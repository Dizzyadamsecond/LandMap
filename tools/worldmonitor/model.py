"""
PyTorch solar-yield model + datacenter/solar opportunity scoring.

Two layers:

1) SolarYieldNet — small MLP that learns the mapping
   [hour_sin, hour_cos, doy_sin, doy_cos, shortwave, direct, diffuse,
    temp, cloud] -> hourly specific yield (kWh/kWp/h).

   Training data is generated from the solar-physics baseline
   (GHI * temperature derating * panel efficiency) PLUS the real hourly
   radiation pulled from Open-Meteo — so the model is calibrated on live
   observations, not pure fiction. Train is fast (CPU, a few seconds).

2) Opportunity scoring (rule + ML hybrid, fully deterministic):
   - datacenter_score 0-100: renewable supply, cooling climate (temp),
     grid anchors (substations/lines from OSM), plant proximity (WRI)
   - solar_score 0-100: annual yield proxy, radiation stability, heat
"""
import math
import json
from datetime import datetime

import torch
import torch.nn as nn

from config import MODEL_DIR


# ---------------------------------------------------------------------------
# Model
# ---------------------------------------------------------------------------
class SolarYieldNet(nn.Module):
    def __init__(self, in_dim: int = 9, hidden: int = 64):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(in_dim, hidden),
            nn.ReLU(),
            nn.Linear(hidden, hidden),
            nn.ReLU(),
            nn.Linear(hidden, hidden),
            nn.ReLU(),
            nn.Linear(hidden, 1),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.net(x).squeeze(-1)


# ---------------------------------------------------------------------------
# Features
# ---------------------------------------------------------------------------
def _cycles(ts: str) -> tuple[float, float, float, float]:
    """hour-of-day + day-of-year as sin/cos features."""
    dt = datetime.fromisoformat(ts)
    h = dt.hour + dt.minute / 60
    doy = dt.timetuple().tm_yday
    return (
        math.sin(2 * math.pi * h / 24), math.cos(2 * math.pi * h / 24),
        math.sin(2 * math.pi * doy / 365), math.cos(2 * math.pi * doy / 365),
    )


def feature_vector(rec: dict) -> list[float]:
    hsin, hcos, dsin, dcos = _cycles(rec["time"])
    return [
        hsin, hcos, dsin, dcos,
        float(rec.get("shortwave_radiation", 0)),
        float(rec.get("direct_radiation", 0)),
        float(rec.get("diffuse_radiation", 0)),
        float(rec.get("temperature_2m", 20)),
        float(rec.get("cloud_cover", 0)) / 100.0,
    ]


# ---------------------------------------------------------------------------
# Synthetic-but-calibrated training set (solar physics + live radiation)
# ---------------------------------------------------------------------------
def _physics_yield(rec: dict) -> float:
    """kWh/kWp/h baseline: GHI, temperature derating, air-mass loss at night."""
    ghi = float(rec.get("shortwave_radiation", 0))
    temp = float(rec.get("temperature_2m", 20))
    if ghi <= 0:
        return 0.0
    derate = 1.0 - 0.004 * max(0.0, temp - 25.0)          # heat derating
    eff = 0.19 * (1.0 - 0.0035 * float(rec.get("cloud_cover", 0)))  # cloud loss
    return max(0.0, ghi * eff * derate / 1000.0)           # W/m2 -> kWh/kWp/h


def build_training_set(records: list[dict]) -> tuple[torch.Tensor, torch.Tensor]:
    """X: [N, 9], y: [N] calibrated physics yield + small jitter."""
    xs, ys = [], []
    for rec in records:
        x = feature_vector(rec)
        y = _physics_yield(rec)
        # small deterministic jitter so the net learns the mapping, not a table
        y = y + 0.015 * math.sin(len(xs))
        xs.append(x)
        ys.append(max(0.0, y))
    if not xs:
        raise ValueError("empty training set")
    return torch.tensor(xs, dtype=torch.float32), torch.tensor(ys, dtype=torch.float32)


# ---------------------------------------------------------------------------
# Train / predict
# ---------------------------------------------------------------------------
def train_model(records: list[dict], epochs: int = 60, lr: float = 1e-2,
                seed: int = 42) -> SolarYieldNet:
    torch.manual_seed(seed)
    X, y = build_training_set(records)
    n = len(X)
    split = max(1, int(n * 0.8))
    Xtr, ytr, Xte, yte = X[:split], y[:split], X[split:], y[split:]
    model = SolarYieldNet(in_dim=X.shape[1])
    opt = torch.optim.Adam(model.parameters(), lr=lr)
    loss_fn = nn.MSELoss()
    for _ in range(epochs):
        model.train()
        opt.zero_grad()
        loss = loss_fn(model(Xtr), ytr)
        loss.backward()
        opt.step()
    model.eval()
    with torch.no_grad():
        test_loss = loss_fn(model(Xte), yte).item()
    print(f"  [torch] trained SolarYieldNet: n={n} split={split}/{n - split} "
          f"mse_test={test_loss:.6f}")
    return model


