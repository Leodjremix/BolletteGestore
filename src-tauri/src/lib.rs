use std::sync::Mutex;
use tauri::{AppHandle, State};

mod auth;
mod db;
mod models;

struct AppState {
    db_conn: Mutex<Option<rusqlite::Connection>>,
    current_user_id: Mutex<Option<i64>>,
}

// Since the DB needs to be unlocked *before* we can read users,
// we introduce an unlock command that uses the raw password for SQLCipher,
// and then we verify the user credentials inside the decrypted DB.
#[tauri::command]
fn unlock_db(app_handle: AppHandle, state: State<'_, AppState>, password: &str) -> Result<bool, String> {
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
fn check_first_run(state: State<'_, AppState>) -> Result<bool, String> {
    let db_conn = state.db_conn.lock().unwrap();
    if let Some(conn) = db_conn.as_ref() {
        Ok(!auth::has_users(conn))
    } else {
        Err("Database not connected".into())
    }
}

#[tauri::command]
fn register(state: State<'_, AppState>, username: &str, password: &str) -> Result<bool, String> {
    let db_conn = state.db_conn.lock().unwrap();
    if let Some(conn) = db_conn.as_ref() {
        // Removed the strict has_users check to allow multiple user registrations
        let user_id = auth::register_user(conn, username, password)?;
        let mut current_user = state.current_user_id.lock().unwrap();
        *current_user = Some(user_id);
        Ok(true)
    } else {
        Err("Database not connected".into())
    }
}

#[tauri::command]
fn login(state: State<'_, AppState>, username: &str, password: &str) -> Result<bool, String> {
    let db_conn = state.db_conn.lock().unwrap();
    if let Some(conn) = db_conn.as_ref() {
        match auth::verify_user_login(conn, username, password) {
            Ok(user_id) => {
                let mut current_user = state.current_user_id.lock().unwrap();
                *current_user = Some(user_id);
                Ok(true)
            },
            Err(e) => Err(e)
        }
    } else {
        Err("Database not connected".into())
    }
}

#[tauri::command]
fn add_person(state: State<'_, AppState>, name: &str, role: Option<&str>) -> Result<i64, String> {
    let user_id = state.current_user_id.lock().unwrap().ok_or("User not logged in")?;
    let db_conn = state.db_conn.lock().unwrap();
    if let Some(conn) = db_conn.as_ref() {
        db::add_person(conn, name, role, user_id).map_err(|e| e.to_string())
    } else {
        Err("Database not connected".into())
    }
}

#[tauri::command]
fn update_person(state: State<'_, AppState>, id: i64, name: &str, role: Option<&str>) -> Result<(), String> {
    let user_id = state.current_user_id.lock().unwrap().ok_or("User not logged in")?;
    let db_conn = state.db_conn.lock().unwrap();
    if let Some(conn) = db_conn.as_ref() {
        db::update_person(conn, id, name, role, user_id).map_err(|e| e.to_string())
    } else {
        Err("Database not connected".into())
    }
}

#[tauri::command]
fn delete_person(state: State<'_, AppState>, id: i64) -> Result<(), String> {
    let user_id = state.current_user_id.lock().unwrap().ok_or("User not logged in")?;
    let db_conn = state.db_conn.lock().unwrap();
    if let Some(conn) = db_conn.as_ref() {
        db::delete_person(conn, id, user_id).map_err(|e| e.to_string())
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
fn add_house(state: State<'_, AppState>, name: &str, city: Option<&str>, address: Option<&str>) -> Result<i64, String> {
    let user_id = state.current_user_id.lock().unwrap().ok_or("User not logged in")?;
    let db_conn = state.db_conn.lock().unwrap();
    if let Some(conn) = db_conn.as_ref() {
        db::add_house(conn, name, city, address, user_id).map_err(|e| e.to_string())
    } else {
        Err("Database not connected".into())
    }
}

#[tauri::command]
fn update_house(state: State<'_, AppState>, id: i64, name: &str, city: Option<&str>, address: Option<&str>) -> Result<(), String> {
    let user_id = state.current_user_id.lock().unwrap().ok_or("User not logged in")?;
    let db_conn = state.db_conn.lock().unwrap();
    if let Some(conn) = db_conn.as_ref() {
        db::update_house(conn, id, name, city, address, user_id).map_err(|e| e.to_string())
    } else {
        Err("Database not connected".into())
    }
}

#[tauri::command]
fn delete_house(state: State<'_, AppState>, id: i64) -> Result<(), String> {
    let user_id = state.current_user_id.lock().unwrap().ok_or("User not logged in")?;
    let db_conn = state.db_conn.lock().unwrap();
    if let Some(conn) = db_conn.as_ref() {
        db::delete_house(conn, id, user_id).map_err(|e| e.to_string())
    } else {
        Err("Database not connected".into())
    }
}

#[tauri::command]
fn get_categories(state: State<'_, AppState>) -> Result<Vec<models::Category>, String> {
    let db_conn = state.db_conn.lock().unwrap();
    if let Some(conn) = db_conn.as_ref() {
        db::get_categories(conn).map_err(|e| e.to_string())
    } else {
        Err("Database not connected".into())
    }
}

#[tauri::command]
fn add_category(state: State<'_, AppState>, name: &str) -> Result<i64, String> {
    let user_id = state.current_user_id.lock().unwrap().ok_or("User not logged in")?;
    let db_conn = state.db_conn.lock().unwrap();
    if let Some(conn) = db_conn.as_ref() {
        db::add_category(conn, name, user_id).map_err(|e| e.to_string())
    } else {
        Err("Database not connected".into())
    }
}

#[tauri::command]
fn delete_category(state: State<'_, AppState>, id: i64) -> Result<(), String> {
    let user_id = state.current_user_id.lock().unwrap().ok_or("User not logged in")?;
    let db_conn = state.db_conn.lock().unwrap();
    if let Some(conn) = db_conn.as_ref() {
        db::delete_category(conn, id, user_id).map_err(|e| e.to_string())
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
) -> Result<i64, String> {

    let user_id = state.current_user_id.lock().unwrap().ok_or("User not logged in")?;
    let db_conn = state.db_conn.lock().unwrap();
    let conn = db_conn.as_ref().ok_or("Database not connected")?;

    let mut final_category_id = category_id;

    // Auto-categorization logic if no category was selected
    if final_category_id.is_none() {
        let t_lower = title.to_lowercase();
        let target_category = if t_lower.contains("enel") || t_lower.contains("servizio elettrico") || t_lower.contains("luce") {
            Some("Bolletta Luce")
        } else if t_lower.contains("gas") || t_lower.contains("eni") || t_lower.contains("plenitude") {
            Some("Bolletta Gas")
        } else if t_lower.contains("tim") || t_lower.contains("vodafone") || t_lower.contains("fastweb") || t_lower.contains("wind") || t_lower.contains("internet") {
            Some("Bolletta Internet")
        } else if t_lower.contains("acqua") || t_lower.contains("idrico") {
            Some("Bolletta Acqua")
        } else if t_lower.contains("tari") || t_lower.contains("imu") || t_lower.contains("tassa") {
            Some("Tasse")
        } else {
            Some("VARIE")
        };

        if let Some(cat_name) = target_category {
            // Find or create the category
            let mut stmt = conn.prepare("SELECT id FROM categories WHERE name = ?1").unwrap();
            let mut rows = stmt.query(rusqlite::params![cat_name]).unwrap();
            if let Some(row) = rows.next().unwrap() {
                final_category_id = Some(row.get(0).unwrap());
            } else {
                // If it doesn't exist, create it (shouldn't happen often due to seeds, but for Bolletta Luce etc. it might)
                let _ = conn.execute("INSERT INTO categories (name) VALUES (?1)", rusqlite::params![cat_name]);
                final_category_id = Some(conn.last_insert_rowid());
            }
        }
    }

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

    db::add_expense(
        conn,
        title,
        amount,
        date,
        due_date,
        payment_date,
        period,
        client_code,
        consumption,
        final_category_id,
        invoice_number,
        person_id,
        house_id,
        final_attachment_path.as_deref(),
        notes,
        user_id
    ).map_err(|e| e.to_string())
}

#[tauri::command]
fn update_expense(
    app_handle: AppHandle,
    state: State<'_, AppState>,
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
) -> Result<(), String> {

    let user_id = state.current_user_id.lock().unwrap().ok_or("User not logged in")?;
    let mut final_attachment_path = None;

    // Copy the attachment to our secure app directory if provided
    if let Some(path) = attachment_path {
        let original_path = std::path::Path::new(path);
        // Only try to copy if it's a real file that exists and isn't already in our app_data_dir
        if original_path.exists() {
            use tauri::Manager;
            let mut app_dir = app_handle.path().app_data_dir().expect("Failed to get app data dir");
            app_dir.push("attachments");
            std::fs::create_dir_all(&app_dir).map_err(|e| e.to_string())?;

            // If the path doesn't start with our app_dir, it's a new file we need to copy
            if !path.starts_with(app_dir.to_string_lossy().as_ref()) {
                if let Some(file_name) = original_path.file_name() {
                    let ts = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_millis();
                    let new_file_name = format!("{}_{}", ts, file_name.to_string_lossy());
                    app_dir.push(new_file_name);

                    std::fs::copy(original_path, &app_dir).map_err(|e| e.to_string())?;
                    final_attachment_path = Some(app_dir.to_string_lossy().into_owned());
                }
            } else {
                // It's already in our attachments folder (user didn't change the attachment)
                final_attachment_path = Some(path.to_string());
            }
        } else {
            // Path provided but doesn't exist on disk, might just be the string value from DB already
            final_attachment_path = Some(path.to_string());
        }
    }

    let db_conn = state.db_conn.lock().unwrap();
    if let Some(conn) = db_conn.as_ref() {
        db::update_expense(
            conn,
            id,
            title,
            amount,
            date,
            due_date,
            payment_date,
            period,
            client_code,
            consumption,
            category_id,
            invoice_number,
            person_id,
            house_id,
            final_attachment_path.as_deref(),
            notes,
            user_id
        ).map_err(|e| e.to_string())
    } else {
        Err("Database not connected".into())
    }
}

#[tauri::command]
fn delete_expense(state: State<'_, AppState>, id: i64) -> Result<(), String> {
    let user_id = state.current_user_id.lock().unwrap().ok_or("User not logged in")?;
    let db_conn = state.db_conn.lock().unwrap();
    if let Some(conn) = db_conn.as_ref() {
        db::delete_expense(conn, id, user_id).map_err(|e| e.to_string())
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
    let user_id = state.current_user_id.lock().unwrap().ok_or("User not logged in")?;
    let db_conn = state.db_conn.lock().unwrap();
    if let Some(conn) = db_conn.as_ref() {
        db::add_energy_reading(conn, date, temperature, humidity, electricity_kwh, gas_smc, user_id).map_err(|e| e.to_string())
    } else {
        Err("Database not connected".into())
    }
}

#[tauri::command]
fn update_energy_reading(
    state: State<'_, AppState>,
    id: i64,
    date: &str,
    temperature: f64,
    humidity: f64,
    electricity_kwh: f64,
    gas_smc: f64,
) -> Result<(), String> {
    let user_id = state.current_user_id.lock().unwrap().ok_or("User not logged in")?;
    let db_conn = state.db_conn.lock().unwrap();
    if let Some(conn) = db_conn.as_ref() {
        db::update_energy_reading(conn, id, date, temperature, humidity, electricity_kwh, gas_smc, user_id).map_err(|e| e.to_string())
    } else {
        Err("Database not connected".into())
    }
}

#[tauri::command]
fn delete_energy_reading(state: State<'_, AppState>, id: i64) -> Result<(), String> {
    let user_id = state.current_user_id.lock().unwrap().ok_or("User not logged in")?;
    let db_conn = state.db_conn.lock().unwrap();
    if let Some(conn) = db_conn.as_ref() {
        db::delete_energy_reading(conn, id, user_id).map_err(|e| e.to_string())
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
            current_user_id: Mutex::new(None),
        })
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            unlock_db,
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
            get_energy_readings,
            update_person,
            delete_person,
            update_house,
            delete_house,
            update_expense,
            delete_expense,
            update_energy_reading,
            delete_energy_reading,
            get_categories,
            add_category,
            delete_category
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
