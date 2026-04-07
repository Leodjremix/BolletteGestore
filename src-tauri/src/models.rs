use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct Person {
    pub id: i64,
    pub name: String,
    pub role: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct House {
    pub id: i64,
    pub name: String, // alias/nomignolo
    pub city: Option<String>,
    pub address: Option<String>, // via
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Category {
    pub id: i64,
    pub name: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Expense {
    pub id: i64,
    pub title: String,
    pub amount: f64,
    pub date: String, // issue_date
    pub due_date: Option<String>,
    pub payment_date: Option<String>,
    pub period: Option<String>, // periodo di riferimento
    pub client_code: Option<String>, // codice cliente
    pub consumption: Option<f64>,
    pub category_id: Option<i64>, // foreign key instead of string
    pub category_name: Option<String>, // joined field for frontend
    pub invoice_number: Option<String>,
    pub person_id: Option<i64>,
    pub house_id: Option<i64>,
    pub attachment_path: Option<String>,
    pub notes: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct EnergyReading {
    pub id: i64,
    pub date: String,
    pub temperature: f64,
    pub humidity: f64,
    pub electricity_kwh: f64,
    pub gas_smc: f64,
}
