import { buildRouteMetadata } from '../../../lib/seo';

export async function generateMetadata({ params }: { params: Promise<{ locale?: string }> }) {
  const { locale } = await params;
  return buildRouteMetadata({ route: 'glossary', locale });
}

export default function GlossaryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