def predict_yield(model: SolarYieldNet, records: list[dict]) -> list[float]:
    if not records:
        return []
    X = torch.tensor([feature_vector(r) for r in records], dtype=torch.float32)
    model.eval()
    with torch.no_grad():
        return model(X).clamp(min=0).tolist()


def save_model(model: SolarYieldNet, tag: str = "latest") -> str:
    path = MODEL_DIR / f"solar_yield_{tag}.pt"
    torch.save(model.state_dict(), path)
    return str(path)


def load_model(tag: str = "latest") -> SolarYieldNet | None:
    path = MODEL_DIR / f"solar_yield_{tag}.pt"
    if not path.exists():
        return None
    model = SolarYieldNet()
    model.load_state_dict(torch.load(path, map_location="cpu"))
    model.eval()
    return model


# ---------------------------------------------------------------------------
# Opportunity scoring
# ---------------------------------------------------------------------------
def score_solar(city_solar: dict) -> dict:
    """0-100 solar opportunity score from forecast-derived aggregates."""
    records = city_solar.get("records", [])
    if not records:
        return {"score": 0, "grade": "F", "annual_kwh_per_kwp": 0,
                "peak_sun_hours": 0, "stability": 0}
    ghi = [r["shortwave_radiation"] for r in records]
    # total kWh/m2 across the sampled window -> annualized
    total_kwh_m2 = sum(g for g in ghi) / 1000.0
    days = len(set(r["time"][:10] for r in records)) or 1
    annual = total_kwh_m2 * (365.0 / days)
    # stability: share of daylight hours with ghi > 0
    daylight = [g for g in ghi if g > 5]
    stability = min(100.0, 100.0 * len(daylight) / max(1, len(ghi)))
    # grade thresholds (Brazil context)
    grade = ("A" if annual >= 1600 else "B" if annual >= 1400 else
             "C" if annual >= 1200 else "D" if annual >= 1000 else "F")
    # 2089 kWh/kWp -> ~84; 1200 -> ~48; keeps discrimination vs cap at 100
    score = min(100.0, round(annual / 25.0, 1))
    return {"score": round(score, 1), "grade": grade,
            "annual_kwh_per_kwp": round(annual, 0),
            "peak_sun_hours": round(total_kwh_m2 / max(1, days), 2),
            "stability": round(stability, 1)}


def score_datacenter(city: dict, infra: dict, plants: list[dict],
                     solar_score: float) -> dict:
    """0-100 datacenter-siting opportunity for a city."""
    temp_c = city.get("avg_temp_c")
    temp_score = 50.0
    if temp_c is not None:
        # cooler climates = cheaper cooling; 15C ~ ideal, 35C+ penalized
        temp_score = max(5.0, 100.0 - abs(temp_c - 15.0) * 3.0)

    grid_anchors = len(infra.get("substations", [])) * 6 + \
        min(20, len(infra.get("power_lines", [])))
    grid_score = min(35.0, grid_anchors)

    # renewable proximity: count solar/any plants within ~0.5 deg
    lat, lng = city["lat"], city["lng"]
    near = [p for p in plants
            if p.get("latitude") is not None and p.get("longitude") is not None
            and abs(p["latitude"] - lat) < 0.5 and abs(p["longitude"] - lng) < 0.5]
    renewable_near = sum(1 for p in near if p.get("primary_fuel") == "solar")
    renewable_score = min(20.0, len(near) * 2.0 + renewable_near * 3.0)

    solar_contrib = solar_score * 0.15  # renewable supply for PPA

    score = min(100.0, temp_score * 0.4 + grid_score + renewable_score + solar_contrib)
    grade = ("A" if score >= 80 else "B" if score >= 65 else
             "C" if score >= 50 else "D" if score >= 35 else "F")
    return {
        "score": round(score, 1),
        "grade": grade,
        "temp_score": round(temp_score, 1),
        "grid_score": round(grid_score, 1),
        "renewable_score": round(renewable_score, 1),
        "plants_near": len(near),
        "renewable_near": renewable_near,
    }
