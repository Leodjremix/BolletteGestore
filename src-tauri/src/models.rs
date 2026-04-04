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
    pub amount: f64,
    pub date: String,
    pub category: String,
    pub invoice_number: Option<String>,
    pub person_id: Option<i64>,
    pub house_id: Option<i64>,
    pub attachment_path: Option<String>,
}
