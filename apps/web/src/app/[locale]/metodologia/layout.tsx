import type { Metadata } from 'next';
import { LANDMAP_OG_IMAGE } from '../../../lib/og-image';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale?: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://landmapprod.vercel.app';

  const SEO: Record<string, { title: string; description: string }> = {
    'pt-BR': {
      title: 'Metodologia — LandMap',
      description:
        'Como a LandMap organiza dados territoriais, calcula o preço por m² e constrói o LandMap Opportunity Score.',
    },
    'en-US': {
      title: 'Methodology — LandMap',
      description:
        'How LandMap organizes territorial data, calculates price per m² and builds the LandMap Opportunity Score.',
    },
    'es-ES': {
      title: 'Metodología — LandMap',
      description:
        'Cómo LandMap organiza datos territoriales, calcula el precio por m² y construye el LandMap Opportunity Score.',
    },
  };
  const seo = SEO[locale || 'pt-BR'] || SEO['pt-BR'];

  return {
    title: seo.title,
    description: seo.description,
    metadataBase: new URL(siteUrl),
    alternates: { canonical: `/${locale}/metodologia` },
    openGraph: {
      title: seo.title,
      description: seo.description,
      url: `/${locale}/metodologia`,
      siteName: 'LandMap',
      type: 'website',
      locale: locale || 'pt-BR',
      images: [{ url: LANDMAP_OG_IMAGE, width: 1200, height: 630, alt: seo.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: seo.title,
      description: seo.description,
      images: [LANDMAP_OG_IMAGE],
    },
  };
}

export default function MetodologiaLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
