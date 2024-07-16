use aes_gcm::{
    aead::{Aead, KeyInit, OsRng},
    Aes256Gcm, Nonce, Key // Or `Aes128Gcm`
};
use rand::RngCore;
use anyhow::Result;

#[test]
fn test_generate_key() {
    let key_str = generate_key();
    println!("{}", key_str);
}

#[test]
fn test_encrypt() {
    let key_str = String::from("9865019e6e19b04cccc73f387e24aea8dc59f2121393e642790a2b058568608a");
    let plaintext = String::from("Hello, world!");
    let ciphertext = encrypt(&key_str, plaintext).unwrap();
    println!("{}", ciphertext);
}

#[test]
fn test_decrypt() {
    let key_str = String::from("9865019e6e19b04cccc73f387e24aea8dc59f2121393e642790a2b058568608a");
    let ciphertext = String::from("74095b64e3790bcfdcf7b5dc.911ec0d7b9f2d6a8a77e4f4ba18095208cfeebb9671a7cf0c2b046ba5b");
    let plaintext = decrypt(&key_str, ciphertext).unwrap();
    println!("{}", plaintext);
}

pub fn generate_key() -> String{
    let key = Aes256Gcm::generate_key(OsRng);
    format!("{:x}", key)
}

pub fn encrypt(key: &str, plaintext: String) -> Result<String, String> {
    let key_bytes = hex::decode(key).map_err(|_| "Invalid key")?;
    let key = Key::<Aes256Gcm>::from_slice(&key_bytes);
    let cipher = Aes256Gcm::new(key);

    let mut rng = rand::thread_rng();
    let mut nonce = [0u8; 12];
    rng.fill_bytes(&mut nonce);
    let nonce = Nonce::from_slice(&nonce);

    let ciphertext = cipher.encrypt(nonce, plaintext.as_bytes().as_ref())
        .map_err(|_| "Encryption failure")?;

    Ok(format!("{}.{}", hex::encode(&nonce), hex::encode(&ciphertext)))
}

pub fn decrypt(key: &str, data: String) -> Result<String, String> {
    let key_bytes = hex::decode(key).map_err(|_| "Invalid key")?;
    let key = Key::<Aes256Gcm>::from_slice(&key_bytes);
    let cipher = Aes256Gcm::new(key);

    let mut parts = data.splitn(2, '.');
    let nonce = parts.next().ok_or("Missing nonce")?;
    let ciphertext = parts.next().ok_or("Missing ciphertext")?;

    let nonce_bytes = hex::decode(nonce).map_err(|_| "Invalid nonce")?;
    let nonce = Nonce::from_slice(&nonce_bytes);

    let ciphertext_bytes = hex::decode(ciphertext).map_err(|_| "Invalid ciphertext")?;

    let plaintext = cipher.decrypt(nonce, ciphertext_bytes.as_ref())
        .map_err(|_| "Decryption failure")?;

    Ok(String::from_utf8(plaintext).map_err(|_| "Invalid UTF-8")?)
}