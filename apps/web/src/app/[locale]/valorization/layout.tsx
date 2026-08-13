import { buildRouteMetadata } from '../../../lib/seo';

export async function generateMetadata({ params }: { params: Promise<{ locale?: string }> }) {
  const { locale } = await params;
  return buildRouteMetadata({ route: 'valorization', locale });
}

export default function ValorizationLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
