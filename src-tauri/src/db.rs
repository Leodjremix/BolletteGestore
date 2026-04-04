use rusqlite::{Connection, Result};
use std::path::PathBuf;
use std::fs;

pub fn get_db_path(app_handle: &tauri::AppHandle) -> PathBuf {
    use tauri::Manager;
    let mut path = app_handle.path().app_data_dir().expect("Failed to get app data dir");
    fs::create_dir_all(&path).expect("Failed to create app data dir");
    path.push("app.db");
    path
}

pub fn init_db(db_path: &PathBuf, key: &str) -> Result<Connection> {
    let conn = Connection::open(db_path)?;

    // Set the encryption key using SQLCipher
    conn.pragma_update(None, "key", key)?;

    // Test if the key is correct by attempting to read from the schema
    conn.execute("SELECT count(*) FROM sqlite_master", [])?;

    // Create tables if they don't exist
    conn.execute(
        "CREATE TABLE IF NOT EXISTS people (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            role TEXT
        )",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS houses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            address TEXT
        )",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS expenses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            amount REAL NOT NULL,
            date TEXT NOT NULL,
            category TEXT NOT NULL,
            invoice_number TEXT,
            person_id INTEGER,
            house_id INTEGER,
            attachment_path TEXT,
            FOREIGN KEY(person_id) REFERENCES people(id),
            FOREIGN KEY(house_id) REFERENCES houses(id)
        )",
        [],
    )?;

    Ok(conn)
}
