'use client';

import Link from 'next/link';

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[var(--background)] px-6 text-[var(--foreground)]">
      <div className="max-w-md text-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mx-auto text-[var(--muted-foreground)]"
        >
          <path d="M1 1l22 22" />
          <path d="M16.72 11.06A10.94 10.94 0 0119 12.55" />
          <path d="M5 12.55a10.94 10.94 0 015.17-2.39" />
          <path d="M10.71 5.05A16 16 0 0122.56 9" />
          <path d="M1.42 9a15.91 15.91 0 014.7-2.88" />
          <path d="M8.53 16.11a6 6 0 016.95 0" />
          <line x1="12" y1="20" x2="12.01" y2="20" />
        </svg>

        <h1 className="mt-6 text-xl font-semibold tracking-tight">
          Sem conexão
        </h1>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          Verifique sua internet e tente novamente.
        </p>

        <div className="mt-8 flex items-center justify-center gap-3">
          <button
            onClick={() => window.location.reload()}
            className="inline-flex h-10 items-center rounded-lg bg-[var(--primary)] px-5 text-sm font-medium text-[var(--primary-foreground)] transition hover:bg-[var(--primary)]/90"
          >
            Recarregar
          </button>
          <Link
            href="/"
            className="inline-flex h-10 items-center rounded-lg border border-[var(--border)] px-5 text-sm font-medium text-[var(--foreground)] transition hover:border-[var(--primary)]"
          >
            Início
          </Link>
        </div>
      </div>
    </main>
  );
}
