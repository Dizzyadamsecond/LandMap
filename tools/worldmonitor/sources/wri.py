"""
WRI Global Power Plant Database collector (open dataset, CC-BY 4.0).

~35k power plants worldwide. We download once (cached) and slice the rows
that matter for WorldMonitor: plants in Brazil + every plant tagged as solar
anywhere, so the solar-opportunity model can reference real anchors.
"""
import csv
import io
import urllib.request

from config import WRI_CSV_URL, WRI_CACHE, HTTP_TIMEOUT, USER_AGENT

COLUMNS = [
    "country", "country_long", "name", "gppd_idnr", "capacity_mw",
    "latitude", "longitude", "primary_fuel", "commissioning_year",
]


def _download() -> bytes:
    req = urllib.request.Request(WRI_CSV_URL, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=HTTP_TIMEOUT * 4) as resp:
        return resp.read()


def load_plants(force: bool = False) -> list[dict]:
    """Returns filtered plants (Brazil + all solar worldwide)."""
    if not WRI_CACHE.exists() or force:
        print("  [wri] downloading global power plant database...")
        raw = _download()
        WRI_CACHE.write_bytes(raw)
        print(f"  [wri] cached {len(raw) // 1024} KB -> {WRI_CACHE}")
    else:
        raw = WRI_CACHE.read_bytes()

    plants: list[dict] = []
    text = raw.decode("utf-8", errors="replace")
    reader = csv.DictReader(io.StringIO(text))
    for row in reader:
        fuel = (row.get("primary_fuel") or "").strip().lower()
        country = (row.get("country") or "").strip().lower()
        if country == "bra" or fuel == "solar":
            plants.append({
                "country": row.get("country"),
                "name": row.get("name"),
                "capacity_mw": _f(row.get("capacity_mw")),
                "latitude": _f(row.get("latitude")),
                "longitude": _f(row.get("longitude")),
                "primary_fuel": fuel,
                "commissioning_year": row.get("commissioning_year"),
            })
    return plants


def _f(v: str | None) -> float | None:
    if v is None or v == "":
        return None
    try:
        return float(v)
    except ValueError:
        return None
