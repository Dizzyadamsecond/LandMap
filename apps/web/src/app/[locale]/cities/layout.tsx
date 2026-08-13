import { buildRouteMetadata } from '../../../lib/seo';

export async function generateMetadata({ params }: { params: Promise<{ locale?: string }> }) {
  const { locale } = await params;
  return buildRouteMetadata({ route: 'cities', locale });
}

export default function CitiesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
