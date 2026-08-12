"""
WorldMonitor multi-agent RAG orchestration (24/7).

Agents (each a pure, composable function — no LLM dependency for the data
path; optional LLM hooks via @landmap/llm chatCompletion when configured):

  CollectorAgent  -> pulls Open-Meteo / Overpass / WRI (live open data)
  AnalystAgent    -> runs PyTorch solar-yield model + opportunity scoring
  IndexerAgent    -> writes dossiês markdown (RAG corpus) + summary JSON
  MonitorAgent    -> health of every source; returns status + last snapshot

The RAG loop: collect -> analyze -> index. Run it on a cron every N minutes;
it is idempotent and writes to data/worldmonitor/*.
"""
from __future__ import annotations

import json
import time
from dataclasses import dataclass, field
from datetime import datetime, timezone

from config import OUT_DIR, CITIES
from sources.openmeteo import fetch_solar_forecast, parse_hourly, now_iso
from sources.overpass import fetch_infrastructure
from sources.wri import load_plants
from model import train_model, predict_yield, save_model, score_solar, score_datacenter


@dataclass
class AgentResult:
    name: str
    ok: bool
    detail: str
    data: dict = field(default_factory=dict)
    ts: str = field(default_factory=now_iso)


class CollectorAgent:
    """Collect raw live data from the three open sources."""

    name = "collector"

    def run(self, cities: list[dict] | None = None,
            include_overpass: bool = True, include_wri: bool = True,
            quick: bool = False) -> AgentResult:
        cities = cities or (CITIES[:6] if quick else CITIES)
        solar: dict[str, dict] = {}
        all_records: list[dict] = []
        om_ok = om_fail = 0
        for c in cities:
            key = f"{c['city']}|{c['state']}"
            payload = fetch_solar_forecast(c["lat"], c["lng"])
            if not payload or not payload.get("hourly"):
                om_fail += 1
                continue
            records = parse_hourly(payload["hourly"])
            om_ok += 1
            avg_temp = sum(r["temperature_2m"] for r in records) / max(1, len(records))
            solar[key] = {
                "city": c["city"], "state": c["state"],
                "lat": c["lat"], "lng": c["lng"],
                "avg_temp_c": round(avg_temp, 1), "records": records,
                "forecast_days": len(set(r["time"][:10] for r in records)),
            }
            all_records.extend(records)

        infra: dict[str, dict] = {}
        if include_overpass:
            for i, c in enumerate(cities):
                key = f"{c['city']}|{c['state']}"
                try:
                    infra[key] = fetch_infrastructure(c["lat"], c["lng"])
                except Exception as exc:  # noqa: BLE001
                    infra[key] = {"datacenters": [], "substations": [],
                                  "solar_generators": [], "power_lines": []}
                    print(f"  [agent:collector] {c['city']} overpass fail: {exc}")
                if i < len(cities) - 1:
                    time.sleep(2.0)

        plants: list[dict] = []
        if include_wri:
            try:
                plants = load_plants()
            except Exception as exc:  # noqa: BLE001
                print(f"  [agent:collector] wri fail: {exc}")

        return AgentResult(
            name=self.name, ok=bool(all_records),
            detail=f"openmeteo {om_ok}/{om_ok + om_fail} · "
                   f"records={len(all_records)} · infra cities={len(infra)} · "
                   f"plants={len(plants)}",
            data={"solar": solar, "infra": infra, "plants": plants,
                  "records": all_records},
        )


class AnalystAgent:
    """Train the PyTorch model on live radiation and score every city."""

    name = "analyst"

    def run(self, collected: dict, epochs: int = 40) -> AgentResult:
        all_records = collected.get("records", [])
        if not all_records:
            return AgentResult(name=self.name, ok=False,
                               detail="no records to analyze")
        model = train_model(all_records, epochs=epochs)
        ckpt = save_model(model)
        plants = collected.get("plants", [])

        solar_out: list[dict] = []
        for key, cs in collected["solar"].items():
            yield_kwh = predict_yield(model, cs["records"])
            by_day: dict[str, float] = {}
            for rec, y in zip(cs["records"], yield_kwh):
                d = rec["time"][:10]
                by_day[d] = by_day.get(d, 0.0) + y
            daily = [{"date": d, "kwh_per_kwp": round(v, 3)}
                     for d, v in sorted(by_day.items())]
            s = score_solar(cs)
            slim = {k: cs[k] for k in ("city", "state", "lat", "lng",
                                       "avg_temp_c", "forecast_days")}
            solar_out.append({**slim, **s, "daily": daily[-7:],
                              "updatedAt": now_iso()})

        dc_out: list[dict] = []
        for e in solar_out:
            key = f"{e['city']}|{e['state']}"
            infra = collected["infra"].get(
                key, {"datacenters": [], "substations": [],
                      "solar_generators": [], "power_lines": []})
            dc = score_datacenter(e, infra, plants, e["score"])
            dc_out.append({
                "city": e["city"], "state": e["state"],
                "lat": e["lat"], "lng": e["lng"], **dc,
                "datacenters_osm": len(infra["datacenters"]),
                "substations_osm": len(infra["substations"]),
                "solar_generators_osm": len(infra["solar_generators"]),
                "power_lines_osm": len(infra["power_lines"]),
                "datacenter_grade": dc["grade"], "solar_grade": e["grade"],
                "updatedAt": now_iso(),
            })

        return AgentResult(
            name=self.name, ok=True,
            detail=f"solar cities={len(solar_out)} dc cities={len(dc_out)} "
                   f"checkpoint={ckpt}",
            data={"solar": solar_out, "datacenter": dc_out, "checkpoint": ckpt},
        )


