import { buildRouteMetadata } from '../../../lib/seo';

export async function generateMetadata({ params }: { params: Promise<{ locale?: string }> }) {
  const { locale } = await params;
  return buildRouteMetadata({ route: 'history40', locale });
}

export default function History40Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
