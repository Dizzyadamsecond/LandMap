'use client';

import Link from 'next/link';
import { Sparkles, ArrowRight } from './lovable/icons';
import { Card, Badge } from '@landmap/ui';

export function RecommendationWidget({
  recommendations,
  locale,
}: {
  recommendations: Array<{ name: string; city: string; score: number; trend: number; id: string }>;
  locale: string;
}) {
  if (!recommendations.length) return null;

  return (
    <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent p-6">
      <div className="mb-4 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">Recomendações para você</h3>
      </div>
      <div className="space-y-3">
        {recommendations.slice(0, 3).map((rec) => (
          <Link
            key={rec.id}
            href={`/${locale}/property/${rec.id}`}
            className="flex items-center justify-between rounded-lg border border-border/50 bg-background/50 p-3 transition hover:border-primary/30 hover:bg-primary/5"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">{rec.name}</p>
              <p className="text-xs text-muted-foreground">{rec.city}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-right">
                <p className="text-sm font-bold text-primary">{rec.score}</p>
                <p className={`text-xs font-medium ${rec.trend > 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {rec.trend > 0 ? '↑' : '↓'} {Math.abs(rec.trend).toFixed(1)}%
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </Link>
        ))}
      </div>
    </Card>
  );
}
