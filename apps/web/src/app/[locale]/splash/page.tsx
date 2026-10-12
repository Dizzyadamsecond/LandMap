import type { Metadata } from 'next';
import SplashClient from './splash-client';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale?: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  // 1:1 Paridade com a Lovable Live (https://landmap-insight.lovable.app/splash)
  const SEO: Record<string, { title: string; description: string }> = {
    'pt-BR': {
      title: 'LandMap',
      description: 'Inteligência territorial baseada em dados para decisões de terreno no Brasil.',
    },
    'en-US': {
      title: 'LandMap',
      description: 'Data-driven land intelligence for real estate decisions in Brazil.',
    },
    'es-ES': {
      title: 'LandMap',
      description: 'Inteligencia territorial basada en datos para decisiones de terrenos en Brasil.',
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
      url: `/${locale || 'pt-BR'}/splash`,
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

export default function SplashRoute() {
  return <SplashClient />;
}
