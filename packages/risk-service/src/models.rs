use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BuyerProfile {
    pub credit_score: f64,
    pub successful_deals: u64,
    pub failed_deals: u64,
    pub portfolio_value_cents: u64,
    pub identity_verified: bool,
    pub email_verified: bool,
    pub phone_verified: bool,
    pub failed_login_attempts: u64,
    pub account_age_days: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RiskFactor {
    pub factor_type: String,
    pub weight: f64,
    pub value: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuditLog {
    pub assessment_id: String,
    pub user_id: String,
    pub action: String,
    pub timestamp: String,
}
