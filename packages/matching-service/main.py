from fastapi import FastAPI, Header, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Optional, List
import os
import uuid
import json
from datetime import datetime
import asyncpg

app = FastAPI(title="Matching Service", version="1.0.0")

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://dev:dev@postgres:5432/landmap")
REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379")

class MatchRequest(BaseModel):
    buyer_id: str
    property_ids: Optional[List[str]] = None
    limit: int = 10

class MatchResponse(BaseModel):
    buyer_id: str
    matches: List[dict]
    generated_at: str

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
    return {"status": "ok", "service": "matching-service"}

@app.post("/api/v1/matches", response_model=MatchResponse)
async def get_matches(
    req: MatchRequest,
    x_user_id: Optional[str] = Header(None)
):
    if not x_user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")

    # Simple content-based matching: price + location + property type
    matches = []

    try:
        # Fetch buyer profile
        buyer = await db.fetchrow(
            "SELECT id, preferences FROM users WHERE id = $1",
            req.buyer_id
        )

        if not buyer:
            raise HTTPException(status_code=404, detail="Buyer not found")

        prefs = buyer['preferences'] or {}
        preferred_location = prefs.get('location')
        max_price = prefs.get('max_price', 10_000_000_00)  # 10M default
        min_price = prefs.get('min_price', 50_000_00)  # 50k default

        # Fetch properties
        query = """
            SELECT id, title, location, price_cents, property_type, features
            FROM properties
            WHERE price_cents BETWEEN $1 AND $2
            ORDER BY id DESC
            LIMIT $3
        """
        properties = await db.fetch(query, min_price, max_price, req.limit)

        for prop in properties:
            # Simple scoring: price fit (50%) + location fit (30%) + features (20%)
            price_score = 50 if min_price <= prop['price_cents'] <= max_price else 20
            location_score = 30 if prop['location'] == preferred_location else 10
            feature_score = 20  # TODO: compare with buyer preferences

            match_score = (price_score + location_score + feature_score) / 3

            matches.append({
                "property_id": str(prop['id']),
                "title": prop['title'],
                "location": prop['location'],
                "price_cents": prop['price_cents'],
                "match_score": match_score,
                "match_factors": {
                    "price_fit": price_score,
                    "location_fit": location_score,
                    "feature_fit": feature_score
                }
            })

        # Persist matches to DB
        for match in matches:
            await db.execute(
                """INSERT INTO ai_matches (buyer_id, property_id, match_score, match_factors, model_version, created_at)
                   VALUES ($1, $2, $3, $4, 'v1.0', NOW())
                   ON CONFLICT (buyer_id, property_id) DO UPDATE
                   SET match_score = EXCLUDED.match_score, match_factors = EXCLUDED.match_factors
                """,
                uuid.UUID(req.buyer_id),
                uuid.UUID(match['property_id']),
                float(match['match_score']),
                json.dumps(match['match_factors'])
            )

        return MatchResponse(
            buyer_id=req.buyer_id,
            matches=matches,
            generated_at=datetime.utcnow().isoformat()
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3001)
