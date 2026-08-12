import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { getLocale } from 'next-intl/server';
import { LANDMAP_OG_IMAGE } from '../lib/og-image';

// NOTE: We intentionally do NOT use `next/font` (nor the `geist` package it
// wraps). On this Windows + Node 24 environment, next/font's loader imports a
// generated module by an absolute `c:\\...` path, which Node's ESM loader
// rejects with ERR_UNSUPPORTED_ESM_URL_SCHEME — crashing every page render in
// both `next dev` and `next build`. Instead we load only DM Sans + Space
// Grotesk via Google Fonts <link>. Map them to `--font-sans` / `--font-display`
// in globals.css; `--font-mono` uses the system mono stack.

export const dynamic = 'force-dynamic';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#4F46E5',
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  manifest: '/manifest.json',
  applicationName: 'LandMap',
  themeColor: '#4F46E5',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'LandMap',
  },
  icons: {
    icon: '/favicon.svg',
    apple: '/icons/apple-touch-icon.png',
  },
  openGraph: {
    title: 'LandMap — Inteligência de terrenos',
    description:
      'LandMap: mapa de valorização, ranking de regiões e histórico de preço por m² para decisões de terreno no Brasil.',
    type: 'website',
    images: [{ url: LANDMAP_OG_IMAGE, width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LandMap — Inteligência de terrenos',
    description:
      'LandMap: mapa de valorização, ranking de regiões e histórico de preço por m² para decisões de terreno no Brasil.',
    images: [LANDMAP_OG_IMAGE],
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const plausibleDomain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;

  return (
    <html lang={locale}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Fontes via Google Fonts <link> (DM Sans + Space Grotesk) — intencional por CLAUDE.md: next/font quebra ESM em Windows+Node24 */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap"
        />
        {plausibleDomain ? (
          <Script
            defer
            data-domain={plausibleDomain}
            src="https://plausible.io/js/script.js"
            strategy="afterInteractive"
          />
        ) : null}
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      </head>
      <body>
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}

import PwaRegister from './pwa-register';
