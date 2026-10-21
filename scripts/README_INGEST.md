# Pipeline de Ingestão Territorial do Brasil (`ingest_terrenos.py`)

Pipeline open-source (100% gratuito, sem chaves pagas) que baixa, limpa, cruza e calcula indicadores imobiliários e territoriais para polos de todas as regiões do Brasil, alimentando diretamente o mapa e os rankings do **LandMap**.

---

## Fontes de Dados Integradas

| Fonte | Endpoint Público | Dados Extraídos |
|---|---|---|
| **IBGE Localidades & Malhas** | `servicodados.ibge.gov.br/api/v1/localidades/municipios` e `/api/v3/malhas/municipios/{id}` | Código IBGE, UF, macrorregião, área territorial em $\text{km}^2$ (SIRGAS-2000), população, renda e IDH-M |
| **OpenStreetMap (Overpass API)** | `overpass-api.de/api/interpreter` | Densidade de vias urbanas (`highway`), polígonos de uso do solo (`landuse`) e amenidades num raio de $1{,}5\text{ km}$ |
| **INPE TerraBrasilis / SRTM DEM** | `terrabrasilis.dpi.inpe.br/geoserver/ows` + DEM SRTM 30m | Altitude ortométrica ($\text{m}$), declividade e risco ambiental costeiro |
| **Clima / Pluviometria (Open-Meteo)** | `api.open-meteo.com/v1/forecast` | Precipitação acumulada de 7 dias ($\text{mm}$) e classificação de risco hidrológico (`baixo` / `medio` / `alto`) |

---

## Pré-requisitos e Licenças

- **Python 3.11+** (usa apenas a biblioteca padrão `urllib`, `gzip`, `json`, `sqlite3`, `concurrent.futures` — zero dependências obrigatórias).
- **Opcional (MIT / BSD-3):** compatível diretamente com **DuckDB** (`sqlite_scan`), **Dask** (leitura paralela do JSON/SQLite) e **Turf.js** / **Leaflet** (consumo do arquivo `.geojson` RFC 7946).

---

## Como Executar

### 1. Ingestão Completa Ao Vivo (IBGE + OSM + INPE/DEM + Clima)

```bash
python scripts/ingest_terrenos.py --workers 12
```

### 2. Ingestão Rápida / Offline (CI/CD ou sem rede externa)

```bash
python scripts/ingest_terrenos.py --offline
```

### 3. Limitar Número de Polos Processados

```bash
python scripts/ingest_terrenos.py --limit 25 --workers 8
```

---

## Artefatos Gerados

1. **`apps/web/public/data/terrenos_brasil.json`**
   Consumido automaticamente pela rota [`GET /api/map/insights`](../apps/web/src/app/api/map/insights/route.ts) e disponível estaticamente em `/data/terrenos_brasil.json`.
2. **`apps/web/public/data/terrenos_brasil.geojson`**
   `FeatureCollection` padrão RFC 7946 pronto para uso em **Leaflet**, **Turf.js**, **QGIS** ou **MapLibre**.
3. **`apps/web/data/terrenos_brasil.sqlite`**
   Banco SQLite local com a tabela `terrenos_brasil`, consultável via SQL padrão ou **DuckDB**:
   ```sql
   SELECT name, city, state, score, price_sqm, delta_12m
   FROM terrenos_brasil
   ORDER BY score DESC
   LIMIT 10;
   ```
