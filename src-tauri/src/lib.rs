use std::sync::Mutex;
use tauri::{AppHandle, State};

mod auth;
mod db;
mod models;

struct AppState {
    db_conn: Mutex<Option<rusqlite::Connection>>,
}

#[tauri::command]
fn check_first_run(app_handle: AppHandle) -> bool {
    !auth::has_master_password(&app_handle)
}

#[tauri::command]
fn register(app_handle: AppHandle, password: &str) -> Result<bool, String> {
    if auth::has_master_password(&app_handle) {
        return Err("Already registered".into());
    }

    let hash = auth::hash_password(password);
    let hash_path = auth::get_hash_path(&app_handle);
    std::fs::write(hash_path, hash).map_err(|e| e.to_string())?;

    Ok(true)
}

#[tauri::command]
fn login(app_handle: AppHandle, state: State<'_, AppState>, password: &str) -> Result<bool, String> {
    let hash_path = auth::get_hash_path(&app_handle);
    let stored_hash = std::fs::read_to_string(hash_path).map_err(|e| e.to_string())?;

    if !auth::verify_password(password, &stored_hash) {
        return Ok(false);
    }

    // Pass is good, derive DB key and open connection
    // For simplicity right now, using password as key directly
    let db_path = db::get_db_path(&app_handle);

    match db::init_db(&db_path, password) {
        Ok(conn) => {
            let mut db_conn = state.db_conn.lock().unwrap();
            *db_conn = Some(conn);
            Ok(true)
        },
        Err(e) => {
            Err(format!("Database unlock failed: {}", e))
        }
    }
}

#[tauri::command]
fn add_person(state: State<'_, AppState>, name: &str, role: Option<&str>) -> Result<i64, String> {
    let db_conn = state.db_conn.lock().unwrap();
    if let Some(conn) = db_conn.as_ref() {
        db::add_person(conn, name, role).map_err(|e| e.to_string())
    } else {
        Err("Database not connected".into())
    }
}

#[tauri::command]
fn get_people(state: State<'_, AppState>) -> Result<Vec<models::Person>, String> {
    let db_conn = state.db_conn.lock().unwrap();
    if let Some(conn) = db_conn.as_ref() {
        db::get_people(conn).map_err(|e| e.to_string())
    } else {
        Err("Database not connected".into())
    }
}

#[tauri::command]
fn add_house(state: State<'_, AppState>, name: &str, address: Option<&str>) -> Result<i64, String> {
    let db_conn = state.db_conn.lock().unwrap();
    if let Some(conn) = db_conn.as_ref() {
        db::add_house(conn, name, address).map_err(|e| e.to_string())
    } else {
        Err("Database not connected".into())
    }
}

#[tauri::command]
fn get_houses(state: State<'_, AppState>) -> Result<Vec<models::House>, String> {
    let db_conn = state.db_conn.lock().unwrap();
    if let Some(conn) = db_conn.as_ref() {
        db::get_houses(conn).map_err(|e| e.to_string())
    } else {
        Err("Database not connected".into())
    }
}

#[tauri::command]
fn add_expense(
    app_handle: AppHandle,
    state: State<'_, AppState>,
    amount: f64,
    date: &str,
    category: &str,
    invoice_number: Option<&str>,
    person_id: Option<i64>,
    house_id: Option<i64>,
    attachment_path: Option<&str>,
) -> Result<i64, String> {

    let mut final_attachment_path = None;

    // Copy the attachment to our secure app directory if provided
    if let Some(path) = attachment_path {
        use tauri::Manager;
        let original_path = std::path::Path::new(path);
        if original_path.exists() {
            let mut app_dir = app_handle.path().app_data_dir().expect("Failed to get app data dir");
            app_dir.push("attachments");
            std::fs::create_dir_all(&app_dir).map_err(|e| e.to_string())?;

            if let Some(file_name) = original_path.file_name() {
                // Prepend timestamp to avoid collisions
                let ts = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_millis();
                let new_file_name = format!("{}_{}", ts, file_name.to_string_lossy());
                app_dir.push(new_file_name);

                std::fs::copy(original_path, &app_dir).map_err(|e| e.to_string())?;
                final_attachment_path = Some(app_dir.to_string_lossy().into_owned());
            }
        }
    }

    let db_conn = state.db_conn.lock().unwrap();
    if let Some(conn) = db_conn.as_ref() {
        db::add_expense(
            conn,
            amount,
            date,
            category,
            invoice_number,
            person_id,
            house_id,
            final_attachment_path.as_deref()
        ).map_err(|e| e.to_string())
    } else {
        Err("Database not connected".into())
    }
}

#[tauri::command]
fn get_expenses(state: State<'_, AppState>) -> Result<Vec<models::Expense>, String> {
    let db_conn = state.db_conn.lock().unwrap();
    if let Some(conn) = db_conn.as_ref() {
        db::get_expenses(conn).map_err(|e| e.to_string())
    } else {
        Err("Database not connected".into())
    }
}

#[tauri::command]
fn add_energy_reading(
    state: State<'_, AppState>,
    date: &str,
    temperature: f64,
    humidity: f64,
    electricity_kwh: f64,
    gas_smc: f64,
) -> Result<i64, String> {
    let db_conn = state.db_conn.lock().unwrap();
    if let Some(conn) = db_conn.as_ref() {
        db::add_energy_reading(conn, date, temperature, humidity, electricity_kwh, gas_smc).map_err(|e| e.to_string())
    } else {
        Err("Database not connected".into())
    }
}

#[tauri::command]
fn get_energy_readings(state: State<'_, AppState>) -> Result<Vec<models::EnergyReading>, String> {
    let db_conn = state.db_conn.lock().unwrap();
    if let Some(conn) = db_conn.as_ref() {
        db::get_energy_readings(conn).map_err(|e| e.to_string())
    } else {
        Err("Database not connected".into())
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(AppState {
            db_conn: Mutex::new(None),
        })
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            check_first_run,
            register,
            login,
            add_person,
            get_people,
            add_house,
            get_houses,
            add_expense,
            get_expenses,
            add_energy_reading,
            get_energy_readings
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
