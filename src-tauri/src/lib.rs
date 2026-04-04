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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(AppState {
            db_conn: Mutex::new(None),
        })
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            check_first_run,
            register,
            login,
            add_person,
            get_people,
            add_house,
            get_houses
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
