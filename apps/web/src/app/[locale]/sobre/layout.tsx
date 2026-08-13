import { buildRouteMetadata } from '../../../lib/seo';

export async function generateMetadata({ params }: { params: Promise<{ locale?: string }> }) {
  const { locale } = await params;
  return buildRouteMetadata({ route: 'sobre', locale });
}

export default function SobreLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
