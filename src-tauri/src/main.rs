// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod ollama;
mod storage;
mod encryption;
mod lancedb;
mod file_processor;
mod error;
mod database;


use tauri::{Manager, Emitter};
use std::sync::Arc;
use std::path::PathBuf;
use std::process::Stdio;
use tokio::sync::Mutex;

#[cfg(windows)]
use std::os::windows::process::CommandExt;

// Re-export modules
pub use ollama::OllamaService;
pub use storage::LocalStorage;
pub use encryption::EncryptionService;
pub use lancedb::LanceDBService;
pub use database::Database;
pub use error::AppError;


/// Application state shared across all commands
pub struct AppState {
    pub ollama: Arc<Mutex<OllamaService>>,
    pub storage: Arc<Mutex<LocalStorage>>,
    pub encryption: Arc<Mutex<EncryptionService>>,
    pub lancedb: Arc<Mutex<LanceDBService>>,
    pub database: Arc<Mutex<Database>>,
}

/// Check if Ollama is installed on the system
#[tauri::command]
async fn check_ollama_installed(state: tauri::State<'_, AppState>) -> Result<bool, String> {
    let ollama = state.ollama.lock().await;
    ollama.is_ollama_installed()
        .map_err(|e| e.to_string())
}

/// Start Ollama server in the background
#[tauri::command]
async fn start_ollama_server(state: tauri::State<'_, AppState>) -> Result<(), String> {
    let ollama = state.ollama.lock().await;
    ollama.start_ollama_server()
        .map_err(|e| e.to_string())
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

/// Store embeddings for a model
#[tauri::command]
async fn store_embeddings(
    model_id: String,
    chunks: Vec<lancedb::DocumentChunk>,
    embeddings: Vec<Vec<f32>>,
    encrypt: bool,
    password: Option<String>,
    state: tauri::State<'_, AppState>
) -> Result<usize, String> {
    let lancedb = state.lancedb.lock().await;
    lancedb.store_embeddings(
        &model_id,
        chunks,
        embeddings,
        encrypt,
        password.as_deref(),
    )
    .await
    .map_err(|e| e.to_string())
}

/// Search for similar embeddings
#[tauri::command]
async fn search_similar(
    model_id: String,
    query_embedding: Vec<f32>,
    limit: usize,
    encrypted: bool,
    password: Option<String>,
    state: tauri::State<'_, AppState>
) -> Result<Vec<lancedb::SearchResult>, String> {
    let lancedb = state.lancedb.lock().await;
    lancedb.search_similar(
        &model_id,
        query_embedding,
        limit,
        encrypted,
        password.as_deref(),
    )
    .await
    .map_err(|e| e.to_string())
}

/// Get context for RAG
#[tauri::command]
async fn get_rag_context(
    model_id: String,
    query_embedding: Vec<f32>,
    max_chunks: usize,
    encrypted: bool,
    password: Option<String>,
    state: tauri::State<'_, AppState>
) -> Result<String, String> {
    let lancedb = state.lancedb.lock().await;
    lancedb.get_context(
        &model_id,
        query_embedding,
        max_chunks,
        encrypted,
        password.as_deref(),
    )
    .await
    .map_err(|e| e.to_string())
}

/// Delete model embeddings
#[tauri::command]
async fn delete_model_embeddings(
    model_id: String,
    state: tauri::State<'_, AppState>
) -> Result<(), String> {
    let lancedb = state.lancedb.lock().await;
    lancedb.delete_model_data(&model_id).await
        .map_err(|e| e.to_string())
}

/// Get embedding statistics for a model
#[tauri::command]
async fn get_embedding_stats(
    model_id: String,
    state: tauri::State<'_, AppState>
) -> Result<lancedb::ModelStats, String> {
    let lancedb = state.lancedb.lock().await;
    lancedb.get_stats(&model_id).await
        .map_err(|e| e.to_string())
}

/// List all models with embeddings
#[tauri::command]
async fn list_embedding_models(
    state: tauri::State<'_, AppState>
) -> Result<Vec<String>, String> {
    let lancedb = state.lancedb.lock().await;
    lancedb.list_models().await
        .map_err(|e| e.to_string())
}

/// Generate embeddings using Ollama
#[tauri::command]
async fn generate_embeddings(
    model: String,
    text: String,
    state: tauri::State<'_, AppState>
) -> Result<Vec<f32>, String> {
    let ollama = state.ollama.lock().await;
    ollama.generate_embeddings(&model, &text).await
        .map_err(|e| e.to_string())
}

/// Generate embeddings for multiple texts
#[tauri::command]
async fn generate_embeddings_batch(
    model: String,
    texts: Vec<String>,
    state: tauri::State<'_, AppState>
) -> Result<Vec<Vec<f32>>, String> {
    let ollama = state.ollama.lock().await;
    ollama.generate_embeddings_batch(&model, texts).await
        .map_err(|e| e.to_string())
}

/// Extract text from a file
#[tauri::command]
async fn extract_text_from_file(
    file_path: String,
) -> Result<String, String> {
    let processor = file_processor::FileProcessor::new();
    let path = PathBuf::from(file_path);
    processor.extract_text(&path)
        .map_err(|e| e.to_string())
}

/// Chunk text into smaller pieces
#[tauri::command]
async fn chunk_text(
    text: String,
    chunk_size: usize,
    overlap: usize,
) -> Result<Vec<ChunkInfo>, String> {
    let processor = file_processor::FileProcessor::new();
    let chunks = processor.chunk_text(&text, chunk_size, overlap);

    Ok(chunks.into_iter().map(|c| ChunkInfo {
        text: c.text,
        index: c.index,
        char_start: c.char_start,
        char_end: c.char_end,
    }).collect())
}

/// Process a file: extract text and chunk it
#[tauri::command]
async fn process_file(
    file_path: String,
    chunk_size: usize,
    overlap: usize,
) -> Result<FileProcessResult, String> {
    let processor = file_processor::FileProcessor::new();
    let path = PathBuf::from(file_path);

    let (text, chunks) = processor.process_file(&path, chunk_size, overlap)
        .map_err(|e| e.to_string())?;

    let chunk_infos: Vec<ChunkInfo> = chunks.into_iter().map(|c| ChunkInfo {
        text: c.text,
        index: c.index,
        char_start: c.char_start,
        char_end: c.char_end,
    }).collect();

    Ok(FileProcessResult {
        full_text: text,
        chunks: chunk_infos,
    })
}

/// Get file information
#[tauri::command]
async fn get_file_info(
    file_path: String,
) -> Result<FileInfoResponse, String> {
    let processor = file_processor::FileProcessor::new();
    let path = PathBuf::from(file_path);

    let info = processor.get_file_info(&path)
        .map_err(|e| e.to_string())?;

    Ok(FileInfoResponse {
        name: info.name,
        file_type: format!("{:?}", info.file_type),
        size_bytes: info.size_bytes,
        size_mb: info.size_mb,
    })
}

/// Complete RAG workflow: process file, generate embeddings, store in LanceDB
#[tauri::command]
async fn process_and_store_file(
    model_id: String,
    file_path: String,
    file_name: String,
    embedding_model: String,
    chunk_size: usize,
    overlap: usize,
    encrypt: bool,
    password: Option<String>,
    state: tauri::State<'_, AppState>
) -> Result<ProcessResult, String> {
    // 1. Process file
    let processor = file_processor::FileProcessor::new();
    let path = PathBuf::from(&file_path);

    let (full_text, chunks) = processor.process_file(&path, chunk_size, overlap)
        .map_err(|e| format!("File processing failed: {}", e))?;

    // 2. Generate embeddings
    let ollama = state.ollama.lock().await;
    let texts: Vec<String> = chunks.iter().map(|c| c.text.clone()).collect();
    let embeddings = ollama.generate_embeddings_batch(&embedding_model, texts).await
        .map_err(|e| format!("Embedding generation failed: {}", e))?;
    drop(ollama); // Release lock

    // 3. Prepare document chunks
    let doc_chunks: Vec<lancedb::DocumentChunk> = chunks.iter().map(|c| lancedb::DocumentChunk {
        id: uuid::Uuid::new_v4().to_string(),
        model_id: model_id.clone(),
        chunk_text: c.text.clone(),
        chunk_index: c.index as i32,
        file_name: file_name.clone(),
    }).collect();

    // 4. Store in LanceDB
    let lancedb = state.lancedb.lock().await;
    let stored_count = lancedb.store_embeddings(
        &model_id,
        doc_chunks,
        embeddings,
        encrypt,
        password.as_deref(),
    ).await
        .map_err(|e| format!("Storage failed: {}", e))?;

    Ok(ProcessResult {
        chunks_processed: chunks.len(),
        chunks_stored: stored_count,
        total_chars: full_text.len(),
    })
}

#[derive(serde::Serialize)]
struct ChunkInfo {
    text: String,
    index: usize,
    char_start: usize,
    char_end: usize,
}

#[derive(serde::Serialize)]
struct FileProcessResult {
    full_text: String,
    chunks: Vec<ChunkInfo>,
}

#[derive(serde::Serialize)]
struct FileInfoResponse {
    name: String,
    file_type: String,
    size_bytes: u64,
    size_mb: f64,
}

#[derive(serde::Serialize)]
struct ProcessResult {
    chunks_processed: usize,
    chunks_stored: usize,
    total_chars: usize,
}

// ============ DATABASE COMMANDS ============

/// Create a new model
#[tauri::command]
async fn db_create_model(
    model: database::NewModel,
    state: tauri::State<'_, AppState>
) -> Result<database::Model, String> {
    let db = state.database.lock().await;
    db.create_model(model).await
        .map_err(|e| e.to_string())
}

/// Get a model by ID
#[tauri::command]
async fn db_get_model(
    id: String,
    state: tauri::State<'_, AppState>
) -> Result<Option<database::Model>, String> {
    let db = state.database.lock().await;
    db.get_model(&id).await
        .map_err(|e| e.to_string())
}

/// List all models for a user
#[tauri::command]
async fn db_list_models(
    user_id: String,
    state: tauri::State<'_, AppState>
) -> Result<Vec<database::Model>, String> {
    let db = state.database.lock().await;
    db.list_models(&user_id).await
        .map_err(|e| e.to_string())
}

/// Update a model
#[tauri::command]
async fn db_update_model(
    id: String,
    updates: database::ModelUpdate,
    state: tauri::State<'_, AppState>
) -> Result<database::Model, String> {
    let db = state.database.lock().await;
    db.update_model(&id, updates).await
        .map_err(|e| e.to_string())
}

/// Delete a model
#[tauri::command]
async fn db_delete_model(
    id: String,
    state: tauri::State<'_, AppState>
) -> Result<(), String> {
    let db = state.database.lock().await;
    db.delete_model(&id).await
        .map_err(|e| e.to_string())
}

/// Add training data
#[tauri::command]
async fn db_add_training_data(
    data: database::NewTrainingData,
    state: tauri::State<'_, AppState>
) -> Result<database::TrainingData, String> {
    let db = state.database.lock().await;
    db.add_training_data(data).await
        .map_err(|e| e.to_string())
}

/// List training data for a model
#[tauri::command]
async fn db_list_training_data(
    model_id: String,
    state: tauri::State<'_, AppState>
) -> Result<Vec<database::TrainingData>, String> {
    let db = state.database.lock().await;
    db.list_training_data(&model_id).await
        .map_err(|e| e.to_string())
}

/// Delete training data
#[tauri::command]
async fn db_delete_training_data(
    id: String,
    state: tauri::State<'_, AppState>
) -> Result<(), String> {
    let db = state.database.lock().await;
    db.delete_training_data(&id).await
        .map_err(|e| e.to_string())
}

/// Create a chat session
#[tauri::command]
async fn db_create_chat_session(
    session: database::NewChatSession,
    state: tauri::State<'_, AppState>
) -> Result<database::ChatSession, String> {
    let db = state.database.lock().await;
    db.create_chat_session(session).await
        .map_err(|e| e.to_string())
}

/// List chat sessions for a model
#[tauri::command]
async fn db_list_chat_sessions(
    model_id: String,
    state: tauri::State<'_, AppState>
) -> Result<Vec<database::ChatSession>, String> {
    let db = state.database.lock().await;
    db.list_chat_sessions(&model_id).await
        .map_err(|e| e.to_string())
}

/// Get a chat session by ID
#[tauri::command]
async fn db_get_chat_session(
    id: String,
    state: tauri::State<'_, AppState>
) -> Result<Option<database::ChatSession>, String> {
    let db = state.database.lock().await;
    db.get_chat_session(&id).await
        .map_err(|e| e.to_string())
}

/// Delete a chat session
#[tauri::command]
async fn db_delete_chat_session(
    id: String,
    state: tauri::State<'_, AppState>
) -> Result<(), String> {
    let db = state.database.lock().await;
    db.delete_chat_session(&id).await
        .map_err(|e| e.to_string())
}

/// Add a chat message
#[tauri::command]
async fn db_add_chat_message(
    message: database::NewChatMessage,
    state: tauri::State<'_, AppState>
) -> Result<database::ChatMessage, String> {
    let db = state.database.lock().await;
    db.add_chat_message(message).await
        .map_err(|e| e.to_string())
}

/// Get chat messages for a session
#[tauri::command]
async fn db_get_chat_messages(
    session_id: String,
    state: tauri::State<'_, AppState>
) -> Result<Vec<database::ChatMessage>, String> {
    let db = state.database.lock().await;
    db.get_chat_messages(&session_id).await
        .map_err(|e| e.to_string())
}

/// Initialize and run the application
fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            use std::process::Command;
            
            // Get window for emitting events
            let window = app.get_webview_window("main").unwrap();
            
            // Show simple loading HTML first
            let loading_html = r#"
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <style>
                        body { margin:0; padding:0; background:#0f172a; color:white; font-family:system-ui; display:flex; align-items:center; justify-content:center; height:100vh; }
                        .container { text-align:center; }
                        .logo { width:80px; height:80px; background:linear-gradient(135deg,#3b82f6,#8b5cf6); border-radius:20px; margin:0 auto 20px; display:flex; align-items:center; justify-content:center; font-size:40px; font-weight:bold; }
                        h1 { font-size:32px; margin:10px 0; }
                        p { color:#94a3b8; margin-bottom:30px; }
                        .spinner { width:40px; height:40px; margin:0 auto; border:4px solid rgba(59,130,246,0.2); border-top-color:#3b82f6; border-radius:50%; animation:spin 1s linear infinite; }
                        @keyframes spin { to { transform:rotate(360deg); } }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="logo">M</div>
                        <h1>MyDistinctAI</h1>
                        <p>Starting server...</p>
                        <div class="spinner"></div>
                    </div>
                </body>
                </html>
            "#;
            
            let _ = window.eval(&format!("document.write(`{}`)", loading_html.replace('`', "\\`")));
            
            // Clone window for background thread
            let window_clone = window.clone();
            
            // Run startup sequence in background thread
            std::thread::spawn(move || {
                // Step 1: Check if dev server is already running, if not start it
                println!("🔍 Checking if development server is running...");
                let _ = window_clone.emit("startup-progress", serde_json::json!({
                    "step": "server",
                    "status": "loading",
                    "message": "Starting server..."
                }));
                
                // Quick check if server is already running
                let mut server_ready = false;
                if let Ok(response) = reqwest::blocking::get("http://localhost:4000") {
                    if response.status().is_success() || response.status().as_u16() == 404 {
                        server_ready = true;
                        println!("✅ Found running server on port 4000");
                    }
                }
                
                // If server not running, start it
                if !server_ready {
                    println!("🚀 Starting Next.js development server...");
                    
                    // Use the project root (where package.json is)
                    let project_root = std::path::PathBuf::from("C:\\Users\\imoud\\OneDrive\\Documents\\MyDistinctAi");
                    
                    println!("📁 Project root: {:?}", project_root);
                    
                    // Start the dev server directly (hidden window) - WORKING VERSION
                    #[cfg(windows)]
                    let server_result = {
                        use std::os::windows::process::CommandExt;
                        // Use PowerShell to start npm with hidden window (ensures all child processes are hidden)
                        let ps_script = format!(
                            "Start-Process -FilePath 'npm.cmd' -ArgumentList 'run','dev' -WorkingDirectory '{}' -WindowStyle Hidden -PassThru | Out-Null",
                            project_root.display()
                        );
                        Command::new("powershell.exe")
                            .args(&["-WindowStyle", "Hidden", "-ExecutionPolicy", "Bypass", "-Command", &ps_script])
                            .creation_flags(
                                0x08000000 | // CREATE_NO_WINDOW
                                0x00000200   // CREATE_BREAKAWAY_FROM_JOB
                            )
                            .stdout(Stdio::null())
                            .stderr(Stdio::null())
                            .stdin(Stdio::null())
                            .spawn()
                    };
                    
                    #[cfg(not(windows))]
                    let server_result = Command::new("npm")
                        .args(&["run", "dev"])
                        .current_dir(&project_root)
                        .stdout(Stdio::null())
                        .stderr(Stdio::null())
                        .spawn();
                    
                    match server_result {
                        Ok(_) => {
                            println!("⏳ Waiting for server to be ready...");
                            
                            // Poll server until it's ready (max 30 seconds)
                            for i in 0..30 {
                                std::thread::sleep(std::time::Duration::from_secs(1));
                                
                                // Try to connect to server
                                if let Ok(response) = reqwest::blocking::get("http://localhost:4000") {
                                    if response.status().is_success() || response.status().as_u16() == 404 {
                                        server_ready = true;
                                        println!("✅ Server is ready after {} seconds", i + 1);
                                        break;
                                    }
                                }
                            }
                            
                            if !server_ready {
                                println!("⚠️  Server failed to start in time");
                                let _ = window_clone.emit("startup-progress", serde_json::json!({
                                    "step": "server",
                                    "status": "error",
                                    "message": "Server timeout",
                                    "errorMessage": "Server did not start in 30 seconds"
                                }));
                                return;
                            }
                        }
                        Err(e) => {
                            println!("⚠️  Failed to start server: {}", e);
                            let _ = window_clone.emit("startup-progress", serde_json::json!({
                                "step": "server",
                                "status": "error",
                                "message": "Failed to start server",
                                "errorMessage": format!("Error: {}", e)
                            }));
                            return;
                        }
                    }
                }
                
                if server_ready {
                    let _ = window_clone.emit("startup-progress", serde_json::json!({
                        "step": "server",
                        "status": "complete",
                        "message": "Server ready"
                    }));
                    
                    // Navigate to the splash screen
                    let _ = window_clone.eval("window.location.href = 'http://localhost:4000/desktop-startup'");
                } else {
                    // Server failed to start - show error
                    println!("❌ Server failed to start");
                    
                    let error_html = r#"
                        <!DOCTYPE html>
                        <html>
                        <head>
                            <meta charset="UTF-8">
                            <style>
                                body { margin:0; padding:40px; background:#0f172a; color:white; font-family:system-ui; }
                                .container { max-width:600px; margin:0 auto; text-align:center; }
                                .logo { width:80px; height:80px; background:linear-gradient(135deg,#3b82f6,#8b5cf6); border-radius:20px; margin:0 auto 30px; display:flex; align-items:center; justify-content:center; font-size:40px; font-weight:bold; }
                                h1 { font-size:28px; margin:20px 0 10px; }
                                .error { color:#f87171; margin-bottom:30px; }
                                .info { background:#1e293b; border-radius:12px; padding:20px; text-align:left; margin-bottom:20px; }
                                code { background:#0f172a; padding:4px 8px; border-radius:4px; font-family:monospace; }
                                .btn { display:inline-block; padding:15px 30px; background:#3b82f6; color:white; border:none; border-radius:8px; font-size:16px; font-weight:600; cursor:pointer; }
                                .btn:hover { background:#2563eb; }
                            </style>
                        </head>
                        <body>
                            <div class="container">
                                <div class="logo">M</div>
                                <h1>MyDistinctAI Desktop</h1>
                                <p class="error">❌ Could not start the development server</p>
                                <div class="info">
                                    <p>Please make sure Node.js is installed and try running manually:</p>
                                    <p><code>npm run dev</code></p>
                                </div>
                                <button class="btn" onclick="window.location.reload()">🔄 Retry</button>
                            </div>
                        </body>
                        </html>
                    "#;
                    
                    let _ = window_clone.eval(&format!("document.write(`{}`)", error_html.replace('`', "\\`")));
                    return;
                }
                
                // Step 2: Check Ollama
                let _ = window_clone.emit("startup-progress", serde_json::json!({
                    "step": "ollama",
                    "status": "loading",
                    "message": "Checking Ollama..."
                }));
                
                println!("🔍 Checking Ollama status...");
                let ollama_service = OllamaService::new("http://localhost:11434".to_string());
                
                if let Ok(false) = ollama_service.is_ollama_installed() {
                    println!("⚠️  Ollama not installed");
                    let _ = window_clone.emit("startup-progress", serde_json::json!({
                        "step": "ollama",
                        "status": "error",
                        "message": "Ollama not installed",
                        "errorMessage": "Please install Ollama to use local AI models"
                    }));
                } else {
                    if let Ok(()) = ollama_service.start_ollama_server() {
                        println!("✅ Ollama server started");
                    }
                    
                    std::thread::sleep(std::time::Duration::from_secs(2));
                    
                    let _ = window_clone.emit("startup-progress", serde_json::json!({
                        "step": "ollama",
                        "status": "complete",
                        "message": "Ollama ready"
                    }));
                    
                    // Step 3: Download model (skip gracefully if offline)
                    let _ = window_clone.emit("startup-progress", serde_json::json!({
                        "step": "model",
                        "status": "loading",
                        "message": "Checking mistral:7b model...",
                        "progress": 0
                    }));
                    
                    println!("📦 Checking for mistral:7b model...");
                    let window_model = window_clone.clone();
                    
                    // Check if Ollama is actually accessible before trying to pull
                    let ollama_check = Command::new("ollama")
                        .args(&["list"])
                        .stdout(Stdio::piped())
                        .stderr(Stdio::piped())
                        .output();
                    
                    let ollama_accessible = match ollama_check {
                        Ok(output) => output.status.success(),
                        Err(_) => false,
                    };
                    
                    if !ollama_accessible {
                        println!("⚠️  Ollama not accessible (offline mode?) - skipping model pull");
                        let _ = window_clone.emit("startup-progress", serde_json::json!({
                            "step": "model",
                            "status": "skipped",
                            "message": "Offline - using cached models"
                        }));
                    } else {
                        let pull_result = Command::new("ollama")
                            .args(&["pull", "mistral:7b"])
                            .stdout(Stdio::piped())
                            .stderr(Stdio::piped())
                            .spawn();
                        
                        match pull_result {
                            Ok(mut child) => {
                                println!("🔄 Pulling mistral:7b model...");
                                
                                std::thread::spawn(move || {
                                    for i in (0..=100).step_by(10) {
                                        let _ = window_model.emit("startup-progress", serde_json::json!({
                                            "step": "model",
                                            "status": "loading",
                                            "message": "Downloading mistral:7b...",
                                            "progress": i
                                        }));
                                        std::thread::sleep(std::time::Duration::from_millis(500));
                                    }
                                    
                                    if let Ok(status) = child.wait() {
                                        if status.success() {
                                            println!("✅ mistral:7b model ready");
                                            let _ = window_model.emit("startup-progress", serde_json::json!({
                                                "step": "model",
                                                "status": "complete",
                                                "message": "Model ready",
                                                "progress": 100
                                            }));
                                        } else {
                                            println!("⚠️  Failed to pull model (offline?)");
                                            let _ = window_model.emit("startup-progress", serde_json::json!({
                                                "step": "model",
                                                "status": "skipped",
                                                "message": "Using cached models"
                                            }));
                                        }
                                    }
                                });
                            }
                            Err(e) => {
                                println!("⚠️  Could not pull model (offline?): {}", e);
                                let _ = window_clone.emit("startup-progress", serde_json::json!({
                                    "step": "model",
                                    "status": "skipped",
                                    "message": "Using cached models"
                                }));
                            }
                        }
                    }
                }
                
                // Step 4: Finalize
                std::thread::sleep(std::time::Duration::from_secs(1));
                
                let _ = window_clone.emit("startup-progress", serde_json::json!({
                    "step": "ready",
                    "status": "loading",
                    "message": "Finalizing..."
                }));
                
                std::thread::sleep(std::time::Duration::from_secs(1));
                
                let _ = window_clone.emit("startup-progress", serde_json::json!({
                    "step": "ready",
                    "status": "complete",
                    "message": "Ready!"
                }));
            });
            
            // Initialize services
            let ollama = Arc::new(Mutex::new(OllamaService::new(
                "http://localhost:11434".to_string()
            )));

            let app_data_dir = app.path().app_data_dir()?;

            let storage = Arc::new(Mutex::new(
                LocalStorage::new(app_data_dir.clone())
            ));

            let encryption = Arc::new(Mutex::new(EncryptionService::new()));

            // Initialize LanceDB with path in app data directory
            let lancedb_path = app_data_dir.join("lancedb");
            let lancedb = Arc::new(Mutex::new(LanceDBService::new(lancedb_path)));

            // Initialize SQLite database (use block_on since setup is not async)
            let db_path = app_data_dir.join("mydistinctai.db");
            let database = Arc::new(Mutex::new(
                tauri::async_runtime::block_on(async {
                    Database::new(db_path).await
                        .expect("Failed to initialize database")
                })
            ));

            // Set up application state
            app.manage(AppState {
                ollama,
                storage,
                encryption,
                lancedb,
                database,
            });

            println!("✅ Application initialized successfully!");
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            check_ollama_installed,
            start_ollama_server,
            check_ollama_status,
            list_ollama_models,
            pull_ollama_model,
            generate_response,
            stream_response,
            extract_text_from_file,
            chunk_text,
            generate_embeddings,
            generate_embeddings_batch,
            store_embeddings,
            search_similar,
            get_rag_context,
            encrypt_data,
            decrypt_data,
            save_user_data,
            load_user_data,
            delete_user_data,
            list_data_keys,
            save_model_config,
            load_model_config,
            save_chat_history,
            load_chat_history,
            process_file,
            get_file_info,
            process_and_store_file,
            // Database commands
            db_create_model,
            db_get_model,
            db_list_models,
            db_update_model,
            db_delete_model,
            db_add_training_data,
            db_list_training_data,
            db_delete_training_data,
            db_create_chat_session,
            db_list_chat_sessions,
            db_get_chat_session,
            db_delete_chat_session,
            db_add_chat_message,
            db_get_chat_messages,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
