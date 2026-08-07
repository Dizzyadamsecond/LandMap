-- ============================================================================
-- LANDMAP GEO SYSTEM — PostgreSQL + PostGIS Schema
-- ============================================================================
-- Tabelas para visualização geoespacial do Brasil inteiro
-- Dados: INCRA SIGEF + Sentinel-2 + Copernicus DEM
-- ============================================================================

-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_raster;
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- ============================================================================
-- 1. TERRENOS — Geometrias de propriedades/glebas (INCRA SIGEF base)
-- ============================================================================

CREATE TABLE terrenos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identificação
  incra_id VARCHAR(50),  -- SNCR/SNCI registration
  name VARCHAR(255),
  state_code VARCHAR(2) NOT NULL,  -- UF: MG, SP, RJ, etc.
  municipality_code INTEGER,  -- IBGE code

  -- Geometria
  geometry GEOMETRY(MultiPolygon, 4326) NOT NULL,
  area_m2 FLOAT NOT NULL,  -- ST_Area(geometry)
  perimeter_m FLOAT,  -- ST_Perimeter(geometry)
  centroid GEOMETRY(Point, 4326),

  -- Propriedade
  owner_name VARCHAR(255),
  owner_cpf_cnpj VARCHAR(20),
  registration_date TIMESTAMP,
  last_updated TIMESTAMP DEFAULT NOW(),

  -- Metadados
  data_source VARCHAR(50),  -- 'INCRA', 'IBGE', 'OSM', etc.
  verified BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices críticos para performance
CREATE INDEX idx_terrenos_state ON terrenos(state_code);
CREATE INDEX idx_terrenos_municipality ON terrenos(municipality_code);
CREATE INDEX idx_terrenos_geometry ON terrenos USING GIST(geometry);
CREATE INDEX idx_terrenos_area ON terrenos(area_m2 DESC);
CREATE INDEX idx_terrenos_centroid ON terrenos USING GIST(centroid);

-- Particionamento por estado (27 partitions)
CREATE TABLE terrenos_mg PARTITION OF terrenos FOR VALUES IN ('MG');
CREATE TABLE terrenos_sp PARTITION OF terrenos FOR VALUES IN ('SP');
CREATE TABLE terrenos_rj PARTITION OF terrenos FOR VALUES IN ('RJ');
CREATE TABLE terrenos_ba PARTITION OF terrenos FOR VALUES IN ('BA');
CREATE TABLE terrenos_rs PARTITION OF terrenos FOR VALUES IN ('RS');
-- ... (22 mais estados omitidos por brevidade; script de setup vai criar todos)

-- ============================================================================
-- 2. MÉTRICAS DE TERRENO — Dados calculados e em tempo real
-- ============================================================================

CREATE TABLE terreno_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  terreno_id UUID NOT NULL REFERENCES terrenos(id) ON DELETE CASCADE,

  -- Métricas estáticas (calculadas uma vez)
  altitude_m INTEGER,  -- Copernicus DEM 30m amostra no centroide
  slope_percent FLOAT,  -- Declividade média em %
  aspect_degrees INTEGER,  -- Aspecto/exposição 0-359
  solar_exposure_hours FLOAT,  -- Horas de sol médias por dia (calculado)

  -- Cobertura de solo (ESA WorldCover 10m)
  land_cover_class INTEGER,  -- 1-11 (tree, shrub, grass, crop, etc.)
  impervious_percent FLOAT,  -- % de superfície impermeável

  -- Índices de vegetação (Sentinel-2, refresh 5d)
  ndvi FLOAT,  -- Normalized Difference Vegetation Index (-1 a +1)
  ndbi FLOAT,  -- Normalized Difference Built Index
  soil_moisture_percent FLOAT,

  -- Contexto climático
  climate_zone VARCHAR(20),  -- Köppen-Geiger classification
  precipitation_mm_annual FLOAT,
  temperature_c_mean FLOAT,

  last_updated TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_terreno_metrics_terreno ON terreno_metrics(terreno_id);
