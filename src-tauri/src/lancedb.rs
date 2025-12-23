use crate::encryption::EncryptionService;
use crate::error::{AppError, AppResult};
use arrow_array::{Float32Array, RecordBatch, RecordBatchIterator, StringArray};
use arrow_schema::{DataType, Field, Schema};
use futures::stream::StreamExt;
use lancedb::connection::Connection;
use lancedb::query::{ExecutableQuery, QueryBase};
use lancedb::Table;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::sync::Arc;

/// Document chunk with embedding
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DocumentChunk {
    pub id: String,
    pub model_id: String,
    pub chunk_text: String,
    pub chunk_index: i32,
    pub file_name: String,
}

/// Embedding search result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchResult {
    pub chunk_text: String,
    pub similarity: f32,
    pub file_name: String,
    pub chunk_index: i32,
}

/// LanceDB service for local vector storage
pub struct LanceDBService {
    db_path: PathBuf,
    encryption: EncryptionService,
}

impl LanceDBService {
    /// Create a new LanceDB service
    pub fn new(db_path: PathBuf) -> Self {
        Self {
            db_path,
            encryption: EncryptionService::new(),
        }
    }

    /// Initialize the database
    pub async fn initialize(&self) -> AppResult<Connection> {
        // Ensure directory exists
        if let Some(parent) = self.db_path.parent() {
            std::fs::create_dir_all(parent)
                .map_err(|e| AppError::Storage(format!("Failed to create DB directory: {}", e)))?;
        }

        let db = lancedb::connect(self.db_path.to_str().unwrap())
            .execute()
            .await
            .map_err(|e| AppError::LanceDB(format!("Failed to connect to LanceDB: {}", e)))?;

        Ok(db)
    }

    /// Open an existing table (for read operations like search)
    async fn open_table(&self, model_id: &str) -> AppResult<Table> {
        let db = self.initialize().await?;
        let table_name = format!("embeddings_{}", model_id.replace('-', "_"));

        db.open_table(&table_name)
            .execute()
            .await
            .map_err(|e| AppError::LanceDB(format!("Failed to open table: {}", e)))
    }

    /// Get or create a table for a model with specific embedding dimension
    async fn get_table(&self, model_id: &str, embedding_dim: i32) -> AppResult<Table> {
        let db = self.initialize().await?;
        let table_name = format!("embeddings_{}", model_id.replace('-', "_"));

        // Check if table exists
        let table_names = db
            .table_names()
            .execute()
            .await
            .map_err(|e| AppError::LanceDB(format!("Failed to list tables: {}", e)))?;

        if table_names.contains(&table_name) {
            // Table exists, open it
            db.open_table(&table_name)
                .execute()
                .await
                .map_err(|e| AppError::LanceDB(format!("Failed to open table: {}", e)))
        } else {
            // Create new table with schema using actual embedding dimension
            let schema = Arc::new(Schema::new(vec![
                Field::new("id", DataType::Utf8, false),
                Field::new("model_id", DataType::Utf8, false),
                Field::new("chunk_text", DataType::Utf8, false),
                Field::new("chunk_index", DataType::Int32, false),
                Field::new("file_name", DataType::Utf8, false),
                Field::new(
                    "embedding",
                    DataType::FixedSizeList(
                        Arc::new(Field::new("item", DataType::Float32, true)),
                        embedding_dim, // Use dynamic dimension
                    ),
                    false,
                ),
            ]));

            // Create empty initial batch
            let empty_batch = RecordBatch::new_empty(schema.clone());

            db.create_table(
                &table_name,
                RecordBatchIterator::new(vec![Ok(empty_batch)], schema),
            )
            .execute()
            .await
            .map_err(|e| AppError::LanceDB(format!("Failed to create table: {}", e)))
        }
    }

