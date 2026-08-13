import { buildRouteMetadata } from '../../../lib/seo';

export async function generateMetadata({ params }: { params: Promise<{ locale?: string }> }) {
  const { locale } = await params;
  return buildRouteMetadata({ route: 'investor', locale });
}

export default function InvestorLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
