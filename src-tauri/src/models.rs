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
    pub name: String,
    pub address: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Expense {
    pub id: i64,
    pub title: String,
    pub amount: f64,
    pub date: String,
    pub due_date: Option<String>,
    pub payment_date: Option<String>,
    pub consumption: Option<f64>,
    pub category: String,
    pub invoice_number: Option<String>,
    pub person_id: Option<i64>,
    pub house_id: Option<i64>,
    pub attachment_path: Option<String>,
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
