use crate::error::{AppError, AppResult};
use serde::{Deserialize, Serialize};
use sqlx::{sqlite::SqlitePool, Row};
use std::path::PathBuf;
use uuid::Uuid;

/// Model stored in database
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Model {
    pub id: String,
    pub user_id: String,
    pub name: String,
    pub description: String,
    pub system_prompt: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

/// New model (before insertion)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NewModel {
    pub user_id: String,
    pub name: String,
    pub description: String,
    pub system_prompt: Option<String>,
}

/// Model update
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelUpdate {
    pub name: Option<String>,
    pub description: Option<String>,
    pub system_prompt: Option<String>,
}

/// Training data record
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrainingData {
    pub id: String,
    pub model_id: String,
    pub file_name: String,
    pub file_path: String,
    pub file_type: String,
    pub chunks_count: i32,
    pub created_at: String,
}

/// New training data
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NewTrainingData {
    pub model_id: String,
    pub file_name: String,
    pub file_path: String,
    pub file_type: String,
    pub chunks_count: i32,
}

/// Chat session
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatSession {
    pub id: String,
    pub model_id: String,
    pub title: String,
    pub created_at: String,
    pub updated_at: String,
}

/// New chat session
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NewChatSession {
    pub model_id: String,
    pub title: String,
}

/// Chat message
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatMessage {
    pub id: String,
    pub session_id: String,
    pub role: String, // 'user', 'assistant', 'system'
    pub content: String,
    pub created_at: String,
}

/// New chat message
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NewChatMessage {
    pub session_id: String,
    pub role: String,
    pub content: String,
}

/// Database service for SQLite
pub struct Database {
    pool: SqlitePool,
}

impl Database {
    /// Create a new database instance
    pub async fn new(db_path: PathBuf) -> AppResult<Self> {
        // Ensure parent directory exists
        if let Some(parent) = db_path.parent() {
            std::fs::create_dir_all(parent)
                .map_err(|e| AppError::Storage(format!("Failed to create db directory: {}", e)))?;
        }

        // Create empty database file if it doesn't exist
        if !db_path.exists() {
            std::fs::File::create(&db_path)
                .map_err(|e| AppError::Storage(format!("Failed to create db file: {}", e)))?;
        }

        // Create connection URL with create_if_missing flag
        let db_url = format!("sqlite:{}?mode=rwc", db_path.display());
        
        // Create connection pool
        let pool = SqlitePool::connect(&db_url)
            .await
            .map_err(|e| AppError::Storage(format!("Failed to connect to database: {}", e)))?;

        let db = Self { pool };

        // Initialize tables
        db.init_tables().await?;

        Ok(db)
    }

    /// Initialize database tables
    pub async fn init_tables(&self) -> AppResult<()> {
        // Models table
        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS models (
                id TEXT PRIMARY KEY NOT NULL,
                user_id TEXT NOT NULL,
                name TEXT NOT NULL,
                description TEXT NOT NULL,
                system_prompt TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
            "#,
        )
        .execute(&self.pool)
        .await
        .map_err(|e| AppError::Storage(format!("Failed to create models table: {}", e)))?;

        // Training data table
        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS training_data (
                id TEXT PRIMARY KEY NOT NULL,
                model_id TEXT NOT NULL,
                file_name TEXT NOT NULL,
                file_path TEXT NOT NULL,
                file_type TEXT NOT NULL,
                chunks_count INTEGER NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY (model_id) REFERENCES models(id) ON DELETE CASCADE
            )
            "#,
        )
        .execute(&self.pool)
        .await
        .map_err(|e| AppError::Storage(format!("Failed to create training_data table: {}", e)))?;

