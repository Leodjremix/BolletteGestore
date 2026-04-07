use argon2::{
    password_hash::{
        rand_core::OsRng,
        PasswordHash, PasswordHasher, PasswordVerifier, SaltString
    },
    Argon2
};
use rusqlite::Connection;

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

pub fn has_users(conn: &Connection) -> bool {
    let count: i64 = conn.query_row("SELECT count(*) FROM users", [], |row| row.get(0)).unwrap_or(0);
    count > 0
}

pub fn register_user(conn: &Connection, username: &str, password: &str) -> Result<i64, String> {
    let hash = hash_password(password);
    conn.execute(
        "INSERT INTO users (username, password_hash, role) VALUES (?1, ?2, 'admin')",
        rusqlite::params![username, hash],
    ).map_err(|e| e.to_string())?;
    Ok(conn.last_insert_rowid())
}

pub fn verify_user_login(conn: &Connection, username: &str, password: &str) -> Result<i64, String> {
    let mut stmt = conn.prepare("SELECT id, password_hash FROM users WHERE username = ?1 AND is_deleted = 0").map_err(|e| e.to_string())?;

    let user_row = stmt.query_row(rusqlite::params![username], |row| {
        let id: i64 = row.get(0)?;
        let hash: String = row.get(1)?;
        Ok((id, hash))
    });

    match user_row {
        Ok((id, hash)) => {
            if verify_password(password, &hash) {
                Ok(id)
            } else {
                Err("Invalid password".to_string())
            }
        },
        Err(_) => Err("User not found".to_string())
    }
}
