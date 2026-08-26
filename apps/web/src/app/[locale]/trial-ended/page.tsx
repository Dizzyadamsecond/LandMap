'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowRight,
  Bell,
  Check,
  Clock,
  GitCompare,
  Lightbulb,
  MapPin,
  Sparkles,
  Star,
} from 'lucide-react';
import { LandMapWordmark } from '../../../components/lovable/icons';

const BENEFITS = [
  'Histórico completo das regiões',
  'Alertas inteligentes',
  'Radar de oportunidades',
  'Comparação entre bairros',
  'Avaliações automáticas de terrenos',
  'Relatórios exclusivos',
  'Novas oportunidades diariamente',
];

export default function TrialEndedPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'pt-BR';

  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState<{
    regions: number;
    favorites: number;
    compares: number;
    alerts: number;
    opportunities: number;
    hoursSaved: number;
  }>({
    regions: 14,
    favorites: 6,
    compares: 8,
    alerts: 3,
    opportunities: 12,
    hoursSaved: 18,
  });

  useEffect(() => {
    const t = window.setTimeout(() => setMounted(true), 60);
    return () => window.clearTimeout(t);
  }, []);

  const statItems = [
    { icon: MapPin, label: 'Regiões analisadas', value: String(stats.regions) },
    { icon: Star, label: 'Áreas favoritas salvas', value: String(stats.favorites) },
    { icon: GitCompare, label: 'Comparações realizadas', value: String(stats.compares) },
    { icon: Bell, label: 'Alertas recebidos', value: String(stats.alerts) },
    { icon: Lightbulb, label: 'Oportunidades identificadas', value: String(stats.opportunities) },
    {
      icon: Clock,
      label: 'Tempo estimado economizado',
      value: `${stats.hoursSaved} h`,
      note: 'estimativa baseada no seu uso',
    },
  ];

  const maxVal = Math.max(1, stats.regions, stats.favorites, stats.compares, stats.alerts, stats.opportunities);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="flex items-center justify-center border-b border-border/50 px-6 py-4">
        <LandMapWordmark />
      </header>

      <main className="mx-auto max-w-md px-6 pb-28 pt-12">
        <div
          className={`transition-all duration-700 ${
            mounted ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'
          }`}
        >
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[11.5px] font-medium text-primary">
            <Sparkles className="h-3 w-3" /> 7 dias completos
          </div>
          <h1 className="mt-4 font-display text-[30px] font-bold leading-[1.1] tracking-[-0.035em]">
            Seu teste gratuito chegou ao fim.
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-foreground/60">
            Durante os últimos 7 dias você descobriu como investir em terrenos com muito mais
            inteligência. Agora continue aproveitando todos os dados, análises e oportunidades que a
            LandMap oferece.
          </p>
        </div>

        <section className="mt-10">
          <h2 className="font-display text-[19px] font-bold tracking-[-0.02em]">
            Seu resumo na LandMap
          </h2>
          <div className="mt-4 space-y-2.5">
            {statItems.map((item, idx) => {
              const Icon = item.icon;
              const num = Number(item.value.replace(/\D/g, '')) || 0;
              const pct = Math.min(100, Math.round((num / maxVal) * 100));

              return (
                <div
                  key={item.label}
                  style={{ transitionDelay: `${120 + idx * 70}ms` }}
                  className={`overflow-hidden rounded-2xl border border-border/70 bg-card px-4 py-3.5 shadow-sm transition-all duration-700 ${
                    mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-[13.5px] text-foreground/70">
                          {item.label}
                        </span>
                        {item.note && (
                          <span className="block text-[11px] text-foreground/45">
                            {item.note}
                          </span>
                        )}
                      </span>
                    </div>
                    <span className="font-display text-[19px] font-bold tabular-nums tracking-tight text-primary">
                      {item.value}
                    </span>
                  </div>
                  <div className="mt-3 h-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary/70 transition-all duration-1000 ease-out"
                      style={{ width: mounted ? `${Math.max(8, pct)}%` : '0%' }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mt-10 rounded-2xl bg-primary px-5 py-6 text-primary-foreground shadow-md">
          <p className="font-display text-[17.5px] font-semibold leading-snug tracking-[-0.02em]">
            Você já viu o potencial da LandMap.
          </p>
          <p className="mt-2 text-[14px] leading-relaxed opacity-85">
            Agora transforme dados em decisões inteligentes e continue encontrando oportunidades
            antes do mercado.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="font-display text-[19px] font-bold tracking-[-0.02em]">
            Ao continuar com a LandMap você continuará tendo acesso a:
          </h2>
          <ul className="mt-4 space-y-2.5">
            {BENEFITS.map((benefit, idx) => (
              <li
                key={benefit}
                style={{ transitionDelay: `${100 + idx * 60}ms` }}
                className={`flex items-center gap-2.5 rounded-xl border border-border/60 bg-card px-4 py-3 text-[14px] text-foreground/80 transition-all duration-700 ${
                  mounted ? 'translate-x-0 opacity-100' : 'translate-x-3 opacity-0'
                }`}
              >
                <Check className="h-4 w-4 shrink-0 text-primary" />
                {benefit}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-10 rounded-2xl border border-border/70 bg-muted/40 p-5">
          <p className="text-[14px] leading-relaxed text-foreground/70">
            Todas as suas análises, regiões favoritas, histórico e configurações permanecerão salvos.
            Basta escolher um plano para continuar exatamente de onde você parou.
          </p>
        </section>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-md border-t border-border bg-background/98 px-6 py-4">
        <Link
          href={`/${locale}/plans`}
          className="flex w-full items-center justify-center rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
        >
          Continuar com a LandMap <ArrowRight className="ml-1.5 h-4 w-4" />
        </Link>
        <Link
          href={`/${locale}/auth`}
          className="mt-3 block w-full text-center text-[13px] font-medium text-primary transition hover:opacity-80"
        >
          Entrar com outra conta
        </Link>
        <Link
          href={`/${locale}/insights`}
          className="mt-2 block text-center text-[13px] text-foreground/50 hover:text-foreground"
        >
          Talvez depois
        </Link>
      </div>
    </div>
  );
}
