'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useReducedMotion,
} from 'framer-motion';

/* ------------------------------------------------------------------ *
 * LandMap — Surreal Launch Presentation
 * Indigo mono-dark, on-brand (var(--primary) / --background / --ring).
 * Framer Motion 11. Scroll-driven parallax, morphing gradient orbs,
 * kinetic logo bloom, magnetic text reveal, staggered feature cards.
 * Fully neutralized under prefers-reduced-motion.
 * ------------------------------------------------------------------ */

const COL = {
  primary: 'var(--primary)',
  ring: 'var(--ring)',
  muted: 'var(--muted-foreground)',
};

const FEATURES = [
  { k: 'Mapa de valorização', d: 'Ranking de regiões A–F com heat API em tempo real.' },
  { k: 'Histórico de preço /m²', d: 'Séries de 20 cidades, investor-grade.' },
  { k: 'Dossier de região', d: 'Demografia, ROI e liquidez num toque.' },
  { k: 'RAG + Chat', d: 'Pergunte à inteligência do terreno.' },
  { k: 'Agentes autônomos', d: 'Follow-up, cold recovery e WABA em auto-loop.' },
  { k: 'Multi-idioma', d: 'pt-BR · en-US · es-ES nativo.' },
];

type SeedItem = {
  id: string;
  title: string;
  city: string;
  state: string;
  price: number;
  areaM2: number;
  pricePerM2: number;
  type: 'apartamento' | 'casa' | 'terreno' | 'comercial';
  status: string;
  neighborhood?: string;
};

const STATIC_FALLBACK: SeedItem[] = [
  { id: 'seed-1', title: 'Lote Planalto', city: 'Fortaleza', state: 'CE', price: 180000, areaM2: 250, pricePerM2: 720, type: 'terreno', status: 'available', neighborhood: 'Meireles' },
  { id: 'seed-2', title: 'Apartamento Aldeota', city: 'Fortaleza', state: 'CE', price: 620000, areaM2: 85, pricePerM2: 7294, type: 'apartamento', status: 'available', neighborhood: 'Aldeota' },
  { id: 'seed-3', title: 'Casa Cocó', city: 'Fortaleza', state: 'CE', price: 950000, areaM2: 160, pricePerM2: 5937, type: 'casa', status: 'available', neighborhood: 'Cocó' },
  { id: 'seed-4', title: 'Terreno Guararapes', city: 'Fortaleza', state: 'CE', price: 210000, areaM2: 300, pricePerM2: 700, type: 'terreno', status: 'available', neighborhood: 'Guararapes' },
  { id: 'seed-5', title: 'Flat Praia do Futuro', city: 'Fortaleza', state: 'CE', price: 390000, areaM2: 55, pricePerM2: 7090, type: 'apartamento', status: 'available', neighborhood: 'Praia do Futuro' },
  { id: 'seed-6', title: 'Sobrado Fátima', city: 'Fortaleza', state: 'CE', price: 780000, areaM2: 140, pricePerM2: 5571, type: 'casa', status: 'available', neighborhood: 'Fátima' },
];

let cachedSeed: SeedItem[] | null = null;
let seedPromise: Promise<SeedItem[]> | null = null;

function getOrCreateSeedPromise(): Promise<SeedItem[]> {
  if (cachedSeed) return Promise.resolve(cachedSeed);
  if (!seedPromise) {
    seedPromise = fetch('/api/markdowns?limit=20', { cache: 'no-store' })
      .then((res) => {
        if (!res.ok) throw new Error(`API ${res.status}`);
        return res.json() as Promise<{ items?: Array<{
          id: string; title: string; city: string; state: string; price: number; areaM2: number;
          pricePerM2?: number; type: SeedItem['type']; status: string; neighborhood?: string;
        }> }>;
      })
      .then((data) => {
        const items = (data.items ?? [])
          .filter((item): item is SeedItem => !!item.id && typeof item.price === 'number' && typeof item.areaM2 === 'number')
          .map((item) => ({
            ...item,
            pricePerM2: item.pricePerM2 ?? Math.round(item.price / Math.max(1, item.areaM2)),
          }));
        cachedSeed = items.length > 0 ? items : STATIC_FALLBACK;
        return cachedSeed;
      })
      .catch(() => STATIC_FALLBACK);
  }
  return seedPromise;
}

function getLaunchSeedSync(): SeedItem[] {
  return cachedSeed ?? STATIC_FALLBACK;
}

