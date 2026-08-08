'use client';

import { useMemo, useState, useCallback } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { motion } from 'framer-motion';
import {
  Search,
  MapPin,
  TrendingUp,
  ArrowRight,
  Sparkles,
  Layers,
  GitCompare,
  SlidersHorizontal,
  Star,
} from '../../../components/lovable/icons';
import { Badge, buttonVariants, cn } from '@landmap/ui';
import {
  INTELLIGENCE_REGIONS,
  topByScore,
  topByValorization,
  fmtPriceSqm,
  fmtDelta,
  type IntelligenceRegion,
} from '../../../lib/mapIntelligence';

// /insights com fotos reais de bairros (imagens estáveis, $0, sem API key).
// O "Radar de oportunidades" (versão anterior) foi movido para /radar-insights.

const scoreTone = (score: number) =>
  score >= 90
    ? 'text-[var(--primary)]'
    : score >= 80
      ? 'text-[var(--ring)]'
      : score >= 65
        ? 'text-[var(--warning)]'
        : 'text-[var(--destructive)]';

const SEARCH_PLACEHOLDER = 'Cidade, bairro ou região';

/**
 * Foto estável por região — LoremFlickr por tags de cidade/bairro.
 * Unsplash Source (source.unsplash.com) foi descontinuado (503) e quebrava as
 * imagens; LoremFlickr devolve foto REAL de cidade, $0, sem API key, estável por
 * `lock` (hash do id da região, então não muda a cada reload). Se no futuro
 * tivermos as URLs da Lovable, basta trocar este helper.
 */
const stableLock = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) % 100000;
  return h;
};

const photoFor = (region: IntelligenceRegion) => {
  const tags = encodeURIComponent(`${region.city}, ${region.name}, brazil, neighborhood`);
  return `https://loremflickr.com/800/520/${tags}?lock=${stableLock(region.id)}`;
};

function RegionPhotoCard({
  region,
  locale,
  onHover,
}: {
  region: IntelligenceRegion;
  locale: string;
  onHover?: (id: string | null) => void;
}) {
  return (
    <Link
      href={`/${locale}/map?region=${region.id}`}
      onMouseEnter={() => onHover?.(region.id)}
      onMouseLeave={() => onHover?.(null)}
      className="group block overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm transition hover:border-[var(--primary)]/40 hover:shadow-md"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-[var(--muted)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photoFor(region)}
          alt={`${region.name}, ${region.city}`}
          loading="lazy"
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
        <div className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/45 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur">
          <Star className="h-3.5 w-3.5 text-[var(--primary)]" />
          {region.score}
          <span className="text-[10px] font-medium uppercase tracking-wider opacity-70">Score</span>
        </div>
        <div className="absolute bottom-3 left-3 right-3">
          <div className="flex items-center gap-1.5 text-white">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate text-sm font-semibold drop-shadow">
              {region.name}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-white/80 drop-shadow">
            {region.city} · {region.state}
          </p>
        </div>
      </div>
      <div className="flex items-end justify-between gap-3 p-3 sm:p-4">
        <p className="text-lg font-bold text-[var(--foreground)]">
          {fmtPriceSqm(region.priceSqm)}
          <span className="text-xs font-medium text-[var(--muted-foreground)]"> /m²</span>
        </p>
        <span
          className={cn(
            'inline-flex items-center gap-1 text-sm font-semibold',
            region.priceSqmDelta12m >= 0 ? 'text-[var(--success)]' : 'text-[var(--destructive)]',
          )}
        >
          <TrendingUp className="h-3.5 w-3.5" />
          {fmtDelta(region.priceSqmDelta12m)}
        </span>
      </div>
    </Link>
  );
}

