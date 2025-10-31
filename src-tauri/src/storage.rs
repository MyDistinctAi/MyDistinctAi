use crate::error::{AppError, AppResult};
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use std::sync::Arc;
use tokio::sync::RwLock;

/// Local storage service for persisting data
pub struct LocalStorage {
    data_dir: PathBuf,
    cache: Arc<RwLock<HashMap<String, String>>>,
}

impl LocalStorage {
    /// Create a new local storage instance
    pub fn new(data_dir: PathBuf) -> Self {
        // Ensure data directory exists
        if !data_dir.exists() {
            fs::create_dir_all(&data_dir).ok();
        }

        Self {
            data_dir,
            cache: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    /// Get the file path for a key
    fn get_file_path(&self, key: &str) -> PathBuf {
        self.data_dir.join(format!("{}.json", key))
    }

    /// Save data to local storage
    pub async fn save(&mut self, key: &str, data: &str) -> AppResult<()> {
        let file_path = self.get_file_path(key);

        // Write to file
        fs::write(&file_path, data)
            .map_err(|e| AppError::Storage(format!("Failed to write file: {}", e)))?;

        // Update cache
        let mut cache = self.cache.write().await;
        cache.insert(key.to_string(), data.to_string());

        Ok(())
    }

    /// Load data from local storage
    pub async fn load(&self, key: &str) -> AppResult<String> {
        // Check cache first
        {
            let cache = self.cache.read().await;
            if let Some(data) = cache.get(key) {
                return Ok(data.clone());
            }
        }

        // Load from file
        let file_path = self.get_file_path(key);

        if !file_path.exists() {
            return Err(AppError::Storage(format!("Key not found: {}", key)));
        }

        let data = fs::read_to_string(&file_path)
            .map_err(|e| AppError::Storage(format!("Failed to read file: {}", e)))?;

        // Update cache
        let mut cache = self.cache.write().await;
        cache.insert(key.to_string(), data.clone());

        Ok(data)
    }

    /// Delete data from local storage
    pub async fn delete(&mut self, key: &str) -> AppResult<()> {
        let file_path = self.get_file_path(key);

        if file_path.exists() {
            fs::remove_file(&file_path)
                .map_err(|e| AppError::Storage(format!("Failed to delete file: {}", e)))?;
        }

        // Remove from cache
        let mut cache = self.cache.write().await;
        cache.remove(key);

        Ok(())
    }

    /// List all keys in storage
    pub async fn list_keys(&self) -> AppResult<Vec<String>> {
        let entries = fs::read_dir(&self.data_dir)
            .map_err(|e| AppError::Storage(format!("Failed to read directory: {}", e)))?;

        let mut keys = Vec::new();

        for entry in entries {
            if let Ok(entry) = entry {
                if let Some(file_name) = entry.file_name().to_str() {
                    if file_name.ends_with(".json") {
                        let key = file_name.trim_end_matches(".json");
                        keys.push(key.to_string());
                    }
                }
            }
        }

        Ok(keys)
    }

    /// Check if a key exists
    pub async fn exists(&self, key: &str) -> bool {
        // Check cache first
        {
            let cache = self.cache.read().await;
            if cache.contains_key(key) {
                return true;
            }
        }

        // Check file system
        self.get_file_path(key).exists()
    }

    /// Clear all data (use with caution!)
    pub async fn clear_all(&mut self) -> AppResult<()> {
        let keys = self.list_keys().await?;

        for key in keys {
            self.delete(&key).await?;
        }

        // Clear cache
        let mut cache = self.cache.write().await;
        cache.clear();

        Ok(())
    }

    /// Get storage statistics
    pub async fn get_stats(&self) -> AppResult<StorageStats> {
        let keys = self.list_keys().await?;
        let mut total_size = 0u64;

        for key in &keys {
            let file_path = self.get_file_path(key);
            if let Ok(metadata) = fs::metadata(&file_path) {
                total_size += metadata.len();
            }
        }

        Ok(StorageStats {
            total_keys: keys.len(),
            total_size_bytes: total_size,
            data_dir: self.data_dir.to_string_lossy().to_string(),
        })
    }
}

#[derive(Debug)]
pub struct StorageStats {
    pub total_keys: usize,
    pub total_size_bytes: u64,
    pub data_dir: String,
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::env;

    #[tokio::test]
    async fn test_save_and_load() {
        let temp_dir = env::temp_dir().join("mydistinctai_test");
        let mut storage = LocalStorage::new(temp_dir.clone());

        let key = "test_key";
        let data = "test_data";

        storage.save(key, data).await.unwrap();
        let loaded = storage.load(key).await.unwrap();

        assert_eq!(data, loaded);

        // Cleanup
        storage.delete(key).await.unwrap();
        fs::remove_dir_all(temp_dir).ok();
    }

    #[tokio::test]
    async fn test_delete() {
        let temp_dir = env::temp_dir().join("mydistinctai_test_delete");
        let mut storage = LocalStorage::new(temp_dir.clone());

        let key = "test_key";
        let data = "test_data";

        storage.save(key, data).await.unwrap();
        assert!(storage.exists(key).await);

        storage.delete(key).await.unwrap();
        assert!(!storage.exists(key).await);

        // Cleanup
        fs::remove_dir_all(temp_dir).ok();
    }

    #[tokio::test]
    async fn test_list_keys() {
        let temp_dir = env::temp_dir().join("mydistinctai_test_list");
        let mut storage = LocalStorage::new(temp_dir.clone());

        storage.save("key1", "data1").await.unwrap();
        storage.save("key2", "data2").await.unwrap();
        storage.save("key3", "data3").await.unwrap();

        let keys = storage.list_keys().await.unwrap();
        assert_eq!(keys.len(), 3);
        assert!(keys.contains(&"key1".to_string()));
        assert!(keys.contains(&"key2".to_string()));
        assert!(keys.contains(&"key3".to_string()));

        // Cleanup
        storage.clear_all().await.unwrap();
        fs::remove_dir_all(temp_dir).ok();
    }
}
