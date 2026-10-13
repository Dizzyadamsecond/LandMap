'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import type * as LeafletType from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Search,
  Layers as LayersIcon,
  Flame,
  X,
  TrendingUp,
  TrendingDown,
  Minus,
  Star,
  ChevronRight,
  Sparkles,
  MapPin,
  Activity,
  Gem,
  Award,
  Satellite,
  BarChart3,
  Plus,
  Minus as MinusIcon,
  FileBarChart,
  GitCompare,
} from '../../../components/lovable/icons';
import {
  REGIONS,
  LAYERS,
  FORTALEZA_CENTER,
  scoreToFillColor,
  scoreLabel,
  type LayerId,
  type RegionInsight,
} from '../../../lib/landmap-regions';
import { RequireAuth } from '../../../components/RequireAuth';
import { addFavorite, removeFavorite, isFavorite } from '../../../lib/favorites';

export default function DashboardPage() {
  return (
    <RequireAuth>
      <DashboardMapInner />
    </RequireAuth>
  );
}

function DashboardMapInner() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'pt-BR';

  const containerRef = useRef<HTMLDivElement | null>(null);
  const leafletModuleRef = useRef<typeof LeafletType | null>(null);
  const mapRef = useRef<LeafletType.Map | null>(null);
  const markersRef = useRef<LeafletType.Marker[]>([]);
  const circlesRef = useRef<LeafletType.Circle[]>([]);
  const heatmapRef = useRef<LeafletType.Circle[]>([]);

  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<RegionInsight | null>(null);
  const [layersOpen, setLayersOpen] = useState(false);
  const [heatmapOn, setHeatmapOn] = useState(true);
  const [activeLayer, setActiveLayer] = useState<LayerId>('valorization');
  const [search, setSearch] = useState('');
  const [mapMode, setMapMode] = useState<'green' | 'roadmap' | 'satellite'>(() => {
    if (typeof window === 'undefined') return 'green';
    const saved = window.localStorage.getItem('landmap:map-base');
    if (saved === 'green' || saved === 'roadmap' || saved === 'satellite') return saved;
    return 'green';
  });
  const baseTilesRef = useRef<{
    [key: string]: LeafletType.TileLayer | LeafletType.LayerGroup;
  }>({});
  const tileFailRef = useRef<{ [key: string]: boolean }>({});

  // Insights via API (/api/map/insights) — paridade com a Lovable LIVE, que
  // hidrata o mapa do mesmo jeito. O dataset estático REGIONS é o fallback:
  // se a API falhar, o mapa continua completo (nunca vazio).
  const [regions, setRegions] = useState<RegionInsight[]>(REGIONS);

  useEffect(() => {
    let alive = true;
    fetch('/api/map/insights')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d) => {
        if (!alive || !Array.isArray(d?.regions) || d.regions.length === 0) return;
        setRegions(d.regions as RegionInsight[]);
      })
      .catch(() => {
        /* fallback estático já está no state */
      });
    return () => {
      alive = false;
    };
  }, []);

  // Derived indicators — Bloomberg-style ticker
  const indicators = useMemo(() => {
    const avgPrice = regions.reduce((s, r) => s + r.priceSqm, 0) / regions.length;
    const avgDelta = regions.reduce((s, r) => s + r.priceSqmDelta12m, 0) / regions.length;
    const hottest = [...regions].sort((a, b) => b.priceSqmDelta12m - a.priceSqmDelta12m)[0];
    const bestOpp = [...regions].sort((a, b) => b.score - a.score)[0];
    const indexLandmap = Math.round(
      regions.reduce((s, r) => s + r.score, 0) / regions.length,
    );
    return { avgPrice, avgDelta, hottest, bestOpp, indexLandmap };
  }, [regions]);

  const rankings = useMemo(() => {
    const byDelta = [...regions].sort((a, b) => b.priceSqmDelta12m - a.priceSqmDelta12m);
    const byScore = [...regions].sort((a, b) => b.score - a.score);
    return {
      topDelta: byDelta.slice(0, 5),
      topScore: byScore.slice(0, 5),
    };
  }, [regions]);

  const searchResults = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.trim().toLowerCase();
    return regions.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.city.toLowerCase().includes(q) ||
        r.zoning.toLowerCase().includes(q),
    ).slice(0, 6);
  }, [search, regions]);

  // Initialize Map dynamically on client side
  useEffect(() => {
    let isMounted = true;
    if (!containerRef.current || mapRef.current) return;

    import('leaflet')
      .then((LModule) => {
        if (!isMounted || !containerRef.current) return;
        const L = (LModule.default || LModule) as typeof LeafletType;
        leafletModuleRef.current = L;

        try {
          const map = L.map(containerRef.current, {
            center: [-14.235, -51.925], // Visão ampla Brasil com foco inteligente
            zoom: 4,
            minZoom: 2, // permite visão do mundo completo (z2)
            maxZoom: 19,
            zoomControl: false,
            attributionControl: false,
          });

          // ── Base tiles via /api/tiles (proxy) ────────────────────────────
          // O proxy busca os tiles server-side (CDN acessível no servidor),
          // serve pelo nosso domínio (permitido no CSP img-src 'self') e faz
          // failover automático entre provedores. Isso elimina o "mapa em
          // branco" causado por CDN bloqueado/throttlado na rede do usuário.
          // Se o proxy estiver fora (offline/HTTP error), cada layer cai no
          // CDN direto automaticamente — nunca ficamos sem mapa.

          // URL de tile com failover: tenta o proxy; se a resposta vier como
          // PNG transparente (fallback do proxy) ou o CDN direto falhar, o
          // Leaflet pede de novo no CDN original.
          const proxied = (src: string) =>
            `/api/tiles?src=${src}&z={z}&x={x}&y={y}{r}`;
          const directGreen = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}';
          const directLight = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
          const directSat = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
          const directSatLbl = 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}';

          // Detecta tiles vazios (PNG 1x1 transparente do fallback do proxy)
          // e troca a layer para o CDN direto — garante mapa real sempre.
          const tileerror = (mode: string, directUrl: string, subdomains?: string) => {
            tileFailRef.current[mode] = true;
            const key = `${mode}:direct`;
            if (baseTilesRef.current[key]) return;
            const fallback = L.tileLayer(directUrl, {
              maxZoom: 19,
              ...(subdomains ? { subdomains } : {}),
              attribution:
                mode === 'satellite'
                  ? 'Esri, Maxar, Earthstar Geographics'
                  : '© OpenStreetMap contributors',
            });
            const old = baseTilesRef.current[mode];
            if (old && map.hasLayer(old)) map.removeLayer(old);
            baseTilesRef.current[key] = fallback;
            if (mapMode === mode) fallback.addTo(map);
          };

          // Camada Verde (OpenStreetMap — padrão mundial, dados abertos)
          const greenLayer = L.tileLayer(proxied('green'), {
            maxZoom: 19,
            subdomains: 'abc',
            attribution: '© OpenStreetMap contributors',
            errorTileUrl: undefined,
          });
          (greenLayer as any).options.directUrl = directGreen;
          greenLayer.on?.('tileerror', () => tileerror('green', directGreen, 'abc'));

          // Camada Mapa (CARTO Positron — claro, estilo Lovable)
          const roadmapLayer = L.tileLayer(proxied('light'), {
            maxZoom: 19,
            subdomains: 'abcd',
            attribution: '© OpenStreetMap contributors, © CARTO',
          });
          (roadmapLayer as any).options.directUrl = directLight;
          roadmapLayer.on?.('tileerror', () => tileerror('roadmap', directLight, 'abcd'));

          // Camada Satélite (globo terrestre tradicional — Esri World Imagery)
          const satelliteImg = L.tileLayer(proxied('satellite'), {
            maxZoom: 19,
            attribution: 'Esri, Maxar, Earthstar Geographics',
          });
          const satelliteLabels = L.tileLayer(proxied('satlabels'), {
            maxZoom: 19,
          });
          const satelliteLayer = L.layerGroup([satelliteImg, satelliteLabels]);
          satelliteImg.on?.('tileerror', () => tileerror('satellite', directSat));
          satelliteLabels.on?.('tileerror', () => tileerror('satellite', directSatLbl));

          baseTilesRef.current = {
            green: greenLayer,
            roadmap: roadmapLayer,
            satellite: satelliteLayer,
          };

          const initialLayer =
            mapMode === 'satellite'
              ? satelliteLayer
              : mapMode === 'green'
                ? greenLayer
                : roadmapLayer;
          initialLayer.addTo(map);

          mapRef.current = map;
          setReady(true);

          // Dispara invalidateSize em múltiplos frames para garantir cálculo correto
          // de dimensões do container (especialmente durante transições de layout / hydration)
          [100, 300, 600, 1000].forEach((delay) => {
            setTimeout(() => {
              if (isMounted && mapRef.current) {
                mapRef.current.invalidateSize();
              }
            }, delay);
          });

          // ResizeObserver para manter tiles sempre ajustadas ao tamanho do viewport
          if (typeof ResizeObserver !== 'undefined' && containerRef.current) {
            const ro = new ResizeObserver(() => {
              if (isMounted && mapRef.current) {
                mapRef.current.invalidateSize();
              }
            });
            ro.observe(containerRef.current);
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Falha ao inicializar o mapa');
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Falha ao carregar biblioteca do mapa');
      });

    return () => {
      isMounted = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Alterna dinamicamente entre visual Mapa (CartoDB) e Satélite (Globo tradicional)
  useEffect(() => {
    if (!ready || !mapRef.current) return;
    const map = mapRef.current;
    try {
      localStorage.setItem('landmap:map-base', mapMode);
    } catch {
      /* ignore */
    }

    const { roadmap, satellite, green } = baseTilesRef.current;
    if (roadmap && satellite && green) {
      const target =
        mapMode === 'satellite' ? satellite : mapMode === 'green' ? green : roadmap;
      const directKey = `${mapMode}:direct`;
      const direct = baseTilesRef.current[directKey];
      // Remove todas as layers base (proxy + direct fallback) e adiciona só a do modo atual
      Object.entries(baseTilesRef.current).forEach(([key, layer]) => {
        if (key === 'green' || key === 'roadmap' || key === 'satellite' || key.endsWith(':direct')) {
          if (map.hasLayer(layer)) map.removeLayer(layer);
        }
      });
      const active = direct && tileFailRef.current[mapMode] ? direct : target;
      if (!map.hasLayer(active)) active.addTo(map);
    }
  }, [ready, mapMode]);

  // Update Region Markers and Layer Circles
  useEffect(() => {
    const L = leafletModuleRef.current;
    if (!ready || !mapRef.current || !L) return;
    const map = mapRef.current;

    // Clear old circles and markers
    circlesRef.current.forEach((c) => c.remove());
    markersRef.current.forEach((m) => m.remove());
    circlesRef.current = [];
    markersRef.current = [];

    regions.forEach((region) => {
      const layerScore = region.layerScores[activeLayer];
      const color = scoreToFillColor(layerScore);

      // Layer score circle
      const circle = L.circle([region.lat, region.lng], {
        radius: 900 + layerScore * 12,
        color: color,
        fillColor: color,
        fillOpacity: 0.22,
        weight: 1.25,
        interactive: false,
      }).addTo(map);
      circlesRef.current.push(circle);

      // Custom DivIcon marker with official score badge
      const icon = L.divIcon({
        className: 'landmap-custom-marker',
        html: `
          <div style="
            width: 32px;
            height: 32px;
            border-radius: 9999px;
            background-color: ${scoreToFillColor(region.score)};
            border: 2.5px solid #ffffff;
            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.35);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #ffffff;
            font-size: 11px;
            font-weight: 700;
            font-family: system-ui, -apple-system, sans-serif;
            cursor: pointer;
            transition: transform 0.15s ease;
          " onmouseover="this.style.transform='scale(1.15)'" onmouseout="this.style.transform='scale(1)'">
            ${region.score}
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([region.lat, region.lng], { icon, title: `${region.name} · Score ${region.score}` }).addTo(map);
      marker.on('click', () => {
        setSelected(region);
        map.flyTo([region.lat, region.lng], 14, { duration: 0.8 });
      });
      markersRef.current.push(marker);
    });
  }, [ready, activeLayer, regions]);

  // Update Heatmap Concentric Rings
  useEffect(() => {
    const L = leafletModuleRef.current;
    if (!ready || !mapRef.current || !L) return;
    const map = mapRef.current;

    heatmapRef.current.forEach((c) => c.remove());
    heatmapRef.current = [];

    if (!heatmapOn) return;

    const rings: LeafletType.Circle[] = [];
    regions.forEach((r) => {
      const weight = r.layerScores[activeLayer] / 100;
      const color = scoreToFillColor(r.layerScores[activeLayer]);
      [2600, 1800, 1100].forEach((radius, i) => {
        const ring = L.circle([r.lat, r.lng], {
          radius,
          stroke: false,
          fillColor: color,
          fillOpacity: 0.08 + weight * 0.12 * (1 - i * 0.25),
          interactive: false,
        }).addTo(map);
        rings.push(ring);
      });
    });
    heatmapRef.current = rings;
  }, [ready, heatmapOn, activeLayer, regions]);

  function focusRegion(r: RegionInsight) {
    setSelected(r);
    setSearch('');
    if (mapRef.current) {
      mapRef.current.flyTo([r.lat, r.lng], 14, { duration: 0.8 });
    }
  }

  function zoom(delta: number) {
    if (!mapRef.current) return;
    mapRef.current.setZoom(mapRef.current.getZoom() + delta);
  }

  const now = new Date();
  const timeLabel = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  return (
    <div
      className="relative h-[calc(100dvh-4rem-3.5rem)] md:h-[calc(100dvh-4rem)] w-full overflow-hidden bg-[#f8fafc] landmap-tiles"
      data-map-mode={mapMode}
    >
      {/* Container Leaflet */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full z-0 outline-none" />

      {/* Watermark LandMap */}
      <div className="pointer-events-none absolute bottom-3 left-3 z-10 md:bottom-4 md:left-4">
        <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-border/40 bg-white/90 px-3 py-1.5 shadow-md backdrop-blur">
          <span className="h-2 w-2 rounded-full bg-[var(--primary)]" />
          <span className="font-display text-xs font-bold tracking-tight text-[var(--primary)]">
            LandMap
          </span>
        </div>
      </div>

      {!ready && !error && (
        <div className="pointer-events-none absolute inset-0 z-20 grid place-items-center bg-white/50 backdrop-blur-sm">
          <div className="flex items-center gap-2.5 rounded-full bg-white/95 px-5 py-2.5 text-sm font-medium text-foreground/80 shadow-lg backdrop-blur">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            Carregando inteligência territorial…
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 z-20 grid place-items-center p-6 bg-white/70">
          <div className="max-w-sm rounded-2xl border border-destructive/20 bg-white p-5 text-sm shadow-xl">
            <p className="font-semibold text-destructive">Falha ao carregar o mapa</p>
            <p className="mt-1 text-foreground/70">{error}</p>
          </div>
        </div>
      )}

      {/* TOP INDICATOR TICKER — Bloomberg-style */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 px-3 pt-3 md:px-6 md:pt-4">
        <div className="pointer-events-auto mx-auto grid max-w-[1400px] grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-5">
          <TickerCard
            icon={<TrendingUp className="h-3.5 w-3.5" />}
            label="Valorização média"
            value={`R$ ${Math.round(indicators.avgPrice).toLocaleString('pt-BR')}/m²`}
            delta={`↑ ${indicators.avgDelta.toFixed(1)}%`}
            deltaPositive
          />
          <TickerCard
            icon={<Flame className="h-3.5 w-3.5" />}
            label="Região mais aquecida"
            value={indicators.hottest.name}
            hint={`${indicators.hottest.city} · +${indicators.hottest.priceSqmDelta12m.toFixed(1)}%`}
            accent
          />
          <TickerCard
            icon={<Gem className="h-3.5 w-3.5" />}
            label="Melhor oportunidade"
            value={indicators.bestOpp.name}
            hint={`Score ${indicators.bestOpp.score}`}
          />
          <TickerCard
            icon={<Activity className="h-3.5 w-3.5" />}
            label="Índice LandMap"
            value={String(indicators.indexLandmap)}
            hint={scoreLabel(indicators.indexLandmap)}
            large
          />
          <TickerCard
            icon={<Satellite className="h-3.5 w-3.5" />}
            label="Atualização"
            value={timeLabel}
            hint="Hoje · tempo real"
          />
        </div>

        {/* Search + layers controls */}
        <div className="pointer-events-auto mx-auto mt-2.5 flex max-w-[1400px] items-start justify-between gap-3">
          <div className="relative w-full max-w-md">
            <div className="flex items-center gap-2 rounded-full border border-border/60 bg-white/95 pl-4 pr-3 py-2 shadow-md backdrop-blur">
              <Search className="h-4 w-4 text-foreground/50 shrink-0" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar bairro, cidade, CEP ou zoneamento…"
                className="w-full bg-transparent text-xs sm:text-sm outline-none placeholder:text-foreground/45"
              />
            </div>
            {searchResults.length > 0 && (
              <div className="absolute inset-x-0 top-full mt-2 overflow-hidden rounded-2xl border border-border/50 bg-white/98 shadow-xl animate-in fade-in z-30">
                {searchResults.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => focusRegion(r)}
                    className="flex w-full items-center gap-3 border-b border-border/40 px-4 py-2.5 text-left last:border-0 hover:bg-muted/60 transition"
                  >
                    <MapPin className="h-4 w-4 text-primary shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{r.name}</p>
                      <p className="truncate text-xs text-foreground/50">
                        {r.city} · {r.state} · {r.zoning}
                      </p>
                    </div>
                    <ScoreBadge score={r.score} />
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setLayersOpen((v) => !v)}
            className={`flex items-center gap-2 rounded-full border border-border/60 px-4 py-2 text-xs font-semibold shadow-md backdrop-blur transition ${
              layersOpen ? 'bg-primary text-primary-foreground border-primary' : 'bg-white/95 text-foreground hover:bg-white'
            }`}
          >
            <LayersIcon className="h-4 w-4" />
            Camadas
          </button>
        </div>
      </div>

      {/* LAYERS PANEL */}
      {layersOpen && (
        <div className="absolute right-3 top-[calc(1rem+110px)] z-20 w-[290px] sm:w-[320px] rounded-2xl border border-border/50 bg-white/98 p-4 shadow-2xl backdrop-blur animate-in fade-in zoom-in-95 md:right-6">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-display text-sm font-semibold">Camadas de inteligência</p>
            <button
              type="button"
              onClick={() => setLayersOpen(false)}
              className="grid h-6 w-6 place-items-center rounded-full text-foreground/50 hover:bg-muted"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="mb-3 flex items-center justify-between rounded-xl bg-muted/60 px-3 py-2">
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-[#dc2626]" />
              <span className="text-sm font-medium">Heatmap</span>
            </div>
            <ToggleSwitch checked={heatmapOn} onChange={setHeatmapOn} />
          </div>

          <div className="space-y-1">
            {LAYERS.map((layer) => {
              const active = activeLayer === layer.id;
              return (
                <button
                  key={layer.id}
                  type="button"
                  onClick={() => setActiveLayer(layer.id)}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-medium transition ${
                    active ? 'bg-primary text-primary-foreground' : 'text-foreground/75 hover:bg-muted'
                  }`}
                >
                  <span>{layer.label}</span>
                  {active && <Sparkles className="h-3.5 w-3.5" />}
                </button>
              );
            })}
          </div>

          <div className="mt-4 rounded-xl bg-muted/40 p-3">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-foreground/50">
              Escala do heatmap
            </p>
            <div className="h-2 w-full rounded-full bg-gradient-to-r from-destructive via-amber-500 to-primary" />
            <div className="mt-1 flex justify-between text-[10px] text-foreground/50">
              <span>Crítico</span>
              <span>Médio</span>
              <span>Excepcional</span>
            </div>
          </div>
        </div>
      )}

      {/* BOTTOM RANKINGS */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 px-3 pb-3 md:px-6 md:pb-6">
        <div className="pointer-events-auto mx-auto grid max-w-[1400px] gap-3 md:grid-cols-2 lg:grid-cols-3">
          <RankCard
            title="Top valorização (12m)"
            icon={<TrendingUp className="h-3.5 w-3.5" />}
            items={rankings.topDelta.map((r) => ({
              id: r.id,
              name: r.name,
              hint: r.city,
              value: `+${r.priceSqmDelta12m.toFixed(1)}%`,
              tone: 'positive' as const,
              onClick: () => focusRegion(r),
            }))}
          />
          <RankCard
            title="Top oportunidades"
            icon={<Award className="h-3.5 w-3.5" />}
            items={rankings.topScore.map((r) => ({
              id: r.id,
              name: r.name,
              hint: `${r.city} · ${r.zoning}`,
              value: String(r.score),
              tone: 'neutral' as const,
              onClick: () => focusRegion(r),
            }))}
          />
          <div className="hidden lg:block">
            <MiniPanel
              title="Fluxo do índice"
              subtitle="Últimos 7 anos"
              icon={<BarChart3 className="h-3.5 w-3.5" />}
            >
              <TrendSparkline
                data={regions[0].priceHistory.map((p) => p.value)}
                labels={regions[0].priceHistory.map((p) => String(p.year))}
              />
            </MiniPanel>
          </div>
        </div>
      </div>

      {/* Map Controls: Base layer toggle (Mapa / Satélite 1:1 Lovable) + Zoom */}
      <div className="absolute right-3 bottom-[calc(1rem+160px)] z-10 flex flex-col items-end gap-2 md:right-6 md:bottom-6">
        {/* Toggle Verde / Mapa / Satélite */}
        <div className="flex items-center gap-0.5 rounded-2xl border border-border/60 bg-white/95 p-1 shadow-md backdrop-blur">
          <button
            type="button"
            onClick={() => setMapMode('green')}
            aria-pressed={mapMode === 'green'}
            title="Mapa verde — OpenStreetMap (mundo completo, dados abertos)"
            className={`rounded-xl px-2.5 py-1 text-[11px] font-semibold transition ${
              mapMode === 'green'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-foreground/60 hover:bg-muted'
            }`}
          >
            Verde
          </button>
          <button
            type="button"
            onClick={() => setMapMode('roadmap')}
            aria-pressed={mapMode === 'roadmap'}
            className={`rounded-xl px-2.5 py-1 text-[11px] font-semibold transition ${
              mapMode === 'roadmap'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-foreground/60 hover:bg-muted'
            }`}
          >
            Mapa
          </button>
          <button
            type="button"
            onClick={() => setMapMode('satellite')}
            aria-pressed={mapMode === 'satellite'}
            className={`rounded-xl px-2.5 py-1 text-[11px] font-semibold transition ${
              mapMode === 'satellite'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-foreground/60 hover:bg-muted'
            }`}
          >
            Satélite
          </button>
        </div>

        {/* Zoom controls */}
        <div className="flex flex-col overflow-hidden rounded-xl border border-border/50 bg-white/95 shadow-md backdrop-blur">
          <button
            type="button"
            onClick={() => zoom(1)}
            className="grid h-9 w-9 place-items-center border-b border-border/50 text-foreground/70 hover:bg-muted hover:text-foreground transition"
            aria-label="Aproximar"
          >
            <Plus className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => zoom(-1)}
            className="grid h-9 w-9 place-items-center text-foreground/70 hover:bg-muted hover:text-foreground transition"
            aria-label="Afastar"
          >
            <MinusIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* REGION DETAIL PANEL */}
      {selected && (
        <RegionDetail
          region={selected}
          locale={locale}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

/* ------------------------- SUBCOMPONENTS ------------------------- */

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
        checked ? 'bg-primary' : 'bg-muted-foreground/30'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
          checked ? 'translate-x-4' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

function TickerCard({
  icon,
  label,
  value,
  delta,
  deltaPositive,
  hint,
  accent,
  large,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  delta?: string;
  deltaPositive?: boolean;
  hint?: string;
  accent?: boolean;
  large?: boolean;
}) {
  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border border-border/50 bg-white/95 px-3.5 py-2.5 shadow-sm backdrop-blur transition hover:border-primary/25 hover:shadow-md ${
        accent ? 'ring-1 ring-primary/15' : ''
      }`}
    >
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/45">
        <span className="grid h-5 w-5 place-items-center rounded-md bg-primary/8 text-primary shrink-0">
          {icon}
        </span>
        <span className="truncate">{label}</span>
      </div>
      <p
        className={`mt-1 font-display font-bold tabular-nums leading-tight truncate ${
          large ? 'text-xl sm:text-2xl' : 'text-base sm:text-lg'
        }`}
      >
        {value}
      </p>
      {(delta || hint) && (
        <p className="mt-0.5 flex items-center gap-1.5 text-[11px] font-medium truncate">
          {delta && (
            <span className={`font-semibold ${deltaPositive ? 'text-primary' : 'text-destructive'}`}>
              {delta}
            </span>
          )}
          {hint && <span className="text-foreground/50 truncate">{hint}</span>}
        </p>
      )}
    </div>
  );
}

function RankCard({
  title,
  icon,
  items,
}: {
  title: string;
  icon: React.ReactNode;
  items: Array<{
    id: string;
    name: string;
    hint: string;
    value: string;
    tone: 'positive' | 'neutral';
    onClick: () => void;
  }>;
}) {
  return (
    <div className="rounded-2xl border border-border/50 bg-white/95 p-3.5 shadow-sm backdrop-blur">
      <div className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/45">
        <span className="grid h-5 w-5 place-items-center rounded-md bg-primary/8 text-primary">
          {icon}
        </span>
        {title}
      </div>
      <ul className="divide-y divide-border/50">
        {items.map((item, i) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={item.onClick}
              className="flex w-full items-center gap-2.5 py-1.5 text-left transition hover:opacity-80"
            >
              <span className="w-4 shrink-0 text-[11px] font-semibold text-foreground/40 tabular-nums">
                {i + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-semibold text-foreground">
                  {item.name}
                </span>
                <span className="block truncate text-[10px] text-foreground/45">
                  {item.hint}
                </span>
              </span>
              <span
                className={`shrink-0 text-xs font-bold tabular-nums ${
                  item.tone === 'positive' ? 'text-primary' : 'text-foreground'
                }`}
              >
                {item.value}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function MiniPanel({
  title,
  subtitle,
  icon,
  children,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border/50 bg-white/95 p-3.5 shadow-sm backdrop-blur">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/45">
          <span className="grid h-5 w-5 place-items-center rounded-md bg-primary/8 text-primary">
            {icon}
          </span>
          {title}
        </div>
        <span className="text-[10px] text-foreground/45">{subtitle}</span>
      </div>
      {children}
    </div>
  );
}

function TrendSparkline({ data, labels }: { data: number[]; labels: string[] }) {
  const w = 260;
  const h = 64;
  const pad = 4;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => {
    const x = pad + (i * (w - pad * 2)) / (data.length - 1);
    const y = h - pad - ((v - min) / range) * (h - pad * 2);
    return [x, y] as const;
  });
  const path = points
    .map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`)
    .join(' ');
  const area = `${path} L${(w - pad).toFixed(1)},${(h - pad).toFixed(1)} L${pad},${(h - pad).toFixed(1)} Z`;

  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} className="h-16 w-full">
        <defs>
          <linearGradient id="lm-spark-gradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#003594" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#003594" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#lm-spark-gradient)" />
        <path
          d={path}
          fill="none"
          stroke="#003594"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div className="mt-0.5 flex justify-between text-[9px] text-foreground/45">
        {labels.map((l) => (
          <span key={l}>{l}</span>
        ))}
      </div>
    </div>
  );
}

