'use client';

import { useLocale } from 'next-intl';
import { usePathname } from 'next/navigation';

/**
 * StructuredData — injeta JSON-LD (Organization + WebSite + BreadcrumbList)
 * no <head> do cliente. O metadata `other` do Next 14 não emite
 * application/ld+json, então renderizamos via script tag dinâmica.
 */
export function StructuredData() {
  const locale = useLocale();
  const pathname = usePathname();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://landmapwebprod2.vercel.app';
  const path = pathname.replace(`/${locale}`, '') || '/';

  const breadcrumbs = [
    { '@type': 'ListItem', position: 1, name: 'LandMap', item: `${siteUrl}/${locale}` },
  ];
  if (path !== '/') {
    const name = path.split('/').filter(Boolean).pop() || 'LandMap';
    breadcrumbs.push({
      '@type': 'ListItem',
      position: 2,
      name: name.charAt(0).toUpperCase() + name.slice(1).replace(/-/g, ' '),
      item: `${siteUrl}/${locale}${path}`,
    });
  }

  const data = [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'LandMap',
      url: siteUrl,
      logo: `${siteUrl}/icons/icon-512.png`,
      description: 'Inteligência territorial para decisões imobiliárias no Brasil.',
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'LandMap',
      url: siteUrl,
      inLanguage: locale,
      potentialAction: {
        '@type': 'SearchAction',
        target: `${siteUrl}/${locale}/map?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbs,
    },
  ];

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
