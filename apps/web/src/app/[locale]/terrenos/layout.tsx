import { buildRouteMetadata } from '../../../lib/seo';

export async function generateMetadata({ params }: { params: Promise<{ locale?: string }> }) {
  const { locale } = await params;
  return buildRouteMetadata({ route: 'terrenos', locale });
}

export default function TerrenosLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
