import type { Metadata } from 'next';
import { LANDMAP_OG_IMAGE } from '../../../lib/og-image';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale?: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: 'Preços — LandMap',
    description: 'Veja os planos LandMap e escolha entre Access, Plus, Pro e Business.',
    alternates: {
      canonical: `/${locale}/plans`,
    },
    openGraph: {
      title: 'Preços — LandMap',
      description: 'Veja os planos LandMap e escolha entre Access, Plus, Pro e Business.',
      url: `/${locale}/pricing`,
      type: 'website',
      locale: locale,
      images: [{ url: LANDMAP_OG_IMAGE, width: 1200, height: 630, alt: 'Preços — LandMap' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Preços — LandMap',
      description: 'Veja os planos LandMap e escolha entre Access, Plus, Pro e Business.',
      images: [LANDMAP_OG_IMAGE],
    },
  };
}

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
