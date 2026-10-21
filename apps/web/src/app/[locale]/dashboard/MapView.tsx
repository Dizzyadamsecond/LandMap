'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

/**
 * Standalone Leaflet map component that avoids SSR issues.
 * Uses imperative Leaflet API with Google Maps tiles (no API key).
 */
export default function MapView({
  onError,
}: {
  onError?: (msg: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;

    try {
      const map = L.map(containerRef.current, {
        center: [-3.7319, -38.5267], // Fortaleza
        zoom: 12,
        zoomControl: false,
        attributionControl: false,
      });

      L.tileLayer(
        'https://mt{s}.google.com/vt/lyrs=p&hl=pt-BR&gl=BR&x={x}&y={y}&z={z}',
        {
          maxZoom: 20,
          subdomains: '0123',
          attribution: '© Google',
          errorTileUrl: '/api/tiles?src=green&z={z}&x={x}&y={y}{r}',
        },
      ).addTo(map);

      L.marker([-3.7319, -38.5267])
        .addTo(map)
        .bindPopup('Fortaleza');

      mapRef.current = map;

      setTimeout(() => map.invalidateSize(), 100);
    } catch (err) {
      onError?.(
        err instanceof Error ? err.message : 'Erro ao inicializar o mapa',
      );
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [onError]);

  return <div ref={containerRef} className="h-full w-full" />;
}