export function useLaunchSeed() {
  const [seed, setSeed] = useState<SeedItem[]>(getLaunchSeedSync);
  const [status, setStatus] = useState<'ready' | 'loading' | 'fallback'>(() => cachedSeed ? 'ready' : 'fallback');

  useEffect(() => {
    let active = true;
    setStatus('loading');
    getOrCreateSeedPromise().then((items) => {
      if (!active) return;
      cachedSeed = items;
      setSeed(items);
      setStatus(items === STATIC_FALLBACK ? 'fallback' : 'ready');
    });
    return () => {
      active = false;
    };
  }, []);

  return { seed, status };
}

export default function LaunchPage({ params }: { params: { locale: string } }) {
  const reduce = useReducedMotion() ?? false;
  const root = useRef<HTMLDivElement>(null);
  const { seed, status } = useLaunchSeed();

  const { scrollYProgress } = useScroll({
    target: root,
    offset: ['start start', 'end end'],
  });
  const smooth = useSpring(scrollYProgress, { stiffness: 80, damping: 24 });

  const orbY1 = useTransform(smooth, [0, 1], [0, -260]);
  const orbY2 = useTransform(smooth, [0, 1], [0, 180]);
  const orbScale = useTransform(smooth, [0, 0.5, 1], [1, 1.6, 0.8]);
  const heroY = useTransform(smooth, [0, 0.4], [0, -120]);
  const heroOpacity = useTransform(smooth, [0, 0.35], [1, 0]);
  const gridOpacity = useTransform(smooth, [0, 0.6], [0.18, 0.02]);

  const spotlight = useMemo(() => {
    if (status === 'loading') return null;
    return seed.filter((item) => item.price > 0 && item.areaM2 > 0).slice(0, 6);
  }, [status, seed]);

  return (
    <div
      ref={root}
      style={{
        position: 'relative',
        background: 'var(--background)',
        color: 'var(--foreground)',
        fontFamily: 'var(--font-sans)',
        overflow: 'hidden',
      }}
    >
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <motion.div
          style={{
            position: 'absolute',
            top: '-20%',
            left: '-10%',
            width: 'min(620px, 72vw)',
            height: 'min(620px, 72vw)',
            borderRadius: '50%',
            background: 'radial-gradient(circle at 30% 30%, color-mix(in srgb, var(--primary) 70%, transparent), transparent 70%)',
            filter: 'blur(80px)',
            y: reduce ? 0 : orbY1,
            scale: reduce ? 1 : orbScale,
            opacity: 0.55,
          }}
        />
        <motion.div
          style={{
            position: 'absolute',
            bottom: '-25%',
            right: '-15%',
            width: 'min(520px, 66vw)',
            height: 'min(520px, 66vw)',
            borderRadius: '50%',
            background: 'radial-gradient(circle at 70% 70%, color-mix(in srgb, var(--ring) 60%, transparent), transparent 70%)',
            filter: 'blur(90px)',
            y: reduce ? 0 : orbY2,
            opacity: 0.45,
          }}
        />
        <motion.div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'linear-gradient(to right, color-mix(in srgb, var(--foreground) 8%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in srgb, var(--foreground) 8%, transparent) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
            opacity: reduce ? 0.1 : 1,
            // @ts-expect-error -- framer style
            '--grid-op': gridOpacity,
            maskImage: 'radial-gradient(circle at 50% 40%, black, transparent 80%)',
          }}
        />
      </div>

      <section
        style={{
          position: 'relative',
          zIndex: 2,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '0 24px',
        }}
      >
        <motion.div
          style={{ y: reduce ? 0 : heroY, opacity: reduce ? 1 : heroOpacity }}
        >
          <RevealWord reduce={reduce} text="LANDMAP" size={84} />
          <motion.p
            initial={reduce ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.8 }}
            style={{
              marginTop: 18,
              color: COL.muted,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              fontSize: 13,
              fontFamily: 'var(--font-display)',
            }}
          >
            Inteligência de terrenos
          </motion.p>

          <motion.div
            initial={reduce ? false : { opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.2, duration: 0.9, type: 'spring', stiffness: 120 }}
            style={{ marginTop: 40, display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}
          >
            <Pill>pt-BR</Pill>
            <Pill>en-US</Pill>
            <Pill>es-ES</Pill>
          </motion.div>

          <motion.div
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.6, duration: 1 }}
            style={{ marginTop: 64, color: COL.muted, fontSize: 13 }}
          >
            role ↓ para revelar
          </motion.div>
        </motion.div>
      </section>

      <section style={sectionStyle}>
        <OrbMorph reduce={reduce} />
        <RevealText reduce={reduce} delay={0.1}>
          O mapa que pensa
          <br />
          como um investidor.
        </RevealText>
        <RevealText reduce={reduce} delay={0.35} sub>
          Cada região ganha vida — gradientes que respiram, dados que flutuam.
        </RevealText>
      </section>

      <section style={{ ...sectionStyle, minHeight: 'auto', padding: '120px 24px' }}>
        <RevealText reduce={reduce} delay={0}>
          Tudo num só lugar
        </RevealText>
        <div
          style={{
            marginTop: 56,
            maxWidth: 980,
            width: '100%',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 20,
          }}
        >
          {FEATURES.map((f, i) => (
            <FeatureCard key={f.k} reduce={reduce} index={i} title={f.k} desc={f.d} />
          ))}
        </div>
      </section>

      <section style={{ ...sectionStyle, minHeight: '70vh' }}>
        <RevealText reduce={reduce} delay={0}>
          Dados reais, não placeholders.
        </RevealText>
        <motion.p
          initial={reduce ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-10%' }}
          transition={{ delay: 0.1, duration: 0.8 }}
          style={{ marginTop: 18, color: COL.muted, maxWidth: 640, textAlign: 'center', lineHeight: 1.55 }}
        >
          A apresentação agora consome o catálogo real do LandMap via <code style={{ color: 'var(--primary)' }}>/api/markdowns</code>.
          A lista abaixo atualiza automaticamente quando o dataset mudar; enquanto isso, usamos um fallback determinístico.
        </motion.p>

        <div
          style={{
            marginTop: 64,
            width: '100%',
            maxWidth: 980,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 16,
          }}
        >
          {spotlight?.map((item, i) => (
            <motion.div
              key={item.id}
              initial={reduce ? false : { opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-10%' }}
              transition={{ delay: (i % 6) * 0.06, duration: 0.65 }}
              whileHover={reduce ? undefined : { y: -6, scale: 1.02 }}
              style={{
                position: 'relative',
                padding: 22,
                borderRadius: 20,
                border: '1px solid color-mix(in srgb, var(--ring) 28%, transparent)',
                background: 'color-mix(in srgb, var(--primary) 5%, var(--card, transparent))',
                backdropFilter: 'blur(10px)',
                textAlign: 'left',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: 3,
                  background: 'linear-gradient(90deg, var(--primary), transparent)',
                  transformOrigin: 'left',
                }}
              />
              <p style={{ margin: 0, fontSize: 11, letterSpacing: '0.18em', color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>
                {item.neighborhood ?? item.city} · {item.state}
              </p>
              <p style={{ margin: '8px 0 6px', fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 600, color: 'var(--foreground)' }}>
                {item.title}
              </p>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--muted-foreground)', lineHeight: 1.5 }}>
                {item.type === 'terreno' ? 'Lote' : item.type === 'apartamento' ? 'Apartamento' : item.type === 'casa' ? 'Casa' : 'Comercial'} · {(item.areaM2 ?? 0).toLocaleString('pt-BR')} m²
              </p>
              <p style={{ margin: '8px 0 0', fontSize: 14, fontWeight: 600, color: 'var(--foreground)' }}>
                R$ {(item.price ?? 0).toLocaleString('pt-BR')}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      <section style={{ ...sectionStyle, minHeight: '70vh' }}>
        <RevealText reduce={reduce} delay={0}>
          Pronto para lançar.
        </RevealText>
        <motion.a
          href={`/${params.locale}/map`}
          initial={reduce ? false : { opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          whileHover={reduce ? undefined : { scale: 1.06 }}
          whileTap={reduce ? undefined : { scale: 0.97 }}
          style={{
            marginTop: 40,
            display: 'inline-block',
            padding: '16px 38px',
            borderRadius: 999,
            background: 'var(--primary)',
            color: 'var(--primary-foreground)',
            fontFamily: 'var(--font-display)',
            fontWeight: 600,
            fontSize: 16,
            textDecoration: 'none',
            boxShadow: '0 0 40px color-mix(in srgb, var(--primary) 50%, transparent)',
          }}
        >
          Abrir o mapa →
        </motion.a>
      </section>

      <footer
        style={{
          position: 'relative',
          zIndex: 2,
          textAlign: 'center',
          padding: '40px 24px 64px',
          color: COL.muted,
          fontSize: 12,
          letterSpacing: '0.1em',
        }}
      >
        LandMap · lançamento 2026
      </footer>
    </div>
  );
}

/* ---------- pieces ---------- */

function RevealWord({ reduce, text, size }: { reduce: boolean; text: string; size: number }) {
  return (
    <h1
      style={{
        margin: 0,
        fontFamily: 'var(--font-display)',
        fontWeight: 700,
        fontSize: size,
        lineHeight: 1,
        letterSpacing: '-0.03em',
        background: 'linear-gradient(180deg, var(--foreground), color-mix(in srgb, var(--primary) 80%, var(--foreground)))',
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        color: 'transparent',
      }}
    >
      {text.split('').map((c, i) => (
        <motion.span
          key={i}
          initial={reduce ? false : { opacity: 0, y: 60, rotateX: -90 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ delay: 0.04 * i, duration: 0.7, type: 'spring', stiffness: 140 }}
          style={{ display: 'inline-block', transformOrigin: 'bottom' }}
        >
          {c}
        </motion.span>
      ))}
    </h1>
  );
}

function RevealText({
  reduce,
  delay,
  sub,
  children,
}: {
  reduce: boolean;
  delay: number;
  sub?: boolean;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 40, filter: 'blur(8px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '-15%' }}
      transition={{ delay, duration: 0.9 }}
      style={{
        fontFamily: sub ? 'var(--font-sans)' : 'var(--font-display)',
        fontSize: sub ? 18 : 44,
        fontWeight: sub ? 400 : 600,
        lineHeight: 1.15,
        color: sub ? 'var(--muted-foreground)' : 'var(--foreground)',
        maxWidth: 760,
        textAlign: 'center',
      }}
    >
      {children}
    </motion.div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        padding: '8px 18px',
        borderRadius: 999,
        border: '1px solid color-mix(in srgb, var(--ring) 50%, transparent)',
        fontSize: 13,
        fontFamily: 'var(--font-display)',
        color: 'var(--foreground)',
        background: 'color-mix(in srgb, var(--primary) 8%, transparent)',
      }}
    >
      {children}
    </span>
  );
}

function OrbMorph({ reduce }: { reduce: boolean }) {
  return (
    <motion.div
      initial={reduce ? false : { scale: 0, rotate: -180, opacity: 0 }}
      whileInView={{ scale: 1, rotate: 0, opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 1.4, type: 'spring', stiffness: 60 }}
      style={{
        width: 260,
        height: 260,
        borderRadius: '42% 58% 63% 37% / 41% 44% 56% 59%',
        background: 'conic-gradient(from 0deg, color-mix(in srgb, var(--primary) 90%, transparent), color-mix(in srgb, var(--ring) 90%, transparent), color-mix(in srgb, var(--primary) 90%, transparent))',
        filter: 'blur(6px)',
        marginBottom: 48,
        boxShadow: '0 0 90px color-mix(in srgb, var(--primary) 55%, transparent)',
        animate: reduce
          ? undefined
          : {
              borderRadius: [
                '42% 58% 63% 37% / 41% 44% 56% 59%',
                '63% 37% 41% 59% / 58% 63% 37% 42%',
                '42% 58% 63% 37% / 41% 44% 56% 59%',
              ],
            },
        // @ts-expect-error -- framer style
        transition: reduce ? undefined : { duration: 8, repeat: Infinity, ease: 'easeInOut' },
      }}
    />
  );
}

function FeatureCard({
  reduce,
  index,
  title,
  desc,
}: {
  reduce: boolean;
  index: number;
  title: string;
  desc: string;
}) {
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-10%' }}
      transition={{ delay: (index % 3) * 0.08, duration: 0.6 }}
      whileHover={reduce ? undefined : { y: -8, scale: 1.02 }}
      style={{
        position: 'relative',
        padding: 26,
        borderRadius: 18,
        border: '1px solid color-mix(in srgb, var(--ring) 30%, transparent)',
        background: 'color-mix(in srgb, var(--primary) 6%, var(--card, transparent))',
        backdropFilter: 'blur(8px)',
        textAlign: 'left',
        overflow: 'hidden',
      }}
    >
      <motion.div
        initial={reduce ? false : { scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.2 + index * 0.05, duration: 0.7 }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: 3,
          background: 'linear-gradient(90deg, var(--primary), transparent)',
          transformOrigin: 'left',
        }}
      />
      <h3
        style={{
          margin: '0 0 10px',
          fontFamily: 'var(--font-display)',
          fontSize: 19,
          fontWeight: 600,
          color: 'var(--foreground)',
        }}
      >
        {title}
      </h3>
      <p style={{ margin: 0, color: 'var(--muted-foreground)', fontSize: 14, lineHeight: 1.5 }}>
        {desc}
      </p>
    </motion.div>
  );
}

const sectionStyle: React.CSSProperties = {
  position: 'relative',
  zIndex: 2,
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '0 24px',
  textAlign: 'center',
};
