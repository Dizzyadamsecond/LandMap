'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { Search } from '../../../components/lovable/icons';
import { Input } from '@landmap/ui';
import { PublicPageShell } from '../../../components/PublicPageShell';
import {
  GLOSSARY_GROUPS,
  GLOSSARY_ORIGIN_LABEL,
  GLOSSARY_ORIGIN_STYLE,
  GLOSSARY_TERMS,
} from '../../../lib/public-content';

/**
 * `/glossario` — paridade 1:1 com a Lovable LIVE
 * (`landmap-insight.lovable.app/glossario`, chunk `glossario-BsIjFowT.js`):
 * header "Abrir o mapa" → `/dashboard`, `section.mx-auto.max-w-4xl.px-6.py-14`,
 * eyebrow "Glossário", H1 "O que cada indicador quer dizer", busca de termos
 * (`relative mt-8 max-w-md` + ícone + `pl-9`), estado vazio "Nenhum termo
 * encontrado para “…”", grupos com H2 uppercase + cards
 * (`rounded-2xl border border-foreground/10 p-5`, título + badge de origem +
 * unidade à direita, `short`, box "Como calculamos"), `<Footer />` 1:1.
 *
 * Termos: `lib/public-content.ts` (GLOSSARY_TERMS — os 20 termos 1:1 do
 * dicionário da referência). Busca normaliza acentos (NFD), igual à ref.
 */
export default function GlossarioPage() {
  const locale = useLocale();
  const lh = (p: string) => `/${locale}${p}`;
  const [q, setQ] = useState('');

  const norm = (s: string) =>
    s
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  const query = norm(q.trim());

  const filtered = useMemo(
    () =>
      GLOSSARY_TERMS.filter(
        (t) =>
          !query ||
          norm(t.term).includes(query) ||
          norm(t.short).includes(query) ||
          norm(t.how).includes(query),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [query],
  );

  const groups = GLOSSARY_GROUPS.map((g) => ({
    ...g,
    terms: filtered.filter((t) => t.group === g.id),
  })).filter((g) => g.terms.length > 0);

  return (
    <PublicPageShell backHref="/dashboard" backLabel="Abrir o mapa" maxWidth="4xl">
      <section className="mx-auto max-w-4xl px-6 py-14">
        <p className="text-xs font-medium uppercase tracking-widest text-primary">Glossário</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight">
          O que cada indicador quer dizer
        </h1>
        <p className="mt-4 max-w-2xl text-foreground/60">
          Escrito para quem está comprando o primeiro terreno. Cada termo mostra o que significa,
          como chegamos ao número e se ele vem de dado observado ou de estimativa.
        </p>

        <div className="relative mt-8 max-w-md">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/40"
            aria-hidden
          />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar termo (ex.: liquidez)"
            aria-label="Buscar termo no glossário"
            className="pl-9"
          />
        </div>

        {filtered.length === 0 ? (
          <p className="mt-10 text-sm text-foreground/60">
            Nenhum termo encontrado para &ldquo;{q}&rdquo;.
          </p>
        ) : (
          <div className="mt-12 space-y-12">
            {groups.map((g) => (
              <div key={g.id}>
                <h2 className="text-xs font-semibold uppercase tracking-widest text-foreground/50">
                  {g.label}
                </h2>
                <div className="mt-4 space-y-3">
                  {g.terms.map((t) => (
                    <article
                      key={t.id}
                      className="rounded-2xl border border-foreground/10 p-5"
                    >
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                        <h3 className="text-base font-semibold">{t.term}</h3>
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${GLOSSARY_ORIGIN_STYLE[t.origin]}`}
                        >
                          {GLOSSARY_ORIGIN_LABEL[t.origin]}
                        </span>
                        {t.unit && (
                          <span className="ml-auto text-[11px] text-foreground/50">{t.unit}</span>
                        )}
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-foreground/70">{t.short}</p>
                      <div className="mt-3 rounded-lg bg-muted/60 p-3">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-foreground/50">
                          Como calculamos
                        </p>
                        <p className="mt-1 text-sm leading-relaxed text-foreground/70">{t.how}</p>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Complemento LandMap (fora da referência — volta ao mapa). */}
        <div className="mt-10">
          <Link
            href={lh('/dashboard')}
            className="inline-flex h-10 items-center rounded-lg bg-[var(--primary)] px-5 text-sm font-medium text-[var(--primary-foreground)] transition hover:bg-[var(--primary)]/90"
          >
            Abrir o mapa
          </Link>
        </div>
      </section>
    </PublicPageShell>
  );
}
