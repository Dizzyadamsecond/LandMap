'use client';

import { useEffect, useState } from 'react';
import { Card } from '@landmap/ui';
import {
  getPortfolioAnalytics,
  getMatches,
  getMarketHeat,
  getPricePrediction,
  PortfolioAnalytics,
  AIMatch,
  MarketHeat,
  PricePrediction,
} from '@/lib/vc-features-api';

export function VCDashboard() {
  const [analytics, setAnalytics] = useState<PortfolioAnalytics | null>(null);
  const [matches, setMatches] = useState<AIMatch[]>([]);
  const [marketHeat, setMarketHeat] = useState<MarketHeat | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [a, m] = await Promise.all([
          getPortfolioAnalytics().catch(() => null),
          getMatches(5).catch(() => ({ matches: [] })),
        ]);

        setAnalytics(a);
        setMatches(m.matches || []);
      } catch (e) {
        console.error('VC Dashboard error:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div className="text-xs text-muted-foreground">Loading analytics...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Portfolio Analytics Card */}
      {analytics && (
        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-3">Portfolio Analytics</h3>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <p className="text-muted-foreground">Total Invested</p>
              <p className="font-semibold">
                R$ {(analytics.total_invested_cents / 100).toLocaleString('pt-BR')}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">ROI</p>
              <p className={`font-semibold ${analytics.roi_pct >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {analytics.roi_pct.toFixed(2)}%
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Risk Exposure</p>
              <p className="font-semibold">{analytics.risk_exposure_pct.toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-muted-foreground">Properties</p>
              <p className="font-semibold">{analytics.property_count}</p>
            </div>
          </div>
        </Card>
      )}

      {/* AI Matches Card */}
      {matches.length > 0 && (
        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-3">Top Matches for You</h3>
          <div className="space-y-2">
            {matches.slice(0, 5).map((match) => (
              <div key={match.id} className="flex items-center justify-between text-xs border-b pb-2 last:border-0">
                <div>
                  <p className="font-medium truncate">{match.property?.title || 'Property'}</p>
                  <p className="text-muted-foreground">{match.property?.location}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-primary">{match.match_score.toFixed(0)}%</p>
                  <p className="text-muted-foreground text-xs">match score</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* No Data Fallback */}
      {!analytics && matches.length === 0 && (
        <Card className="p-4 text-center">
          <p className="text-xs text-muted-foreground">No portfolio data yet. Start exploring properties!</p>
        </Card>
      )}
    </div>
  );
}
