'use client';

/**
 * Mapa — paridade literal Lovable Map Intelligence
 * (layout flutuante, 8 camadas, heat scale, tops, painel de região).
 * Lovable usa Google Maps; aqui Leaflet + mesmo chrome/copy.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import 'leaflet/dist/leaflet.css';
import { RequireAuth } from '../../../components/RequireAuth';
import {
  geoAutocomplete,
  geoGeocode,
  getAuctionOpportunities,
  type AuctionOpportunity,
  type AutocompleteSuggestion,
} from '../../../lib/api';
import {
  LandMapWordmark,
  Search,
  Layers,
  TrendingUp,
  MapPin,
  X,
  ArrowLeft,
  Activity,
  LineChart,
  BellRing,
  GitCompare,
  FileText,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  MessageSquare,
} from '../../../components/lovable/icons';
import {
  Badge,
  Sparkline,
  buttonVariants,
  cn,
} from '@landmap/ui';
import {
  COPY,
  heatScaleGradient,
  INTELLIGENCE_LAYERS,
  INTELLIGENCE_REGIONS,
  MAP_CENTER,
  MAP_DEFAULT_ZOOM,
  SEARCH_PLACEHOLDER,
  filterRegions,
  fmtDelta,
  fmtPriceSqm,
  layerValue,
  scoreColor,
  scoreLabel,
  resolveVar,
  topByScore,
  topByValorization,
  type IntelligenceRegion,
  type LayerId,
} from '../../../lib/mapIntelligence';

function escapePopupText(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[char] ?? char);
}

function MapPageInner() {
  const locale = useLocale();
  const lh = (p: string) => `/${locale}${p}`;
  const reduceMotion = useReducedMotion();

  const [query, setQuery] = useState('');
  const [activeLayer, setActiveLayer] = useState<LayerId>('valorization');
  const [showHeat, setShowHeat] = useState(true);
  const [layersOpen, setLayersOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [streetViewOpen, setStreetViewOpen] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [remoteSuggestions, setRemoteSuggestions] = useState<AutocompleteSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [auctionPoints, setAuctionPoints] = useState<AuctionOpportunity[]>([]);

  /** Controle de expansão do painel de KPIs do mapa — minimizado por padrão (UX Lovable). */
  const [kpisOpen, setKpisOpen] = useState(false);

  /** Controle de expansão dos cards de ranking/flow do mapa — minimizado por padrão. */
  const [rankingsOpen, setRankingsOpen] = useState(false);
  const [currentCity, setCurrentCity] = useState('Fortaleza');
  const [detailsMinimized, setDetailsMinimized] = useState(false);

  /** Pontos de heatmap ao vivo (API /api/market/heatmap), dados do dataset real. */
  const [heatPoints, setHeatPoints] = useState<
    { lat: number; lng: number; weight: number; neighborhood: string; avgPrice: number }[]
  >([]);
  const heatDataRef = useRef<
    { lat: number; lng: number; weight: number; neighborhood: string; avgPrice: number }[]
  >([]);

  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const heatLayerRef = useRef<any>(null);
  const auctionLayerRef = useRef<any>(null);
  const selectedRef = useRef(selectedId);
  const layerRef = useRef(activeLayer);
  const heatRef = useRef(showHeat);
  selectedRef.current = selectedId;
  layerRef.current = activeLayer;
  heatRef.current = showHeat;

  const localSuggestions = useMemo(() => filterRegions(query).slice(0, 8), [query]);
  const suggestions = useMemo(() => {
    const seen = new Set<string>();
    const merged: Array<(typeof localSuggestions)[number] | AutocompleteSuggestion> = [];
    for (const item of [...remoteSuggestions, ...localSuggestions]) {
      const key = 'label' in item ? item.label : item.id;
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(item);
    }
    return merged.slice(0, 8);
  }, [localSuggestions, remoteSuggestions]);
  const selected = useMemo(
    () => INTELLIGENCE_REGIONS.find((r) => r.id === selectedId) ?? null,
    [selectedId],
  );
  const topVal = useMemo(() => topByValorization(5), []);
  const topOpp = useMemo(() => topByScore(5), []);
  const avgVal = useMemo(() => {
    if (!topVal.length) return 0;
    return topVal.reduce((acc, r) => acc + r.priceSqmDelta12m, 0) / topVal.length;
  }, [topVal]);
  const bestOpp = topOpp[0] ?? null;

  const selectRegion = useCallback((r: IntelligenceRegion) => {
    setSelectedId(r.id);
    setQuery(r.name);
    setSuggestOpen(false);
    if (r.city) {
      setCurrentCity(r.city);
    }
    const map = mapInstance.current;
    if (map) map.flyTo([r.lat, r.lng], 14, { duration: 0.55 });
  }, []);

  const selectAutocomplete = useCallback(
    async (item: (typeof suggestions)[number]) => {
      const label = 'label' in item ? item.label : item.name;
      setQuery(label);
      setSuggestOpen(false);
      if ('label' in item) {
        if (item.city) {
          setCurrentCity(item.city);
        } else if (item.type === 'city') {
          setCurrentCity(item.label.split(',')[0].trim());
        }
        const map = mapInstance.current;
        if (map) {
          try {
            const res = await geoGeocode(label);
            const first = res.features[0];
            if (first && first.bbox) {
              map.fitBounds([
                [first.bbox[1], first.bbox[0]],
                [first.bbox[3], first.bbox[2]]
              ], { duration: 0.55 });
              return;
            }
          } catch {
            /* ignore & fallback */
          }
          map.flyTo([item.lat, item.lng], 14, { duration: 0.55 });
        }
        return;
      }

      try {
        const res = await geoGeocode(label);
        const first = res.features[0];
        if (!first) return;
        if (first.city) {
          setCurrentCity(first.city);
        }
        const map = mapInstance.current;
        if (map) {
          if (first.bbox) {
            map.fitBounds([
              [first.bbox[1], first.bbox[0]],
              [first.bbox[3], first.bbox[2]]
            ], { duration: 0.55 });
          } else {
            map.flyTo([first.lat, first.lng], 14, { duration: 0.55 });
          }
        }
      } catch {
        /* ignore */
      }
    },
    [],
  );

  const paintMarkers = useCallback(() => {
    const map = mapInstance.current;
    const L = (window as any).L;
    if (!map || !L) return;

    markersRef.current.forEach((m) => map.removeLayer(m));
    markersRef.current = [];

    const layer = layerRef.current;
    const heat = heatRef.current;
    const group = L.layerGroup();

    for (const r of INTELLIGENCE_REGIONS) {
      const w = layerValue(r, layer);
      const color = scoreColor(w);
      const isSel = r.id === selectedRef.current;
      const radius = heat ? 10 + (w / 100) * 16 : isSel ? 12 : 9;
      const marker = L.circleMarker([r.lat, r.lng], {
        radius,
        fillColor: color,
        color: isSel ? '#ffffff' : '#ffffff',
        weight: isSel ? 3 : 2,
        fillOpacity: heat ? 0.35 + (w / 100) * 0.45 : 0.92,
        opacity: 1,
      });
      marker.bindPopup(
        `<strong>${r.name}</strong><br/>${COPY.score}: <b>${r.score}</b> · ${scoreLabel(r.score)}<br/>${fmtPriceSqm(r.priceSqm)}/m² · ${fmtDelta(r.priceSqmDelta12m)}`,
      );
      marker.on('click', (e: { originalEvent?: { stopPropagation?: () => void } }) => {
        e.originalEvent?.stopPropagation?.();
        setSelectedId(r.id);
      });
      group.addLayer(marker);
    }
    group.addTo(map);
    markersRef.current = [group];
  }, []);

  const onResize = useCallback(() => {
    const map = mapInstance.current;
    if (!map) return;
    if ((window as any).__mapResizeRAF) cancelAnimationFrame((window as any).__mapResizeRAF);
    (window as any).__mapResizeRAF = requestAnimationFrame(() => {
      try {
        map.invalidateSize({ animate: false });
      } catch {
        /* ignore */
      }
    });
  }, []);

  useEffect(() => {
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    const t = setTimeout(onResize, 250);
    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
    };
  }, [onResize]);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;
    let cancelled = false;

    (async () => {
      try {
        if (cancelled || !mapRef.current || mapInstance.current) return;
        const leafletMod = await import('leaflet');
        const L = (leafletMod as any).default ?? leafletMod;
        const map = L.map(mapRef.current, {
          center: MAP_CENTER,
          zoom: MAP_DEFAULT_ZOOM,
          zoomControl: false,
          preferCanvas: true,
          attributionControl: true,
        });
        L.control.zoom({ position: 'bottomright' }).addTo(map);
        // Basemap Lovable-style: CartoDB dark_all (clean neutral-dark, no API key).
        // Matches the dark indigo brand chrome. No beige OSM tiles, no biocolor palette.
        const baseUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
        L.tileLayer(baseUrl, {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: 'abcd',
          maxZoom: 19,
        }).addTo(map);
        mapInstance.current = map;
        setMapReady(true);
        setTimeout(() => {
          try {
            map.invalidateSize({ animate: false });
          } catch {
            /* ignore */
          }
        }, 120);
      } catch {
        setMapError(true);
      }
    })();

    return () => {
      cancelled = true;
      window.removeEventListener('resize', onResize);
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [onResize]);

  useEffect(() => {
    if (mapReady) paintMarkers();
  }, [mapReady, paintMarkers, activeLayer, showHeat, selectedId]);

  useEffect(() => {
    let active = true;
    fetch(`/api/market/heatmap?city=${encodeURIComponent(currentCity)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!active || !data?.points?.length) return;
        heatDataRef.current = data.points;
        setHeatPoints(data.points);
      })
      .catch(() => {
        /* heatmap opcional: falha silenciosa mantém os marcadores estáticos */
      });
    return () => {
      active = false;
    };
  }, [currentCity]);

  useEffect(() => {
    let active = true;
    const refreshAuctions = () => getAuctionOpportunities({ limit: 120 })
      .then((data) => {
        if (active) setAuctionPoints(data.items);
      })
      .catch(() => {
        /* oportunidades são uma camada opcional do mapa */
      });
    refreshAuctions();
    const poll = setInterval(refreshAuctions, 10000);

    const wsUrl = process.env.NEXT_PUBLIC_AUCTIONS_WS_URL;
    if (!wsUrl || typeof WebSocket === 'undefined') {
      return () => {
        active = false;
        clearInterval(poll);
      };
    }

    let socket: WebSocket | null = null;
    let retry: ReturnType<typeof setTimeout> | undefined;
    let stopped = false;
    const connect = () => {
      if (stopped) return;
      try {
        socket = new WebSocket(wsUrl);
        socket.onmessage = (event) => {
          try {
            const payload = JSON.parse(event.data) as {
              type?: string;
              items?: AuctionOpportunity[];
              item?: AuctionOpportunity;
            };
            if (payload.type === 'snapshot' && payload.items) setAuctionPoints(payload.items);
            if (payload.type === 'auction.updated' && payload.item) {
              setAuctionPoints((current) => [
                payload.item!,
                ...current.filter((item) => item.id !== payload.item!.id),
              ].slice(0, 120));
            }
          } catch {
            /* payload inválido não deve afetar o mapa */
          }
        };
        socket.onclose = () => {
          if (!stopped) retry = setTimeout(connect, 5000);
        };
      } catch {
        retry = setTimeout(connect, 5000);
      }
    };
    connect();

    return () => {
      active = false;
      stopped = true;
      clearInterval(poll);
      if (retry) clearTimeout(retry);
      socket?.close();
    };
  }, []);

  const paintHeat = useCallback(() => {
    const map = mapInstance.current;
    const L = (window as any).L;
    if (!map || !L) return;

    if (heatLayerRef.current) {
      map.removeLayer(heatLayerRef.current);
      heatLayerRef.current = null;
    }
    if (!heatRef.current) return;

    const pts = heatDataRef.current;
    if (!pts.length) return;

    const maxW = Math.max(...pts.map((p) => p.weight), 0.0001);
    const circles = pts.map((p) => {
      const w = p.weight / maxW;
      return L.circleMarker([p.lat, p.lng], {
        radius: 26 + w * 46,
        stroke: false,
        fillColor: resolveVar('--primary', 'oklch(62% .2 265)'),
        fillOpacity: 0.1 + w * 0.22,
      }).bindPopup(
        `<strong>${p.neighborhood}</strong><br/>Preço médio: <b>${fmtPriceSqm(p.avgPrice)}/m²</b>`,
      );
    });
    const layer = L.layerGroup(circles);
    layer.addTo(map);
    heatLayerRef.current = layer;
  }, []);

  useEffect(() => {
    if (mapReady) paintHeat();
  }, [mapReady, paintHeat, heatPoints, showHeat]);

  const paintAuctions = useCallback(() => {
    const map = mapInstance.current;
    const L = (window as any).L;
    if (!map || !L) return;
    if (auctionLayerRef.current) map.removeLayer(auctionLayerRef.current);
    const markers = auctionPoints
      .filter((item) => item.latitude != null && item.longitude != null)
      .map((item) => L.circleMarker([item.latitude, item.longitude], {
        radius: 7,
        fillColor: resolveVar('--warning', 'oklch(70% .15 70)'),
        color: '#ffffff',
        weight: 2,
        fillOpacity: 0.95,
      }).bindPopup(
        `<strong>${escapePopupText(item.title)}</strong><br/>${escapePopupText(item.city)}/${item.state} · ${escapePopupText(item.type)}<br/><small>Fonte: ${escapePopupText(item.source)}</small>`,
      ));
    if (!markers.length) {
      auctionLayerRef.current = null;
      return;
    }
    auctionLayerRef.current = L.layerGroup(markers).addTo(map);
  }, [auctionPoints]);

  useEffect(() => {
    if (mapReady) paintAuctions();
  }, [mapReady, paintAuctions]);

  useEffect(() => {
    let active = true;
    const q = query.trim();
    if (!q) {
      setRemoteSuggestions([]);
      setLoadingSuggestions(false);
      return;
    }
    setLoadingSuggestions(true);
    const t = setTimeout(() => {
      geoAutocomplete(q, 6)
        .then((items) => {
          if (!active) return;
          setRemoteSuggestions(items);
        })
        .catch(() => {
          if (!active) return;
          setRemoteSuggestions([]);
        })
        .finally(() => {
          if (!active) return;
          setLoadingSuggestions(false);
        });
    }, 220);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [query]);

  const sparkData = selected?.priceHistory.map((p) => p.value) ?? [];
  const sidebarLinks = [
    {
      href: lh('/compare'),
      icon: GitCompare,
      title: 'Comparador',
      desc: 'Lado a lado com diferenças de preço e confiança',
    },
    {
      href: lh('/alerts'),
      icon: BellRing,
      title: 'Alertas',
      desc: 'Gatilhos de valorização, risco e oportunidades',
    },
    {
      href: lh('/reports'),
      icon: FileText,
      title: 'Relatórios',
      desc: 'PDFs e dossiês para decisão comercial',
    },
  ];

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-[var(--background)] text-[var(--foreground)]">
      {/* Full-bleed map — iOS-friendly rendering */}
      <motion.div
        ref={mapRef}
        role="region"
        aria-label="Mapa de inteligência territorial"
        className="landmap-tiles absolute inset-0 z-0 h-full w-full touch-manipulation font-[system-ui,sans-serif]"
        initial={reduceMotion ? undefined : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.9, ease: 'easeOut' }}
      />
      {!mapReady && !mapError && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="flex flex-col items-center gap-4">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <div className="animate-pulse">
              <LandMapWordmark />
            </div>
            <p className="text-xs text-foreground/50 font-medium">Carregando mapa de inteligência...</p>
          </div>
        </div>
      )}
      {mapError && (
        <div className="absolute inset-0 z-10 grid h-full w-full place-items-center p-6">
          <div className="text-center">
            <p className="font-medium text-destructive">{COPY.failMap}</p>
            <p className="mt-1 text-sm text-foreground/60">
              Verifique a conexão e recarregue.
            </p>
          </div>
        </div>
      )}

      {/* Top chrome */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 animate-in fade-in slide-in-from-top-4 duration-500 p-2 sm:p-4">
        <div className="pointer-events-auto mx-auto flex max-w-[1400px] flex-col gap-2 sm:gap-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 rounded-2xl border border-border/50 bg-white/95 px-2 py-1.5 shadow-sm backdrop-blur sm:px-2.5">
              <Link
                href={lh('/')}
                aria-label="Voltar"
                className="grid h-8 w-8 place-items-center rounded-full hover:bg-muted"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
              </Link>
              <div className="flex items-center gap-1.5">
                <LandMapWordmark />
                <span className="text-xs font-semibold text-foreground/80">Mapa</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="hidden items-center gap-1 rounded-full border border-[var(--success)]/30 bg-[var(--success)]/10 px-2 py-1 shadow-sm backdrop-blur md:flex">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--success)] opacity-60" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[var(--success)]" />
                </span>
                <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[var(--success)]">
                  Atualizado
                </span>
              </div>
              {auctionPoints.length > 0 && (
                <div className="hidden items-center gap-1 rounded-full border border-[var(--warning)]/40 bg-[var(--warning)]/15 px-2 py-1 shadow-sm backdrop-blur sm:flex">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--warning)]" />
                  <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[var(--foreground)]">
                    {auctionPoints.length} BR
                  </span>
                </div>
              )}
              <button
                type="button"
                onClick={() => setLayersOpen((v) => !v)}
                className={cn(
                  buttonVariants({ variant: layersOpen ? 'default' : 'outline', size: 'sm' }),
                  'h-8 min-h-8 rounded-full bg-white/95 px-2.5 shadow-sm sm:px-3',
                  !layersOpen && 'border-border/50',
                )}
              >
                <Layers className="mr-1 h-3 w-3 sm:mr-1.5 sm:h-3.5 sm:w-3.5" />
                <span className="text-[11px] sm:text-xs">Camadas</span>
              </button>
              <Link
                href={lh('/map')}
                className={cn(
                  buttonVariants({ variant: 'outline', size: 'sm' }),
                  'h-8 min-h-8 rounded-full border-border/50 bg-white/95 px-2.5 shadow-sm sm:px-3',
                )}
              >
                <span className="text-[11px] sm:text-xs">Painel</span>
              </Link>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-foreground/50">
              {COPY.layersTitle}
            </p>
            <button
              type="button"
              aria-label={kpisOpen ? 'Minimizar KPIs' : 'Expandir KPIs'}
              onClick={() => setKpisOpen((v) => !v)}
              className="inline-flex h-7 items-center gap-1 rounded-full border border-border/50 bg-white/90 px-2.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/70 shadow-sm backdrop-blur transition hover:border-primary/30 hover:text-primary"
            >
              {kpisOpen ? 'Minimizar' : 'KPIs'}
            </button>
          </div>
          {kpisOpen && (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-2 xl:grid-cols-4">
              <KpiChip label={COPY.indexLandMap} value={selected ? String(selected.score) : '92'} hint={selected ? scoreLabel(selected.score) : 'Excepcional'} />
              <KpiChip label={COPY.appreciationAvg} value={fmtDelta(avgVal)} hint="Últimos 12m" />
              <KpiChip label={COPY.liquidity} value={bestOpp ? String(bestOpp.score) : '—'} hint={bestOpp ? bestOpp.name : 'Sem dados'} />
              <KpiChip label={COPY.bestOpportunity} value={bestOpp ? bestOpp.city : '—'} hint={bestOpp ? bestOpp.zoning : 'Sem dados'} />
            </div>
          )}
          <Link
            href={lh('/kpis')}
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'h-8 rounded-full bg-white/95 px-3 text-xs shadow-sm sm:text-sm')}
          >
            KPIs completos
          </Link>

          {/* Search — Lovable placeholder */}
          <div className="relative max-w-xl">
            <div className="flex items-center gap-1.5 rounded-2xl border border-border/50 bg-white/98 px-2.5 py-2 shadow-sm backdrop-blur sm:px-3">
              <Search className="h-3.5 w-3.5 shrink-0 text-foreground/50 sm:h-4 sm:w-4" />
              <input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSuggestOpen(true);
                }}
                onFocus={() => setSuggestOpen(true)}
                onKeyDown={async (e) => {
                  if (e.key !== 'Enter') return;
                  e.preventDefault();
                  const q = query.trim();
                  if (!q) return;
                  if (suggestions[0]) {
                    await selectAutocomplete(suggestions[0]);
                    return;
                  }
                  try {
                    const res = await geoGeocode(q);
                    const first = res.features[0];
                    if (!first) return;
                    const map = mapInstance.current;
                    if (map) {
                      if (first.bbox) {
                        map.fitBounds([
                          [first.bbox[1], first.bbox[0]],
                          [first.bbox[3], first.bbox[2]]
                        ], { duration: 0.55 });
                      } else {
                        map.flyTo([first.lat, first.lng], 14, { duration: 0.55 });
                      }
                    }
                    setSuggestOpen(false);
                  } catch {
                    /* ignore */
                  }
                }}
                placeholder={SEARCH_PLACEHOLDER}
                aria-label={SEARCH_PLACEHOLDER}
                className="h-9 w-full border-0 bg-transparent px-0 text-sm shadow-none outline-none focus-visible:ring-0"
              />
              {query && (
                <button
                  type="button"
                  aria-label="Limpar"
                  onClick={() => {
                    setQuery('');
                    setSuggestOpen(false);
                  }}
                  className="grid h-7 w-7 place-items-center rounded-full text-foreground/50 hover:bg-muted"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            {suggestOpen && query.trim() && suggestions.length > 0 && (
              <div className="absolute inset-x-0 top-full z-30 mt-1.5 overflow-hidden rounded-2xl border border-border/50 bg-white/98 shadow-lg animate-in fade-in motion-reduce:animate-none">
                {suggestions.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => {
                      if ('name' in r && 'score' in r) {
                        selectRegion(r);
                        return;
                      }
                      void selectAutocomplete(r);
                    }}
                    className="flex w-full items-center justify-between px-3 py-2.5 text-left text-sm transition hover:bg-muted"
                  >
                    <span className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-primary" />
                      <span>
                        <span className="font-medium">{'name' in r ? r.name : r.label}</span>
                        <span className="text-foreground/50">
                          {'city' in r && r.city ? ` · ${r.city}` : ''}
                        </span>
                      </span>
                    </span>
                    <span className="tabular-nums text-xs text-foreground/50">
                      {'priceSqmDelta12m' in r ? fmtDelta(r.priceSqmDelta12m) : 'Buscar'}
                    </span>
                  </button>
                ))}
                {loadingSuggestions && (
                  <div className="px-3 py-2 text-xs text-foreground/50">Buscando sugestões…</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Layers panel — Lovable floating card */}
      {layersOpen && (
        <div className="pointer-events-none absolute bottom-auto left-2 top-[7.5rem] z-20 animate-in fade-in zoom-in-95 duration-300 flex w-[min(100%-1rem,18rem)] flex-col gap-2 sm:left-4 sm:top-[8rem] sm:w-[min(100%-2rem,22rem)]">
          <div className="pointer-events-auto max-h-[calc(100dvh-16rem)] overflow-y-auto rounded-2xl border border-border/50 bg-white/98 p-3 shadow-lg backdrop-blur sm:p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="font-display text-sm font-semibold">{COPY.layersTitle}</p>
              <button
                type="button"
                onClick={() => setLayersOpen(false)}
                className="grid h-6 w-6 place-items-center rounded-full text-foreground/50 hover:bg-muted"
                aria-label="Fechar camadas"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="mb-2 flex items-center justify-between rounded-xl bg-muted/60 px-2.5 py-2 sm:px-3">
              <div className="flex items-center gap-2">
                <Activity className="h-3.5 w-3.5 text-primary" />
                <span className="text-sm font-medium">{COPY.heat}</span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={showHeat}
                onClick={() => setShowHeat((v) => !v)}
                className={cn(
                  'relative h-6 w-11 rounded-full transition motion-reduce:transition-none',
                  showHeat ? 'bg-primary' : 'bg-muted-foreground/30',
                )}
              >
                <span
                  className={cn(
                    'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition',
                    showHeat ? 'left-5' : 'left-0.5',
                  )}
                />
              </button>
            </div>

            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/50">
              {COPY.heatScale}
            </p>
            <div
              className="h-2 w-full rounded-full"
              style={{ background: heatScaleGradient() }}
              aria-hidden
            />
            <div className="mt-1 flex justify-between text-[10px] text-foreground/50">
              <span>{COPY.critical}</span>
              <span>{COPY.medium}</span>
              <span>{COPY.exceptional}</span>
            </div>

            <div className="mt-3 space-y-1">
              {INTELLIGENCE_LAYERS.map((layer) => (
                <button
                  key={layer.id}
                  type="button"
                  onClick={() => setActiveLayer(layer.id)}
                  className={cn(
                    'flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-left text-sm transition sm:px-3 sm:py-2.5',
                    activeLayer === layer.id
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted text-foreground/80',
                  )}
                >
                  {layer.label}
                  {activeLayer === layer.id && (
                    <span className="text-[10px] opacity-80">ativa</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="pointer-events-auto rounded-2xl border border-border/50 bg-white/98 p-3 shadow-lg backdrop-blur sm:p-4">
            <div className="mb-2 flex items-center justify-between">
              <div>
                <p className="font-display text-sm font-semibold">Fluxos</p>
                <p className="text-[10px] text-foreground/50">Acesso rápido</p>
              </div>
              <span className="rounded-full border border-border/60 bg-muted/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground/60">
                Hub
              </span>
            </div>
            <div className="space-y-2">
              {sidebarLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-start gap-2.5 rounded-xl border border-border/50 bg-background/70 p-2.5 transition hover:border-primary/30 hover:bg-primary/5 sm:gap-3 sm:p-3"
                  >
                    <span className="mt-0.5 grid h-7 w-7 place-items-center rounded-full bg-primary/10 text-primary sm:h-8 sm:w-8">
                      <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-foreground">{item.title}</span>
                      <span className="mt-0.5 block text-[11px] leading-snug text-foreground/55 sm:text-xs">
                        {item.desc}
                      </span>
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Bottom ranking cards */}
      {rankingsOpen && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 animate-in fade-in zoom-in-95 duration-300 p-2 sm:p-4">
          <div className="pointer-events-auto flex snap-x snap-mandatory gap-2 overflow-x-auto pb-[max(0.25rem,env(safe-area-inset-bottom))] md:mx-auto md:max-w-[1400px] md:grid md:grid-cols-2 md:overflow-visible md:pb-0 lg:grid-cols-3">
            <div className="w-[82vw] max-w-xs shrink-0 snap-start sm:w-72 md:w-auto md:max-w-none md:shrink">
              <RankCard
                title={COPY.topValorization}
                icon={<TrendingUp className="h-3 w-3" />}
                items={topVal.map((r) => ({
                  id: r.id,
                  name: r.name,
                  hint: r.city,
                  value: fmtDelta(r.priceSqmDelta12m),
                  positive: r.priceSqmDelta12m >= 0,
                }))}
                onSelect={(id) => {
                  const r = INTELLIGENCE_REGIONS.find((x) => x.id === id);
                  if (r) selectRegion(r);
                }}
              />
            </div>
            <div className="w-[82vw] max-w-xs shrink-0 snap-start sm:w-72 md:w-auto md:max-w-none md:shrink">
              <RankCard
                title={COPY.topOpportunities}
                icon={<MapPin className="h-3 w-3" />}
                items={topOpp.map((r) => ({
                  id: r.id,
                  name: r.name,
                  hint: `${r.city} · ${r.zoning}`,
                  value: String(r.score),
                  positive: true,
                }))}
                onSelect={(id) => {
                  const r = INTELLIGENCE_REGIONS.find((x) => x.id === id);
                  if (r) selectRegion(r);
                }}
              />
            </div>
            <div className="hidden w-[82vw] max-w-xs shrink-0 snap-start sm:block sm:w-72 md:w-auto md:max-w-none md:shrink lg:block">
              <div className="rounded-2xl border border-border/50 bg-white/98 p-3 shadow-sm backdrop-blur sm:p-4">
                <div className="mb-2 flex items-center gap-2">
                  <LineChart className="h-3.5 w-3.5 text-primary" />
                  <div>
                    <p className="font-display text-sm font-semibold">{COPY.indexFlow}</p>
                    <p className="text-[10px] text-foreground/50">{COPY.last7Years}</p>
                  </div>
                </div>
                <Sparkline
                  data={
                    selected?.priceHistory.map((p) => p.value) ??
                    (INTELLIGENCE_REGIONS[0]?.priceHistory.map((p) => p.value) ?? [])
                  }
                  width={240}
                  height={48}
                  aria-label={COPY.indexFlow}
                />
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="pointer-events-auto z-20 flex justify-center pb-2 sm:pb-0">
        <button
          type="button"
          aria-label={rankingsOpen ? 'Minimizar cards' : 'Expandir cards'}
          onClick={() => setRankingsOpen((v) => !v)}
          className="inline-flex h-7 items-center gap-1 rounded-full border border-border/50 bg-white/90 px-2.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/70 shadow-sm backdrop-blur transition hover:border-primary/30 hover:text-primary"
        >
          {rankingsOpen ? 'Minimizar cards' : 'Cards'}
        </button>
      </div>

      {/* Region detail sheet */}
      {selected && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 animate-in fade-in zoom-in-95 duration-300 flex justify-center p-2 pb-[max(9.5rem,env(safe-area-inset-bottom))] sm:bottom-auto sm:left-auto sm:right-3 sm:top-[7.5rem] sm:w-[20rem] sm:p-0 sm:pb-0">
          <div className="pointer-events-auto max-h-[min(66dvh,460px)] w-full max-w-md overflow-y-auto rounded-2xl border border-border/60 bg-white p-3 shadow-xl sm:max-w-none sm:p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-foreground/50">
                  {selected.city}, {selected.state}
                </p>
                <h2 className="font-display text-lg font-bold">
                  {selected.name}
                </h2>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setDetailsMinimized(v => !v)}
                  className="grid h-8 w-8 place-items-center rounded-full hover:bg-muted text-foreground/60 transition"
                  aria-label={detailsMinimized ? 'Expandir métricas' : 'Minimizar métricas'}
                >
                  {detailsMinimized ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronUp className="h-4 w-4" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedId(null)}
                  className="grid h-8 w-8 place-items-center rounded-full hover:bg-muted"
                  aria-label="Fechar"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="mt-2.5 rounded-xl bg-muted/50 p-2.5 sm:mt-3 sm:p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-foreground/50">
                {COPY.score}
              </p>
              <p className="font-display text-lg font-bold" style={{ color: scoreColor(selected.score) }}>
                {scoreLabel(selected.score)} · {selected.score}
              </p>
              <p className="mt-0.5 text-xs text-foreground/60">{COPY.scoreHint}</p>
            </div>

            {!detailsMinimized && (
              <>
                <div className="mt-2.5 grid grid-cols-2 gap-1.5 sm:mt-3 sm:gap-2">
                  <Meta label={COPY.avgPrice} value={fmtPriceSqm(selected.priceSqm)} />
                  <Meta label="12m" value={fmtDelta(selected.priceSqmDelta12m)} />
                  <Meta label={COPY.stateRank} value={`#${Math.max(1, 12 - Math.floor(selected.score / 10))}`} />
                  <Meta label={COPY.nationalRank} value={`#${Math.max(1, 40 - Math.floor(selected.score / 3))}`} />
                  <Meta label={COPY.population} value={selected.population.toLocaleString('pt-BR')} />
                  <Meta label={COPY.income} value={fmtPriceSqm(selected.incomeAvg)} />
                  <Meta label={COPY.idh} value={selected.hdi.toFixed(3)} />
                  <Meta label={COPY.zoning} value={selected.zoning} />
                  <Meta label={COPY.envRisk} value={selected.environmentalRisk} />
                  <Meta label={COPY.floodRisk} value={selected.floodRisk} />
                </div>
                
                <div className="flex items-center justify-between mb-1.5 mt-3">
                  <p className="font-display text-sm font-semibold text-[var(--foreground)]">Street View do Terreno</p>
                  <button
                    type="button"
                    onClick={() => setStreetViewOpen(true)}
                    className="text-[10px] font-semibold text-primary hover:underline"
                  >
                    Ampliar 360°
                  </button>
                </div>
                <div 
                  onClick={() => setStreetViewOpen(true)}
                  className="group overflow-hidden rounded-xl border border-[var(--border)] h-44 w-full bg-muted relative mb-2 cursor-pointer transition-all hover:opacity-90"
                >
                  <iframe
                    width="100%"
                    height="100%"
                    loading="lazy"
                    allowFullScreen
                    style={{ border: 0, pointerEvents: 'none' }}
                    src={`https://maps.google.com/maps?q=${selected.lat},${selected.lng}&cbll=${selected.lat},${selected.lng}&layer=c&cbp=12,20,0,0,0&output=embed`}
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <span className="text-white text-xs font-semibold px-3 py-1.5 rounded-lg bg-black/70 backdrop-blur-sm">
                      Clique para ver em tela cheia 360°
                    </span>
                  </div>
                </div>

                <p className="mb-1.5 mt-3 font-display text-sm font-semibold">{COPY.composition}</p>
                <div className="space-y-1.5">
                  {INTELLIGENCE_LAYERS.map((layer) => {
                    const n = selected.layerScores[layer.id];
                    return (
                      <div key={layer.id} className="flex items-center gap-2 sm:gap-3">
                        <span className="w-28 shrink-0 truncate text-[11px] text-foreground/70 sm:w-36 sm:text-xs">
                          {layer.label}
                        </span>
                        <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                          <div
                            className="absolute inset-y-0 left-0 rounded-full"
                            style={{
                              width: `${n}%`,
                              background: scoreColor(n),
                            }}
                          />
                        </div>
                        <span className="w-6 text-right text-[11px] tabular-nums font-medium sm:w-7 sm:text-xs">{n}</span>
                      </div>
                    );
                  })}
                </div>

                <p className="mb-1.5 mt-3 font-display text-sm font-semibold">{COPY.highlights}</p>
                <ul className="space-y-1.5 text-sm text-foreground/80">
                  {selected.highlights.map((h) => (
                    <li key={h} className="flex gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      {h}
                    </li>
                  ))}
                </ul>

                <p className="mb-1.5 mt-3 font-display text-sm font-semibold">{COPY.timeline}</p>
                <ul className="space-y-2">
                  {selected.timeline.map((t) => (
                    <li key={`${t.year}-${t.title}`} className="flex items-start gap-2 text-sm">
                      <span className="rounded-md border border-border/60 bg-muted/60 px-2 py-0.5 text-xs tabular-nums font-medium">
                        {t.year}
                      </span>
                      <span className="text-foreground/70">{t.title}</span>
                    </li>
                  ))}
                </ul>

                {sparkData.length > 0 && (
                  <div className="mt-3">
                    <p className="mb-1.5 text-[11px] text-foreground/50">{COPY.history}</p>
                    <Sparkline data={sparkData} width={240} height={36} />
                  </div>
                )}

                <div className="mt-4 flex flex-col gap-2 border-t border-border/60 pt-4">
                  <Link
                    href={lh(`/viabilidade?region=${selected.id}`)}
                    className={cn(buttonVariants({ size: 'md' }), "flex items-center justify-center gap-2 w-full text-sm font-semibold rounded-xl bg-primary text-primary-foreground shadow-sm hover:bg-primary/95 transition-all")}
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                    Simular Viabilidade Construtiva
                  </Link>
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      href={`${lh('/compare')}?ids=${selected.id}`}
                      className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), "flex items-center justify-center gap-1.5 rounded-xl border border-[var(--border)] bg-background/50 text-[11px] font-medium hover:bg-muted transition-all")}
                    >
                      <Layers className="h-3.5 w-3.5" />
                      {COPY.compare}
                    </Link>
                    <Link
                      href={lh(`/rag?query=Explicar+potencial+de+${selected.name}`)}
                      className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), "flex items-center justify-center gap-1.5 rounded-xl border border-[var(--border)] bg-background/50 text-[11px] font-medium hover:bg-muted transition-all")}
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      Falar com Corretor IA
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {streetViewOpen && selected && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl rounded-2xl border border-border bg-background p-5 shadow-2xl animate-in zoom-in-95 duration-200 text-foreground">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="font-display text-base font-bold text-foreground">Visualização Imersiva Street View 360°</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {selected.name}, {selected.city} - {selected.state} · Lat: {selected.lat.toFixed(6)}, Lng: {selected.lng.toFixed(6)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStreetViewOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-full hover:bg-muted text-foreground transition-all"
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div className="overflow-hidden rounded-xl border border-border h-[460px] w-full bg-black/10">
              <iframe
                width="100%"
                height="100%"
                loading="lazy"
                allowFullScreen
                style={{ border: 0 }}
                src={`https://maps.google.com/maps?q=${selected.lat},${selected.lng}&cbll=${selected.lat},${selected.lng}&layer=c&cbp=12,20,0,0,0&output=embed`}
              />
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setStreetViewOpen(false)}
                className={cn(buttonVariants({ size: 'sm' }), "rounded-lg px-4 py-2 font-semibold transition-all")}
              >
                Fechar Painel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  const descriptions: Record<string, string> = {
    'Preço médio m²': 'Média de custo por m²',
    '12m': 'Evolução anual',
    'Ranking estadual': 'Posição no estado',
    'Ranking nacional': 'Posição no Brasil',
    'População': 'Habitantes estimativos',
    'Renda média': 'Ganhos mensais médios',
    'IDH': 'Desenvolvimento Humano',
    'Zoneamento': 'Plano diretor municipal',
    'Risco ambiental': 'Score de risco físico',
    'Risco enchente': 'Histórico de pluviosidade',
  };
  const desc = descriptions[label] || '';

  return (
    <div className="rounded-lg bg-muted/40 px-2.5 py-2">
      <p className="text-[10px] text-foreground/50">{label}</p>
      <p className="truncate text-xs font-semibold">{value}</p>
      {desc && <p className="text-[9px] text-foreground/45 mt-0.5 leading-none">{desc}</p>}
    </div>
  );
}

