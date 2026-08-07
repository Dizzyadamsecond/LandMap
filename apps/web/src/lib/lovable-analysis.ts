/**
 * Lovable Structure Analysis Framework
 *
 * Purpose: Analyze Lovable design system (landmap-insight.lovable.app) HTML structure
 * and compare with current LandMap implementation for alignment/parity.
 *
 * Usage:
 * 1. Export HTML from Lovable app into a file
 * 2. Pass HTML to analyzeLovableStructure()
 * 3. Generate alignment report with compareWithLandMap()
 */

/**
 * Single page/route metadata from Lovable
 */
export interface LovablePage {
  route: string;
  pageTitle: string;
  components: string[];
  hierarchy: number; // nesting depth
  metadata?: {
    sidebar?: boolean;
    header?: boolean;
    nav?: boolean;
    footer?: boolean;
  };
}

/**
 * Component reference (name + usage count)
 */
export interface ComponentReference {
  name: string;
  usageCount: number;
  pages: string[];
}

/**
 * Complete analysis of Lovable structure
 */
export interface LovableAnalysis {
  pages: LovablePage[];
  routes: string[];
  componentMap: Record<string, ComponentReference>;
  metadata: {
    totalPages: number;
    totalComponents: number;
    maxHierarchyDepth: number;
    crawlDate: string;
  };
}

/**
 * Diff between Lovable and LandMap
 */
export interface AnalysisDiff {
  missingRoutes: string[];
  missingComponents: string[];
  extraRoutes: string[];
  extraComponents: string[];
  changedHierarchy: Record<string, { lovable: number; landmap: number }>;
  recommendations: string[];
}

/**
 * Parse HTML and extract page/component structure
 *
 * @param html Raw HTML export from Lovable
 * @returns LovableAnalysis object
 */
export function analyzeLovableStructure(html: string): LovableAnalysis {
  const pages: LovablePage[] = [];
  const routes = new Set<string>();
  const componentMap: Record<string, ComponentReference> = {};

  try {
    // Parse HTML (would use jsdom in Node.js context)
    // For now, return structure ready for JSON input
    const dom = new DOMParser().parseFromString(html, 'text/html');

    // Extract all pages/routes
    const routeElements = dom.querySelectorAll('[data-route], [data-page-id], nav a, [href]');
    routeElements.forEach((el) => {
      const href = el.getAttribute('href') || el.getAttribute('data-route') || '';
      if (href && !href.startsWith('#')) routes.add(href);
    });

    // Extract components
    const componentElements = dom.querySelectorAll('[data-component], .component, [class*=Card], [class*=Button], [class*=Modal]');
    componentElements.forEach((el) => {
      const componentName = el.getAttribute('data-component') || el.className.split(' ')[0];
      if (componentName) {
        if (!componentMap[componentName]) {
          componentMap[componentName] = { name: componentName, usageCount: 0, pages: [] };
        }
        componentMap[componentName].usageCount++;
      }
    });

    // Calculate hierarchy depth
    let maxDepth = 0;
    dom.querySelectorAll('*').forEach((el) => {
      let depth = 0;
      let parent = el.parentElement;
      while (parent) {
        depth++;
        parent = parent.parentElement;
      }
      maxDepth = Math.max(maxDepth, depth);
    });

    // Construct pages array
    routes.forEach((route) => {
      pages.push({
        route,
        pageTitle: route.split('/').pop() || 'root',
        components: Object.keys(componentMap),
        hierarchy: Math.floor(Math.random() * maxDepth), // Placeholder: would be calculated per-page
      });
    });

  } catch (error) {
    console.error('Error parsing Lovable HTML:', error);
  }

  return {
    pages,
    routes: Array.from(routes),
    componentMap,
    metadata: {
      totalPages: pages.length,
      totalComponents: Object.keys(componentMap).length,
      maxHierarchyDepth: Object.values(componentMap).reduce((max, comp) => Math.max(max, comp.usageCount), 0),
      crawlDate: new Date().toISOString(),
    },
  };
}

/**
 * Compare Lovable analysis with current LandMap structure
 *
 * @param lovable Analysis of Lovable app
 * @param landmapRoutes Current routes in LandMap
 * @param landmapComponents Current components in LandMap
 * @returns Diff report with recommendations
 */
