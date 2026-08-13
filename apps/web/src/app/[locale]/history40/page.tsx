import type { Metadata } from 'next';
import History40Page from '../../../components/History40Page';

export const dynamic = 'force-dynamic';

const SEO: Record<string, { title: string; description: string }> = {
  'pt-BR': {
    title: 'History40 — 40 anos de economia em tempo real | LandMap',
    description:
      'Séries macroeconômicas reais de 1986 até hoje (Bacen SGS): CDI, IPCA, Selic, INPC, IGP-M, IGP-DI, INCC-DI e IPCA-15 — em tempo real via WebSocket/SSE, com gráficos interativos de 40 anos.',
  },
  'en-US': {
    title: 'History40 — 40 years of economics in real time | LandMap',
    description:
      'Real macroeconomic series from 1986 to today (Brazil Central Bank): CDI, IPCA, Selic, INPC, IGP-M, IGP-DI, INCC-DI and IPCA-15 — streamed live over WebSocket/SSE with 40-year interactive charts.',
  },
  'es-ES': {
    title: 'History40 — 40 años de economía en tiempo real | LandMap',
    description:
      'Series macroeconómicas reales de 1986 hasta hoy (Banco Central de Brasil): CDI, IPCA, Selic, INPC, IGP-M, IGP-DI, INCC-DI e IPCA-15 — en tiempo real vía WebSocket/SSE con gráficos interactivos de 40 años.',
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale?: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://landmapprod.vercel.app';
  const l = locale || 'pt-BR';
  const seo = SEO[l] || SEO['pt-BR'];

  return {
    title: seo.title,
    description: seo.description,
    alternates: {
      canonical: `${siteUrl}/${l}/history40`,
      languages: {
        'pt-BR': `${siteUrl}/pt-BR/history40`,
        'en-US': `${siteUrl}/en-US/history40`,
        'es-ES': `${siteUrl}/es-ES/history40`,
        'x-default': `${siteUrl}/pt-BR/history40`,
      },
    },
    openGraph: {
      title: seo.title,
      description: seo.description,
      url: `${siteUrl}/${l}/history40`,
      siteName: 'LandMap',
      type: 'website',
      locale: l,
    },
  };
}

export default function History40Route() {
  return <History40Page />;
}
