use crate::{AppState, RiskAssessmentRequest, RiskAssessmentResponse, RiskSignal};
use actix_web::{web, HttpResponse};
use uuid::Uuid;

pub async fn assess_risk(
    state: web::Data<AppState>,
    req: web::Json<RiskAssessmentRequest>,
) -> HttpResponse {
    match assess_risk_internal(&state, &req).await {
        Ok(response) => HttpResponse::Created().json(response),
        Err(e) => {
            tracing::error!("Risk assessment error: {}", e);
            HttpResponse::InternalServerError().json(serde_json::json!({
                "error": "Assessment failed",
                "details": e.to_string()
            }))
        }
    }
}

async fn assess_risk_internal(
    state: &AppState,
    req: &RiskAssessmentRequest,
) -> Result<RiskAssessmentResponse, Box<dyn std::error::Error>> {
    use crate::scoring::score_risk;

    let score = score_risk(req);
    let label = match score {
        0.0..=20.0 => "very_low",
        20.1..=40.0 => "low",
        40.1..=60.0 => "medium",
        60.1..=80.0 => "high",
        _ => "very_high",
    };

    let creditworthiness = (score * 1.2).min(100.0);
    let signals = generate_signals(&req, score);

    let assessment_id = Uuid::new_v4();

    // Persist to DB
    let _result = state
        .db
        .query(
            "INSERT INTO risk_assessments (id, offer_id, score, label, signals, creditworthiness_score, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, NOW())
             RETURNING id",
            &[
                &assessment_id,
                &req.offer_id,
                &score,
                &label,
                &serde_json::to_string(&signals).unwrap_or_default(),
                &creditworthiness,
            ],
        )
        .await;

    Ok(RiskAssessmentResponse {
        assessment_id,
        score,
        label: label.to_string(),
        signals,
        creditworthiness_score: creditworthiness,
    })
}

pub async fn get_assessment(
    state: web::Data<AppState>,
    assessment_id: web::Path<String>,
) -> HttpResponse {
    let assessment_id = match Uuid::parse_str(&assessment_id.into_inner()) {
        Ok(id) => id,
        Err(_) => return HttpResponse::BadRequest().json(serde_json::json!({"error": "Invalid UUID"})),
    };

    match state
        .db
        .query(
            "SELECT id, score, label, signals, creditworthiness_score FROM risk_assessments WHERE id = $1",
            &[&assessment_id],
        )
        .await
    {
        Ok(rows) => {
            if rows.is_empty() {
                return HttpResponse::NotFound().json(serde_json::json!({"error": "Not found"}));
            }
            HttpResponse::Ok().json(&rows[0])
        }
        Err(e) => {
            tracing::error!("Assessment fetch error: {}", e);
            HttpResponse::InternalServerError().json(serde_json::json!({"error": "Fetch failed"}))
        }
    }
}

pub async fn score_creditworthiness(
    req: web::Json<serde_json::Value>,
) -> HttpResponse {
    let buyer_profile = req.into_inner();
    let credit_score = buyer_profile
        .get("credit_score")
        .and_then(|v| v.as_f64())
        .unwrap_or(650.0);

    let creditworthiness = (credit_score / 850.0) * 100.0;

    HttpResponse::Ok().json(serde_json::json!({
        "creditworthiness_score": creditworthiness.min(100.0),
        "credit_score": credit_score
    }))
}

fn generate_signals(req: &RiskAssessmentRequest, score: f64) -> Vec<RiskSignal> {
    let mut signals = vec![];

    // Credit history signal
    if score > 60.0 {
        signals.push(RiskSignal {
            signal_type: "low_credit_history".to_string(),
            severity: "high".to_string(),
            description: "Credit history indicates higher default risk".to_string(),
        });
    }

    // Price deviation signal
    let buyer_profile = &req.buyer_profile;
    if let Some(avg_budget) = buyer_profile.get("average_budget").and_then(|v| v.as_f64()) {
        let deviation = (req.offer_amount_cents as f64 - avg_budget).abs() / avg_budget;
        if deviation > 0.5 {
            signals.push(RiskSignal {
                signal_type: "unusual_price".to_string(),
                severity: "medium".to_string(),
                description: format!("Offer {}% away from buyer's average", (deviation * 100.0) as i32),
            });
        }
    }

    // Transaction velocity signal
    if let Some(recent_offers) = buyer_profile.get("recent_offers").and_then(|v| v.as_u64()) {
        if recent_offers > 5 {
            signals.push(RiskSignal {
                signal_type: "high_velocity".to_string(),
                severity: "medium".to_string(),
                description: format!("{} offers in last 30 days", recent_offers),
            });
        }
    }

    signals
}
