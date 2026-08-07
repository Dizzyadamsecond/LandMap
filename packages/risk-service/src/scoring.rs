use crate::RiskAssessmentRequest;

/// Risk scoring algorithm: weighted combination of factors
/// Total: 100 points
/// - Credit history (40%)
/// - Transaction history (30%)
/// - Market risk (20%)
/// - Fraud flags (10%)
pub fn score_risk(req: &RiskAssessmentRequest) -> f64 {
    let credit_score = score_credit_history(&req.buyer_profile);
    let transaction_score = score_transaction_history(&req.buyer_profile);
    let market_score = score_market_risk(&req);
    let fraud_score = score_fraud_flags(&req.buyer_profile);

    // Weighted average
    (credit_score * 0.4 + transaction_score * 0.3 + market_score * 0.2 + fraud_score * 0.1)
        .min(100.0)
        .max(0.0)
}

fn score_credit_history(profile: &serde_json::Value) -> f64 {
    if let Some(credit) = profile.get("credit_score").and_then(|v| v.as_f64()) {
        // 850 = perfect (0 risk), 300 = worst (100 risk)
        if credit >= 750.0 {
            10.0 // Very low risk
        } else if credit >= 650.0 {
            25.0 // Low risk
        } else if credit >= 550.0 {
            50.0 // Medium risk
        } else if credit >= 450.0 {
            75.0 // High risk
        } else {
            95.0 // Very high risk
        }
    } else {
        50.0 // Unknown = medium risk
    }
}

fn score_transaction_history(profile: &serde_json::Value) -> f64 {
    let successful_deals = profile
        .get("successful_deals")
        .and_then(|v| v.as_u64())
        .unwrap_or(0);

    let failed_deals = profile
        .get("failed_deals")
        .and_then(|v| v.as_u64())
        .unwrap_or(0);

    let total_deals = successful_deals + failed_deals;

    if total_deals == 0 {
        60.0 // No history = medium risk
    } else {
        let success_rate = successful_deals as f64 / total_deals as f64;

        if success_rate >= 0.95 {
            5.0 // Excellent
        } else if success_rate >= 0.85 {
            20.0 // Good
        } else if success_rate >= 0.70 {
            45.0 // Fair
        } else if success_rate >= 0.50 {
            70.0 // Poor
        } else {
            90.0 // Very poor
        }
    }
}

fn score_market_risk(req: &RiskAssessmentRequest) -> f64 {
    // Market risk based on property value and buyer's portfolio
    if let Some(portfolio_value) = req.buyer_profile.get("portfolio_value_cents")
        .and_then(|v| v.as_u64())
    {
        let offer_pct = (req.offer_amount_cents as f64 / portfolio_value as f64) * 100.0;

        if offer_pct < 10.0 {
            15.0 // Small investment = low risk
        } else if offer_pct < 25.0 {
            30.0 // Moderate investment
        } else if offer_pct < 50.0 {
            55.0 // Large investment
        } else if offer_pct < 100.0 {
            75.0 // Very large
        } else {
            95.0 // Exceeds portfolio (impossible but flag it)
        }
    } else {
        60.0 // Unknown portfolio = medium risk
    }
}

fn score_fraud_flags(profile: &serde_json::Value) -> f64 {
    let mut flags = 0.0;

    // Check for suspicious patterns
    if let Some(true) = profile.get("identity_verified").and_then(|v| v.as_bool()) {
        flags -= 10.0; // Verified identity is good
    }

    if let Some(true) = profile.get("email_verified").and_then(|v| v.as_bool()) {
        flags -= 5.0;
    }

    if let Some(true) = profile.get("phone_verified").and_then(|v| v.as_bool()) {
        flags -= 5.0;
    }

    if let Some(failed_attempts) = profile.get("failed_login_attempts").and_then(|v| v.as_u64()) {
        if failed_attempts > 3 {
            flags += 20.0;
        }
    }

    if let Some(account_age_days) = profile.get("account_age_days").and_then(|v| v.as_u64()) {
        if account_age_days < 30 {
            flags += 25.0; // Very new account
        } else if account_age_days < 90 {
            flags += 10.0; // New account
        }
    }

    flags.min(100.0).max(0.0)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_excellent_buyer() {
        let profile = serde_json::json!({
            "credit_score": 800.0,
            "successful_deals": 10,
            "failed_deals": 0,
            "portfolio_value_cents": 10_000_000_000i64,
            "identity_verified": true,
            "email_verified": true,
            "account_age_days": 365
        });

        let req = RiskAssessmentRequest {
            offer_id: uuid::Uuid::new_v4(),
            buyer_id: uuid::Uuid::new_v4(),
            property_id: uuid::Uuid::new_v4(),
            offer_amount_cents: 500_000_000,
            buyer_profile: profile,
        };

        let score = score_risk(&req);
        assert!(score < 30.0); // Should be very low risk
    }

    #[test]
    fn test_risky_buyer() {
        let profile = serde_json::json!({
            "credit_score": 400.0,
            "successful_deals": 1,
            "failed_deals": 3,
            "portfolio_value_cents": 100_000_000i64,
            "identity_verified": false,
            "account_age_days": 10
        });

        let req = RiskAssessmentRequest {
            offer_id: uuid::Uuid::new_v4(),
            buyer_id: uuid::Uuid::new_v4(),
            property_id: uuid::Uuid::new_v4(),
            offer_amount_cents: 10_000_000_000, // Way over budget
            buyer_profile: profile,
        };

        let score = score_risk(&req);
        assert!(score > 70.0); // Should be high risk
    }
}
