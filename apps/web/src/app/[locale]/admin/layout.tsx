import type { Metadata } from 'next';
import { LANDMAP_OG_IMAGE } from '../../../lib/og-image';
import { AdminSidebar } from '../../../components/AdminSidebar';
import { AdminSidebarMobile } from '../../../components/AdminSidebarMobile';
import { AdminBreadcrumb } from '../../../components/AdminBreadcrumb';

export async function generateMetadata({ params }: { params: Promise<{ locale?: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://landmapwebprod2.vercel.app';
  return {
    title: 'Administração — LandMap',
    description: 'LandMap: mapa de valorização, ranking de regiões e histórico de preço por m² para decisões de terreno no Brasil.',
    openGraph: {
      title: 'Administração — LandMap',
      description: 'LandMap: mapa de valorização, ranking de regiões e histórico de preço por m² para decisões de terreno no Brasil.',
      url: `/${locale}/admin`,
      type: 'website',
      locale: locale,
      images: [{ url: LANDMAP_OG_IMAGE, width: 1200, height: 630, alt: 'Administração — LandMap' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Administração — LandMap',
      description: 'LandMap: mapa de valorização, ranking de regiões e histórico de preço por m² para decisões de terreno no Brasil.',
      images: [LANDMAP_OG_IMAGE],
    },
    // Painel administrativo NUNCA deve ser indexado pelo Google.
    robots: { index: false, follow: false },
  };
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Mobile header */}
      <div className="md:hidden sticky top-0 z-40 flex items-center justify-between gap-2 border-b border-[var(--border)] bg-[var(--background)] h-14 px-4 py-2">
        <h1 className="text-sm font-semibold">Admin</h1>
        <AdminSidebarMobile />
      </div>

      {/* Main layout */}
      <div className="flex min-h-[calc(100vh-4rem)]">
        <AdminSidebar />
        <main className="flex-1 overflow-x-hidden">
          <div className="px-4 py-6 sm:px-8">
            <AdminBreadcrumb />
            {children}
          </div>
        </main>
      </div>
    </>
  );
}