        // Chat sessions table
        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS chat_sessions (
                id TEXT PRIMARY KEY NOT NULL,
                model_id TEXT NOT NULL,
                title TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (model_id) REFERENCES models(id) ON DELETE CASCADE
            )
            "#,
        )
        .execute(&self.pool)
        .await
        .map_err(|e| AppError::Storage(format!("Failed to create chat_sessions table: {}", e)))?;

        // Chat messages table
        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS chat_messages (
                id TEXT PRIMARY KEY NOT NULL,
                session_id TEXT NOT NULL,
                role TEXT NOT NULL,
                content TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
            )
            "#,
        )
        .execute(&self.pool)
        .await
        .map_err(|e| AppError::Storage(format!("Failed to create chat_messages table: {}", e)))?;

        Ok(())
    }

    // ============ MODELS CRUD ============

    /// Create a new model
    pub async fn create_model(&self, model: NewModel) -> AppResult<Model> {
        let id = Uuid::new_v4().to_string();
        let now = chrono::Utc::now().to_rfc3339();

        sqlx::query(
            r#"
            INSERT INTO models (id, user_id, name, description, system_prompt, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            "#,
        )
        .bind(&id)
        .bind(&model.user_id)
        .bind(&model.name)
        .bind(&model.description)
        .bind(&model.system_prompt)
        .bind(&now)
        .bind(&now)
        .execute(&self.pool)
        .await
        .map_err(|e| AppError::Storage(format!("Failed to create model: {}", e)))?;

        Ok(Model {
            id,
            user_id: model.user_id,
            name: model.name,
            description: model.description,
            system_prompt: model.system_prompt,
            created_at: now.clone(),
            updated_at: now,
        })
    }

    /// Get a model by ID
    pub async fn get_model(&self, id: &str) -> AppResult<Option<Model>> {
        let row = sqlx::query("SELECT * FROM models WHERE id = ?")
            .bind(id)
            .fetch_optional(&self.pool)
            .await
            .map_err(|e| AppError::Storage(format!("Failed to get model: {}", e)))?;

        if let Some(row) = row {
            Ok(Some(Model {
                id: row.get("id"),
                user_id: row.get("user_id"),
                name: row.get("name"),
                description: row.get("description"),
                system_prompt: row.get("system_prompt"),
                created_at: row.get("created_at"),
                updated_at: row.get("updated_at"),
            }))
        } else {
            Ok(None)
        }
    }

    /// List all models for a user
    pub async fn list_models(&self, user_id: &str) -> AppResult<Vec<Model>> {
        let rows = sqlx::query("SELECT * FROM models WHERE user_id = ? ORDER BY created_at DESC")
            .bind(user_id)
            .fetch_all(&self.pool)
            .await
            .map_err(|e| AppError::Storage(format!("Failed to list models: {}", e)))?;

        let models = rows
            .into_iter()
            .map(|row| Model {
                id: row.get("id"),
                user_id: row.get("user_id"),
                name: row.get("name"),
                description: row.get("description"),
                system_prompt: row.get("system_prompt"),
                created_at: row.get("created_at"),
                updated_at: row.get("updated_at"),
            })
            .collect();

        Ok(models)
    }

    /// Update a model
    pub async fn update_model(&self, id: &str, updates: ModelUpdate) -> AppResult<Model> {
        let now = chrono::Utc::now().to_rfc3339();

        // Build dynamic update query
        let mut query = String::from("UPDATE models SET updated_at = ?");
        let mut params: Vec<String> = vec![now.clone()];

        if let Some(name) = &updates.name {
            query.push_str(", name = ?");
            params.push(name.clone());
        }
        if let Some(description) = &updates.description {
            query.push_str(", description = ?");
            params.push(description.clone());
        }
        if let Some(system_prompt) = &updates.system_prompt {
            query.push_str(", system_prompt = ?");
            params.push(system_prompt.clone());
        }

        query.push_str(" WHERE id = ?");
        params.push(id.to_string());

        // Execute update
        let mut sql_query = sqlx::query(&query);
        for param in &params {
            sql_query = sql_query.bind(param);
        }

        sql_query
            .execute(&self.pool)
            .await
            .map_err(|e| AppError::Storage(format!("Failed to update model: {}", e)))?;

        // Return updated model
        self.get_model(id)
            .await?
            .ok_or_else(|| AppError::Storage("Model not found after update".to_string()))
    }

    /// Delete a model
    pub async fn delete_model(&self, id: &str) -> AppResult<()> {
        sqlx::query("DELETE FROM models WHERE id = ?")
            .bind(id)
            .execute(&self.pool)
            .await
            .map_err(|e| AppError::Storage(format!("Failed to delete model: {}", e)))?;

        Ok(())
    }

    // ============ TRAINING DATA CRUD ============

    /// Add training data
    pub async fn add_training_data(&self, data: NewTrainingData) -> AppResult<TrainingData> {
        let id = Uuid::new_v4().to_string();
        let now = chrono::Utc::now().to_rfc3339();

        sqlx::query(
            r#"
            INSERT INTO training_data (id, model_id, file_name, file_path, file_type, chunks_count, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            "#,
        )
        .bind(&id)
        .bind(&data.model_id)
        .bind(&data.file_name)
        .bind(&data.file_path)
        .bind(&data.file_type)
        .bind(data.chunks_count)
        .bind(&now)
        .execute(&self.pool)
        .await
        .map_err(|e| AppError::Storage(format!("Failed to add training data: {}", e)))?;

        Ok(TrainingData {
            id,
            model_id: data.model_id,
            file_name: data.file_name,
            file_path: data.file_path,
            file_type: data.file_type,
            chunks_count: data.chunks_count,
            created_at: now,
        })
    }

    /// List training data for a model
    pub async fn list_training_data(&self, model_id: &str) -> AppResult<Vec<TrainingData>> {
        let rows = sqlx::query("SELECT * FROM training_data WHERE model_id = ? ORDER BY created_at DESC")
            .bind(model_id)
            .fetch_all(&self.pool)
            .await
            .map_err(|e| AppError::Storage(format!("Failed to list training data: {}", e)))?;

        let data = rows
            .into_iter()
            .map(|row| TrainingData {
                id: row.get("id"),
                model_id: row.get("model_id"),
                file_name: row.get("file_name"),
                file_path: row.get("file_path"),
                file_type: row.get("file_type"),
                chunks_count: row.get("chunks_count"),
                created_at: row.get("created_at"),
            })
            .collect();

        Ok(data)
    }

    /// Delete training data
    pub async fn delete_training_data(&self, id: &str) -> AppResult<()> {
        sqlx::query("DELETE FROM training_data WHERE id = ?")
            .bind(id)
            .execute(&self.pool)
            .await
            .map_err(|e| AppError::Storage(format!("Failed to delete training data: {}", e)))?;

        Ok(())
    }

    // ============ CHAT SESSIONS CRUD ============

    /// Create a chat session
    pub async fn create_chat_session(&self, session: NewChatSession) -> AppResult<ChatSession> {
        let id = Uuid::new_v4().to_string();
        let now = chrono::Utc::now().to_rfc3339();

        sqlx::query(
            r#"
            INSERT INTO chat_sessions (id, model_id, title, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?)
            "#,
        )
        .bind(&id)
        .bind(&session.model_id)
        .bind(&session.title)
        .bind(&now)
        .bind(&now)
        .execute(&self.pool)
        .await
        .map_err(|e| AppError::Storage(format!("Failed to create chat session: {}", e)))?;

        Ok(ChatSession {
            id,
            model_id: session.model_id,
            title: session.title,
            created_at: now.clone(),
            updated_at: now,
        })
    }

    /// List chat sessions for a model
    pub async fn list_chat_sessions(&self, model_id: &str) -> AppResult<Vec<ChatSession>> {
        let rows = sqlx::query("SELECT * FROM chat_sessions WHERE model_id = ? ORDER BY updated_at DESC")
            .bind(model_id)
            .fetch_all(&self.pool)
            .await
            .map_err(|e| AppError::Storage(format!("Failed to list chat sessions: {}", e)))?;

        let sessions = rows
            .into_iter()
            .map(|row| ChatSession {
                id: row.get("id"),
                model_id: row.get("model_id"),
                title: row.get("title"),
                created_at: row.get("created_at"),
                updated_at: row.get("updated_at"),
            })
            .collect();

        Ok(sessions)
    }

    /// Get a chat session by ID
    pub async fn get_chat_session(&self, id: &str) -> AppResult<Option<ChatSession>> {
        let row = sqlx::query("SELECT * FROM chat_sessions WHERE id = ?")
            .bind(id)
            .fetch_optional(&self.pool)
            .await
            .map_err(|e| AppError::Storage(format!("Failed to get chat session: {}", e)))?;

        if let Some(row) = row {
            Ok(Some(ChatSession {
                id: row.get("id"),
                model_id: row.get("model_id"),
                title: row.get("title"),
                created_at: row.get("created_at"),
                updated_at: row.get("updated_at"),
            }))
        } else {
            Ok(None)
        }
    }

    /// Delete a chat session
    pub async fn delete_chat_session(&self, id: &str) -> AppResult<()> {
        sqlx::query("DELETE FROM chat_sessions WHERE id = ?")
            .bind(id)
            .execute(&self.pool)
            .await
            .map_err(|e| AppError::Storage(format!("Failed to delete chat session: {}", e)))?;

        Ok(())
    }

    // ============ CHAT MESSAGES CRUD ============

    /// Add a chat message
    pub async fn add_chat_message(&self, message: NewChatMessage) -> AppResult<ChatMessage> {
        let id = Uuid::new_v4().to_string();
        let now = chrono::Utc::now().to_rfc3339();

        sqlx::query(
            r#"
            INSERT INTO chat_messages (id, session_id, role, content, created_at)
            VALUES (?, ?, ?, ?, ?)
            "#,
        )
        .bind(&id)
        .bind(&message.session_id)
        .bind(&message.role)
        .bind(&message.content)
        .bind(&now)
        .execute(&self.pool)
        .await
        .map_err(|e| AppError::Storage(format!("Failed to add chat message: {}", e)))?;

        // Update session's updated_at
        let session_now = chrono::Utc::now().to_rfc3339();
        sqlx::query("UPDATE chat_sessions SET updated_at = ? WHERE id = ?")
            .bind(&session_now)
            .bind(&message.session_id)
            .execute(&self.pool)
            .await
            .ok(); // Don't fail if session doesn't exist

        Ok(ChatMessage {
            id,
            session_id: message.session_id,
            role: message.role,
            content: message.content,
            created_at: now,
        })
    }

    /// Get all messages for a chat session
    pub async fn get_chat_messages(&self, session_id: &str) -> AppResult<Vec<ChatMessage>> {
        let rows = sqlx::query("SELECT * FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC")
            .bind(session_id)
            .fetch_all(&self.pool)
            .await
            .map_err(|e| AppError::Storage(format!("Failed to get chat messages: {}", e)))?;

        let messages = rows
            .into_iter()
            .map(|row| ChatMessage {
                id: row.get("id"),
                session_id: row.get("session_id"),
                role: row.get("role"),
                content: row.get("content"),
                created_at: row.get("created_at"),
            })
            .collect();

        Ok(messages)
    }
}
