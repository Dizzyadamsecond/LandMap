'use client';

import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { useMemo } from 'react';
import { ChevronRight } from './lovable/icons';
import { buildBreadcrumb } from '@/lib/admin-navigation';

/**
 * Breadcrumb navigation for admin pages
 * Shows current location: Admin > Category > Page
 */
export function AdminBreadcrumb() {
  const pathname = usePathname();
  const params = useParams();
  const locale = (params.locale as string) || 'pt-BR';

  const breadcrumbs = useMemo(() => {
    const normalized = pathname.replace(`/${locale}`, '');
    return buildBreadcrumb(normalized);
  }, [pathname, locale]);

  const handleLocaleHref = (href?: string) => {
    if (!href) return '#';
    return href.replace('^/', `/${locale}`);
  };

  return (
    <nav
      className="mb-6 flex items-center gap-1 text-sm text-[var(--muted-foreground)]"
      aria-label="Breadcrumb"
    >
      {breadcrumbs.map((crumb, index) => {
        const isLast = index === breadcrumbs.length - 1;
        const href = handleLocaleHref(crumb.href);

        return (
          <div key={index} className="flex items-center gap-1">
            {index > 0 && (
              <ChevronRight className="h-4 w-4 text-[var(--border)]" />
            )}

            {isLast ? (
              <span className="font-medium text-[var(--foreground)]">
                {crumb.label}
              </span>
            ) : (
              <Link
                href={href}
                className="transition hover:text-[var(--foreground)]"
              >
                {crumb.label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
