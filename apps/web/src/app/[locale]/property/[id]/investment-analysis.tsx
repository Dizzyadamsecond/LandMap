'use client';

import { Card, Badge } from '@landmap/ui';
import { TrendingUp, AlertTriangle } from '../../../../components/lovable/icons';

export function InvestmentAnalysis({
  score,
  capRate,
  grade,
}: {
  score?: number;
  capRate?: number;
  grade?: string;
}) {
  if (!score && !capRate) return null;

  const recommendation =
    capRate && capRate > 8
      ? '✅ Excelente'
      : capRate && capRate > 6
        ? '👍 Bom'
        : capRate && capRate > 4
          ? '⚠️ Moderado'
          : '🚨 Fraco';

  return (
    <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent p-6">
      <div className="mb-4 flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">Análise de Investimento</h3>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {score !== undefined && (
          <div>
            <p className="text-xs text-muted-foreground">Score</p>
            <p className="mt-1 text-2xl font-bold text-primary">{score}</p>
            <p className="mt-1 text-[10px] text-muted-foreground">/ 100</p>
          </div>
        )}

        {capRate !== undefined && (
          <div>
            <p className="text-xs text-muted-foreground">Cap Rate</p>
            <p className="mt-1 text-2xl font-bold text-success">{capRate.toFixed(1)}%</p>
            <p className="mt-1 text-[10px] text-muted-foreground">12m previsto</p>
          </div>
        )}

        {grade && (
          <div>
            <p className="text-xs text-muted-foreground">Grade</p>
            <div className="mt-1 flex items-end gap-1.5">
              <span className="text-2xl font-bold text-primary">{grade}</span>
              <Badge variant="outline" className="mb-1">
                {recommendation}
              </Badge>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 space-y-2 border-t border-border/50 pt-4">
        <p className="text-xs font-medium text-foreground">Pontos-chave:</p>
        <ul className="space-y-1 text-xs text-muted-foreground">
          <li>✓ Localização em zona de valorização</li>
          <li>✓ Zoneamento favorável a M&A</li>
          <li>ℹ️ Demanda moderada de investidores</li>
        </ul>
      </div>
    </Card>
  );
}
