import { buildRouteMetadata } from '../../../lib/seo';

export async function generateMetadata({ params }: { params: Promise<{ locale?: string }> }) {
  const { locale } = await params;
  return buildRouteMetadata({ route: 'metodologia', locale });
}

export default function MetodologiaLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
