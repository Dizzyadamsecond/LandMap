'use client';

import { useState } from 'react';
import { RequireAuth } from '../../../../components/RequireAuth';
import { Zap, Plus, Trash2 } from '../../../../components/lovable/icons';
import Link from 'next/link';
import { useParams } from 'next/navigation';

function AdminFeatureFlagsPageInner() {
  const params = useParams();
  const locale = (params.locale as string) || 'pt-BR';
  const [flags, setFlags] = useState([
    { id: 'feature_new_map', name: 'New Map UI', enabled: true, rollout: 100, description: 'New map interface' },
    { id: 'feature_chat_v2', name: 'Chat V2', enabled: true, rollout: 50, description: 'Improved chat' },
    { id: 'feature_ai_suggestions', name: 'AI Suggestions', enabled: false, rollout: 0, description: 'AI-powered recommendations' },
  ]);

  const handleToggle = (id: string) => {
    setFlags(flags.map((f) => (f.id === id ? { ...f, enabled: !f.enabled } : f)));
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--primary)]">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">Feature Flags</h1>
            <p className="mt-1 text-[var(--muted-foreground)]">Controlar rollout de features</p>
          </div>
        </div>
      </header>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
        <h3 className="text-sm font-semibold text-[var(--foreground)]">Flags</h3>
        <div className="mt-4 space-y-3">
          {flags.map((flag) => (
            <div key={flag.id} className="flex items-center justify-between gap-3 rounded-lg border border-[var(--border)] bg-[var(--muted)] px-4 py-3">
              <div className="flex-1">
                <p className="text-sm font-medium text-[var(--foreground)]">{flag.name}</p>
                <p className="text-xs text-[var(--muted-foreground)]">{flag.description}</p>
                <p className="mt-1 text-xs text-[var(--muted-foreground)]">Rollout: {flag.rollout}%</p>
              </div>
              <button
                onClick={() => handleToggle(flag.id)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                  flag.enabled
                    ? 'bg-success/20 text-success'
                    : 'bg-gray-500/20 text-gray-700'
                }`}
              >
                {flag.enabled ? 'ON' : 'OFF'}
              </button>
              <button className="text-[var(--muted-foreground)] transition hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AdminFeatureFlagsPage() {
  return (
    <RequireAuth>
      <AdminFeatureFlagsPageInner />
    </RequireAuth>
  );
}
