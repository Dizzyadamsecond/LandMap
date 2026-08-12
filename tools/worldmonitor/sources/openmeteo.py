"""
Open-Meteo collector — real-time solar radiation + weather, no key.

Pulls shortwave/direct/diffuse radiation (W/m2), temperature, cloud cover,
humidity and precipitation on an hourly grid: past_days=2 (training window)
+ 16-day forecast, per city.
"""
import json
import urllib.request
import urllib.parse
from datetime import datetime, timezone

from config import OPENMETEO_BASE, HTTP_TIMEOUT, USER_AGENT


def http_get_json(url: str, timeout: int = HTTP_TIMEOUT) -> dict:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode("utf-8"))


SOLAR_VARS = (
    "shortwave_radiation,direct_radiation,diffuse_radiation,"
    "temperature_2m,cloud_cover,relative_humidity_2m,precipitation"
)


def fetch_solar_forecast(lat: float, lng: float, days: int = 16,
                         past_days: int = 2) -> dict | None:
    """Hourly solar/weather forecast for a point. Returns raw Open-Meteo payload."""
    params = {
        "latitude": f"{lat:.4f}",
        "longitude": f"{lng:.4f}",
        "hourly": SOLAR_VARS,
        "forecast_days": days,
        "past_days": past_days,
        "timezone": "auto",
    }
    url = f"{OPENMETEO_BASE}?{urllib.parse.urlencode(params)}"
    try:
        return http_get_json(url)
    except Exception as exc:  # noqa: BLE001
        print(f"  [openmeteo] {lat:.2f},{lng:.2f} failed: {exc}")
        return None


def parse_hourly(hourly: dict) -> list[dict]:
    """Zip Open-Meteo hourly arrays into a list of records."""
    keys = ["time", "shortwave_radiation", "direct_radiation",
            "diffuse_radiation", "temperature_2m", "cloud_cover",
            "relative_humidity_2m", "precipitation"]
    out: list[dict] = []
    times = hourly.get("time", [])
    for i, ts in enumerate(times):
        rec = {"time": ts}
        for k in keys[1:]:
            arr = hourly.get(k, [])
            rec[k] = arr[i] if i < len(arr) and arr[i] is not None else 0.0
        out.append(rec)
    return out


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()
