import { buildRouteMetadata } from '../../../lib/seo';

export async function generateMetadata({ params }: { params: Promise<{ locale?: string }> }) {
  const { locale } = await params;
  return buildRouteMetadata({ route: 'insights', locale });
}

export default function InsightsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
