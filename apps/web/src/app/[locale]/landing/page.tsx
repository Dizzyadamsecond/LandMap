import type { Metadata } from 'next';
import LandingClient from './landing-client';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale?: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const SEO: Record<string, { title: string; description: string }> = {
    'pt-BR': {
      title: 'LandMap — Inteligência de terrenos',
      description:
        'LandMap: mapa de valorização, ranking de regiões e histórico de preço por m² para decisões de terreno no Brasil.',
    },
    'en-US': {
      title: 'LandMap — Land intelligence',
      description:
        'LandMap: appreciation map, region ranking and price-per-m² history for smarter land decisions in Brazil.',
    },
    'es-ES': {
      title: 'LandMap — Inteligencia de terrenos',
      description:
        'LandMap: mapa de valorización, ranking de regiones e historial de precio por m² para decisiones de terreno en Brasil.',
    },
  };
  const seo = SEO[locale || 'pt-BR'] || SEO['pt-BR'];
  const title = seo.title;
  const description = seo.description;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `/${locale || 'pt-BR'}/landing`,
      type: 'website',
      locale: locale || 'pt-BR',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default function LandingRoute() {
  return <LandingClient />;
}
