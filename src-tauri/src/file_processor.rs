use crate::error::{AppError, AppResult};
use lopdf::Document;
use std::fs;
use std::path::Path;
use unicode_segmentation::UnicodeSegmentation;

/// Supported file types
#[derive(Debug, Clone, Copy)]
pub enum FileType {
    Pdf,
    Docx,
    Txt,
    Md,
    Csv,
}

impl FileType {
    /// Detect file type from extension
    pub fn from_extension(ext: &str) -> AppResult<Self> {
        match ext.to_lowercase().as_str() {
            "pdf" => Ok(FileType::Pdf),
            "docx" => Ok(FileType::Docx),
            "txt" => Ok(FileType::Txt),
            "md" => Ok(FileType::Md),
            "csv" => Ok(FileType::Csv),
            _ => Err(AppError::Unknown(format!("Unsupported file type: {}", ext))),
        }
    }
}

/// Text chunk with metadata
#[derive(Debug, Clone)]
pub struct TextChunk {
    pub text: String,
    pub index: usize,
    pub char_start: usize,
    pub char_end: usize,
}

/// File processing service
pub struct FileProcessor;

impl FileProcessor {
    pub fn new() -> Self {
        Self
    }

    /// Extract text from a file based on its type
    pub fn extract_text(&self, file_path: &Path) -> AppResult<String> {
        // Get file extension
        let extension = file_path
            .extension()
            .and_then(|e| e.to_str())
            .ok_or_else(|| AppError::Unknown("No file extension".to_string()))?;

        let file_type = FileType::from_extension(extension)?;

        match file_type {
            FileType::Pdf => self.extract_pdf(file_path),
            FileType::Docx => self.extract_docx(file_path),
            FileType::Txt | FileType::Md | FileType::Csv => self.extract_plain_text(file_path),
        }
    }

    /// Extract text from PDF
    fn extract_pdf(&self, file_path: &Path) -> AppResult<String> {
        let doc = Document::load(file_path)
            .map_err(|e| AppError::Unknown(format!("Failed to load PDF: {}", e)))?;

        let mut text = String::new();

        // Get the number of pages
        let pages = doc.get_pages();

        for (page_num, _) in pages.iter() {
            if let Ok(page_content) = doc.extract_text(&[*page_num]) {
                text.push_str(&page_content);
                text.push('\n');
            }
        }

        if text.trim().is_empty() {
            return Err(AppError::Unknown(
                "No text could be extracted from PDF".to_string(),
            ));
        }

        Ok(text)
    }

    /// Extract text from DOCX
    fn extract_docx(&self, file_path: &Path) -> AppResult<String> {
        let file_data = fs::read(file_path)
            .map_err(|e| AppError::Io(e))?;

        let docx = docx_rs::read_docx(&file_data)
            .map_err(|e| AppError::Unknown(format!("Failed to read DOCX: {}", e)))?;

        let mut text = String::new();

        // Extract text from document body
        for child in &docx.document.children {
            match child {
                docx_rs::DocumentChild::Paragraph(para) => {
                    for child in &para.children {
                        if let docx_rs::ParagraphChild::Run(run) = child {
                            for child in &run.children {
                                if let docx_rs::RunChild::Text(txt) = child {
                                    text.push_str(&txt.text);
                                }
                            }
                        }
                    }
                    text.push('\n');
                }
                _ => {}
            }
        }

        if text.trim().is_empty() {
            return Err(AppError::Unknown(
                "No text could be extracted from DOCX".to_string(),
            ));
        }

        Ok(text)
    }

    /// Extract text from plain text files (TXT, MD, CSV)
    fn extract_plain_text(&self, file_path: &Path) -> AppResult<String> {
        fs::read_to_string(file_path)
            .map_err(|e| AppError::Io(e))
    }

