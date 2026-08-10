'use client';

import { useState } from 'react';
import { RequireAuth } from '../../../../components/RequireAuth';
import { Zap, Plus, Trash2 } from '../../../../components/lovable/icons';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface Experiment {
  id: string;
  name: string;
  hypothesis: string;
  variants: string[];
  status: 'draft' | 'running' | 'paused' | 'completed';
  startDate?: string;
  endDate?: string;
  winnerVariant?: string;
}

function AdminExperimentsPageInner() {
  const params = useParams();
  const locale = (params.locale as string) || 'pt-BR';
  const [experiments, setExperiments] = useState<Experiment[]>([
    {
      id: '1',
      name: 'Button Color Test',
      hypothesis: 'Blue CTA buttons increase click-through rate by 15%',
      variants: ['control (green)', 'treatment_a (blue)', 'treatment_b (red)'],
      status: 'running',
      startDate: '2026-07-15',
    },
    {
      id: '2',
      name: 'Hero Copy A/B',
      hypothesis: 'Shorter copy improves signup conversion',
      variants: ['control (long)', 'treatment_a (short)'],
      status: 'completed',
      startDate: '2026-06-01',
      endDate: '2026-07-01',
      winnerVariant: 'treatment_a (short)',
    },
  ]);

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', hypothesis: '', variants: '' });

  const handleAddExperiment = () => {
    if (!formData.name || !formData.hypothesis) return;
    const newExp: Experiment = {
      id: String(Date.now()),
      name: formData.name,
      hypothesis: formData.hypothesis,
      variants: formData.variants.split(',').map((v) => v.trim()),
      status: 'draft',
    };
    setExperiments([...experiments, newExp]);
    setFormData({ name: '', hypothesis: '', variants: '' });
    setShowForm(false);
  };

  const handleDeleteExperiment = (id: string) => {
    setExperiments(experiments.filter((e) => e.id !== id));
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--primary)]">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted-foreground)]">Teste</p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight text-[var(--foreground)]">Experimentos A/B</h1>
              <p className="mt-1 text-[var(--muted-foreground)]">Gerenciar testes, variantes e hipóteses.</p>
            </div>
          </div>
          <Link
            href={`/${locale}/admin`}
            className="inline-flex items-center rounded-full border border-[var(--border)] px-4 py-2 text-sm text-[var(--foreground)] transition hover:bg-[var(--muted)]"
          >
            Voltar
          </Link>
        </div>
      </header>

      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--muted-foreground)]">{experiments.length} experimentos</p>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 rounded-full bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] transition hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Novo experimento
        </button>
      </div>

      {showForm && (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Nome do experimento"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder-[var(--muted-foreground)]"
            />
            <textarea
              placeholder="Hipótese"
              value={formData.hypothesis}
              onChange={(e) => setFormData({ ...formData, hypothesis: e.target.value })}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder-[var(--muted-foreground)]"
              rows={2}
            />
            <input
              type="text"
              placeholder="Variantes (separadas por vírgula)"
              value={formData.variants}
              onChange={(e) => setFormData({ ...formData, variants: e.target.value })}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] placeholder-[var(--muted-foreground)]"
            />
            <div className="flex gap-2">
              <button
                onClick={handleAddExperiment}
                className="flex-1 rounded-lg bg-[var(--primary)] px-3 py-2 text-sm font-medium text-[var(--primary-foreground)] transition hover:opacity-90"
              >
                Criar
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 rounded-lg border border-[var(--border)] px-3 py-2 text-sm text-[var(--foreground)] transition hover:bg-[var(--muted)]"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {experiments.map((exp) => (
          <div key={exp.id} className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-[var(--foreground)]">{exp.name}</h3>
                  <span className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase ${
                    exp.status === 'running'
                      ? 'bg-success/20 text-success'
                      : exp.status === 'completed'
                        ? 'bg-primary/20 text-primary'
                        : 'bg-gray-500/20 text-gray-700'
                  }`}>
                    {exp.status}
                  </span>
                </div>
                <p className="mt-1 text-xs text-[var(--muted-foreground)]">{exp.hypothesis}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {exp.variants.map((v) => (
                    <span key={v} className="rounded-full bg-[var(--muted)] px-2 py-1 text-[10px] text-[var(--foreground)]">
                      {v}
                    </span>
                  ))}
                </div>
                {exp.winnerVariant && (
                  <p className="mt-2 text-xs text-[var(--foreground)]">
                    <span className="font-semibold">Vencedor:</span> {exp.winnerVariant}
                  </p>
                )}
              </div>
              <button
                onClick={() => handleDeleteExperiment(exp.id)}
                className="rounded-lg p-2 text-[var(--muted-foreground)] transition hover:bg-[var(--muted)] hover:text-destructive"
                title="Deletar"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminExperimentsPage() {
  return (
    <RequireAuth>
      <AdminExperimentsPageInner />
    </RequireAuth>
  );
}
