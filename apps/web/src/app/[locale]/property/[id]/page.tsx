'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ProductPageShell } from '../../../../components/ProductPageShell';
import { Card, Badge, Button } from '@landmap/ui';
import { FileText, MapPin, TrendingUp, AlertTriangle, Lock, Layers, Share2 } from '../../../../components/lovable/icons';
import { apiUrl } from '../../../../lib/api';
import { formatBRL } from '../../../../lib/plans';
import { Gallery } from './gallery';
import { PriceHistory } from './price-history';
import { ShareButton } from './share-button';
import AiInsights from './ai-insights';
import { RecentlyViewedTracker } from './recently-viewed-tracker';
import { InvestmentAnalysis } from './investment-analysis';

interface Dossier {
  id: string;
  title: string;
  city: string;
  state: string;
  neighborhood?: string;
  price: number;
  areaM2: number;
  pricePerM2?: number;
  grade?: string;
  score?: number;
  capRate?: number;
  thesis?: string[];
  risks?: string[];
  drivers?: string[];
  comps?: string[];
  tags?: string[];
  latitude?: number;
  longitude?: number;
}

export default function PropertyDossierPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string;
  const [p, setP] = useState<Dossier | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(apiUrl(`/markdowns?id=${encodeURIComponent(id)}`), { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('not found'))))
      .then((d) => {
        const it = d.items?.[0];
        if (!it) throw new Error('not found');
        setP(it as Dossier);
      })
      .catch(() => setError('Imóvel não encontrado no dataset.'))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <ProductPageShell
      backHref="/search"
      eyebrow="Dossier"
      title={p?.title ?? 'Imóvel'}
      description={p ? `${p.city}, ${p.state}${p.neighborhood ? ` · ${p.neighborhood}` : ''}` : 'Carregando…'}
      maxWidth="7xl"
    >
      {p && (
        <RecentlyViewedTracker
          id={p.id}
          title={p.title}
          city={p.city}
          price={p.price}
        />
      )}

      {loading ? (
        <div className="py-16 text-center text-[var(--muted-foreground)]">Carregando dossier…</div>
      ) : error || !p ? (
        <Card variant="default" className="py-14 text-center text-sm text-[var(--muted-foreground)]">
          {error}
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Card variant="default" className="p-4">
                <p className="text-xs text-[var(--muted-foreground)]">Preço</p>
                <p className="mt-1 text-lg font-semibold text-[var(--foreground)]">{formatBRL(p.price)}</p>
                <p className="text-[10px] text-[var(--muted-foreground)] mt-1.5 leading-snug">Valor de aquisição negociado</p>
              </Card>
              <Card variant="default" className="p-4">
                <p className="text-xs text-[var(--muted-foreground)]">Preço/m²</p>
                <p className="mt-1 text-lg font-semibold text-[var(--foreground)]">
                  {p.pricePerM2 ? formatBRL(p.pricePerM2) : '—'}
                </p>
                <p className="text-[10px] text-[var(--muted-foreground)] mt-1.5 leading-snug">Custo médio por metro quadrado</p>
              </Card>
              <Card variant="default" className="p-4">
                <p className="text-xs text-[var(--muted-foreground)]">Área</p>
                <p className="mt-1 text-lg font-semibold text-[var(--foreground)]">{p.areaM2} m²</p>
                <p className="text-[10px] text-[var(--muted-foreground)] mt-1.5 leading-snug">Dimensão total útil declarada</p>
              </Card>
              <Card variant="default" className="p-4">
                <p className="text-xs text-[var(--muted-foreground)]">Cap rate</p>
                <p className="mt-1 text-lg font-semibold text-[var(--foreground)]">
                  {p.capRate ? `${p.capRate}%` : '—'}
                </p>
                <p className="text-[10px] text-[var(--muted-foreground)] mt-1.5 leading-snug">Rendimento anual líquido (NOI)</p>
              </Card>
            </div>

            <InvestmentAnalysis score={p.score} capRate={p.capRate} grade={p.grade} />

            {p && (
              <Gallery
                images={[]}
                title={p.title}
              />
            )}

            {p.thesis && p.thesis.length > 0 && (
              <Card variant="default" className="p-5">
                <div className="mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-[var(--primary)]" />
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--foreground)]">Tese</h2>
                </div>
                <ul className="space-y-1.5">
                  {p.thesis.map((t, i) => (
                    <li key={i} className="flex gap-2 text-sm text-[var(--foreground)]">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--primary)]" />
                      {t}
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              {p.drivers && p.drivers.length > 0 && (
                <Card variant="default" className="p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-[var(--success)]" />
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--foreground)]">Drivers</h2>
                  </div>
                  <ul className="space-y-1.5">
                    {p.drivers.map((d, i) => (
                      <li key={i} className="text-sm text-[var(--muted-foreground)]">• {d}</li>
                    ))}
                  </ul>
                </Card>
              )}
              {p.risks && p.risks.length > 0 && (
                <Card variant="default" className="p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-[var(--destructive)]" />
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--foreground)]">Riscos</h2>
                  </div>
                  <ul className="space-y-1.5">
                    {p.risks.map((r, i) => (
                      <li key={i} className="text-sm text-[var(--muted-foreground)]">• {r}</li>
                    ))}
                  </ul>
                </Card>
              )}
            </div>

            {p.comps && p.comps.length > 0 && (
              <Card variant="default" className="p-5">
                <div className="mb-3 flex items-center gap-2">
                  <Layers className="h-4 w-4 text-[var(--primary)]" />
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--foreground)]">Comps</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {p.comps.map((c, i) => (
                    <Badge key={i} variant="outline">{c}</Badge>
                  ))}
                </div>
              </Card>
            )}
          </div>

          <div className="space-y-4">
            <Card variant="highlight" className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--muted-foreground)]">Score</span>
                <span className="text-2xl font-bold text-[var(--foreground)]">{p.score ?? '—'}</span>
              </div>
              {p.grade && (
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-sm text-[var(--muted-foreground)]">Grade</span>
                  <Badge variant="secondary">Grade {p.grade}</Badge>
                </div>
              )}
            </Card>
            {p.tags && p.tags.length > 0 && (
              <Card variant="default" className="p-5">
                <div className="mb-3 flex items-center gap-2">
                  <Lock className="h-4 w-4 text-[var(--primary)]" />
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--foreground)]">Tags</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {p.tags.map((t, i) => (
                    <Badge key={i} variant="secondary">{t}</Badge>
                  ))}
                </div>
              </Card>
            )}
            <Card variant="default" className="p-5 space-y-3">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-[var(--primary)]" />
                <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--foreground)]">Local & Google Street View</h2>
              </div>
              <p className="text-sm text-[var(--muted-foreground)]">
                {p.neighborhood ?? 'Centro'} · {p.city}/{p.state}
              </p>
              {typeof p.latitude === 'number' && typeof p.longitude === 'number' && (
                <>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    Coordenadas: {p.latitude.toFixed(4)}, {p.longitude.toFixed(4)}
                  </p>
                  <div className="overflow-hidden rounded-xl border border-[var(--border)] h-48 w-full mt-2 bg-muted relative">
                    <iframe
                      width="100%"
                      height="100%"
                      loading="lazy"
                      allowFullScreen
                      style={{ border: 0 }}
                      src={`https://maps.google.com/maps?q=${p.latitude},${p.longitude}&cbll=${p.latitude},${p.longitude}&layer=c&cbp=12,20,0,0,0&output=embed`}
                    />
                  </div>
                </>
              )}
            </Card>

            {p && (
              <Card variant="default" className="flex items-center justify-between p-4">
                <span className="text-sm text-[var(--muted-foreground)]">Compartilhar</span>
                <ShareButton
                  property={{
                    title: p.title,
                    price: p.price,
                    city: p.city,
                    state: p.state,
                    areaM2: p.areaM2,
                    type: p.tags?.[0],
                  }}
                />
              </Card>
            )}

            {p && <PriceHistory history={[]} />}

            {p && <AiInsights propertyId={p.id} propertyTitle={p.title} city={p.city} neighborhood={p.neighborhood} />}
            </div>
        </div>
      )}
    </ProductPageShell>
  );
}
