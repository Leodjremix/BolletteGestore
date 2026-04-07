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
            city TEXT,
            address TEXT
        )",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE
        )",
        [],
    )?;

    // Seed default categories
    let default_categories = vec![
        "GAS", "ACQUA", "RIFIUTI", "TELEFONO", "AUTO",
        "CONDOMINIO", "SPESE MEDICHE", "ACQUISTI", "TASSE", "VARIE"
    ];
    for cat in default_categories {
        let _ = conn.execute(
            "INSERT OR IGNORE INTO categories (name) VALUES (?1)",
            rusqlite::params![cat],
        );
    }

    conn.execute(
        "CREATE TABLE IF NOT EXISTS expenses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL DEFAULT 'Spesa',
            amount REAL NOT NULL,
            date TEXT NOT NULL,
            due_date TEXT,
            payment_date TEXT,
            period TEXT,
            client_code TEXT,
            consumption REAL,
            category_id INTEGER,
            invoice_number TEXT,
            person_id INTEGER,
            house_id INTEGER,
            attachment_path TEXT,
            notes TEXT,
            FOREIGN KEY(category_id) REFERENCES categories(id),
            FOREIGN KEY(person_id) REFERENCES people(id),
            FOREIGN KEY(house_id) REFERENCES houses(id)
        )",
        [],
    )?;

    // Migrations for existing users
    let _ = conn.execute("ALTER TABLE houses ADD COLUMN city TEXT", []);
    let _ = conn.execute("ALTER TABLE expenses ADD COLUMN title TEXT NOT NULL DEFAULT 'Spesa'", []);
    let _ = conn.execute("ALTER TABLE expenses ADD COLUMN due_date TEXT", []);
    let _ = conn.execute("ALTER TABLE expenses ADD COLUMN payment_date TEXT", []);
    let _ = conn.execute("ALTER TABLE expenses ADD COLUMN consumption REAL", []);
    let _ = conn.execute("ALTER TABLE expenses ADD COLUMN period TEXT", []);
    let _ = conn.execute("ALTER TABLE expenses ADD COLUMN client_code TEXT", []);
    let _ = conn.execute("ALTER TABLE expenses ADD COLUMN category_id INTEGER", []);
    let _ = conn.execute("ALTER TABLE expenses ADD COLUMN notes TEXT", []);

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

use crate::models::{House, Person, Expense, EnergyReading, Category};

pub fn get_categories(conn: &Connection) -> Result<Vec<Category>> {
    let mut stmt = conn.prepare("SELECT id, name FROM categories ORDER BY name ASC")?;
    let cat_iter = stmt.query_map([], |row| {
        Ok(Category {
            id: row.get(0)?,
            name: row.get(1)?,
        })
    })?;
    let mut cats = Vec::new();
    for c in cat_iter {
        cats.push(c?);
    }
    Ok(cats)
}

pub fn add_category(conn: &Connection, name: &str) -> Result<i64> {
    conn.execute("INSERT INTO categories (name) VALUES (?1)", rusqlite::params![name])?;
    Ok(conn.last_insert_rowid())
}

pub fn delete_category(conn: &Connection, id: i64) -> Result<()> {
    conn.execute("DELETE FROM categories WHERE id = ?1", rusqlite::params![id])?;
    Ok(())
}

pub fn add_person(conn: &Connection, name: &str, role: Option<&str>) -> Result<i64> {
    conn.execute(
        "INSERT INTO people (name, role) VALUES (?1, ?2)",
        rusqlite::params![name, role],
    )?;
    Ok(conn.last_insert_rowid())
}

pub fn update_person(conn: &Connection, id: i64, name: &str, role: Option<&str>) -> Result<()> {
    conn.execute(
        "UPDATE people SET name = ?1, role = ?2 WHERE id = ?3",
        rusqlite::params![name, role, id],
    )?;
    Ok(())
}

