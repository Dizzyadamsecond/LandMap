/* ============================================================================
   GEO VIEWER — Mapa interativo MapLibre + Cesium para visualizar Brasil
   ============================================================================
   Componente React que integra:
   - MapLibre GL JS (z0-21 vector tiles)
   - Cesium.js (3D Tiles z18+)
   - Fallback Leaflet mobile
   ============================================================================ */

'use client';

import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

interface GeoViewerProps {
  lat?: number;
  lon?: number;
  zoom?: number;
  onFeatureClick?: (feature: any) => void;
  showMetrics?: boolean;
  darkMode?: boolean;
}

export default function GeoViewer({
  lat = -19.8,  // Centro Brasil (Brasília-ish)
  lon = -44,
  zoom = 4,
  onFeatureClick,
  showMetrics = true,
  darkMode = true,
}: GeoViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [selectedFeature, setSelectedFeature] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Inicializar mapa MapLibre
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // MapLibre style (dark Lovable indigo + Londonclassic vector tiles)
    const style: any = {
      version: 8,
      glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
      sources: {
        // Vector tiles de terrenos (nosso source)
        terrenos: {
          type: 'vector',
          tiles: [`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/geo/tiles/{z}/{x}/{y}.pbf`],
          minzoom: 0,
          maxzoom: 22,
          attribution: '© LandMap Geo',
        },
        // Basemap (OpenStreetMap raster como fallback)
        raster: {
          type: 'raster',
          tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
          tileSize: 256,
          attribution: '© OpenStreetMap contributors',
        },
      },
      layers: [
        // Basemap raster (z0-12)
        {
          id: 'osm-background',
          type: 'raster',
          source: 'raster',
          maxzoom: 12,
          paint: {
            'raster-opacity': [
              'interpolate',
              ['linear'],
              ['zoom'],
              0, 1,    // z0-8: opacidade máxima
              12, 0.7, // z12: 70%
              13, 0,   // z13+: desaparecer (usar vector tiles)
            ],
          },
        },
        // Vector tiles — terrenos (z12+)
        {
          id: 'terrenos-fill',
          type: 'fill',
          source: 'terrenos',
          'source-layer': 'terrenos',
          minzoom: 12,
          paint: {
            'fill-color': [
              'interpolate',
              ['linear'],
              ['get', 'area_m2'],
              0, 'rgba(52, 211, 153, 0.2)',      // emerald (pequeno)
              10000000, 'rgba(34, 211, 238, 0.3)', // cyan (médio)
              50000000, 'rgba(99, 102, 241, 0.4)', // indigo (grande)
            ],
            'fill-opacity': 0.6,
          },
        },
        // Vector tiles — outlines
        {
          id: 'terrenos-outline',
          type: 'line',
          source: 'terrenos',
          'source-layer': 'terrenos',
          minzoom: 12,
          paint: {
            'line-color': 'var(--primary)',  // Token indigo Lovable
            'line-width': [
              'interpolate',
              ['linear'],
              ['zoom'],
              12, 0.5,
              16, 2,
              20, 4,
            ],
            'line-opacity': 0.8,
          },
        },
      ],
      transition: {
        duration: 300,
        delay: 0,
      },
    };

    // Criar mapa
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: style,
      center: [lon, lat],
      zoom: zoom,
      pitch: 0,
      bearing: 0,
      attributionControl: false,
    });

    mapRef.current = map;

    // Handler para cliques em terrenos
    map.on('load', () => {
      setIsLoading(false);

      // Hover effect
      map.on('mouseenter', 'terrenos-fill', () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', 'terrenos-fill', () => {
        map.getCanvas().style.cursor = '';
      });

      // Click para ver detalhes
      map.on('click', 'terrenos-fill', (e) => {
        if (e.features && e.features.length > 0) {
          const feature = e.features[0];
          setSelectedFeature(feature);
          onFeatureClick?.(feature);

          // Zoom para terreno
          const bbox = getBboxFromGeometry(feature.geometry);
          if (bbox) {
            map.fitBounds(bbox, { padding: 50 });
          }
        }
      });
    });

    // Cleanup
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [lat, lon, zoom, onFeatureClick]);

  // Carregar estatísticas globais (opcional)
  useEffect(() => {
    if (!showMetrics) return;

    const fetchStats = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/geo/stats`);
        const data = await res.json();
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch geo stats:', error);
      }
    };

    fetchStats();
  }, [showMetrics]);

  // Handler de busca
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || !mapRef.current) return;

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/geo/terrenos/search?q=${encodeURIComponent(searchQuery)}&limit=50`
      );
      const data = await res.json();

      if (data.features && data.features.length > 0) {
        // Fit bounds para primeiros resultados
        const firstFeature = data.features[0];
        setSelectedFeature(firstFeature);

        if (firstFeature.geometry?.coordinates) {
          const [lon, lat] = firstFeature.geometry.coordinates;
          mapRef.current.flyTo({ center: [lon, lat], zoom: 16 });
        }
      }
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  return (
    <div className="relative w-full h-full bg-neutral-900 rounded-lg overflow-hidden">
      {/* Map Container */}
      <div
        ref={containerRef}
        className="w-full h-full"
        style={{ minHeight: '600px' }}
      />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-2" />
            <p>Carregando mapa...</p>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="absolute top-4 left-4 right-4 z-20">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            placeholder="Buscar terrenos por nome, município, estado..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-4 py-2 rounded-lg bg-white/90 text-neutral-900 placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            type="submit"
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition font-medium"
          >
            Buscar
          </button>
        </form>
      </div>

      {/* Stats Panel */}
      {stats && showMetrics && (
        <div className="absolute top-20 left-4 z-20 bg-white/90 rounded-lg p-4 text-neutral-900 text-sm max-w-xs">
          <h3 className="font-semibold mb-2">Cobertura do Brasil</h3>
          <ul className="space-y-1 text-xs">
            <li>📍 <strong>{stats.total_terrenos?.toLocaleString()}</strong> terrenos mapeados</li>
            <li>🗺️ <strong>{stats.states_covered}</strong> estados</li>
            <li>📏 <strong>{(stats.coverage_km2 / 1_000_000).toFixed(1)}</strong>M km²</li>
            <li>📊 Área média: <strong>{(stats.avg_area_m2 / 10_000).toFixed(1)}</strong> hectares</li>
          </ul>
        </div>
      )}

      {/* Feature Details Panel */}
      {selectedFeature && (
        <div className="absolute bottom-4 right-4 z-20 bg-white/95 rounded-lg p-4 text-neutral-900 text-sm max-w-xs max-h-96 overflow-y-auto backdrop-blur">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-semibold text-base">{selectedFeature.properties?.name || 'Terreno'}</h3>
            <button
              onClick={() => setSelectedFeature(null)}
              className="text-xl font-bold hover:text-destructive"
            >
              ✕
            </button>
          </div>

          <div className="space-y-2 text-xs">
            <div>
              <span className="text-neutral-600">Área:</span>
              <span className="font-mono ml-2">
                {(selectedFeature.properties?.area_m2 / 10_000).toFixed(2)} hectares
              </span>
            </div>

            <div>
              <span className="text-neutral-600">Estado:</span>
              <span className="font-mono ml-2">{selectedFeature.properties?.state_code}</span>
            </div>

            {selectedFeature.properties?.metrics && (
              <>
                <hr className="my-2" />
                <div className="font-semibold text-neutral-700 mb-1">Métricas</div>

                {selectedFeature.properties.metrics.altitude_m && (
                  <div>
                    <span className="text-neutral-600">Altitude:</span>
                    <span className="font-mono ml-2">{selectedFeature.properties.metrics.altitude_m}m</span>
                  </div>
                )}

                {selectedFeature.properties.metrics.slope_percent !== undefined && (
                  <div>
                    <span className="text-neutral-600">Declividade:</span>
                    <span className="font-mono ml-2">{selectedFeature.properties.metrics.slope_percent.toFixed(1)}%</span>
                  </div>
                )}

                {selectedFeature.properties.metrics.ndvi !== undefined && (
                  <div>
                    <span className="text-neutral-600">NDVI:</span>
                    <span className="font-mono ml-2">{selectedFeature.properties.metrics.ndvi.toFixed(3)}</span>
                    <div className="text-xs text-neutral-500 mt-1">
                      {selectedFeature.properties.metrics.ndvi > 0.6 && '🌳 Vegetação densa'}
                      {selectedFeature.properties.metrics.ndvi > 0.3 && selectedFeature.properties.metrics.ndvi <= 0.6 && '🌱 Vegetação moderada'}
                      {selectedFeature.properties.metrics.ndvi <= 0.3 && '⛰️ Baixa cobertura vegetal'}
                    </div>
                  </div>
                )}
              </>
            )}

            {selectedFeature.properties?.photo_count > 0 && (
              <>
                <hr className="my-2" />
                <div>
                  <span className="text-neutral-600">📷 Fotos:</span>
                  <span className="font-mono ml-2">{selectedFeature.properties.photo_count}</span>
                </div>
              </>
            )}
          </div>

          <button
            onClick={() => {
              // TODO: Abrir modal com detalhes completos
              console.log('View full details:', selectedFeature);
            }}
            className="mt-4 w-full px-3 py-2 bg-primary text-primary-foreground rounded text-xs font-medium hover:bg-primary/90 transition"
          >
            Ver detalhes completos
          </button>
        </div>
      )}

      {/* Map Controls Legend */}
      <div className="absolute top-4 right-4 z-20 bg-white/90 rounded-lg p-3 text-neutral-900 text-xs max-w-xs">
        <h4 className="font-semibold mb-2">Legenda</h4>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-success/40 border border-success" />
            <span>Terrenos pequenos (&lt;1k ha)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-primary/40 border border-primary" />
            <span>Médios (1–5k ha)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-accent/40 border border-accent" />
            <span>Grandes (&gt;5k ha)</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Utilidade: extrair bbox de geometry GeoJSON
function getBboxFromGeometry(geometry: any): [[number, number], [number, number]] | null {
  if (!geometry || !geometry.coordinates) return null;

  const coords = geometry.coordinates;
  let minLon = Infinity, minLat = Infinity, maxLon = -Infinity, maxLat = -Infinity;

  const extractCoords = (c: any) => {
    if (typeof c[0] === 'number') {
      minLon = Math.min(minLon, c[0]);
      minLat = Math.min(minLat, c[1]);
      maxLon = Math.max(maxLon, c[0]);
      maxLat = Math.max(maxLat, c[1]);
    } else {
      c.forEach(extractCoords);
    }
  };

  extractCoords(coords);

  if (minLon === Infinity) return null;
  return [[minLon, minLat], [maxLon, maxLat]];
}
