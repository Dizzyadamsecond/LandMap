'use client';

import { useEffect, useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, Activity, ArrowRight } from './lovable/icons';
import { Badge, Card } from '@landmap/ui';
import Link from 'next/link';

export function LiveTicker({ locale = 'pt-BR' }) {
  const [tickers, setTickers] = useState<Array<{
    name: string;
    city: string;
    price: number;
    delta: number;
    trend: 'up' | 'down' | 'stable';
    volume: number;
  }>>([]);

  // Simular dados ao vivo (em produção, consumir WebSocket)
  useMemo(() => {
    const regions = [
      { name: 'Jardim Paulista', city: 'São Paulo', price: 12500, delta: 3.2, trend: 'up' as const, volume: 47 },
      { name: 'Vila Mariana', city: 'São Paulo', price: 11800, delta: 2.8, trend: 'up' as const, volume: 52 },
      { name: 'Pinheiros', city: 'São Paulo', price: 10200, delta: -1.5, trend: 'down' as const, volume: 28 },
      { name: 'Bela Vista', city: 'São Paulo', price: 9100, delta: 1.2, trend: 'stable' as const, volume: 18 },
      { name: 'Centro', city: 'São Paulo', price: 7800, delta: 5.1, trend: 'up' as const, volume: 64 },
    ];
    setTickers(regions);
  }, []);

  return (
    <div className="overflow-x-auto">
      <div className="grid auto-cols-max gap-3 md:grid-cols-5 pb-4">
        {tickers.map((ticker, i) => (
          <Card
            key={`${ticker.name}-${i}`}
            className="min-w-[240px] border-primary/10 bg-gradient-to-br from-background to-primary/5 p-3 cursor-pointer transition hover:border-primary/30"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-primary truncate">{ticker.name}</p>
                <p className="text-[10px] text-muted-foreground">{ticker.city}</p>
              </div>
              {ticker.trend === 'up' && (
                <TrendingUp className="h-3.5 w-3.5 text-green-500 shrink-0 ml-1" />
              )}
              {ticker.trend === 'down' && (
                <TrendingDown className="h-3.5 w-3.5 text-red-500 shrink-0 ml-1" />
              )}
              {ticker.trend === 'stable' && (
                <Activity className="h-3.5 w-3.5 text-yellow-500 shrink-0 ml-1" />
              )}
            </div>

            <div className="mb-2.5">
              <p className="text-lg font-bold text-foreground">R$ {ticker.price.toLocaleString('pt-BR')}</p>
              <p className={`text-xs font-semibold ${
                ticker.delta > 0 ? 'text-green-500' : ticker.delta < 0 ? 'text-red-500' : 'text-yellow-600'
              }`}>
                {ticker.delta > 0 ? '+' : ''}{ticker.delta.toFixed(1)}% · {ticker.volume} transações
              </p>
            </div>

            <Link
              href={`/${locale}/map?q=${ticker.name}`}
              className="inline-flex items-center gap-1 text-[10px] font-medium text-primary hover:underline"
            >
              Ver no mapa <ArrowRight className="h-2.5 w-2.5" />
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
}
