import type { Metadata } from 'next';
import { LANDMAP_OG_IMAGE } from '../../lib/og-image';

/**
 * Home pública (`/`) — no Lovable a raiz renderiza o splash
 * ("Conheça o LandMap"). Mantemos o mesmo conteúdo e metadata autoritativos.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale?: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  // Lovable home title shell = product brand, localized (1:1 with message files)
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
      url: `/${locale || 'pt-BR'}`,
      type: 'website',
      locale: locale || 'pt-BR',
      images: [
        {
          url: LANDMAP_OG_IMAGE,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [LANDMAP_OG_IMAGE],
    },
  };
}

import { redirect } from 'next/navigation';

export default async function LocaleHomePage({
  params,
}: {
  params: Promise<{ locale?: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale || 'pt-BR'}/splash`);
}
