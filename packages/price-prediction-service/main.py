from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel
from typing import Optional
import os
import json
import asyncpg
from datetime import datetime, timedelta
import numpy as np

app = FastAPI(title="Price Prediction Service", version="1.0.0")

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://dev:dev@postgres:5432/landmap")

class PredictionRequest(BaseModel):
    property_id: str
    timeframe: str  # 7d, 30d, 90d, 1y

class PredictionResponse(BaseModel):
    property_id: str
    timeframe: str
    predicted_price_cents: int
    confidence_interval_lower_cents: int
    confidence_interval_upper_cents: int
    confidence_pct: float
    model_version: str

async def connect_db():
    global db
    db = await asyncpg.create_pool(DATABASE_URL)

async def disconnect_db():
    await db.close()

@app.on_event("startup")
async def startup():
    await connect_db()

@app.on_event("shutdown")
async def shutdown():
    await disconnect_db()

@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "price-prediction-service"}

@app.post("/api/v1/predict", response_model=PredictionResponse)
async def predict_price(
    req: PredictionRequest,
    x_user_id: Optional[str] = Header(None)
):
    if not x_user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")

    try:
        # Fetch property
        prop = await db.fetchrow(
            "SELECT id, price_cents, location, property_type FROM properties WHERE id = $1",
            req.property_id
        )

        if not prop:
            raise HTTPException(status_code=404, detail="Property not found")

        current_price = prop['price_cents']

        # Simple linear model: predict based on market trend (±2-5% per month baseline)
        timeframe_days = {
            "7d": 7,
            "30d": 30,
            "90d": 90,
            "1y": 365
        }.get(req.timeframe, 30)

        # Simulate trend: random walk with 0.5% per month drift
        monthly_change = 0.005  # 0.5% per month
        months = timeframe_days / 30
        drift = monthly_change * months

        # Add some randomness
        volatility = 0.05  # 5% volatility
        noise = np.random.normal(0, volatility)

        predicted_change = drift + noise
        predicted_price = int(current_price * (1 + predicted_change))

        # Confidence interval: ±volatility%
        ci_lower = int(predicted_price * (1 - volatility))
        ci_upper = int(predicted_price * (1 + volatility))

        # Confidence increases with more data
        confidence = min(85.0, 50.0 + (timeframe_days / 365.0 * 35.0))

        # Persist to DB
        await db.execute(
            """INSERT INTO price_predictions (property_id, prediction_type, predicted_price_cents,
               confidence_interval_lower_cents, confidence_interval_upper_cents, confidence_pct,
               model_version, created_at)
               VALUES ($1, $2, $3, $4, $5, $6, 'v1.0-simple', NOW())
            """,
            req.property_id,
            req.timeframe,
            predicted_price,
            ci_lower,
            ci_upper,
            confidence
        )

        return PredictionResponse(
            property_id=req.property_id,
            timeframe=req.timeframe,
            predicted_price_cents=predicted_price,
            confidence_interval_lower_cents=ci_lower,
            confidence_interval_upper_cents=ci_upper,
            confidence_pct=confidence,
            model_version="v1.0-simple"
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3005)
