import { buildRouteMetadata } from '../../../lib/seo';

export async function generateMetadata({ params }: { params: Promise<{ locale?: string }> }) {
  const { locale } = await params;
  return buildRouteMetadata({ route: 'brasil', locale });
}

export default function BrasilLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