function ScoreBadge({ score }: { score: number }) {
  return (
    <div
      className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-[10px] font-bold text-white shadow-sm"
      style={{ backgroundColor: scoreToFillColor(score) }}
    >
      {score}
    </div>
  );
}

function RegionDetail({
  region,
  locale,
  onClose,
}: {
  region: RegionInsight;
  locale: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [favorited, setFavorited] = useState(false);

  useEffect(() => {
    setFavorited(isFavorite(region.id));
  }, [region.id]);

  const toggleFav = () => {
    if (favorited) {
      removeFavorite(region.id);
      setFavorited(false);
    } else {
      addFavorite({
        id: region.id,
        address: `${region.name}, ${region.city}`,
        totalPrice: region.priceSqm * 250,
        pricePerSqm: region.priceSqm,
        regionName: region.name,
        confidence: region.score,
      });
      setFavorited(true);
    }
  };

  const trend = region.priceSqmDelta12m;
  const TrendIcon = trend > 1 ? TrendingUp : trend < -1 ? TrendingDown : Minus;
  const trendColor =
    trend > 1 ? 'text-primary' : trend < -1 ? 'text-destructive' : 'text-foreground/60';

  const priceMax = Math.max(...region.priceHistory.map((p) => p.value));
  const priceMin = Math.min(...region.priceHistory.map((p) => p.value));

  return (
    <div className="pointer-events-auto absolute inset-x-0 bottom-0 z-30 max-h-[85%] overflow-y-auto rounded-t-3xl border-t border-border/60 bg-white shadow-2xl animate-in slide-in-from-bottom duration-300 md:inset-y-0 md:right-0 md:left-auto md:max-h-none md:w-[440px] md:rounded-none md:rounded-l-3xl md:border-l md:border-t-0">
      <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-border/50 bg-white/95 px-5 pb-3 pt-5 backdrop-blur">
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wider text-foreground/50">
            <MapPin className="h-3 w-3 text-primary" /> {region.city} · {region.state}
          </p>
          <h2 className="mt-0.5 truncate font-display text-2xl font-bold tracking-tight text-foreground">
            {region.name}
          </h2>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={toggleFav}
            className={`grid h-8 w-8 place-items-center rounded-full transition ${
              favorited ? 'text-[#eab308] bg-[#eab308]/10' : 'text-foreground/50 hover:bg-muted'
            }`}
            aria-label="Salvar aos favoritos"
          >
            <Star className="h-4 w-4" fill={favorited ? 'currentColor' : 'none'} />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full text-foreground/50 hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="space-y-4 px-5 py-4">
        {/* Score hero */}
        <div className="flex items-center gap-4 rounded-2xl bg-gradient-to-br from-primary/6 via-primary/[0.02] to-transparent p-4 ring-1 ring-primary/10">
          <div
            className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl text-white shadow-md"
            style={{ backgroundColor: scoreToFillColor(region.score) }}
          >
            <span className="font-display text-2xl font-black leading-none">
              {region.score}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-foreground/50">
              Score LandMap
            </p>
            <p className="font-display text-lg font-bold">{scoreLabel(region.score)}</p>
            <p className="mt-0.5 text-xs text-foreground/60">
              Índice composto de valorização, infra e crescimento.
            </p>
          </div>
        </div>

        {/* Rankings row */}
        <div className="grid grid-cols-2 gap-2">
          <PillMetric label="Ranking estadual" value={`#${Math.max(1, Math.round(100 - region.score) + 1)}`} />
          <PillMetric label="Ranking nacional" value={`#${Math.max(1, Math.round((100 - region.score) * 4))}`} />
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <Metric
            label="Preço médio m²"
            value={`R$ ${region.priceSqm.toLocaleString('pt-BR')}`}
            trailing={
              <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${trendColor}`}>
                <TrendIcon className="h-3 w-3" />
                {trend > 0 ? '+' : ''}
                {trend.toFixed(1)}%
              </span>
            }
          />
          <Metric label="Liquidez" value={region.liquidity} capitalize />
          <Metric label="População" value={region.population.toLocaleString('pt-BR')} />
          <Metric label="Renda média" value={`R$ ${region.incomeAvg.toLocaleString('pt-BR')}`} />
          <Metric label="IDH" value={region.hdi.toFixed(3)} />
          <Metric label="PIB (cresc.)" value={`${region.gdpGrowth > 0 ? '+' : ''}${region.gdpGrowth.toFixed(1)}%`} />
        </div>

        {/* Price chart */}
        <section className="rounded-2xl border border-border/60 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-display text-sm font-semibold">Histórico do m²</p>
            <span className="text-[11px] text-foreground/50">2019 – 2025</span>
          </div>
          <PriceChart data={region.priceHistory} max={priceMax} min={priceMin} />
        </section>

        {/* Layer breakdown */}
        <section className="rounded-2xl border border-border/60 bg-white p-4">
          <p className="mb-3 font-display text-sm font-semibold">Composição por camada</p>
          <div className="space-y-2">
            {LAYERS.map((l) => {
              const v = region.layerScores[l.id];
              return (
                <div key={l.id} className="flex items-center gap-3">
                  <span className="w-36 shrink-0 truncate text-xs text-foreground/70">
                    {l.label}
                  </span>
                  <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="absolute inset-y-0 left-0 rounded-full transition-all"
                      style={{ width: `${v}%`, backgroundColor: scoreToFillColor(v) }}
                    />
                  </div>
                  <span className="w-8 text-right text-xs font-semibold tabular-nums">
                    {v}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        <section className="grid grid-cols-3 gap-2">
          <PillMetric label="Zoneamento" value={region.zoning} />
          <PillMetric label="Risco ambiental" value={region.environmentalRisk} capitalize />
          <PillMetric label="Risco enchente" value={region.floodRisk} capitalize />
        </section>

        {region.timeline.length > 0 && (
          <section className="rounded-2xl border border-border/60 bg-white p-4">
            <p className="mb-3 font-display text-sm font-semibold">Linha do tempo</p>
            <ol className="relative space-y-3 border-l border-border/60 pl-4">
              {region.timeline.map((ev, i) => (
                <li key={i} className="relative">
                  <span className="absolute -left-[21px] top-1 grid h-3 w-3 place-items-center rounded-full bg-primary ring-4 ring-primary/10" />
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                    {ev.year}
                  </p>
                  <p className="text-xs text-foreground/80">{ev.title}</p>
                </li>
              ))}
            </ol>
          </section>
        )}

        <section>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-foreground/50">
            Destaques
          </p>
          <ul className="space-y-1.5">
            {region.highlights.map((h, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-foreground/80">
                <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                {h}
              </li>
            ))}
          </ul>
        </section>

        <div className="flex flex-wrap gap-2 pt-2 pb-6">
          <button
            type="button"
            onClick={toggleFav}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition"
          >
            <Star className="h-3.5 w-3.5" fill={favorited ? 'currentColor' : 'none'} />
            {favorited ? 'Salvo' : 'Salvar'}
          </button>
          <button
            type="button"
            onClick={() => router.push(`/${locale}/compare?a=${region.id}`)}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-border/80 bg-white px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-muted transition"
          >
            <GitCompare className="h-3.5 w-3.5 text-primary" />
            Comparar
          </button>
          <button
            type="button"
            onClick={() => router.push(`/${locale}/reports`)}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-border/80 bg-white px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-muted transition"
          >
            <FileBarChart className="h-3.5 w-3.5 text-primary" />
            Relatório
          </button>
        </div>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  trailing,
  capitalize,
}: {
  label: string;
  value: string;
  trailing?: React.ReactNode;
  capitalize?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-white p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/50">
        {label}
      </p>
      <div className="mt-1 flex items-baseline justify-between gap-2">
        <p className={`font-display text-sm sm:text-base font-bold tabular-nums ${capitalize ? 'capitalize' : ''}`}>
          {value}
        </p>
        {trailing}
      </div>
    </div>
  );
}

function PillMetric({
  label,
  value,
  capitalize,
}: {
  label: string;
  value: string;
  capitalize?: boolean;
}) {
  return (
    <div className="rounded-xl bg-muted/60 p-2.5 text-center">
      <p className="text-[9px] font-semibold uppercase tracking-wider text-foreground/50">
        {label}
      </p>
      <p className={`mt-0.5 text-xs font-semibold text-foreground/85 ${capitalize ? 'capitalize' : ''}`}>
        {value}
      </p>
    </div>
  );
}

function PriceChart({
  data,
  max,
  min,
}: {
  data: { year: number; value: number }[];
  max: number;
  min: number;
}) {
  const w = 320;
  const h = 90;
  const pad = 8;
  const range = max - min || 1;
  const points = data.map((d, i) => {
    const x = pad + (i * (w - pad * 2)) / (data.length - 1);
    const y = h - pad - ((d.value - min) / range) * (h - pad * 2);
    return [x, y] as const;
  });
  const path = points
    .map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`)
    .join(' ');
  const area = `${path} L${(w - pad).toFixed(1)},${(h - pad).toFixed(1)} L${pad},${(h - pad).toFixed(1)} Z`;

  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} className="h-20 w-full">
        <defs>
          <linearGradient id="lm-gradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#003594" stopOpacity="0.30" />
            <stop offset="100%" stopColor="#003594" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#lm-gradient)" />
        <path
          d={path}
          fill="none"
          stroke="#003594"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {points.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={2.5} fill="#003594" />
        ))}
      </svg>
      <div className="mt-1 flex justify-between text-[10px] text-foreground/50">
        {data.map((d) => (
          <span key={d.year}>{d.year}</span>
        ))}
      </div>
    </div>
  );
}