function Section({
  title,
  subtitle,
  regions,
  locale,
  onHover,
}: {
  title: string;
  subtitle: string;
  regions: IntelligenceRegion[];
  locale: string;
  onHover?: (id: string | null) => void;
}) {
  return (
    <section className="mb-14">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-bold tracking-tight text-[var(--foreground)] sm:text-2xl">
            {title}
          </h2>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">{subtitle}</p>
        </div>
        <Link
          href={`/${locale}/map`}
          className="hidden shrink-0 items-center gap-1 text-sm font-medium text-[var(--primary)] transition-colors hover:text-[var(--primary-foreground)] sm:inline-flex"
        >
          Mostrar todos
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-80px' }}
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }}
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      >
        {regions.map((region) => (
          <motion.div
            key={region.id}
            variants={{
              hidden: { opacity: 0, y: 16 },
              show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
            }}
          >
            <RegionPhotoCard region={region} locale={locale} onHover={onHover} />
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}

export default function InsightsPage() {
  const locale = useLocale();
  const lh = (p: string) => `/${locale}${p}`;
  const [query, setQuery] = useState('');
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [, setHovered] = useState<string | null>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return INTELLIGENCE_REGIONS.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.city.toLowerCase().includes(q) ||
        r.state.toLowerCase().includes(q),
    ).slice(0, 8);
  }, [query]);

  const wanted = useMemo(
    () =>
      [
        'jardins',
        'leblon',
        'vila-nova-conceicao',
        'ipanema',
        'barra-sul',
        'itaim-bibi',
        'lago-sul',
        'lourdes',
        'batel',
        'jurere',
        'meireles',
        'praia-do-futuro',
        'coco',
        'ponta-negra',
        'plano-diretor-sul',
        'eusebio-centro',
        'sapiranga',
      ]
        .map((id) => INTELLIGENCE_REGIONS.find((r) => r.id === id))
        .filter(Boolean) as IntelligenceRegion[],
    [],
  );
  const best = useMemo(() => topByScore(8), []);
  const rising = useMemo(() => topByValorization(8), []);
  const emerging = useMemo(
    () =>
      [...INTELLIGENCE_REGIONS]
        .sort((a, b) => b.priceSqmDelta12m - a.priceSqmDelta12m)
        .filter((r) => r.priceSqm < 8000)
        .slice(0, 6),
    [],
  );

  const onPick = useCallback(
    (region: IntelligenceRegion) => {
      setQuery('');
      setSuggestOpen(false);
      window.location.href = `/${locale}/map?region=${region.id}`;
    },
    [locale],
  );

  return (
    <div className="min-h-[100dvh] bg-[var(--background)] text-[var(--foreground)]">
      {/* Hero com foto de capa + busca global */}
      <section className="relative overflow-hidden border-b border-[var(--border)]">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://loremflickr.com/1600/900/brazil,city,skyline,neighborhood?lock=4242"
            alt=""
            className="h-full w-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[var(--background)]/80 via-[var(--background)]/55 to-[var(--background)]" />
          <div className="aurora" />
          <div className="grain" />
        </div>
        <div className="mx-auto max-w-7xl px-4 py-16 sm:py-20 lg:py-24">
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="eyebrow inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-1 text-xs font-medium text-[var(--muted-foreground)]"
          >
            <Sparkles className="h-3.5 w-3.5 text-[var(--primary)]" />
            Insights de bairros
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
            className="mt-5 max-w-3xl font-display text-4xl font-bold tracking-tight text-[var(--foreground)] sm:text-5xl"
          >
            Onde vale a pena investir
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.14, ease: [0.22, 1, 0.36, 1] }}
            className="mt-4 max-w-2xl text-base text-[var(--muted-foreground)] sm:text-lg"
          >
            Veja os bairros mais desejados do Brasil em fotos, ranqueados por Score LandMap,
            valorização e liquidez. Explore cada região no mapa de inteligência.
          </motion.p>

          {/* Busca global */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="relative mt-8 max-w-xl"
          >
            <div className="flex items-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--card)] px-3 py-2.5 shadow-sm backdrop-blur sm:px-4">
              <Search className="h-4 w-4 shrink-0 text-[var(--muted-foreground)]" />
              <input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSuggestOpen(true);
                }}
                onFocus={() => setSuggestOpen(true)}
                placeholder={SEARCH_PLACEHOLDER}
                className="h-9 w-full border-0 bg-transparent text-sm outline-none placeholder:text-[var(--muted-foreground)] focus-visible:ring-0"
              />
              {query && (
                <button
                  type="button"
                  aria-label="Limpar"
                  onClick={() => setQuery('')}
                  className="grid h-7 w-7 place-items-center rounded-full text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
                >
                  ✕
                </button>
              )}
            </div>
            {suggestOpen && query.trim() && results.length > 0 && (
              <div className="absolute inset-x-0 top-full z-30 mt-1.5 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-lg">
                {results.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => onPick(r)}
                    className="flex w-full items-center justify-between px-3 py-2.5 text-left text-sm transition hover:bg-[var(--muted)]"
                  >
                    <span className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-[var(--primary)]" />
                      <span className="font-medium">{r.name}</span>
                      <span className="text-[var(--muted-foreground)]">
                        {r.city}, {r.state}
                      </span>
                    </span>
                    <span className={cn('tabular-nums text-xs font-semibold', scoreTone(r.score))}>
                      {r.score}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="mt-6 flex flex-wrap gap-3"
          >
            <Link href={lh('/map')} className={buttonVariants({ size: 'lg' })}>
              Abrir mapa
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link href={lh('/radar-insights')} className={buttonVariants({ size: 'lg', variant: 'outline' })}>
              Radar de oportunidades
            </Link>
          </motion.div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:py-16">
        <Section
          title="Bairros mais desejados do Brasil"
          subtitle="Ranqueados por Score LandMap e liquidez de mercado."
          regions={best}
          locale={locale}
          onHover={setHovered}
        />
        <Section
          title="Melhores oportunidades hoje"
          subtitle="Maior spread de valorização com fundamentos sólidos."
          regions={wanted}
          locale={locale}
          onHover={setHovered}
        />
        <Section
          title="Em alta agora"
          subtitle="Maior velocidade de valorização nos últimos 12 meses."
          regions={rising}
          locale={locale}
          onHover={setHovered}
        />
        <Section
          title="Emergentes"
          subtitle="Mercados de entrada com forte tração e preço abaixo da média."
          regions={emerging}
          locale={locale}
          onHover={setHovered}
        />

        {/* Hub de acesso rápido */}
        <section className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-8">
          <div className="mb-6 flex items-center gap-2">
            <Layers className="h-5 w-5 text-[var(--primary)]" />
            <h2 className="text-lg font-semibold text-[var(--foreground)]">Fluxos</h2>
            <span className="rounded-full border border-[var(--border)] bg-[var(--background)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
              Hub
            </span>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Link
              href={lh('/compare')}
              className="flex items-start gap-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)]/70 p-3 transition hover:border-[var(--primary)]/30 hover:bg-[var(--primary)]/5"
            >
              <span className="mt-0.5 grid h-7 w-7 place-items-center rounded-full bg-[var(--primary)]/10 text-[var(--primary)]">
                <GitCompare className="h-3.5 w-3.5" />
              </span>
              <span>
                <span className="block text-sm font-semibold text-[var(--foreground)]">Comparador</span>
                <span className="mt-0.5 block text-xs text-[var(--muted-foreground)]">
                  Lado a lado com diferenças de preço e confiança
                </span>
              </span>
            </Link>
            <Link
              href={lh('/viabilidade')}
              className="flex items-start gap-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)]/70 p-3 transition hover:border-[var(--primary)]/30 hover:bg-[var(--primary)]/5"
            >
              <span className="mt-0.5 grid h-7 w-7 place-items-center rounded-full bg-[var(--primary)]/10 text-[var(--primary)]">
                <SlidersHorizontal className="h-3.5 w-3.5" />
              </span>
              <span>
                <span className="block text-sm font-semibold text-[var(--foreground)]">Viabilidade</span>
                <span className="mt-0.5 block text-xs text-[var(--muted-foreground)]">
                  Simule construtibilidade e yield por região
                </span>
              </span>
            </Link>
            <Link
              href={lh('/map')}
              className="flex items-start gap-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)]/70 p-3 transition hover:border-[var(--primary)]/30 hover:bg-[var(--primary)]/5"
            >
              <span className="mt-0.5 grid h-7 w-7 place-items-center rounded-full bg-[var(--primary)]/10 text-[var(--primary)]">
                <MapPin className="h-3.5 w-3.5" />
              </span>
              <span>
                <span className="block text-sm font-semibold text-[var(--foreground)]">Mapa</span>
                <span className="mt-0.5 block text-xs text-[var(--muted-foreground)]">
                  Inteligência territorial completa por camadas
                </span>
              </span>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
