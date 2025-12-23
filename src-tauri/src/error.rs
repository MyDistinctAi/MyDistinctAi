use thiserror::Error;

#[derive(Error, Debug)]
pub enum AppError {
    #[error("Ollama error: {0}")]
    Ollama(String),

    #[error("Ollama error: {0}")]
    OllamaError(String),

    #[error("Storage error: {0}")]
    Storage(String),

    #[error("Encryption error: {0}")]
    Encryption(String),

    #[error("LanceDB error: {0}")]
    LanceDB(String),

    #[error("Network error: {0}")]
    Network(String),

    #[error("Serialization error: {0}")]
    Serialization(String),

    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    #[error("Request error: {0}")]
    Request(#[from] reqwest::Error),

    #[error("JSON error: {0}")]
    Json(#[from] serde_json::Error),

    #[error("Unknown error: {0}")]
    Unknown(String),
}

pub type AppResult<T> = Result<T, AppError>;