CREATE INDEX idx_terreno_metrics_altitude ON terreno_metrics(altitude_m);
CREATE INDEX idx_terreno_metrics_ndvi ON terreno_metrics(ndvi);

-- ============================================================================
-- 3. IMAGEM SATÉLITE — Referências para Sentinel-2 + CBERS-4A COGs
-- ============================================================================

CREATE TABLE satellite_imagery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identificação
  source VARCHAR(20) NOT NULL,  -- 'SENTINEL2' | 'CBERS4A' | 'LANDSAT8'
  product_id VARCHAR(255) UNIQUE,  -- SAFE product ID (Sentinel-2) ou product code

  -- Cobertura geográfica
  geometry GEOMETRY(Polygon, 4326) NOT NULL,
  tile_x INTEGER,
  tile_y INTEGER,
  utm_zone INTEGER,

  -- Metadados da imagem
  acquisition_date DATE NOT NULL,
  cloud_cover_percent FLOAT,
  processing_level VARCHAR(10),  -- 'L1C', 'L2A', etc.

  -- Armazenamento
  s3_bucket VARCHAR(255),  -- 's3://landmap-geo-prod'
  s3_prefix VARCHAR(255),  -- 's3://.../2024/08/05/T23JLE_...'
  cog_url VARCHAR(2048),  -- Cloud Optimized GeoTIFF URL (range-request friendly)

  -- Bands disponíveis (JSON)
  available_bands TEXT,  -- JSON: {"red": "B04.tif", "nir": "B08.tif", ...}

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_satellite_geometry ON satellite_imagery USING GIST(geometry);
CREATE INDEX idx_satellite_acquisition ON satellite_imagery(acquisition_date DESC);
CREATE INDEX idx_satellite_source ON satellite_imagery(source);

-- ============================================================================
-- 4. TILE CACHE — Referências para tiles vector pré-gerados (.pbf)
-- ============================================================================

CREATE TABLE tile_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Coordenação de tile Web Mercator
  z INTEGER NOT NULL,  -- zoom level (0-22)
  x INTEGER NOT NULL,  -- tile X
  y INTEGER NOT NULL,  -- tile Y

  -- Armazenamento
  s3_key VARCHAR(255),  -- 's3://landmap-tiles/0/0/0.pbf'
  generated_at TIMESTAMP,
  expires_at TIMESTAMP,  -- TTL para invalidação

  -- Metadados
  feature_count INTEGER,  -- Quantos features neste tile
  size_bytes INTEGER,  -- Tamanho do arquivo .pbf

  PRIMARY KEY(z, x, y),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_tile_cache_expires ON tile_cache(expires_at);

-- ============================================================================
-- 5. IMAGEM DRONE/STREET VIEW — Fotos de alta resolução por terreno
-- ============================================================================

CREATE TABLE terrain_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  terreno_id UUID NOT NULL REFERENCES terrenos(id) ON DELETE CASCADE,

  -- Tipo de foto
  photo_type VARCHAR(20) NOT NULL,  -- 'DRONE' | 'STREET' | 'SATELLITE' | 'THERMAL'
  capture_date DATE,

  -- Localização
  location GEOMETRY(Point, 4326) NOT NULL,
  altitude_m FLOAT,  -- Altitude do drone se aplicável
  heading_degrees FLOAT,  -- Direção de captura 0-359
  pitch_degrees FLOAT,  -- Inclinação -90 a +90

  -- Metadados
  resolution_megapixels FLOAT,
  url VARCHAR(2048),  -- CDN public URL
  s3_key VARCHAR(255),

  -- Análise
  ai_tags TEXT,  -- JSON: ["grass", "building", "tree", ...]
  quality_score FLOAT,  -- 0-1 (based on sharpness, lighting, occlusion)

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_terrain_photos_terreno ON terrain_photos(terreno_id);
CREATE INDEX idx_terrain_photos_location ON terrain_photos USING GIST(location);
CREATE INDEX idx_terrain_photos_date ON terrain_photos(capture_date DESC);
CREATE INDEX idx_terrain_photos_type ON terrain_photos(photo_type);

