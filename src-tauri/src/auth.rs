use argon2::{
    password_hash::{
        rand_core::OsRng,
        PasswordHash, PasswordHasher, PasswordVerifier, SaltString
    },
    Argon2
};
use std::fs;
use std::path::PathBuf;

pub fn get_hash_path(app_handle: &tauri::AppHandle) -> PathBuf {
    use tauri::Manager;
    let mut path = app_handle.path().app_data_dir().expect("Failed to get app data dir");
    fs::create_dir_all(&path).expect("Failed to create app data dir");
    path.push("master.hash");
    path
}

pub fn has_master_password(app_handle: &tauri::AppHandle) -> bool {
    let path = get_hash_path(app_handle);
    path.exists()
}

pub fn hash_password(password: &str) -> String {
    let salt = SaltString::generate(&mut OsRng);
    let argon2 = Argon2::default();

    let password_hash = argon2.hash_password(password.as_bytes(), &salt)
        .expect("Failed to hash password")
        .to_string();

    password_hash
}

pub fn verify_password(password: &str, hash: &str) -> bool {
    let parsed_hash = match PasswordHash::new(hash) {
        Ok(h) => h,
        Err(_) => return false,
    };

    let argon2 = Argon2::default();
    argon2.verify_password(password.as_bytes(), &parsed_hash).is_ok()
}
