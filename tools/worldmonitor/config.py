"""
WorldMonitor — LandMap real-time data layer.

Scraper 24/7 multi-fonte (open APIs, sem chave) + modelo PyTorch de previsão
solar + scoring de oportunidades (datacenter & energia solar) + ingestão RAG.

Fontes reais:
  - Open-Meteo         -> radiação solar (curta/direta/difusa) + temperatura, previsão 16d
  - Overpass/OSM       -> datacenters, subestações e geradores solares (tags OSM)
  - WRI Global PP DB   -> usinas de energia reais (global, dataset aberto)

Saída: data/worldmonitor/{overview,solar,datacenters,opportunities,sources}.json
       + data/worldmonitor/rag/*.md (alimenta o índice RAG do LandMap).
"""
import os
from pathlib import Path

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
REPO_ROOT = Path(__file__).resolve().parents[2]           # <repo>/tools/worldmonitor -> <repo>
TOOLS_DIR = Path(__file__).resolve().parent
OUT_DIR = REPO_ROOT / "data" / "worldmonitor"
RAG_DIR = OUT_DIR / "rag"
CACHE_DIR = OUT_DIR / "cache"
MODEL_DIR = OUT_DIR / "model"

for d in (OUT_DIR, RAG_DIR, CACHE_DIR, MODEL_DIR):
    d.mkdir(parents=True, exist_ok=True)

# ---------------------------------------------------------------------------
# Monitoring grid — 36 cidades reais do dataset LandMap (lat/lng médios)
# ---------------------------------------------------------------------------
CITIES = [
    {"city": "Aracaju", "state": "SE", "lat": -10.9132, "lng": -37.0707},
    {"city": "Balneário Camboriú", "state": "SC", "lat": -26.9923, "lng": -48.6303},
    {"city": "Belo Horizonte", "state": "MG", "lat": -19.9158, "lng": -43.9351},
    {"city": "Belém", "state": "PA", "lat": -1.4527, "lng": -48.4973},
    {"city": "Boa Vista", "state": "RR", "lat": 2.8098, "lng": -60.6731},
    {"city": "Brasília", "state": "DF", "lat": -15.7804, "lng": -47.9303},
    {"city": "Campinas", "state": "SP", "lat": -22.9138, "lng": -47.0639},
    {"city": "Campo Grande", "state": "MS", "lat": -20.4635, "lng": -54.6243},
    {"city": "Cuiabá", "state": "MT", "lat": -15.6261, "lng": -56.1114},
    {"city": "Curitiba", "state": "PR", "lat": -25.4314, "lng": -49.2658},
    {"city": "Florianópolis", "state": "SC", "lat": -27.5936, "lng": -48.549},
    {"city": "Fortaleza", "state": "CE", "lat": -3.7161, "lng": -38.5444},
    {"city": "Goiânia", "state": "GO", "lat": -16.6872, "lng": -49.2652},
    {"city": "Itajaí", "state": "SC", "lat": -26.9088, "lng": -48.6612},
    {"city": "Joinville", "state": "SC", "lat": -26.3052, "lng": -48.8482},
    {"city": "João Pessoa", "state": "PB", "lat": -7.1371, "lng": -34.8406},
    {"city": "Londrina", "state": "PR", "lat": -23.3113, "lng": -51.163},
    {"city": "Macapá", "state": "AP", "lat": 0.0368, "lng": -51.0664},
    {"city": "Maceió", "state": "AL", "lat": -9.6527, "lng": -35.7439},
    {"city": "Manaus", "state": "AM", "lat": -3.1248, "lng": -60.0266},
    {"city": "Maringá", "state": "PR", "lat": -23.42, "lng": -51.932},
    {"city": "Natal", "state": "RN", "lat": -5.7836, "lng": -35.2094},
    {"city": "Niterói", "state": "RJ", "lat": -22.8856, "lng": -43.1036},
    {"city": "Palmas", "state": "TO", "lat": -10.2518, "lng": -48.2973},
    {"city": "Porto Alegre", "state": "RS", "lat": -30.035, "lng": -51.2161},
    {"city": "Porto Velho", "state": "RO", "lat": -8.7644, "lng": -63.8843},
    {"city": "Recife", "state": "PE", "lat": -8.0469, "lng": -34.8778},
    {"city": "Ribeirão Preto", "state": "SP", "lat": -21.1791, "lng": -47.8118},
    {"city": "Rio Branco", "state": "AC", "lat": -9.9671, "lng": -67.837},
    {"city": "Rio de Janeiro", "state": "RJ", "lat": -22.9055, "lng": -43.1731},
    {"city": "Salvador", "state": "BA", "lat": -12.9779, "lng": -38.5036},
    {"city": "São Luís", "state": "MA", "lat": -2.5239, "lng": -44.3067},
    {"city": "São Paulo", "state": "SP", "lat": -23.5502, "lng": -46.6334},
    {"city": "Teresina", "state": "PI", "lat": -5.1093, "lng": -42.8044},
    {"city": "Uberlândia", "state": "MG", "lat": -18.918, "lng": -48.2769},
    {"city": "Vitória", "state": "ES", "lat": -20.2983, "lng": -40.3213},
]

# ---------------------------------------------------------------------------
# Scraper tuning
# ---------------------------------------------------------------------------
HTTP_TIMEOUT = 25
USER_AGENT = "LandMap-WorldMonitor/1.0 (real-time open-data scraper)"

# Overpass endpoints (failover em cascata)
OVERPASS_ENDPOINTS = [
    "https://overpass-api.de/api/interpreter",
    "https://lz4.overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
]

# WRI Global Power Plant Database — dataset aberto (CC-BY 4.0)
WRI_CSV_URL = (
    "https://raw.githubusercontent.com/wri/global-power-plant-database/"
    "master/output_database/global_power_plant_database.csv"
)
WRI_CACHE = CACHE_DIR / "global_power_plants.csv"

# Open-Meteo
OPENMETEO_BASE = "https://api.open-meteo.com/v1/forecast"
