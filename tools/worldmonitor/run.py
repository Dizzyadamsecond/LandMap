"""
WorldMonitor orchestrator — run everything.

    python run.py [--skip-overpass] [--skip-wri] [--quick]

Pipeline:
  1. Open-Meteo: hourly solar+weather for all 36 cities (past 2d + 16d fwd)
  2. Overpass/OSM: datacenters, substations, solar generators, power lines
  3. WRI: real power plants (Brazil + solar worldwide)
  4. PyTorch: train SolarYieldNet on (physics-calibrated) live radiation,
     predict hourly yield, derive city-level solar/datacenter scores
  5. Write data/worldmonitor/{overview,solar,datacenters,opportunities}.json
     + sources.json (health) + RAG markdowns

24/7: schedule this script (cron) — it is idempotent and cached.
"""
import argparse
import json
import sys
import time
from datetime import datetime, timezone

sys.path.insert(0, __file__.rsplit("\\", 1)[0] if "\\" in __file__ else __file__.rsplit("/", 1)[0])

from config import CITIES, OUT_DIR, RAG_DIR  # noqa: E402
from sources.openmeteo import fetch_solar_forecast, parse_hourly, now_iso  # noqa: E402
from sources.overpass import fetch_infrastructure  # noqa: E402
from sources.wri import load_plants  # noqa: E402
from model import (train_model, predict_yield, save_model,  # noqa: E402
                   score_solar, score_datacenter)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--skip-overpass", action="store_true")
    ap.add_argument("--skip-wri", action="store_true")
    ap.add_argument("--quick", action="store_true",
                    help="only first 6 cities (dev loop)")
    args = ap.parse_args()

    t0 = time.time()
    cities = CITIES[:6] if args.quick else CITIES
    print(f"WorldMonitor run — {len(cities)} cidades @ {now_iso()}")

    sources = {"openmeteo": {"ok": 0, "fail": 0},
               "overpass": {"ok": 0, "fail": 0},
               "wri": {"ok": 0, "fail": 0}}

    # --- 1) Open-Meteo -----------------------------------------------------
    solar_by_city: dict[str, dict] = {}
    all_records: list[dict] = []
    for c in cities:
        key = f"{c['city']}|{c['state']}"
        payload = fetch_solar_forecast(c["lat"], c["lng"])
        if not payload or not payload.get("hourly"):
            sources["openmeteo"]["fail"] += 1
            continue
        records = parse_hourly(payload["hourly"])
        sources["openmeteo"]["ok"] += 1
        avg_temp = sum(r["temperature_2m"] for r in records) / max(1, len(records))
        solar_by_city[key] = {
            "city": c["city"], "state": c["state"], "lat": c["lat"], "lng": c["lng"],
            "avg_temp_c": round(avg_temp, 1),
            "records": records,
            "forecast_days": len(set(r["time"][:10] for r in records)),
        }
        all_records.extend(records)

    if not all_records:
        print("ERROR: no Open-Meteo data — network blocked?")
        return 1
    print(f"  openmeteo ok={sources['openmeteo']['ok']} "
          f"fail={sources['openmeteo']['fail']} records={len(all_records)}")

    # --- 2) Overpass (concorrente — 4 workers, tolerante a rate-limit) ------
    from concurrent.futures import ThreadPoolExecutor, as_completed

    infra_by_city: dict[str, dict] = {}
    if not args.skip_overpass:
        def _one(c: dict) -> tuple[str, dict]:
            key = f"{c['city']}|{c['state']}"
            try:
                return key, fetch_infrastructure(c["lat"], c["lng"])
            except Exception as exc:  # noqa: BLE001
                print(f"  [overpass] {c['city']} failed: {exc}")
                return key, {"datacenters": [], "substations": [],
                             "solar_generators": [], "power_lines": []}

        with ThreadPoolExecutor(max_workers=4) as pool:
            futs = [pool.submit(_one, c) for c in cities]
            for fut in as_completed(futs):
                key, infra = fut.result()
                infra_by_city[key] = infra
                sources["overpass"]["ok"] += 1
                print(f"  [overpass] {key}: dc={len(infra['datacenters'])} "
                      f"sub={len(infra['substations'])} "
                      f"solar={len(infra['solar_generators'])}")
                time.sleep(1.0)  # mild pacing across parallel workers
    else:
        print("  [overpass] skipped")

    # --- 3) WRI plants -----------------------------------------------------
    plants: list[dict] = []
    if not args.skip_wri:
        try:
            plants = load_plants()
            sources["wri"]["ok"] = 1
            print(f"  [wri] {len(plants)} plants (BR + solar worldwide)")
        except Exception as exc:  # noqa: BLE001
            sources["wri"]["fail"] = 1
            print(f"  [wri] failed: {exc}")
    else:
        print("  [wri] skipped")

    # --- 4) PyTorch model + predictions ------------------------------------
    print("  [torch] training SolarYieldNet...")
    model = train_model(all_records, epochs=40)
    ckpt = save_model(model)
    print(f"  [torch] checkpoint -> {ckpt}")

    solar_out: list[dict] = []
    for key, cs in solar_by_city.items():
        yield_kwh = predict_yield(model, cs["records"])
        # hourly kWh/kWp -> daily kWh/kWp
        by_day: dict[str, float] = {}
        for rec, y in zip(cs["records"], yield_kwh):
            d = rec["time"][:10]
            by_day[d] = by_day.get(d, 0.0) + y
        daily = [{"date": d, "kwh_per_kwp": round(v, 3)}
                 for d, v in sorted(by_day.items())]
        s = score_solar(cs)
        cs_slim = {k: cs[k] for k in ("city", "state", "lat", "lng",
                                      "avg_temp_c", "forecast_days")}
        solar_out.append({**cs_slim, **s, "daily": daily[-7:],
                          "updatedAt": now_iso()})

    # --- 5) Datacenter opportunities ----------------------------------------
    dc_out: list[dict] = []
    for entry in solar_out:
        key = f"{entry['city']}|{entry['state']}"
        infra = infra_by_city.get(key, {"datacenters": [], "substations": [],
                                        "solar_generators": [], "power_lines": []})
        dc = score_datacenter(entry, infra, plants, entry["score"])
        dc_out.append({
            "city": entry["city"], "state": entry["state"],
            "lat": entry["lat"], "lng": entry["lng"],
            **dc,
            "datacenters_osm": len(infra["datacenters"]),
            "substations_osm": len(infra["substations"]),
            "solar_generators_osm": len(infra["solar_generators"]),
            "power_lines_osm": len(infra["power_lines"]),
            "datacenter_grade": dc["grade"],
            "solar_grade": entry["grade"],
            "updatedAt": now_iso(),
        })

    # --- 6) Write outputs ---------------------------------------------------
    overview = {
        "generatedAt": now_iso(),
        "cities": len(solar_out),
        "records": len(all_records),
        "solar": {e["city"]: {"score": e["score"], "grade": e["grade"],
                              "annual_kwh_per_kwp": e["annual_kwh_per_kwp"]}
                  for e in solar_out},
        "datacenter": {e["city"]: {"score": e["score"], "grade": e["grade"]}
                       for e in dc_out},
        "topSolar": sorted(solar_out, key=lambda e: -e["score"])[:5],
        "topDataCenter": sorted(dc_out, key=lambda e: -e["score"])[:5],
    }
    (OUT_DIR / "overview.json").write_text(
        json.dumps(overview, ensure_ascii=False, indent=2), encoding="utf-8")
    (OUT_DIR / "solar.json").write_text(
        json.dumps(solar_out, ensure_ascii=False, indent=2), encoding="utf-8")
    (OUT_DIR / "datacenters.json").write_text(
        json.dumps(dc_out, ensure_ascii=False, indent=2), encoding="utf-8")
    (OUT_DIR / "sources.json").write_text(
        json.dumps({"sources": sources, "modelCheckpoint": ckpt,
                    "plantsTotal": len(plants)}, ensure_ascii=False, indent=2),
        encoding="utf-8")

    _write_rag_markdowns(overview, solar_out, dc_out)
    elapsed = time.time() - t0
    print(f"WorldMonitor done in {elapsed:.1f}s -> {OUT_DIR}")
    return 0