    /// Store embeddings for a model
    pub async fn store_embeddings(
        &self,
        model_id: &str,
        chunks: Vec<DocumentChunk>,
        embeddings: Vec<Vec<f32>>,
        encrypt: bool,
        password: Option<&str>,
    ) -> AppResult<usize> {
        if chunks.len() != embeddings.len() {
            return Err(AppError::LanceDB(
                "Chunks and embeddings length mismatch".to_string(),
            ));
        }

        if chunks.is_empty() {
            return Ok(0);
        }

        // Detect embedding dimension from first vector
        let embedding_dim = embeddings.first()
            .map(|e| e.len() as i32)
            .ok_or_else(|| AppError::LanceDB("No embeddings provided".to_string()))?;

        // Verify all embeddings have the same dimension
        for (i, emb) in embeddings.iter().enumerate() {
            if emb.len() as i32 != embedding_dim {
                return Err(AppError::LanceDB(format!(
                    "Embedding dimension mismatch at index {}: expected {}, got {}", 
                    i, embedding_dim, emb.len()
                )));
            }
        }

        let table = self.get_table(model_id, embedding_dim).await?;

        // Prepare data for insertion
        let mut ids = Vec::new();
        let mut model_ids = Vec::new();
        let mut chunk_texts = Vec::new();
        let mut chunk_indices = Vec::new();
        let mut file_names = Vec::new();
        let mut embedding_values: Vec<f32> = Vec::new();

        for (chunk, embedding) in chunks.iter().zip(embeddings.iter()) {
            ids.push(chunk.id.clone());
            model_ids.push(chunk.model_id.clone());

            // Optionally encrypt chunk text
            let text = if encrypt {
                if let Some(pwd) = password {
                    self.encryption.encrypt(&chunk.chunk_text, pwd)?
                } else {
                    return Err(AppError::Encryption(
                        "Password required for encryption".to_string(),
                    ));
                }
            } else {
                chunk.chunk_text.clone()
            };

            chunk_texts.push(text);
            chunk_indices.push(chunk.chunk_index);
            file_names.push(chunk.file_name.clone());

            // Flatten embedding for Arrow FixedSizeList
            embedding_values.extend_from_slice(embedding);
        }

        // Create Arrow arrays
        let id_array = StringArray::from(ids);
        let model_id_array = StringArray::from(model_ids);
        let chunk_text_array = StringArray::from(chunk_texts);
        let chunk_index_array = arrow_array::Int32Array::from(chunk_indices);
        let file_name_array = StringArray::from(file_names);
        
        // Create FixedSizeListArray for embeddings
        let flat_embedding_array = Float32Array::from(embedding_values);
        let embedding_field = Arc::new(Field::new("item", DataType::Float32, true));
        let embedding_array = arrow_array::FixedSizeListArray::try_new(
            embedding_field,
            embedding_dim,
            Arc::new(flat_embedding_array),
            None,
        ).map_err(|e| AppError::LanceDB(format!("Failed to create embedding array: {}", e)))?;

        // Create schema with dynamic dimension
        let schema = Arc::new(Schema::new(vec![
            Field::new("id", DataType::Utf8, false),
            Field::new("model_id", DataType::Utf8, false),
            Field::new("chunk_text", DataType::Utf8, false),
            Field::new("chunk_index", DataType::Int32, false),
            Field::new("file_name", DataType::Utf8, false),
            Field::new(
                "embedding",
                DataType::FixedSizeList(
                    Arc::new(Field::new("item", DataType::Float32, true)),
                    embedding_dim,
                ),
                false,
            ),
        ]));

        // Create record batch
        let batch = RecordBatch::try_new(
            schema.clone(),
            vec![
                Arc::new(id_array),
                Arc::new(model_id_array),
                Arc::new(chunk_text_array),
                Arc::new(chunk_index_array),
                Arc::new(file_name_array),
                Arc::new(embedding_array),
            ],
        )
        .map_err(|e| AppError::LanceDB(format!("Failed to create record batch: {}", e)))?;

        // Insert data
        table
            .add(RecordBatchIterator::new(vec![Ok(batch)], schema))
            .execute()
            .await
            .map_err(|e| AppError::LanceDB(format!("Failed to insert embeddings: {}", e)))?;

        Ok(chunks.len())
    }

