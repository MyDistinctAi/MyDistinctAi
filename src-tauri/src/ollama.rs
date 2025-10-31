use crate::error::{AppError, AppResult};
use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::time::Duration;

#[derive(Debug, Serialize, Deserialize)]
pub struct OllamaModel {
    pub name: String,
    pub size: u64,
    pub modified_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GenerateRequest {
    pub model: String,
    pub prompt: String,
    pub stream: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub context: Option<Vec<i32>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub options: Option<GenerateOptions>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct GenerateOptions {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub temperature: Option<f32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub top_p: Option<f32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub top_k: Option<i32>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GenerateResponse {
    pub model: String,
    pub created_at: String,
    pub response: String,
    pub done: bool,
    #[serde(default)]
    pub context: Vec<i32>,
}

/// Service for interacting with Ollama
pub struct OllamaService {
    base_url: String,
    client: Client,
}

impl OllamaService {
    /// Create a new Ollama service
    pub fn new(base_url: String) -> Self {
        let client = Client::builder()
            .timeout(Duration::from_secs(300)) // 5 minutes for large model responses
            .build()
            .unwrap();

        Self { base_url, client }
    }

    /// Check if Ollama is running
    pub async fn check_status(&self) -> AppResult<bool> {
        let url = format!("{}/api/tags", self.base_url);

        match self.client.get(&url).send().await {
            Ok(response) => Ok(response.status().is_success()),
            Err(_) => Ok(false),
        }
    }

    /// List available models
    pub async fn list_models(&self) -> AppResult<Vec<String>> {
        let url = format!("{}/api/tags", self.base_url);

        let response = self.client
            .get(&url)
            .send()
            .await
            .map_err(|e| AppError::Ollama(format!("Failed to fetch models: {}", e)))?;

        if !response.status().is_success() {
            return Err(AppError::Ollama("Ollama is not running or not accessible".to_string()));
        }

        #[derive(Deserialize)]
        struct TagsResponse {
            models: Vec<OllamaModel>,
        }

        let tags: TagsResponse = response.json().await
            .map_err(|e| AppError::Ollama(format!("Failed to parse models: {}", e)))?;

        Ok(tags.models.into_iter().map(|m| m.name).collect())
    }

    /// Pull a model from Ollama registry
    pub async fn pull_model(&self, model: &str) -> AppResult<String> {
        let url = format!("{}/api/pull", self.base_url);

        #[derive(Serialize)]
        struct PullRequest {
            name: String,
            stream: bool,
        }

        let request = PullRequest {
            name: model.to_string(),
            stream: false,
        };

        let response = self.client
            .post(&url)
            .json(&request)
            .send()
            .await
            .map_err(|e| AppError::Ollama(format!("Failed to pull model: {}", e)))?;

        if !response.status().is_success() {
            return Err(AppError::Ollama(format!("Failed to pull model: {}", model)));
        }

        Ok(format!("Successfully pulled model: {}", model))
    }

    /// Generate a response from Ollama
    pub async fn generate(
        &self,
        model: &str,
        prompt: &str,
        context: Option<Vec<String>>,
    ) -> AppResult<String> {
        let url = format!("{}/api/generate", self.base_url);

        // Build the full prompt with context if provided
        let full_prompt = if let Some(ctx) = context {
            format!("Context:\n{}\n\nQuestion: {}", ctx.join("\n"), prompt)
        } else {
            prompt.to_string()
        };

        let request = GenerateRequest {
            model: model.to_string(),
            prompt: full_prompt,
            stream: false,
            context: None,
            options: Some(GenerateOptions {
                temperature: Some(0.7),
                top_p: Some(0.9),
                top_k: Some(40),
            }),
        };

        let response = self.client
            .post(&url)
            .json(&request)
            .timeout(Duration::from_secs(300))
            .send()
            .await
            .map_err(|e| AppError::Ollama(format!("Failed to generate response: {}", e)))?;

        if !response.status().is_success() {
            let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
            return Err(AppError::Ollama(format!("Generation failed: {}", error_text)));
        }

        let generate_response: GenerateResponse = response.json().await
            .map_err(|e| AppError::Ollama(format!("Failed to parse response: {}", e)))?;

        Ok(generate_response.response)
    }

    /// Stream generate a response (returns immediately with stream ID)
    pub async fn stream_generate(
        &self,
        model: &str,
        prompt: &str,
        context: Option<Vec<String>>,
    ) -> AppResult<String> {
        // For now, we'll use non-streaming generation
        // In a full implementation, this would set up a streaming connection
        // and return a stream ID that the frontend can poll
        self.generate(model, prompt, context).await
    }

    /// Check if a specific model is available
    pub async fn has_model(&self, model: &str) -> AppResult<bool> {
        let models = self.list_models().await?;
        Ok(models.iter().any(|m| m.contains(model)))
    }

    /// Get model info
    pub async fn get_model_info(&self, model: &str) -> AppResult<OllamaModel> {
        let url = format!("{}/api/show", self.base_url);

        #[derive(Serialize)]
        struct ShowRequest {
            name: String,
        }

        let request = ShowRequest {
            name: model.to_string(),
        };

        let response = self.client
            .post(&url)
            .json(&request)
            .send()
            .await
            .map_err(|e| AppError::Ollama(format!("Failed to get model info: {}", e)))?;

        if !response.status().is_success() {
            return Err(AppError::Ollama(format!("Model not found: {}", model)));
        }

        // Parse the response
        #[derive(Deserialize)]
        struct ShowResponse {
            modelfile: String,
            parameters: String,
            template: String,
        }

        let show_response: ShowResponse = response.json().await
            .map_err(|e| AppError::Ollama(format!("Failed to parse model info: {}", e)))?;

        // Return basic model info (in a real implementation, parse more details)
        Ok(OllamaModel {
            name: model.to_string(),
            size: 0, // Would be parsed from response
            modified_at: chrono::Utc::now().to_rfc3339(),
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_ollama_service_creation() {
        let service = OllamaService::new("http://localhost:11434".to_string());
        assert_eq!(service.base_url, "http://localhost:11434");
    }
}