pub fn delete_person(conn: &Connection, id: i64) -> Result<()> {
    conn.execute("DELETE FROM people WHERE id = ?1", rusqlite::params![id])?;
    Ok(())
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

pub fn add_house(conn: &Connection, name: &str, city: Option<&str>, address: Option<&str>) -> Result<i64> {
    conn.execute(
        "INSERT INTO houses (name, city, address) VALUES (?1, ?2, ?3)",
        rusqlite::params![name, city, address],
    )?;
    Ok(conn.last_insert_rowid())
}

pub fn update_house(conn: &Connection, id: i64, name: &str, city: Option<&str>, address: Option<&str>) -> Result<()> {
    conn.execute(
        "UPDATE houses SET name = ?1, city = ?2, address = ?3 WHERE id = ?4",
        rusqlite::params![name, city, address, id],
    )?;
    Ok(())
}

pub fn delete_house(conn: &Connection, id: i64) -> Result<()> {
    conn.execute("DELETE FROM houses WHERE id = ?1", rusqlite::params![id])?;
    Ok(())
}

pub fn get_houses(conn: &Connection) -> Result<Vec<House>> {
    let mut stmt = conn.prepare("SELECT id, name, city, address FROM houses")?;
    let house_iter = stmt.query_map([], |row| {
        Ok(House {
            id: row.get(0)?,
            name: row.get(1)?,
            city: row.get(2)?,
            address: row.get(3)?,
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
    title: &str,
    amount: f64,
    date: &str,
    due_date: Option<&str>,
    payment_date: Option<&str>,
    period: Option<&str>,
    client_code: Option<&str>,
    consumption: Option<f64>,
    category_id: Option<i64>,
    invoice_number: Option<&str>,
    person_id: Option<i64>,
    house_id: Option<i64>,
    attachment_path: Option<&str>,
    notes: Option<&str>,
) -> Result<i64> {
    conn.execute(
        "INSERT INTO expenses (title, amount, date, due_date, payment_date, period, client_code, consumption, category_id, invoice_number, person_id, house_id, attachment_path, notes)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14)",
        rusqlite::params![title, amount, date, due_date, payment_date, period, client_code, consumption, category_id, invoice_number, person_id, house_id, attachment_path, notes],
    )?;
    Ok(conn.last_insert_rowid())
}

pub fn update_expense(
    conn: &Connection,
    id: i64,
    title: &str,
    amount: f64,
    date: &str,
    due_date: Option<&str>,
    payment_date: Option<&str>,
    period: Option<&str>,
    client_code: Option<&str>,
    consumption: Option<f64>,
    category_id: Option<i64>,
    invoice_number: Option<&str>,
    person_id: Option<i64>,
    house_id: Option<i64>,
    attachment_path: Option<&str>,
    notes: Option<&str>,
) -> Result<()> {
    conn.execute(
        "UPDATE expenses SET title = ?1, amount = ?2, date = ?3, due_date = ?4, payment_date = ?5, period = ?6, client_code = ?7, consumption = ?8, category_id = ?9, invoice_number = ?10, person_id = ?11, house_id = ?12, attachment_path = ?13, notes = ?14
         WHERE id = ?15",
        rusqlite::params![title, amount, date, due_date, payment_date, period, client_code, consumption, category_id, invoice_number, person_id, house_id, attachment_path, notes, id],
    )?;
    Ok(())
}

pub fn delete_expense(conn: &Connection, id: i64) -> Result<()> {
    conn.execute("DELETE FROM expenses WHERE id = ?1", rusqlite::params![id])?;
    Ok(())
}

pub fn get_expenses(conn: &Connection) -> Result<Vec<Expense>> {
    let mut stmt = conn.prepare(
        "SELECT e.id, e.title, e.amount, e.date, e.due_date, e.payment_date, e.period, e.client_code, e.consumption, e.category_id, c.name as category_name, e.invoice_number, e.person_id, e.house_id, e.attachment_path, e.notes
         FROM expenses e
         LEFT JOIN categories c ON e.category_id = c.id
         ORDER BY e.date DESC"
    )?;
    let expense_iter = stmt.query_map([], |row| {
        Ok(Expense {
            id: row.get(0)?,
            title: row.get(1)?,
            amount: row.get(2)?,
            date: row.get(3)?,
            due_date: row.get(4)?,
            payment_date: row.get(5)?,
            period: row.get(6)?,
            client_code: row.get(7)?,
            consumption: row.get(8)?,
            category_id: row.get(9)?,
            category_name: row.get(10)?,
            invoice_number: row.get(11)?,
            person_id: row.get(12)?,
            house_id: row.get(13)?,
            attachment_path: row.get(14)?,
            notes: row.get(15)?,
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

pub fn update_energy_reading(
    conn: &Connection,
    id: i64,
    date: &str,
    temperature: f64,
    humidity: f64,
    electricity_kwh: f64,
    gas_smc: f64,
) -> Result<()> {
    conn.execute(
        "UPDATE energy_readings SET date = ?1, temperature = ?2, humidity = ?3, electricity_kwh = ?4, gas_smc = ?5 WHERE id = ?6",
        rusqlite::params![date, temperature, humidity, electricity_kwh, gas_smc, id],
    )?;
    Ok(())
}

pub fn delete_energy_reading(conn: &Connection, id: i64) -> Result<()> {
    conn.execute("DELETE FROM energy_readings WHERE id = ?1", rusqlite::params![id])?;
    Ok(())
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
