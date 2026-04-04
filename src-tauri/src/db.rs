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
    conn.query_row("SELECT count(*) FROM sqlite_master", [], |_| Ok(()))?;

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

use crate::models::{House, Person};

pub fn add_person(conn: &Connection, name: &str, role: Option<&str>) -> Result<i64> {
    conn.execute(
        "INSERT INTO people (name, role) VALUES (?1, ?2)",
        rusqlite::params![name, role],
    )?;
    Ok(conn.last_insert_rowid())
}

pub fn get_people(conn: &Connection) -> Result<Vec<Person>> {
    let mut stmt = conn.prepare("SELECT id, name, role FROM people")?;
    let person_iter = stmt.query_map([], |row| {
        Ok(Person {
            id: row.get(0)?,
            name: row.get(1)?,
            role: row.get(2)?,
        })
    })?;

    let mut people = Vec::new();
    for person in person_iter {
        people.push(person?);
    }
    Ok(people)
}

pub fn add_house(conn: &Connection, name: &str, address: Option<&str>) -> Result<i64> {
    conn.execute(
        "INSERT INTO houses (name, address) VALUES (?1, ?2)",
        rusqlite::params![name, address],
    )?;
    Ok(conn.last_insert_rowid())
}

pub fn get_houses(conn: &Connection) -> Result<Vec<House>> {
    let mut stmt = conn.prepare("SELECT id, name, address FROM houses")?;
    let house_iter = stmt.query_map([], |row| {
        Ok(House {
            id: row.get(0)?,
            name: row.get(1)?,
            address: row.get(2)?,
        })
    })?;

    let mut houses = Vec::new();
    for house in house_iter {
        houses.push(house?);
    }
    Ok(houses)
}
