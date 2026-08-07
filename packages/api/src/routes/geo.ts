// ============================================================================
// LandMap GEO API — Vector Tiles, Imagery, Search
// ============================================================================
// Rotas Hono para visualização geoespacial do Brasil
// Performance targets: tiles <200ms p95, imagery <500ms p95
// ============================================================================

import { Hono } from 'hono';
import { getCookie } from 'hono/cookie';
import { z } from 'zod';

type Env = {
  db: any;
  cache: any;
  s3: any;
};

const geoRoutes = new Hono<{ Bindings: Env }>();

// ============================================================================
// 1. VECTOR TILES — Servir tiles .pbf Web Mercator
// ============================================================================

// GET /api/geo/tiles/{z}/{x}/{y}.pbf
// Retorna tile vector em Protocol Buffer (Mapbox Vector Tile format)
geoRoutes.get('/tiles/:z/:x/:y.pbf', async (c) => {
  const { z: zParam, x: xParam, 'y.pbf': yParam } = c.req.param();
  const zoom = parseInt(zParam, 10);
  const tileX = parseInt(xParam, 10);
  const tileY = parseInt(yParam, 10);

  // Validação
  if (zoom < 0 || zoom > 22 || tileX < 0 || tileY < 0) {
    return c.json({ error: 'Invalid tile coordinates' }, 400);
  }

  const cacheKey = `tile:${zoom}:${tileX}:${tileY}`;

  // Tentar cache Redis
  try {
    const cached = await c.env.cache?.get(cacheKey);
    if (cached) {
      return c.body(cached, 200, {
        'Content-Type': 'application/x-protobuf',
        'Cache-Control': 'public, max-age=604800',
        'ETag': `"${Buffer.from(cached).toString('hex').slice(0, 16)}"`,
      });
    }
  } catch (e) {
    // Cache miss, continue
  }

  // Buscar do S3 (pre-generated .pbf)
  try {
    const s3Key = `tiles/${zoom}/${tileX}/${tileY}.pbf`;
    const tileBuffer = await c.env.s3?.get(s3Key);

    if (!tileBuffer) {
      // Tile não existe, retornar empty
      return c.json(null, 204);
    }

    // Cache para 7 dias
    await c.env.cache?.set(cacheKey, tileBuffer, { expirationTtl: 604800 });

    return c.body(tileBuffer, 200, {
      'Content-Type': 'application/x-protobuf',
      'Cache-Control': 'public, max-age=604800',
    });
  } catch (error) {
    return c.json({ error: 'Tile not found', details: String(error) }, 404);
  }
});

// ============================================================================
// 2. IMAGERY — Cloud Optimized GeoTIFF com range requests
// ============================================================================

// GET /api/geo/imagery/{source}/{z}/{x}/{y}.tif
// Cloud Optimized GeoTIFF com suporte a range requests HTTP
// Exemplo: /api/geo/imagery/sentinel2/14/5230/3412.tif
geoRoutes.get('/imagery/:source/:z/:x/:y', async (c) => {
  const { source, z, x, y } = c.req.param();
  const zoom = parseInt(z, 10);
  const tileX = parseInt(x, 10);
  const tileY = parseInt(y, 10);

  // Validar source
  const validSources = ['sentinel2', 'cbers4a', 'landsat8'];
  if (!validSources.includes(source.toLowerCase())) {
    return c.json({ error: 'Invalid imagery source', valid: validSources }, 400);
  }

  try {
    // Construir S3 path
    // Exemplo: s3://landmap-geo-prod/imagery/sentinel2/2024/08/05/T23JLE_B2_10m.tif
    // Aqui simplificamos para grid-based lookup
    const s3Key = `imagery/${source}/${zoom}/${tileX}/${tileY}.tif`;

    // Range request suportado via S3 GET com headers
    const rangeHeader = c.req.header('range');
    const headersToS3: any = {};

    if (rangeHeader) {
      headersToS3['range'] = rangeHeader;
    }

    // S3 GET com metadata
    const response = await c.env.s3?.getWithHeaders(s3Key, headersToS3);

    if (!response) {
      return c.json({ error: 'Imagery tile not available' }, 404);
    }

    // CloudFront vai cache esta resposta
    return c.body(response.body, response.status || 200, {
      'Content-Type': 'image/tiff',
      'Content-Length': response.headers?.['content-length'] || '',
      'Cache-Control': 'public, max-age=2592000',  // 30 dias
      'Accept-Ranges': 'bytes',
      ...(response.status === 206 && { 'Content-Range': response.headers?.['content-range'] || '' }),
    });
  } catch (error) {
    return c.json({ error: 'Failed to retrieve imagery', details: String(error) }, 500);
  }
});

