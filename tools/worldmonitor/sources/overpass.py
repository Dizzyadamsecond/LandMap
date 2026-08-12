"""
Overpass (OpenStreetMap) collector — real infrastructure, failover em cascata.

Pulls, for a bbox around each city:
  - datacenters         (building=data_center / man_made=data_center)
  - power substations   (power=substation)
  - solar generators    (power=generator, generator:source=solar)
  - transmission lines  (power=line, sampled)

OSM is the largest open map dataset on Earth — 100% open, no key.
"""
import json
import urllib.request
import urllib.parse

from config import OVERPASS_ENDPOINTS, HTTP_TIMEOUT, USER_AGENT


def _query(bbox: list[float], radius_km: float = 18.0) -> str:
    """Overpass QL: infra within a square bbox around [lat, lng]."""
    lat, lng, half = bbox[0], bbox[1], radius_km / 111.0
    s, w = lat - half, lng - half
    n, e = lat + half, lng + half
    box = f"({s:.4f},{w:.4f},{n:.4f},{e:.4f})"
    return f"""
[out:json][timeout:40];
(
  nwr["building"="data_center"]{box};
  nwr["man_made"="data_center"]{box};
  nwr["power"="substation"]{box};
  nwr["power"="generator"]["generator:source"="solar"]{box};
  way["power"="line"]{box};
);
out center tags;
"""


def _run_overpass(query: str) -> list[dict]:
    last_err: Exception | None = None
    for endpoint in OVERPASS_ENDPOINTS:
        try:
            body = urllib.parse.urlencode({"data": query}).encode()
            req = urllib.request.Request(endpoint, data=body,
                                         headers={"User-Agent": USER_AGENT})
            with urllib.request.urlopen(req, timeout=HTTP_TIMEOUT) as resp:
                payload = json.loads(resp.read().decode("utf-8"))
            return payload.get("elements", [])
        except Exception as exc:  # noqa: BLE001
            last_err = exc
            print(f"  [overpass] {endpoint} failed: {exc}")
    raise RuntimeError(f"All Overpass endpoints failed: {last_err}")


def fetch_infrastructure(lat: float, lng: float) -> dict:
    """Returns {datacenters, substations, solar_generators, power_lines}."""
    elements = _run_overpass(_query([lat, lng]))
    out = {"datacenters": [], "substations": [], "solar_generators": [],
           "power_lines": []}
    for el in elements:
        tags = el.get("tags", {})
        center = el.get("center") or ({"lat": el.get("lat"), "lon": el.get("lon")}
                                      if "lat" in el else None)
        if not center or center.get("lat") is None:
            continue
        rec = {
            "id": el.get("id"),
            "type": el.get("type"),
            "name": tags.get("name") or tags.get("operator") or None,
            "lat": round(center["lat"], 6),
            "lng": round(center["lon"], 6),
            "tags": tags,
        }
        building = tags.get("building") or tags.get("man_made")
        power = tags.get("power")
        if building == "data_center":
            out["datacenters"].append(rec)
        elif power == "substation":
            out["substations"].append(rec)
        elif power == "generator" and tags.get("generator:source") == "solar":
            rec["capacity_kw"] = _parse_capacity(tags.get("generator:output:electricity"))
            out["solar_generators"].append(rec)
        elif power == "line":
            out["power_lines"].append(rec)
    return out


def _parse_capacity(raw: str | None) -> float | None:
    if not raw:
        return None
    try:
        num = float(raw.replace("MW", "").replace("kW", "").strip())
        return round(num * 1000, 1) if "MW" in raw else round(num, 1)
    except ValueError:
        return None
