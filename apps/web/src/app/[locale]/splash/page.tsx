'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { LandMapWordmark } from '../../../components/lovable/icons';

export default function SplashPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale || 'pt-BR';

  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('Iniciando o LandMap Engine...');

  useEffect(() => {
    const duration = 2500; // 2.5 seconds total
    const intervalTime = 30; // ms
    const increment = 100 / (duration / intervalTime);

    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = prev + increment;
        if (next >= 100) {
          clearInterval(timer);
          // Redirect on complete
          router.replace(`/${locale}/onboarding`);
          return 100;
        }
        
        // Update status text based on progress
        if (next < 25) {
          setStatusText('Inicializando módulos do Atlas...');
        } else if (next < 50) {
          setStatusText('Carregando topografia do território nacional...');
        } else if (next < 75) {
          setStatusText('Sincronizando índices regionais em tempo real...');
        } else {
          setStatusText('Otimizando modelos de sensibilidade financeira...');
        }

        return next;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [router, locale]);

  return (
    <main className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden bg-[var(--background)] px-6 text-[var(--foreground)]">
      {/* Subtle background grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-15"
      />
      {/* Glow background */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/3 -z-10 h-[42rem] w-[42rem] -translate-x-1/2 rounded-full bg-[var(--primary)]/10 blur-3xl"
      />

      {/* Skip button top right */}
      <div className="absolute top-6 right-6">
        <button
          onClick={() => router.replace(`/${locale}/onboarding`)}
          className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition"
        >
          Pular Animação
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col items-center text-center w-full max-w-sm space-y-8"
      >
        <LandMapWordmark className="h-10 text-[var(--primary)] animate-pulse" />

        <div className="w-full space-y-3">
          {/* Progress bar container */}
          <div className="h-1.5 w-full bg-[var(--border)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--primary)] transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-[var(--muted-foreground)] px-1">
            <span className="font-medium animate-pulse">{statusText}</span>
            <span className="font-mono font-bold">{Math.round(progress)}%</span>
          </div>
        </div>
      </motion.div>

      <p className="absolute bottom-6 text-[10px] uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
        LandMap · Inteligência Territorial Aberta
      </p>
    </main>
  );
}
