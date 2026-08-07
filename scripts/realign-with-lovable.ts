/**
 * Lovable Realignment Script
 *
 * Purpose: Automatically reorganize AdminSidebar.tsx and other components
 * to match the Lovable design system structure.
 *
 * Usage:
 * 1. Export Lovable analysis JSON to a file (or pass stdin)
 * 2. Run: ts-node scripts/realign-with-lovable.ts [analysis.json]
 * 3. Script will:
 *    - Parse Lovable structure
 *    - Identify layout changes
 *    - Generate AdminSidebar.tsx patch
 *    - Create alignment report
 *
 * Input JSON format:
 * {
 *   "routes": [...],
 *   "componentMap": {...},
 *   "pages": [{...}]
 * }
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { LovableAnalysis, AnalysisDiff, compareWithLandMap, generateAlignmentReport } from '../apps/web/src/lib/lovable-analysis.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');

/**
 * Read Lovable analysis JSON from file or stdin
 */
async function readLovableAnalysis(inputPath?: string): Promise<LovableAnalysis> {
  try {
    let data: string;

    if (inputPath && fs.existsSync(inputPath)) {
      console.log(`📖 Reading Lovable analysis from: ${inputPath}`);
      data = fs.readFileSync(inputPath, 'utf-8');
    } else {
      console.log('⏳ Waiting for Lovable analysis JSON from stdin...');
      data = await new Promise((resolve) => {
        let chunk = '';
        process.stdin.on('data', (d) => (chunk += d));
        process.stdin.on('end', () => resolve(chunk));
      });
    }

    const analysis = JSON.parse(data) as LovableAnalysis;
    console.log(`✓ Loaded Lovable analysis: ${analysis.metadata?.totalPages || 'unknown'} pages\n`);
    return analysis;

  } catch (error) {
    console.error('Error reading Lovable analysis:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

/**
 * Generate AdminSidebar.tsx component from Lovable structure
 */
function generateAdminSidebarCode(sidebarItems: any[]): string {
  // Format items for TypeScript
  const itemsCode = sidebarItems
    .map((item) => {
      const iconCode = item.icon ? `icon: "${item.icon}",` : '';
      const childrenCode = item.children?.length
        ? `children: [${item.children.map((c: any) => `{ label: "${c.label}", href: "${c.route}" }`).join(', ')}],`
        : '';

      return `    {
      label: "${item.label}",
      href: "${item.route}",
      ${iconCode}
      ${childrenCode}
    }`;
    })
    .join(',\n');

  return `/**
 * AdminSidebar.tsx — Auto-generated from Lovable alignment
 *
 * Generated: ${new Date().toISOString()}
 * Source: Lovable (landmap-insight.lovable.app)
 *
 * This component is synchronized with the Lovable design system.
 * Maintain parity with the Lovable app structure.
 */

'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  LayoutGrid,
  BarChart3,
  Settings,
  Users,
  Zap,
  Workflow,
} from 'lucide-react';

export interface SidebarItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
  children?: SidebarItem[];
  badge?: string;
}

const SIDEBAR_ITEMS: SidebarItem[] = [
${itemsCode}
];

export function AdminSidebar() {
  return (
    <aside className="w-64 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800">
      <nav className="space-y-1 p-4">
        {SIDEBAR_ITEMS.map((item) => (
          <div key={item.href}>
            <Link
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors',
                'hover:bg-slate-100 dark:hover:bg-slate-800'
              )}
            >
              {item.icon && <span className="w-5 h-5">{item.icon}</span>}
              <span>{item.label}</span>
              {item.badge && <span className="ml-auto text-xs bg-red-500 text-white px-2 py-1 rounded">{item.badge}</span>}
            </Link>

            {item.children && (
              <div className="ml-6 space-y-1 border-l border-slate-200 dark:border-slate-800 pl-3 mt-1">
                {item.children.map((child) => (
                  <Link
                    key={child.href}
                    href={child.href}
                    className={cn(
                      'block px-3 py-2 text-xs rounded-lg transition-colors',
                      'hover:bg-slate-100 dark:hover:bg-slate-800'
                    )}
                  >
                    {child.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
    </aside>
  );
}

export default AdminSidebar;
`;
}

/**
 * Generate alignment report and save to file
 */
function saveAlignmentReport(diff: AnalysisDiff, outputPath: string): void {
  const report = generateAlignmentReport(diff);
  fs.writeFileSync(outputPath, report, 'utf-8');
  console.log(`✓ Alignment report saved: ${outputPath}`);
}

/**
 * Generate AdminSidebar patch
 */
function generateSidebarPatch(lovable: LovableAnalysis): string {
  console.log('\n📋 Generating AdminSidebar.tsx patch...');

  const sidebarItems = extractLovableSidebarStructure(lovable);
  const sidebarCode = generateAdminSidebarCode(sidebarItems);

  const adminSidebarPath = path.join(PROJECT_ROOT, 'apps/web/src/components/AdminSidebar.tsx');

  // Create backup
  if (fs.existsSync(adminSidebarPath)) {
    const backupPath = `${adminSidebarPath}.backup.${Date.now()}`;
    fs.copyFileSync(adminSidebarPath, backupPath);
    console.log(`✓ Backup created: ${backupPath}`);
  }

  // Write new file
  fs.writeFileSync(adminSidebarPath, sidebarCode, 'utf-8');
  console.log(`✓ AdminSidebar.tsx updated`);

  return sidebarCode;
}

/**
 * Extract sidebar structure from Lovable analysis
 */
function extractLovableSidebarStructure(lovable: LovableAnalysis): any[] {
  // Map Lovable routes to sidebar items
  return lovable.routes
    .filter((route) => !route.startsWith('/auth') && !route.startsWith('/404'))
    .map((route) => {
      const label = route
        .split('/')
        .pop()
        ?.split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ') || 'Home';

      return {
        label,
        route,
        icon: selectIconForRoute(route),
        children: [],
      };
    });
}

/**
 * Select appropriate icon for a route
 */
function selectIconForRoute(route: string): string | undefined {
  const iconMap: Record<string, string> = {
    '/admin': 'LayoutGrid',
    '/dashboard': 'BarChart3',
    '/settings': 'Settings',
    '/users': 'Users',
    '/automations': 'Zap',
    '/workflows': 'Workflow',
  };

  for (const [key, icon] of Object.entries(iconMap)) {
    if (route.includes(key)) return icon;
  }

  return undefined;
}

/**
 * Load current LandMap routes (scan apps/web/src/app)
 */
function loadCurrentLandMapRoutes(): string[] {
  const appDir = path.join(PROJECT_ROOT, 'apps/web/src/app');
  const routes: string[] = [];

  function scanDir(dir: string, prefix: string = ''): void {
    try {
      const entries = fs.readdirSync(dir);

      entries.forEach((entry) => {
        if (entry.startsWith('.') || entry === 'node_modules') return;

        const fullPath = path.join(dir, entry);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          // Handle [locale], [id] patterns
          if (entry.startsWith('[') && entry.endsWith(']')) {
            return; // Skip dynamic segments
          }
          scanDir(fullPath, prefix + '/' + entry);
        } else if (entry === 'page.tsx' || entry === 'page.ts') {
          routes.push(prefix || '/');
        }
      });
    } catch (error) {
      // Directory may not exist
    }
  }

  scanDir(appDir);
  return routes;
}

/**
 * Main realignment function
 */
async function realign(): Promise<void> {
  console.log('🔄 Lovable Realignment Script');
  console.log('━'.repeat(50) + '\n');

  try {
    // 1. Read Lovable analysis
    const inputFile = process.argv[2];
    const lovable = await readLovableAnalysis(inputFile);

    // 2. Load current LandMap routes
    console.log('📂 Scanning LandMap routes...');
    const landmapRoutes = loadCurrentLandMapRoutes();
    console.log(`✓ Found ${landmapRoutes.length} routes in LandMap\n`);

    // 3. Compare structures
    console.log('🔍 Comparing structures...');
    const diff = compareWithLandMap(lovable, landmapRoutes);
    console.log(`✓ Comparison complete`);
    console.log(`  - Missing routes: ${diff.missingRoutes.length}`);
    console.log(`  - Extra routes: ${diff.extraRoutes.length}\n`);

    // 4. Generate AdminSidebar patch
    generateSidebarPatch(lovable);

    // 5. Save alignment report
    const reportPath = path.join(PROJECT_ROOT, 'docs/lovable-alignment-report.md');
    saveAlignmentReport(diff, reportPath);

    // 6. Summary
    console.log('\n✅ Realignment Complete!');
    console.log('\nGenerated files:');
    console.log(`  - AdminSidebar.tsx (updated)`);
    console.log(`  - ${reportPath}`);
    console.log('\nNext steps:');
    console.log('  1. Review AdminSidebar.tsx changes');
    console.log('  2. Run: pnpm build');
    console.log('  3. Run: pnpm lint');
    console.log('  4. Test navigation in admin routes');
    console.log('\nRecommendations:');
    diff.recommendations.forEach((rec) => {
      console.log(`  - ${rec}`);
    });

  } catch (error) {
    console.error('\n❌ Realignment failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// Run script
realign();