    /// Search for similar embeddings
    pub async fn search_similar(
        &self,
        model_id: &str,
        query_embedding: Vec<f32>,
        limit: usize,
        encrypted: bool,
        password: Option<&str>,
    ) -> AppResult<Vec<SearchResult>> {
        let table = self.open_table(model_id).await?;

        // Perform vector search using query().nearest_to() API
        let mut stream = table
            .query()
            .nearest_to(query_embedding)
            .map_err(|e| AppError::LanceDB(format!("Failed to create query: {}", e)))?
            .limit(limit)
            .execute()
            .await
            .map_err(|e| AppError::LanceDB(format!("Search failed: {}", e)))?;

        let mut search_results = Vec::new();

        // Parse results using StreamExt
        while let Some(batch_result) = stream.next().await {
            let batch = batch_result.map_err(|e| AppError::LanceDB(format!("Failed to read batch: {}", e)))?;

            // Extract columns
            let chunk_texts = batch
                .column_by_name("chunk_text")
                .ok_or_else(|| AppError::LanceDB("Missing chunk_text column".to_string()))?
                .as_any()
                .downcast_ref::<StringArray>()
                .ok_or_else(|| AppError::LanceDB("Invalid chunk_text type".to_string()))?;

            let file_names = batch
                .column_by_name("file_name")
                .ok_or_else(|| AppError::LanceDB("Missing file_name column".to_string()))?
                .as_any()
                .downcast_ref::<StringArray>()
                .ok_or_else(|| AppError::LanceDB("Invalid file_name type".to_string()))?;

            let chunk_indices = batch
                .column_by_name("chunk_index")
                .ok_or_else(|| AppError::LanceDB("Missing chunk_index column".to_string()))?
                .as_any()
                .downcast_ref::<arrow_array::Int32Array>()
                .ok_or_else(|| AppError::LanceDB("Invalid chunk_index type".to_string()))?;

            // Process each row
            for i in 0..batch.num_rows() {
                let mut chunk_text = chunk_texts.value(i).to_string();

                // Decrypt if needed
                if encrypted {
                    if let Some(pwd) = password {
                        chunk_text = self.encryption.decrypt(&chunk_text, pwd)?;
                    } else {
                        return Err(AppError::Encryption(
                            "Password required for decryption".to_string(),
                        ));
                    }
                }

                search_results.push(SearchResult {
                    chunk_text,
                    similarity: 1.0 - (i as f32 / limit as f32), // Approximate similarity
                    file_name: file_names.value(i).to_string(),
                    chunk_index: chunk_indices.value(i),
                });
            }
        }

        Ok(search_results)
    }

    /// Get context for RAG (retrieve relevant chunks)
    pub async fn get_context(
        &self,
        model_id: &str,
        query_embedding: Vec<f32>,
        max_chunks: usize,
        encrypted: bool,
        password: Option<&str>,
    ) -> AppResult<String> {
        let results = self
            .search_similar(model_id, query_embedding, max_chunks, encrypted, password)
            .await?;

        if results.is_empty() {
            return Ok(String::new());
        }

        // Format context
        let context = results
            .iter()
            .map(|r| {
                format!(
                    "From {} (chunk {}):\n{}",
                    r.file_name, r.chunk_index, r.chunk_text
                )
            })
            .collect::<Vec<_>>()
            .join("\n\n---\n\n");

        Ok(context)
    }

    /// Delete all data for a model
    pub async fn delete_model_data(&self, model_id: &str) -> AppResult<()> {
        let db = self.initialize().await?;
        let table_name = format!("embeddings_{}", model_id.replace('-', "_"));

        // Check if table exists
        let table_names = db
            .table_names()
            .execute()
            .await
            .map_err(|e| AppError::LanceDB(format!("Failed to list tables: {}", e)))?;

        if table_names.contains(&table_name) {
            db.drop_table(&table_name)
                .await
                .map_err(|e| AppError::LanceDB(format!("Failed to drop table: {}", e)))?;
        }

        Ok(())
    }