function RankCard({
  title,
  icon,
  items,
  onSelect,
}: {
  title: string;
  icon: React.ReactNode;
  items: { id: string; name: string; hint: string; value: string; positive?: boolean }[];
  onSelect: (id: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-border/50 bg-white/98 p-3 shadow-lg backdrop-blur sm:p-4">
      <div className="mb-2 flex items-center gap-1.5 sm:gap-2">
        <span className="text-primary">{icon}</span>
        <p className="font-display text-sm font-semibold">{title}</p>
      </div>
      <ul className="space-y-1">
        {items.map((it, i) => (
          <li key={it.id}>
            <button
              type="button"
              onClick={() => onSelect(it.id)}
              className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-2 text-left text-sm transition hover:bg-muted"
            >
              <span className="min-w-0">
                <span className="mr-1.5 tabular-nums text-foreground/40">{i + 1}.</span>
                <span className="font-medium">{it.name}</span>
                <span className="block truncate text-[10px] text-foreground/50 sm:inline sm:before:content-['·_']">
                  {it.hint}
                </span>
              </span>
              <span
                className={cn(
                  'shrink-0 text-xs font-semibold tabular-nums',
                  it.positive ? 'text-success' : 'text-destructive',
                )}
              >
                {it.value}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function KpiChip({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-border/50 bg-white/95 p-2 shadow-sm backdrop-blur sm:p-3">
      <p className="text-[9px] font-semibold uppercase tracking-wider text-foreground/50">{label}</p>
      <p className="mt-0.5 font-display text-lg font-bold leading-tight sm:text-xl">{value}</p>
      {hint && <p className="text-[10px] text-foreground/50 sm:text-xs">{hint}</p>}
    </div>
  );
}

export default function MapPage() {
  return (
    <RequireAuth>
      <MapPageInner />
    </RequireAuth>
  );
}