export function compareWithLandMap(
  lovable: LovableAnalysis,
  landmapRoutes?: string[],
  landmapComponents?: string[]
): AnalysisDiff {
  const lovableRoutes = new Set(lovable.routes);
  const lovableComponentNames = new Set(Object.keys(lovable.componentMap));

  const landmapRoutesSet = new Set(landmapRoutes || []);
  const landmapComponentsSet = new Set(landmapComponents || []);

  const missingRoutes = Array.from(lovableRoutes).filter((r) => !landmapRoutesSet.has(r));
  const missingComponents = Array.from(lovableComponentNames).filter((c) => !landmapComponentsSet.has(c));
  const extraRoutes = Array.from(landmapRoutesSet).filter((r) => !lovableRoutes.has(r));
  const extraComponents = Array.from(landmapComponentsSet).filter((c) => !lovableComponentNames.has(c));

  const recommendations: string[] = [];

  // Generate recommendations
  if (missingRoutes.length > 0) {
    recommendations.push(`Add ${missingRoutes.length} missing routes: ${missingRoutes.slice(0, 3).join(', ')}${missingRoutes.length > 3 ? '...' : ''}`);
  }

  if (missingComponents.length > 0) {
    recommendations.push(`Implement ${missingComponents.length} missing components: ${missingComponents.slice(0, 3).join(', ')}${missingComponents.length > 3 ? '...' : ''}`);
  }

  if (extraRoutes.length > 5) {
    recommendations.push(`Review ${extraRoutes.length} extra routes not in Lovable (possible divergence)`);
  }

  if (extraComponents.length > 5) {
    recommendations.push(`Audit ${extraComponents.length} custom components (consider removing or standardizing)`);
  }

  recommendations.push('Validate design tokens are synchronized (see DESIGN.md)');
  recommendations.push('Ensure typography matches Lovable (DM Sans + Space Grotesk)');
  recommendations.push('Review sidebar structure and navigation hierarchy');
  recommendations.push('Check Tailwind utility class coverage against Lovable v4 pipeline');

  return {
    missingRoutes,
    missingComponents,
    extraRoutes,
    extraComponents,
    changedHierarchy: {}, // Populated when comparing component hierarchies
    recommendations,
  };
}

/**
 * Generate markdown report from analysis diff
 *
 * @param diff AnalysisDiff result
 * @returns Markdown formatted report
 */
export function generateAlignmentReport(diff: AnalysisDiff): string {
  const lines: string[] = [
    '# Lovable Alignment Report',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    '## Summary',
    `- Missing routes: ${diff.missingRoutes.length}`,
    `- Missing components: ${diff.missingComponents.length}`,
    `- Extra routes: ${diff.extraRoutes.length}`,
    `- Extra components: ${diff.extraComponents.length}`,
    '',
  ];

  if (diff.missingRoutes.length > 0) {
    lines.push('## Missing Routes');
    lines.push('These routes exist in Lovable but not in LandMap:');
    lines.push('');
    diff.missingRoutes.forEach((route) => {
      lines.push(`- \`${route}\``);
    });
    lines.push('');
  }

  if (diff.missingComponents.length > 0) {
    lines.push('## Missing Components');
    lines.push('These components are used in Lovable but not implemented in LandMap:');
    lines.push('');
    diff.missingComponents.forEach((comp) => {
      lines.push(`- \`${comp}\``);
    });
    lines.push('');
  }

  if (diff.extraRoutes.length > 0) {
    lines.push('## Extra Routes');
    lines.push('These routes exist in LandMap but not in Lovable (divergence):');
    lines.push('');
    diff.extraRoutes.forEach((route) => {
      lines.push(`- \`${route}\``);
    });
    lines.push('');
  }

  if (diff.extraComponents.length > 0) {
    lines.push('## Extra Components');
    lines.push('These components exist in LandMap but not in Lovable (custom/divergent):');
    lines.push('');
    diff.extraComponents.forEach((comp) => {
      lines.push(`- \`${comp}\``);
    });
    lines.push('');
  }

  if (diff.recommendations.length > 0) {
    lines.push('## Recommendations');
    lines.push('');
    diff.recommendations.forEach((rec) => {
      lines.push(`- ${rec}`);
    });
    lines.push('');
  }

  lines.push('## Next Steps');
  lines.push('1. Review missing routes and implement if product-critical');
  lines.push('2. Audit component implementations against Lovable spec');
  lines.push('3. Synchronize design tokens (see `DESIGN.md`)');
  lines.push('4. Run `pnpm build` to validate Tailwind v4 compilation');
  lines.push('5. Compare sidebar navigation structure (see `AdminSidebar.tsx`)');
  lines.push('');
  lines.push('## Related Documentation');
  lines.push('- `DESIGN.md` — Design system standard');
  lines.push('- `CLAUDE.md` — Project memory (includes design notes)');
  lines.push('- `docs/lovable-alignment-report.md` — This report');

  return lines.join('\n');
}

/**
 * Extract sidebar structure from Lovable HTML
 *
 * Specifically targets navigation items to understand content organization
 */
export function extractLovableSidebar(html: string): { label: string; route: string; icon?: string; children?: any[] }[] {
  const sidebar: { label: string; route: string; icon?: string; children?: any[] }[] = [];

  try {
    const dom = new DOMParser().parseFromString(html, 'text/html');
    const navItems = dom.querySelectorAll('[data-sidebar-item], nav li, .sidebar-item');

    navItems.forEach((item) => {
      const link = item.querySelector('a');
      const label = item.textContent?.trim() || '';
      const route = link?.getAttribute('href') || '';

      if (label && route) {
        sidebar.push({
          label,
          route,
          icon: item.getAttribute('data-icon') ?? undefined,
          children: [],
        });
      }
    });
  } catch (error) {
    console.error('Error extracting sidebar:', error);
  }

  return sidebar;
}
