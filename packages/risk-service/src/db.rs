use sqlx::PgPool;
use uuid::Uuid;

pub async fn save_assessment(
    pool: &PgPool,
    offer_id: Uuid,
    score: f64,
    label: &str,
    signals: &str,
    creditworthiness: f64,
) -> Result<Uuid, sqlx::Error> {
    let assessment_id = Uuid::new_v4();

    sqlx::query(
        "INSERT INTO risk_assessments (id, offer_id, score, label, signals, creditworthiness_score, created_at)
         VALUES ($1, $2, $3, $4, $5::jsonb, $6, NOW())",
    )
    .bind(assessment_id)
    .bind(offer_id)
    .bind(score)
    .bind(label)
    .bind(signals)
    .bind(creditworthiness)
    .execute(pool)
    .await?;

    Ok(assessment_id)
}

pub async fn get_assessment(
    pool: &PgPool,
    assessment_id: Uuid,
) -> Result<Option<AssessmentRow>, sqlx::Error> {
    sqlx::query_as::<_, AssessmentRow>(
        "SELECT id, score, label, signals, creditworthiness_score, created_at
         FROM risk_assessments WHERE id = $1",
    )
    .bind(assessment_id)
    .fetch_optional(pool)
    .await
}

pub async fn log_audit(
    pool: &PgPool,
    assessment_id: Uuid,
    user_id: Uuid,
    action: &str,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        "INSERT INTO compliance_audit_trail (user_id, event_type, action, details, created_at)
         VALUES ($1, 'risk_assessment', $2, $3::jsonb, NOW())",
    )
    .bind(user_id)
    .bind(action)
    .bind(serde_json::json!({"assessment_id": assessment_id.to_string()}))
    .execute(pool)
    .await?;

    Ok(())
}

#[derive(sqlx::FromRow)]
pub struct AssessmentRow {
    pub id: Uuid,
    pub score: f64,
    pub label: String,
    pub signals: serde_json::Value,
    pub creditworthiness_score: f64,
    pub created_at: chrono::DateTime<chrono::Utc>,
}
