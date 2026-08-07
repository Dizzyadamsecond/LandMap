use actix_web::{web, App, HttpServer, HttpResponse, middleware::Logger};
use sqlx::postgres::PgPoolOptions;
use redis::Client;
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use std::sync::Arc;

mod models;
mod handlers;
mod scoring;
mod db;

pub use handlers::*;
pub use models::*;

#[derive(Clone)]
pub struct AppState {
    pub db: sqlx::PgPool,
    pub redis: Arc<redis::Connection>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RiskSignal {
    pub signal_type: String,
    pub severity: String,
    pub description: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RiskAssessmentRequest {
    pub offer_id: Uuid,
    pub buyer_id: Uuid,
    pub property_id: Uuid,
    pub offer_amount_cents: i64,
    pub buyer_profile: serde_json::Value,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RiskAssessmentResponse {
    pub assessment_id: Uuid,
    pub score: f64,
    pub label: String,
    pub signals: Vec<RiskSignal>,
    pub creditworthiness_score: f64,
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    env_logger::init_from_env(env_logger::Env::new().default_filter_or("info"));

    let db_url = std::env::var("DATABASE_URL")
        .expect("DATABASE_URL must be set");
    let redis_url = std::env::var("REDIS_URL")
        .unwrap_or_else(|_| "redis://127.0.0.1:6379".to_string());
    let port = std::env::var("SERVICE_PORT")
        .unwrap_or_else(|_| "3002".to_string());

    // Database
    let db = PgPoolOptions::new()
        .max_connections(10)
        .connect(&db_url)
        .await
        .expect("Failed to connect to database");

    // Redis
    let redis = Client::open(redis_url)
        .expect("Failed to create Redis client")
        .get_connection()
        .expect("Failed to connect to Redis");

    let state = AppState {
        db,
        redis: Arc::new(redis),
    };

    println!("🚀 Risk Service starting on port {}", port);

    HttpServer::new(move || {
        App::new()
            .app_data(web::Data::new(state.clone()))
            .wrap(Logger::default())
            .route("/health", web::get().to(health_check))
            .route("/api/v1/risk/assess", web::post().to(assess_risk))
            .route("/api/v1/risk/{assessment_id}", web::get().to(get_assessment))
            .route("/api/v1/creditworthiness", web::post().to(score_creditworthiness))
    })
    .bind(format!("0.0.0.0:{}", port))?
    .run()
    .await
}

async fn health_check() -> HttpResponse {
    HttpResponse::Ok().json(serde_json::json!({
        "status": "ok",
        "service": "risk-service"
    }))
}
