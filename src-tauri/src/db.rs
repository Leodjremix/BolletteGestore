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

    conn.execute(
        "CREATE TABLE IF NOT EXISTS energy_readings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT NOT NULL,
            temperature REAL NOT NULL,
            humidity REAL NOT NULL,
            electricity_kwh REAL NOT NULL,
            gas_smc REAL NOT NULL
        )",
        [],
    )?;

    Ok(conn)
}

use crate::models::{House, Person, Expense, EnergyReading};

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

pub fn add_expense(
    conn: &Connection,
    amount: f64,
    date: &str,
    category: &str,
    invoice_number: Option<&str>,
    person_id: Option<i64>,
    house_id: Option<i64>,
    attachment_path: Option<&str>,
) -> Result<i64> {
    conn.execute(
        "INSERT INTO expenses (amount, date, category, invoice_number, person_id, house_id, attachment_path)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        rusqlite::params![amount, date, category, invoice_number, person_id, house_id, attachment_path],
    )?;
    Ok(conn.last_insert_rowid())
}

pub fn get_expenses(conn: &Connection) -> Result<Vec<Expense>> {
    let mut stmt = conn.prepare(
        "SELECT id, amount, date, category, invoice_number, person_id, house_id, attachment_path FROM expenses ORDER BY date DESC"
    )?;
    let expense_iter = stmt.query_map([], |row| {
        Ok(Expense {
            id: row.get(0)?,
            amount: row.get(1)?,
            date: row.get(2)?,
            category: row.get(3)?,
            invoice_number: row.get(4)?,
            person_id: row.get(5)?,
            house_id: row.get(6)?,
            attachment_path: row.get(7)?,
        })
    })?;

    let mut expenses = Vec::new();
    for expense in expense_iter {
        expenses.push(expense?);
    }
    Ok(expenses)
}

pub fn add_energy_reading(
    conn: &Connection,
    date: &str,
    temperature: f64,
    humidity: f64,
    electricity_kwh: f64,
    gas_smc: f64,
) -> Result<i64> {
    conn.execute(
        "INSERT INTO energy_readings (date, temperature, humidity, electricity_kwh, gas_smc)
         VALUES (?1, ?2, ?3, ?4, ?5)",
        rusqlite::params![date, temperature, humidity, electricity_kwh, gas_smc],
    )?;
    Ok(conn.last_insert_rowid())
}

pub fn get_energy_readings(conn: &Connection) -> Result<Vec<EnergyReading>> {
    let mut stmt = conn.prepare(
        "SELECT id, date, temperature, humidity, electricity_kwh, gas_smc FROM energy_readings ORDER BY date ASC"
    )?;
    let reading_iter = stmt.query_map([], |row| {
        Ok(EnergyReading {
            id: row.get(0)?,
            date: row.get(1)?,
            temperature: row.get(2)?,
            humidity: row.get(3)?,
            electricity_kwh: row.get(4)?,
            gas_smc: row.get(5)?,
        })
    })?;

    let mut readings = Vec::new();
    for reading in reading_iter {
        readings.push(reading?);
    }
    Ok(readings)
}