// ============================================================================
// 3. BUSCA GEOESPACIAL — Query por bbox, ponto, texto
// ============================================================================

const SearchQuerySchema = z.object({
  bbox: z.string().optional(),  // "minLon,minLat,maxLon,maxLat"
  lat: z.string().optional(),
  lon: z.string().optional(),
  radius_km: z.string().optional(),
  query: z.string().optional(),
  limit: z.string().optional().default('100'),
  offset: z.string().optional().default('0'),
});

// GET /api/geo/terrenos/search?bbox=...&limit=50
geoRoutes.get('/terrenos/search', async (c) => {
  const query = SearchQuerySchema.parse({
    bbox: c.req.query('bbox'),
    lat: c.req.query('lat'),
    lon: c.req.query('lon'),
    radius_km: c.req.query('radius_km'),
    query: c.req.query('q'),
    limit: c.req.query('limit'),
    offset: c.req.query('offset'),
  });

  const limit = Math.min(parseInt(query.limit, 10) || 100, 1000);
  const offset = parseInt(query.offset, 10) || 0;
  const cacheKey = `search:${JSON.stringify(query)}`;

  try {
    // Tentar cache
    const cached = await c.env.cache?.get(cacheKey);
    if (cached) {
      return c.json(JSON.parse(cached), 200, {
        'Cache-Control': 'public, max-age=3600',
        'X-Cache': 'HIT',
      });
    }

    let results: any[] = [];

    if (query.bbox) {
      // Busca por caixa geográfica
      const [minLon, minLat, maxLon, maxLat] = query.bbox.split(',').map(Number);

      const sql = `
        SELECT
          id, name, ST_AsGeoJSON(geometry) as geometry, area_m2, state_code
        FROM terrenos
        WHERE geometry && ST_MakeEnvelope($1, $2, $3, $4, 4326)
        ORDER BY area_m2 DESC
        LIMIT $5 OFFSET $6
      `;

      results = await c.env.db?.query(sql, [minLon, minLat, maxLon, maxLat, limit, offset]);
    } else if (query.lat && query.lon) {
      // Busca por proximidade (raio)
      const lat = parseFloat(query.lat);
      const lon = parseFloat(query.lon);
      const radiusKm = parseFloat(query.radius_km || '10');

      const sql = `
        SELECT
          id, name, ST_AsGeoJSON(geometry) as geometry, area_m2, state_code,
          ST_Distance(centroid::GEOGRAPHY, ST_MakePoint($1, $2)::GEOGRAPHY) / 1000.0 as distance_km
        FROM terrenos
        WHERE ST_DWithin(centroid::GEOGRAPHY, ST_MakePoint($1, $2)::GEOGRAPHY, $3 * 1000)
        ORDER BY distance_km
        LIMIT $4 OFFSET $5
      `;

      results = await c.env.db?.query(sql, [lon, lat, radiusKm, limit, offset]);
    } else if (query.query) {
      // Full-text search
      const sql = `
        SELECT
          t.id, t.name, ST_AsGeoJSON(t.geometry) as geometry, t.area_m2, t.state_code,
          ts_rank(si.search_text, plainto_tsquery($1)) as relevance
        FROM terrenos t
        LEFT JOIN spatial_index si ON t.id = si.terreno_id
        WHERE si.search_text @@ plainto_tsquery($1)
        ORDER BY relevance DESC
        LIMIT $2 OFFSET $3
      `;

      results = await c.env.db?.query(sql, [query.query, limit, offset]);
    } else {
      // Sem critério, retornar sample
      const sql = `
        SELECT id, name, ST_AsGeoJSON(geometry) as geometry, area_m2, state_code
        FROM terrenos
        ORDER BY RANDOM()
        LIMIT $1
      `;

      results = await c.env.db?.query(sql, [limit]);
    }

    const response = {
      type: 'FeatureCollection',
      features: results.map((r) => ({
        type: 'Feature',
        id: r.id,
        geometry: JSON.parse(r.geometry || '{}'),
        properties: {
          name: r.name,
          area_m2: r.area_m2,
          state_code: r.state_code,
          distance_km: r.distance_km || null,
        },
      })),
      total: results.length,
    };

    // Cache por 1 hora
    await c.env.cache?.set(cacheKey, JSON.stringify(response), { expirationTtl: 3600 });

    return c.json(response, 200, {
      'Cache-Control': 'public, max-age=3600',
      'X-Cache': 'MISS',
    });
  } catch (error) {
    return c.json({ error: 'Search failed', details: String(error) }, 500);
  }
});

