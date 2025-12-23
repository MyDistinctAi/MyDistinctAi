use crate::error::{AppError, AppResult};
use aes_gcm::{
    aead::{Aead, KeyInit, OsRng},
    Aes256Gcm, Nonce,
};
use argon2::{
    password_hash::{PasswordHasher, SaltString},
    Argon2,
};
use rand::RngCore;

/// Service for encrypting and decrypting data
pub struct EncryptionService;

impl EncryptionService {
    pub fn new() -> Self {
        Self
    }

    /// Derive a 256-bit key from a password using Argon2
    fn derive_key(&self, password: &str, salt: &[u8]) -> AppResult<[u8; 32]> {
        let argon2 = Argon2::default();
        let salt_string = SaltString::encode_b64(salt)
            .map_err(|e| AppError::Encryption(format!("Failed to encode salt: {}", e)))?;

        let password_hash = argon2
            .hash_password(password.as_bytes(), &salt_string)
            .map_err(|e| AppError::Encryption(format!("Failed to hash password: {}", e)))?;

        let hash = password_hash.hash
            .ok_or_else(|| AppError::Encryption("No hash produced".to_string()))?;

        let hash_bytes = hash.as_bytes();
        let mut key = [0u8; 32];
        key.copy_from_slice(&hash_bytes[..32]);

        Ok(key)
    }

    /// Encrypt data with AES-256-GCM
    pub fn encrypt(&self, data: &str, password: &str) -> AppResult<String> {
        // Generate random salt (16 bytes)
        let mut salt = [0u8; 16];
        OsRng.fill_bytes(&mut salt);

        // Derive key from password
        let key = self.derive_key(password, &salt)?;

        // Create cipher
        let cipher = Aes256Gcm::new(&key.into());

        // Generate random nonce (12 bytes for GCM)
        let mut nonce_bytes = [0u8; 12];
        OsRng.fill_bytes(&mut nonce_bytes);
        let nonce = Nonce::from_slice(&nonce_bytes);

        // Encrypt data
        let ciphertext = cipher
            .encrypt(nonce, data.as_bytes())
            .map_err(|e| AppError::Encryption(format!("Encryption failed: {}", e)))?;

        // Combine salt + nonce + ciphertext and encode as hex
        let mut result = Vec::new();
        result.extend_from_slice(&salt);
        result.extend_from_slice(&nonce_bytes);
        result.extend_from_slice(&ciphertext);

        Ok(hex::encode(result))
    }

    /// Decrypt data with AES-256-GCM
    pub fn decrypt(&self, encrypted_hex: &str, password: &str) -> AppResult<String> {
        // Decode from hex
        let encrypted_data = hex::decode(encrypted_hex)
            .map_err(|e| AppError::Encryption(format!("Invalid hex encoding: {}", e)))?;

        if encrypted_data.len() < 28 {
            return Err(AppError::Encryption("Data too short".to_string()));
        }

        // Extract salt, nonce, and ciphertext
        let salt = &encrypted_data[0..16];
        let nonce_bytes = &encrypted_data[16..28];
        let ciphertext = &encrypted_data[28..];

        // Derive key from password
        let key = self.derive_key(password, salt)?;

        // Create cipher
        let cipher = Aes256Gcm::new(&key.into());
        let nonce = Nonce::from_slice(nonce_bytes);

        // Decrypt data
        let plaintext = cipher
            .decrypt(nonce, ciphertext)
            .map_err(|e| AppError::Encryption(format!("Decryption failed: {}", e)))?;

        String::from_utf8(plaintext)
            .map_err(|e| AppError::Encryption(format!("Invalid UTF-8: {}", e)))
    }

    /// Generate a random encryption key
    pub fn generate_key(&self) -> String {
        let mut key = [0u8; 32];
        OsRng.fill_bytes(&mut key);
        hex::encode(key)
    }

    /// Hash a password for storage
    pub fn hash_password(&self, password: &str) -> AppResult<String> {
        let salt = SaltString::generate(&mut OsRng);
        let argon2 = Argon2::default();

        let password_hash = argon2
            .hash_password(password.as_bytes(), &salt)
            .map_err(|e| AppError::Encryption(format!("Failed to hash password: {}", e)))?;

        Ok(password_hash.to_string())
    }

    /// Verify a password against a hash
    pub fn verify_password(&self, password: &str, hash: &str) -> AppResult<bool> {
        use argon2::password_hash::{PasswordHash, PasswordVerifier};

        let parsed_hash = PasswordHash::new(hash)
            .map_err(|e| AppError::Encryption(format!("Invalid hash: {}", e)))?;

        Ok(Argon2::default()
            .verify_password(password.as_bytes(), &parsed_hash)
            .is_ok())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_encrypt_decrypt() {
        let service = EncryptionService::new();
        let data = "Hello, World!";
        let password = "my_secure_password";

        let encrypted = service.encrypt(data, password).unwrap();
        let decrypted = service.decrypt(&encrypted, password).unwrap();

        assert_eq!(data, decrypted);
    }

    #[test]
    fn test_encrypt_decrypt_fails_with_wrong_password() {
        let service = EncryptionService::new();
        let data = "Hello, World!";
        let password = "my_secure_password";
        let wrong_password = "wrong_password";

        let encrypted = service.encrypt(data, password).unwrap();
        let result = service.decrypt(&encrypted, wrong_password);

        assert!(result.is_err());
    }

    #[test]
    fn test_generate_key() {
        let service = EncryptionService::new();
        let key1 = service.generate_key();
        let key2 = service.generate_key();

        assert_ne!(key1, key2);
        assert_eq!(key1.len(), 64); // 32 bytes = 64 hex characters
    }

    #[test]
    fn test_password_hashing() {
        let service = EncryptionService::new();
        let password = "my_password";

        let hash = service.hash_password(password).unwrap();
        assert!(service.verify_password(password, &hash).unwrap());
        assert!(!service.verify_password("wrong_password", &hash).unwrap());
    }
}
