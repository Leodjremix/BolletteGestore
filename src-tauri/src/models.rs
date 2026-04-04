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