// ============================================================================
// 4. DETALHES DO TERRENO — Geometria + métricas + fotos
// ============================================================================

// GET /api/geo/terrenos/{id}
geoRoutes.get('/terrenos/:id', async (c) => {
  const { id } = c.req.param();
  const cacheKey = `terreno:${id}`;

  try {
    // Cache
    const cached = await c.env.cache?.get(cacheKey);
    if (cached) {
      return c.json(JSON.parse(cached), 200, {
        'Cache-Control': 'public, max-age=86400',
        'X-Cache': 'HIT',
      });
    }

    // Query terreno + métricas + fotos
    const sql = `
      SELECT
        t.id, t.name, ST_AsGeoJSON(t.geometry) as geometry, t.area_m2, t.perimeter_m,
        t.state_code, t.municipality_code, t.owner_name, t.registration_date,
        tm.altitude_m, tm.slope_percent, tm.aspect_degrees, tm.ndvi, tm.land_cover_class,
        COUNT(tp.id) as photo_count
      FROM terrenos t
      LEFT JOIN terreno_metrics tm ON t.id = tm.terreno_id
      LEFT JOIN terrain_photos tp ON t.id = tp.terreno_id
      WHERE t.id = $1
      GROUP BY t.id, t.name, t.geometry, t.area_m2, t.perimeter_m, t.state_code,
               t.municipality_code, t.owner_name, t.registration_date,
               tm.altitude_m, tm.slope_percent, tm.aspect_degrees, tm.ndvi, tm.land_cover_class
    `;

    const terreno = await c.env.db?.queryOne(sql, [id]);

    if (!terreno) {
      return c.json({ error: 'Terreno not found' }, 404);
    }

    // Fotos
    const photosSql = `
      SELECT id, photo_type, capture_date, url, quality_score
      FROM terrain_photos
      WHERE terreno_id = $1
      ORDER BY quality_score DESC, capture_date DESC
      LIMIT 20
    `;

    const photos = await c.env.db?.query(photosSql, [id]);

    const response = {
      type: 'Feature',
      id: terreno.id,
      geometry: JSON.parse(terreno.geometry || '{}'),
      properties: {
        name: terreno.name,
        area_m2: terreno.area_m2,
        perimeter_m: terreno.perimeter_m,
        state_code: terreno.state_code,
        owner_name: terreno.owner_name,
        registration_date: terreno.registration_date,
        metrics: {
          altitude_m: terreno.altitude_m,
          slope_percent: terreno.slope_percent,
          aspect_degrees: terreno.aspect_degrees,
          ndvi: terreno.ndvi,
          land_cover_class: terreno.land_cover_class,
        },
        photos: photos || [],
        photo_count: terreno.photo_count,
      },
    };

    // Cache por 24h
    await c.env.cache?.set(cacheKey, JSON.stringify(response), { expirationTtl: 86400 });

    return c.json(response, 200, {
      'Cache-Control': 'public, max-age=86400',
      'X-Cache': 'MISS',
    });
  } catch (error) {
    return c.json({ error: 'Failed to fetch terreno', details: String(error) }, 500);
  }
});

// ============================================================================
// 5. MÉTRICAS DE TERRENO — Índices de vegetação, altitude, cobertura solo
// ============================================================================