def _write_rag_markdowns(overview: dict, solar_out: list[dict],
                         dc_out: list[dict]) -> None:
    """Feed the RAG index: one dossiê per city (solar + datacenter)."""
    now = now_iso()
    by_city = {e["city"]: e for e in dc_out}
    for e in solar_out:
        dc = by_city.get(e["city"], {})
        md = (
            f"# WorldMonitor {e['city']} ({e['state']})\n\n"
            f"> Dados em tempo real coletados em {now} via Open-Meteo + OSM + WRI.\n\n"
            f"## Oportunidade solar\n"
            f"- Score: {e['score']}/100 (grade {e['grade']})\n"
            f"- Produção anual estimada: {e['annual_kwh_per_kwp']} kWh/kWp\n"
            f"- Horas de sol pico: {e['peak_sun_hours']} h/dia\n"
            f"- Estabilidade de radiação: {e['stability']}/100\n"
            f"- Temperatura média: {e['avg_temp_c']} °C\n\n"
            f"## Oportunidade datacenter\n"
            f"- Score: {dc.get('score', 0)}/100 (grade {dc.get('grade', 'F')})\n"
            f"- Datacenters OSM: {dc.get('datacenters_osm', 0)} | "
            f"Subestações: {dc.get('substations_osm', 0)}\n"
            f"- Usinas próximas: {dc.get('plants_near', 0)} "
            f"(renováveis: {dc.get('renewable_near', 0)})\n"
            f"- Grade datacenter: {dc.get('datacenter_grade', 'F')} | "
            f"Grade solar: {e['grade']}\n"
        )
        safe = f"{e['state'].lower()}-{e['city'].lower().replace(' ', '-')}"
        (RAG_DIR / f"worldmonitor-{safe}.md").write_text(md, encoding="utf-8")
    print(f"  [rag] {len(solar_out)} dossiês -> {RAG_DIR}")


if __name__ == "__main__":
    raise SystemExit(main())
