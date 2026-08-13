import { buildRouteMetadata } from '../../../lib/seo';

export async function generateMetadata({ params }: { params: Promise<{ locale?: string }> }) {
  const { locale } = await params;
  return buildRouteMetadata({ route: 'worldmonitor', locale });
}

export default function WorldmonitorLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