-- ============================================================================
-- 6. PESQUISA GEOESPACIAL — Índices de localização para busca rápida
-- ============================================================================

CREATE TABLE spatial_index (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Associação a terreno ou feature
  terreno_id UUID REFERENCES terrenos(id) ON DELETE CASCADE,

  -- Texto de busca
  search_text TSVECTOR,  -- Full-text search index

  -- Localização
  location GEOMETRY(Point, 4326),

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_spatial_search ON spatial_index USING GIN(search_text);
CREATE INDEX idx_spatial_location ON spatial_index USING GIST(location);

-- ============================================================================
-- 7. USUARIO → FAVORITOS GEOESPACIAIS
-- ============================================================================

CREATE TABLE user_geo_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,  -- FK to auth.users
  terreno_id UUID NOT NULL REFERENCES terrenos(id) ON DELETE CASCADE,

  saved_at TIMESTAMP DEFAULT NOW(),
  notes TEXT,

  UNIQUE(user_id, terreno_id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_user_geo_favorites_user ON user_geo_favorites(user_id);

-- ============================================================================
-- 8. HISTÓRIO DE MUDANÇAS GEOESPACIAIS — Audit trail
-- ============================================================================

CREATE TABLE geo_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  terreno_id UUID REFERENCES terrenos(id),
  action VARCHAR(50),  -- 'INSERT', 'UPDATE', 'DELETE'

  old_data JSONB,
  new_data JSONB,

  user_id UUID,
  ip_address INET,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_geo_audit_terreno ON geo_audit_log(terreno_id);
CREATE INDEX idx_geo_audit_timestamp ON geo_audit_log(created_at DESC);

-- ============================================================================
-- 9. MATERIALIZED VIEWS — Agregações para performance em z-levels
-- ============================================================================

-- Agregação z0-8 (view Brasil inteira)
CREATE MATERIALIZED VIEW geo_tiles_z8 AS
SELECT
  z,
  x,
  y,
  ST_SimplifyPreserveTopology(ST_Collect(geometry), 0.01) as geometry,
  COUNT(*) as feature_count,
  AVG(area_m2) as avg_area
FROM (
  SELECT
    8 as z,
    (ST_TileX(geometry, 8))::integer as x,
    (ST_TileY(geometry, 8))::integer as y,
    geometry,
    area_m2
  FROM terrenos
) t
GROUP BY z, x, y;

CREATE INDEX idx_geo_tiles_z8 ON geo_tiles_z8(z, x, y);

-- Agregação z12-14 (view regional)
CREATE MATERIALIZED VIEW geo_tiles_z14 AS
SELECT
  z,
  x,
  y,
  ST_SimplifyPreserveTopology(ST_Collect(geometry), 0.001) as geometry,
  COUNT(*) as feature_count
FROM (
  SELECT
    14 as z,
    (ST_TileX(geometry, 14))::integer as x,
    (ST_TileY(geometry, 14))::integer as y,
    geometry
  FROM terrenos
) t
GROUP BY z, x, y;

CREATE INDEX idx_geo_tiles_z14 ON geo_tiles_z14(z, x, y);

-- ============================================================================
-- 10. RLS — Row Level Security (multi-tenant)
-- ============================================================================

ALTER TABLE terrenos ENABLE ROW LEVEL SECURITY;
ALTER TABLE terreno_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE terrain_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_geo_favorites ENABLE ROW LEVEL SECURITY;

-- Policy: todo mundo consegue VER terrenos públicos
CREATE POLICY "anyone_can_read_terrenos" ON terrenos
  FOR SELECT USING (true);

-- Policy: só owner consegue editar
CREATE POLICY "users_update_own_favorites" ON user_geo_favorites
  FOR ALL USING (user_id = auth.uid());

-- ============================================================================
-- 11. FUNCTIONS — Helpers para geoespacial
-- ============================================================================

-- Função: Buscar terrenos por caixa geográfica + retornar geojson
CREATE OR REPLACE FUNCTION get_terrenos_by_bbox(
  min_lon FLOAT,
  min_lat FLOAT,
  max_lon FLOAT,
  max_lat FLOAT,
  max_features INTEGER DEFAULT 1000
)
RETURNS TABLE (
  id UUID,
  name VARCHAR,
  geom GEOMETRY,
  area_m2 FLOAT,
  state_code VARCHAR
) AS $$
  SELECT
    t.id,
    t.name,
    t.geometry,
    t.area_m2,
    t.state_code
  FROM terrenos t
  WHERE t.geometry && ST_MakeEnvelope(min_lon, min_lat, max_lon, max_lat, 4326)
  LIMIT max_features;
$$ LANGUAGE SQL STABLE;

-- Função: Calcular distância entre dois pontos (km)
CREATE OR REPLACE FUNCTION distance_km(
  lat1 FLOAT,
  lon1 FLOAT,
  lat2 FLOAT,
  lon2 FLOAT
)
RETURNS FLOAT AS $$
  SELECT ST_Distance(
    ST_MakePoint(lon1, lat1)::GEOGRAPHY,
    ST_MakePoint(lon2, lat2)::GEOGRAPHY
  ) / 1000.0;
$$ LANGUAGE SQL IMMUTABLE;

-- Função: Buscar terrenos próximos a um ponto (raio em km)
CREATE OR REPLACE FUNCTION find_nearby_terrenos(
  lat FLOAT,
  lon FLOAT,
  radius_km FLOAT,
  limit_results INTEGER DEFAULT 100
)
RETURNS TABLE (
  id UUID,
  name VARCHAR,
  distance_km FLOAT,
  area_m2 FLOAT
) AS $$
  SELECT
    t.id,
    t.name,
    ST_Distance(t.centroid::GEOGRAPHY, ST_MakePoint(lon, lat)::GEOGRAPHY) / 1000.0 as distance_km,
    t.area_m2
  FROM terrenos t
  WHERE ST_DWithin(
    t.centroid::GEOGRAPHY,
    ST_MakePoint(lon, lat)::GEOGRAPHY,
    radius_km * 1000
  )
  ORDER BY distance_km
  LIMIT limit_results;
$$ LANGUAGE SQL STABLE;

-- ============================================================================
-- 12. TRIGGERS — Manter metadados atualizados
-- ============================================================================

CREATE OR REPLACE FUNCTION update_terreno_geometry_fields()
RETURNS TRIGGER AS $$
BEGIN
  NEW.area_m2 = ST_Area(NEW.geometry::GEOGRAPHY);
  NEW.perimeter_m = ST_Perimeter(NEW.geometry::GEOGRAPHY);
  NEW.centroid = ST_Centroid(NEW.geometry);
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_terreno_fields
BEFORE INSERT OR UPDATE ON terrenos
FOR EACH ROW
EXECUTE FUNCTION update_terreno_geometry_fields();

-- Audit log trigger
CREATE OR REPLACE FUNCTION log_terreno_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO geo_audit_log (terreno_id, action, old_data, new_data, user_id)
    VALUES (NEW.id, 'UPDATE', row_to_json(OLD), row_to_json(NEW), auth.uid());
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO geo_audit_log (terreno_id, action, old_data, user_id)
    VALUES (OLD.id, 'DELETE', row_to_json(OLD), auth.uid());
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_audit_terreno
AFTER UPDATE OR DELETE ON terrenos
FOR EACH ROW
EXECUTE FUNCTION log_terreno_changes();

-- ============================================================================
-- 13. GRANTS — Permissões por role
-- ============================================================================

GRANT SELECT ON terrenos TO authenticated;
GRANT SELECT ON terreno_metrics TO authenticated;
GRANT SELECT ON terrain_photos TO authenticated;
GRANT SELECT ON satellite_imagery TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON user_geo_favorites TO authenticated;
GRANT SELECT ON geo_audit_log TO authenticated;

GRANT SELECT ON geo_tiles_z8 TO anonymous;
GRANT SELECT ON geo_tiles_z14 TO anonymous;

COMMIT;