    /// Chunk text into smaller pieces
    pub fn chunk_text(
        &self,
        text: &str,
        chunk_size: usize,
        overlap: usize,
    ) -> Vec<TextChunk> {
        let mut chunks = Vec::new();

        // Use grapheme clusters for proper unicode handling
        let graphemes: Vec<&str> = text.graphemes(true).collect();

        if graphemes.is_empty() {
            return chunks;
        }

        let mut start = 0;
        let mut chunk_index = 0;

        while start < graphemes.len() {
            let end = std::cmp::min(start + chunk_size, graphemes.len());

            // Extract chunk
            let chunk_graphemes = &graphemes[start..end];
            let chunk_text: String = chunk_graphemes.iter().map(|&s| s).collect();

            // Skip empty chunks
            if !chunk_text.trim().is_empty() {
                chunks.push(TextChunk {
                    text: chunk_text,
                    index: chunk_index,
                    char_start: start,
                    char_end: end,
                });
                chunk_index += 1;
            }

            // Move to next chunk with overlap
            if end >= graphemes.len() {
                break;
            }

            start += chunk_size - overlap;
        }

        chunks
    }

    /// Process a file: extract text and chunk it
    pub fn process_file(
        &self,
        file_path: &Path,
        chunk_size: usize,
        overlap: usize,
    ) -> AppResult<(String, Vec<TextChunk>)> {
        let text = self.extract_text(file_path)?;
        let chunks = self.chunk_text(&text, chunk_size, overlap);

        Ok((text, chunks))
    }

    /// Get file size in bytes
    pub fn get_file_size(&self, file_path: &Path) -> AppResult<u64> {
        let metadata = fs::metadata(file_path)
            .map_err(|e| AppError::Io(e))?;
        Ok(metadata.len())
    }

    /// Validate file size (max 10MB by default)
    pub fn validate_file_size(&self, file_path: &Path, max_size_mb: u64) -> AppResult<bool> {
        let size_bytes = self.get_file_size(file_path)?;
        let max_bytes = max_size_mb * 1024 * 1024;

        Ok(size_bytes <= max_bytes)
    }

    /// Get file info
    pub fn get_file_info(&self, file_path: &Path) -> AppResult<FileInfo> {
        let extension = file_path
            .extension()
            .and_then(|e| e.to_str())
            .ok_or_else(|| AppError::Unknown("No file extension".to_string()))?;

        let file_type = FileType::from_extension(extension)?;
        let size_bytes = self.get_file_size(file_path)?;

        let file_name = file_path
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("unknown")
            .to_string();

        Ok(FileInfo {
            name: file_name,
            file_type,
            size_bytes,
            size_mb: size_bytes as f64 / (1024.0 * 1024.0),
        })
    }
}

/// File information
#[derive(Debug)]
pub struct FileInfo {
    pub name: String,
    pub file_type: FileType,
    pub size_bytes: u64,
    pub size_mb: f64,
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Write;
    use std::env;

    #[test]
    fn test_chunk_text() {
        let processor = FileProcessor::new();
        let text = "This is a test. This is only a test. We are testing text chunking.";

        let chunks = processor.chunk_text(text, 20, 5);

        assert!(!chunks.is_empty());
        assert_eq!(chunks[0].index, 0);
    }

    #[test]
    fn test_extract_plain_text() {
        let processor = FileProcessor::new();
        let temp_dir = env::temp_dir();
        let file_path = temp_dir.join("test_file.txt");

        let test_content = "Hello, this is a test file!";
        let mut file = fs::File::create(&file_path).unwrap();
        file.write_all(test_content.as_bytes()).unwrap();

        let result = processor.extract_plain_text(&file_path);
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), test_content);

        // Cleanup
        fs::remove_file(file_path).ok();
    }

    #[test]
    fn test_file_type_detection() {
        assert!(matches!(FileType::from_extension("pdf"), Ok(FileType::Pdf)));
        assert!(matches!(FileType::from_extension("PDF"), Ok(FileType::Pdf)));
        assert!(matches!(FileType::from_extension("txt"), Ok(FileType::Txt)));
        assert!(matches!(FileType::from_extension("docx"), Ok(FileType::Docx)));
        assert!(FileType::from_extension("xyz").is_err());
    }
}