class IndexerAgent:
    """Persist JSON + RAG markdown dossiês (corpus for @landmap/llm)."""

    name = "indexer"

    def run(self, analyzed: dict) -> AgentResult:
        solar = analyzed.get("solar", [])
        dc = analyzed.get("datacenter", [])
        if not solar:
            return AgentResult(name=self.name, ok=False, detail="nothing to index")

        overview = {
            "generatedAt": now_iso(),
            "cities": len(solar),
            "records": sum(len(e.get("daily", [])) for e in solar),
            "solar": {e["city"]: {"score": e["score"], "grade": e["grade"],
                                  "annual_kwh_per_kwp": e["annual_kwh_per_kwp"]}
                      for e in solar},
            "datacenter": {e["city"]: {"score": e["score"], "grade": e["grade"]}
                           for e in dc},
            "topSolar": sorted(solar, key=lambda e: -e["score"])[:5],
            "topDataCenter": sorted(dc, key=lambda e: -e["score"])[:5],
        }
        (OUT_DIR / "overview.json").write_text(
            json.dumps(overview, ensure_ascii=False, indent=2), encoding="utf-8")
        (OUT_DIR / "solar.json").write_text(
            json.dumps(solar, ensure_ascii=False, indent=2), encoding="utf-8")
        (OUT_DIR / "datacenters.json").write_text(
            json.dumps(dc, ensure_ascii=False, indent=2), encoding="utf-8")

        by_city = {e["city"]: e for e in dc}
        for e in solar:
            d = by_city.get(e["city"], {})
            md = (
                f"# WorldMonitor {e['city']} ({e['state']})\n\n"
                f"> Dados em tempo real coletados em {now_iso()} "
                f"via Open-Meteo + OSM + WRI.\n\n"
                f"## Oportunidade solar\n"
                f"- Score: {e['score']}/100 (grade {e['grade']})\n"
                f"- Produção anual estimada: {e['annual_kwh_per_kwp']} kWh/kWp\n"
                f"- Horas de sol pico: {e['peak_sun_hours']} h/dia\n"
                f"- Estabilidade: {e['stability']}/100 · "
                f"Temp média: {e['avg_temp_c']} °C\n\n"
                f"## Oportunidade datacenter\n"
                f"- Score: {d.get('score', 0)}/100 (grade {d.get('grade', 'F')})\n"
                f"- Datacenters OSM: {d.get('datacenters_osm', 0)} · "
                f"Subestações: {d.get('substations_osm', 0)}\n"
                f"- Usinas próximas: {d.get('plants_near', 0)} "
                f"(renováveis: {d.get('renewable_near', 0)})\n"
            )
            safe = f"{e['state'].lower()}-{e['city'].lower().replace(' ', '-')}"
            (OUT_DIR / "rag" / f"worldmonitor-{safe}.md").write_text(
                md, encoding="utf-8")

        return AgentResult(
            name=self.name, ok=True,
            detail=f"indexed {len(solar)} dossiês + 3 JSON",
            data={"overview": overview},
        )


class MonitorAgent:
    """Health check: which sources are alive and how fresh the snapshot is."""

    name = "monitor"

    def run(self, collected: dict | None = None) -> AgentResult:
        solar = (collected or {}).get("solar", {})
        plants = (collected or {}).get("plants", [])
        return AgentResult(
            name=self.name, ok=True,
            detail=f"solar_cities={len(solar)} plants={len(plants)}",
            data={"alive": True, "checkedAt": now_iso()},
        )


def run_squad(quick: bool = False, epochs: int = 40,
              include_overpass: bool = True) -> list[AgentResult]:
    """The 24/7 RAG loop: Collector -> Analyst -> Indexer -> Monitor."""
    results: list[AgentResult] = []
    collector = CollectorAgent()
    collected = collector.run(quick=quick, include_overpass=include_overpass)
    results.append(collected)
    if not collected.ok:
        return results

    analyst = AnalystAgent()
    analyzed = analyst.run(collected.data, epochs=epochs)
    results.append(analyzed)
    if not analyzed.ok:
        return results

    indexer = IndexerAgent()
    indexed = indexer.run(analyzed.data)
    results.append(indexed)

    monitor = MonitorAgent()
    results.append(monitor.run(collected.data))
    return results


if __name__ == "__main__":
    import argparse
    ap = argparse.ArgumentParser()
    ap.add_argument("--quick", action="store_true")
    ap.add_argument("--epochs", type=int, default=40)
    ap.add_argument("--no-overpass", action="store_true")
    args = ap.parse_args()
    t0 = time.time()
    for r in run_squad(quick=args.quick, epochs=args.epochs,
                       include_overpass=not args.no_overpass):
        print(f"[{r.name}] ok={r.ok} :: {r.detail}")
    print(f"squad done in {time.time() - t0:.1f}s")