    /// Get statistics for a model
    pub async fn get_stats(&self, model_id: &str) -> AppResult<ModelStats> {
        let table = match self.open_table(model_id).await {
            Ok(t) => t,
            Err(_) => {
                // Table doesn't exist yet
                return Ok(ModelStats {
                    total_chunks: 0,
                    total_files: 0,
                    table_size_mb: 0.0,
                });
            }
        };

        // Count total rows
        let count = table
            .count_rows(None)
            .await
            .map_err(|e| AppError::LanceDB(format!("Failed to count rows: {}", e)))?;

        // Get unique file names (would need to scan table in real implementation)
        // For now, estimate
        let total_files = (count as f64 / 10.0).ceil() as usize;

        // Estimate table size (simplified)
        let table_size_mb = count as f64 * 0.01; // Rough estimate: 10KB per row

        Ok(ModelStats {
            total_chunks: count,
            total_files,
            table_size_mb,
        })
    }

    /// List all models with embeddings
    pub async fn list_models(&self) -> AppResult<Vec<String>> {
        let db = self.initialize().await?;
        let table_names = db
            .table_names()
            .execute()
            .await
            .map_err(|e| AppError::LanceDB(format!("Failed to list tables: {}", e)))?;

        // Extract model IDs from table names
        let model_ids = table_names
            .iter()
            .filter(|name| name.starts_with("embeddings_"))
            .map(|name| name.replace("embeddings_", "").replace('_', "-"))
            .collect();

        Ok(model_ids)
    }

    /// Clear entire database (use with caution!)
    pub async fn clear_all(&self) -> AppResult<()> {
        let db = self.initialize().await?;
        let table_names = db
            .table_names()
            .execute()
            .await
            .map_err(|e| AppError::LanceDB(format!("Failed to list tables: {}", e)))?;

        for table_name in table_names {
            db.drop_table(&table_name)
                .await
                .map_err(|e| AppError::LanceDB(format!("Failed to drop table: {}", e)))?;
        }

        Ok(())
    }
}

/// Statistics for a model's embeddings
#[derive(Debug, Serialize, Deserialize)]
pub struct ModelStats {
    pub total_chunks: usize,
    pub total_files: usize,
    pub table_size_mb: f64,
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::env;

    #[tokio::test]
    async fn test_lancedb_creation() {
        let temp_dir = env::temp_dir().join("mydistinctai_lancedb_test");
        let service = LanceDBService::new(temp_dir.clone());

        let result = service.initialize().await;
        assert!(result.is_ok());

        // Cleanup
        std::fs::remove_dir_all(temp_dir).ok();
    }

    #[tokio::test]
    async fn test_store_and_search_embeddings() {
        let temp_dir = env::temp_dir().join("mydistinctai_lancedb_test_2");
        let service = LanceDBService::new(temp_dir.clone());

        let model_id = "test_model";
        let chunks = vec![DocumentChunk {
            id: uuid::Uuid::new_v4().to_string(),
            model_id: model_id.to_string(),
            chunk_text: "This is a test chunk".to_string(),
            chunk_index: 0,
            file_name: "test.txt".to_string(),
        }];

        let embeddings = vec![vec![0.1; 1536]]; // Mock 1536-dimension embedding

        let result = service
            .store_embeddings(model_id, chunks, embeddings, false, None)
            .await;
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), 1);

        // Search
        let query_embedding = vec![0.1; 1536];
        let search_results = service
            .search_similar(model_id, query_embedding, 5, false, None)
            .await;
        assert!(search_results.is_ok());
        assert!(!search_results.unwrap().is_empty());

        // Cleanup
        service.delete_model_data(model_id).await.ok();
        std::fs::remove_dir_all(temp_dir).ok();
    }
}
