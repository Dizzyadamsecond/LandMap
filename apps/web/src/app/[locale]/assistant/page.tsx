'use client';

import Link from 'next/link';
import { useLocale } from 'next-intl';
import {
  Sparkles,
  MessageSquare,
  PenLine,
  BookOpen,
  Workflow,
  Bot,
  Star,
  Activity,
  LandMapWordmark,
  ArrowLeft,
  MapPin,
  Layers,
  GitCompare,
  BellRing,
  FileText,
} from '../../../components/lovable/icons';
import { Reveal } from '../../../components/Motion';
import { Card, Badge, Stat, buttonVariants, cn } from '@landmap/ui';

const FEATURES = [
  { href: 'chat', icon: MessageSquare, title: 'LandBot', desc: 'Chat ancorado nas regiões do mapa.' },
  { href: 'writer', icon: PenLine, title: 'Redator IA', desc: 'Descrições com Score e m² reais.' },
  { href: 'rag', icon: BookOpen, title: 'Base RAG', desc: 'Perguntas com fontes locais.' },
  { href: 'automations', icon: Workflow, title: 'Automações', desc: 'Regras sobre camadas e leads.' },
  { href: 'agents', icon: Bot, title: 'Agentes', desc: 'Catálogo de especialistas.' },
  { href: 'recommendations', icon: Star, title: 'Recomendações', desc: 'Matching por Score LandMap.' },
  { href: 'pipeline', icon: Activity, title: 'Pipeline IA', desc: 'Ingestão → score → CRM.' },
  { href: 'knowledge', icon: BookOpen, title: 'Conhecimento', desc: 'Playbooks e docs internos.' },
  { href: 'workflows', icon: Workflow, title: 'Fluxos', desc: 'Orquestrações multi-passo.' },
];

export default function AssistantPage() {
  const locale = useLocale();
  const lh = (p: string) => `/${locale}${p}`;
  const hubLinks = [
    { href: lh('/map'), icon: Layers, label: 'Mapa' },
    { href: lh('/compare'), icon: GitCompare, label: 'Comparar' },
    { href: lh('/alerts'), icon: BellRing, label: 'Alertas' },
    { href: lh('/reports'), icon: FileText, label: 'Relatórios' },
  ];

  return (
    <main className="mx-auto grid min-h-screen max-w-7xl gap-6 bg-background px-4 py-6 xl:grid-cols-[16rem_minmax(0,1fr)]">
      <aside className="space-y-3 self-start">
        <div className="rounded-3xl border border-border/50 bg-card p-4 shadow-sm backdrop-blur">
          <div className="flex items-center justify-between">
            <Link
              href={lh('/map')}
              aria-label="Voltar"
              className="grid h-9 w-9 place-items-center rounded-full transition hover:bg-muted"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <LandMapWordmark />
          </div>
          <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Sparkles className="h-3 w-3" /> Suite de IA LandMap
          </div>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight">
            Seu assistente imobiliário
          </h1>
          <p className="mt-2 text-sm text-foreground/60">
            Chat, RAG, automações e agentes — mesmo design system do mapa intelligence.
          </p>
          <Link href={lh('/map')} className={cn(buttonVariants({ size: 'sm' }), 'mt-4 w-full')}>
            <MapPin className="mr-1 h-3.5 w-3.5" /> Ir ao mapa
          </Link>
        </div>

        <div className="rounded-3xl border border-border/50 bg-card p-4 shadow-sm backdrop-blur">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-foreground/50">Hub</p>
          <div className="mt-3 space-y-2">
            {hubLinks.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-2 rounded-2xl border border-border/50 bg-background/70 px-3 py-2.5 text-sm transition hover:border-primary/30 hover:bg-primary/5"
                >
                  <Icon className="h-3.5 w-3.5 text-primary" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </aside>

      <section className="space-y-6">
      <section className="grid grid-cols-3 gap-3">
        <Stat label="Módulos" value={String(FEATURES.length)} />
        <Stat label="Regiões" value="9+" />
        <Stat label="Padrão" value="Lovable" />
      </section>

      <Reveal className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {FEATURES.map((f) => (
          <Card key={f.href} variant="interactive">
            <Link href={lh(`/${f.href}`)} className="flex items-start gap-3 p-1">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                <f.icon className="h-4 w-4" />
              </span>
              <div>
                <p className="font-semibold">{f.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{f.desc}</p>
              </div>
            </Link>
          </Card>
        ))}
      </Reveal>
      </section>
    </main>
  );
}
