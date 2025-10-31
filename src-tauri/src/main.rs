// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod ollama;
mod storage;
mod encryption;
mod error;

use tauri::Manager;
use std::sync::Arc;
use tokio::sync::Mutex;

// Re-export modules
pub use ollama::OllamaService;
pub use storage::LocalStorage;
pub use encryption::EncryptionService;
pub use error::AppError;

/// Application state shared across all commands
pub struct AppState {
    pub ollama: Arc<Mutex<OllamaService>>,
    pub storage: Arc<Mutex<LocalStorage>>,
    pub encryption: Arc<Mutex<EncryptionService>>,
}

/// Check if Ollama is running and accessible
#[tauri::command]
async fn check_ollama_status(state: tauri::State<'_, AppState>) -> Result<bool, String> {
    let ollama = state.ollama.lock().await;
    ollama.check_status().await
        .map_err(|e| e.to_string())
}

/// List available Ollama models
#[tauri::command]
async fn list_ollama_models(state: tauri::State<'_, AppState>) -> Result<Vec<String>, String> {
    let ollama = state.ollama.lock().await;
    ollama.list_models().await
        .map_err(|e| e.to_string())
}

/// Pull an Ollama model
#[tauri::command]
async fn pull_ollama_model(
    model: String,
    state: tauri::State<'_, AppState>
) -> Result<String, String> {
    let ollama = state.ollama.lock().await;
    ollama.pull_model(&model).await
        .map_err(|e| e.to_string())
}

/// Generate AI response using Ollama
#[tauri::command]
async fn generate_response(
    model: String,
    prompt: String,
    context: Option<Vec<String>>,
    state: tauri::State<'_, AppState>
) -> Result<String, String> {
    let ollama = state.ollama.lock().await;
    ollama.generate(&model, &prompt, context).await
        .map_err(|e| e.to_string())
}

/// Stream AI response (returns a stream ID for frontend to poll)
#[tauri::command]
async fn stream_response(
    model: String,
    prompt: String,
    context: Option<Vec<String>>,
    state: tauri::State<'_, AppState>
) -> Result<String, String> {
    let ollama = state.ollama.lock().await;
    ollama.stream_generate(&model, &prompt, context).await
        .map_err(|e| e.to_string())
}

/// Save user data locally
#[tauri::command]
async fn save_user_data(
    key: String,
    data: String,
    state: tauri::State<'_, AppState>
) -> Result<(), String> {
    let mut storage = state.storage.lock().await;
    storage.save(&key, &data).await
        .map_err(|e| e.to_string())
}

/// Load user data locally
#[tauri::command]
async fn load_user_data(
    key: String,
    state: tauri::State<'_, AppState>
) -> Result<String, String> {
    let storage = state.storage.lock().await;
    storage.load(&key).await
        .map_err(|e| e.to_string())
}

/// Delete user data
#[tauri::command]
async fn delete_user_data(
    key: String,
    state: tauri::State<'_, AppState>
) -> Result<(), String> {
    let mut storage = state.storage.lock().await;
    storage.delete(&key).await
        .map_err(|e| e.to_string())
}

/// List all saved keys
#[tauri::command]
async fn list_data_keys(state: tauri::State<'_, AppState>) -> Result<Vec<String>, String> {
    let storage = state.storage.lock().await;
    storage.list_keys().await
        .map_err(|e| e.to_string())
}

/// Encrypt data
#[tauri::command]
async fn encrypt_data(
    data: String,
    password: String,
    state: tauri::State<'_, AppState>
) -> Result<String, String> {
    let encryption = state.encryption.lock().await;
    encryption.encrypt(&data, &password)
        .map_err(|e| e.to_string())
}

/// Decrypt data
#[tauri::command]
async fn decrypt_data(
    encrypted: String,
    password: String,
    state: tauri::State<'_, AppState>
) -> Result<String, String> {
    let encryption = state.encryption.lock().await;
    encryption.decrypt(&encrypted, &password)
        .map_err(|e| e.to_string())
}

/// Save model configuration
#[tauri::command]
async fn save_model_config(
    model_id: String,
    config: String,
    state: tauri::State<'_, AppState>
) -> Result<(), String> {
    let mut storage = state.storage.lock().await;
    let key = format!("model_config_{}", model_id);
    storage.save(&key, &config).await
        .map_err(|e| e.to_string())
}

/// Load model configuration
#[tauri::command]
async fn load_model_config(
    model_id: String,
    state: tauri::State<'_, AppState>
) -> Result<String, String> {
    let storage = state.storage.lock().await;
    let key = format!("model_config_{}", model_id);
    storage.load(&key).await
        .map_err(|e| e.to_string())
}

/// Save chat history
#[tauri::command]
async fn save_chat_history(
    session_id: String,
    messages: String,
    state: tauri::State<'_, AppState>
) -> Result<(), String> {
    let mut storage = state.storage.lock().await;
    let key = format!("chat_history_{}", session_id);
    storage.save(&key, &messages).await
        .map_err(|e| e.to_string())
}

/// Load chat history
#[tauri::command]
async fn load_chat_history(
    session_id: String,
    state: tauri::State<'_, AppState>
) -> Result<String, String> {
    let storage = state.storage.lock().await;
    let key = format!("chat_history_{}", session_id);
    storage.load(&key).await
        .map_err(|e| e.to_string())
}

/// Initialize and run the application
fn main() {
    tauri::Builder::default()
        .setup(|app| {
            // Initialize services
            let ollama = Arc::new(Mutex::new(OllamaService::new(
                "http://localhost:11434".to_string()
            )));

            let storage = Arc::new(Mutex::new(
                LocalStorage::new(app.path().app_data_dir()?)
            ));

            let encryption = Arc::new(Mutex::new(EncryptionService::new()));

            // Set up application state
            app.manage(AppState {
                ollama,
                storage,
                encryption,
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            check_ollama_status,
            list_ollama_models,
            pull_ollama_model,
            generate_response,
            stream_response,
            save_user_data,
            load_user_data,
            delete_user_data,
            list_data_keys,
            encrypt_data,
            decrypt_data,
            save_model_config,
            load_model_config,
            save_chat_history,
            load_chat_history,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
