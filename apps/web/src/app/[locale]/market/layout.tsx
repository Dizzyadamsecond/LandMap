import { buildRouteMetadata } from '../../../lib/seo';

export async function generateMetadata({ params }: { params: Promise<{ locale?: string }> }) {
  const { locale } = await params;
  return buildRouteMetadata({ route: 'market', locale });
}

export default function MarketLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
