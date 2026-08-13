import type { Metadata } from 'next';
import WorldMonitorPage from '../../../components/WorldMonitorPage';

export const dynamic = 'force-dynamic';

const SEO: Record<string, { title: string; description: string }> = {
  'pt-BR': {
    title: 'WorldMonitor — Oportunidades solares e data centers | LandMap',
    description:
      'Monitoramento 24/7 com dados reais (Open-Meteo, OpenStreetMap e WRI): potencial solar por cidade, infraestrutura de data centers e score de oportunidade A–F alimentado por um modelo PyTorch.',
  },
  'en-US': {
    title: 'WorldMonitor — Solar & data center opportunities | LandMap',
    description:
      '24/7 monitoring with real data (Open-Meteo, OpenStreetMap and WRI): solar potential per city, data center infrastructure and A–F opportunity scores powered by a PyTorch model.',
  },
  'es-ES': {
    title: 'WorldMonitor — Oportunidades solares y data centers | LandMap',
    description:
      'Monitoreo 24/7 con datos reales (Open-Meteo, OpenStreetMap y WRI): potencial solar por ciudad, infraestructura de data centers y score de oportunidad A–F impulsado por un modelo PyTorch.',
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
      canonical: `${siteUrl}/${l}/worldmonitor`,
      languages: {
        'pt-BR': `${siteUrl}/pt-BR/worldmonitor`,
        'en-US': `${siteUrl}/en-US/worldmonitor`,
        'es-ES': `${siteUrl}/es-ES/worldmonitor`,
        'x-default': `${siteUrl}/pt-BR/worldmonitor`,
      },
    },
    openGraph: {
      title: seo.title,
      description: seo.description,
      url: `${siteUrl}/${l}/worldmonitor`,
      siteName: 'LandMap',
      type: 'website',
      locale: l,
    },
    other: {
      'application/ld+json': JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'LandMap', item: `${siteUrl}/${l}` },
          { '@type': 'ListItem', position: 2, name: 'WorldMonitor', item: `${siteUrl}/${l}/worldmonitor` },
        ],
      }),
    },
  };
}

export default function WorldMonitorRoute() {
  return <WorldMonitorPage />;
}