// GET /api/geo/terrenos/{id}/metrics
geoRoutes.get('/terrenos/:id/metrics', async (c) => {
  const { id } = c.req.param();

  try {
    const sql = `
      SELECT
        terreno_id, altitude_m, slope_percent, aspect_degrees, solar_exposure_hours,
        ndvi, ndbi, soil_moisture_percent,
        land_cover_class, impervious_percent,
        climate_zone, precipitation_mm_annual, temperature_c_mean,
        last_updated
      FROM terreno_metrics
      WHERE terreno_id = $1
    `;

    const metrics = await c.env.db?.queryOne(sql, [id]);

    if (!metrics) {
      return c.json({ error: 'Metrics not found for terreno' }, 404);
    }

    return c.json(metrics, 200, {
      'Cache-Control': 'public, max-age=86400',
    });
  } catch (error) {
    return c.json({ error: 'Failed to fetch metrics', details: String(error) }, 500);
  }
});

// ============================================================================
// 6. FAVORITOS — Salvar/listar terrenos favoritos por usuário
// ============================================================================

// POST /api/geo/favorites
geoRoutes.post('/favorites', async (c) => {
  const userId = c.req.header('x-user-id');
  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const body = await c.req.json();
    const { terreno_id, notes } = body;

    const sql = `
      INSERT INTO user_geo_favorites (user_id, terreno_id, notes)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, terreno_id) DO UPDATE SET notes = EXCLUDED.notes
      RETURNING id, terreno_id, saved_at
    `;

    const result = await c.env.db?.queryOne(sql, [userId, terreno_id, notes || '']);

    return c.json(result, 201);
  } catch (error) {
    return c.json({ error: 'Failed to save favorite', details: String(error) }, 500);
  }
});

// GET /api/geo/favorites
geoRoutes.get('/favorites', async (c) => {
  const userId = c.req.header('x-user-id');
  if (!userId) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const sql = `
      SELECT
        ugf.id, ugf.terreno_id, ugf.notes, ugf.saved_at,
        t.name, t.area_m2, ST_AsGeoJSON(t.geometry) as geometry
      FROM user_geo_favorites ugf
      JOIN terrenos t ON ugf.terreno_id = t.id
      WHERE ugf.user_id = $1
      ORDER BY ugf.saved_at DESC
    `;

    const favorites = await c.env.db?.query(sql, [userId]);

    return c.json({
      type: 'FeatureCollection',
      features: (favorites || []).map((f) => ({
        type: 'Feature',
        id: f.terreno_id,
        geometry: JSON.parse(f.geometry || '{}'),
        properties: {
          favorite_id: f.id,
          name: f.name,
          area_m2: f.area_m2,
          notes: f.notes,
          saved_at: f.saved_at,
        },
      })),
    }, 200, {
      'Cache-Control': 'private, max-age=300',
    });
  } catch (error) {
    return c.json({ error: 'Failed to fetch favorites', details: String(error) }, 500);
  }
});

// ============================================================================
// 7. ESTATÍSTICAS GEOESPACIAIS — Dashboard overview
// ============================================================================

// GET /api/geo/stats
geoRoutes.get('/stats', async (c) => {
  const cacheKey = 'geo:stats:global';

  try {
    const cached = await c.env.cache?.get(cacheKey);
    if (cached) {
      return c.json(JSON.parse(cached), 200, {
        'Cache-Control': 'public, max-age=3600',
        'X-Cache': 'HIT',
      });
    }

    const sql = `
      SELECT
        COUNT(*) as total_terrenos,
        COUNT(DISTINCT state_code) as states_covered,
        SUM(area_m2) as total_area_m2,
        AVG(area_m2) as avg_area_m2,
        MIN(area_m2) as min_area_m2,
        MAX(area_m2) as max_area_m2,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY area_m2) as median_area_m2
      FROM terrenos
    `;

    const stats = await c.env.db?.queryOne(sql, []);

    const response = {
      total_terrenos: stats?.total_terrenos || 0,
      states_covered: stats?.states_covered || 0,
      coverage_km2: (stats?.total_area_m2 || 0) / 1_000_000,
      avg_area_m2: stats?.avg_area_m2 || 0,
      median_area_m2: stats?.median_area_m2 || 0,
      last_updated: new Date().toISOString(),
    };

    await c.env.cache?.set(cacheKey, JSON.stringify(response), { expirationTtl: 3600 });

    return c.json(response, 200, {
      'Cache-Control': 'public, max-age=3600',
      'X-Cache': 'MISS',
    });
  } catch (error) {
    return c.json({ error: 'Failed to fetch stats', details: String(error) }, 500);
  }
});

export default geoRoutes;
