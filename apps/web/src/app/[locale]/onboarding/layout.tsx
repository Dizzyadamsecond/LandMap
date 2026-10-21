import type { Metadata } from 'next';
import { LANDMAP_OG_IMAGE } from '../../../lib/og-image';

export async function generateMetadata({ params }: { params: Promise<{ locale?: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://landmapwebprod2.vercel.app';
  return {
    title: 'LandMap — Inteligência territorial baseada em dados',
    description: 'LandMap organiza dados territoriais, indicadores urbanos e dados de mercado para decisões de terreno no Brasil.',
    openGraph: {
      title: 'LandMap — Inteligência territorial baseada em dados',
      description: 'Score de regiões, valorização histórica e camadas urbanas para decisões de terreno no Brasil.',
      url: `/${locale}/onboarding`,
      type: 'website',
      locale: locale,
      images: [{ url: LANDMAP_OG_IMAGE, width: 1200, height: 630, alt: 'LandMap — Inteligência territorial baseada em dados' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'LandMap — Inteligência de terrenos',
      description: 'LandMap: mapa de valorização, ranking de regiões e histórico de preço por m² para decisões de terreno no Brasil.',
      images: [LANDMAP_OG_IMAGE],
    },
  };
}

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
