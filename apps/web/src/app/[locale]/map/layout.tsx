import { buildRouteMetadata } from '../../../lib/seo';

export async function generateMetadata({ params }: { params: Promise<{ locale?: string }> }) {
  const { locale } = await params;
  return buildRouteMetadata({ route: 'map', locale });
}

export default function MapLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
