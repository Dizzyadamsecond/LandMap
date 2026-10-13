import createNextIntlPlugin from 'next-intl/plugin';

const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  reactStrictMode: true,
  transpilePackages: ['@landmap/api', '@landmap/sales', '@landmap/ui', '@landmap/automation', '@landmap/integrations'],
  webpack: (config) => {
    // @landmap/api / packages are consumed from source (tsconfig paths -> packages/*/src).
    // Their NodeNext imports reference `.js` extensions that must resolve to `.ts`/`.tsx`.
    // Without this, the build silently depends on stray compiled .js files in src/ — which we
    // have now removed. extensionAlias restores correct .js -> .ts resolution.
    config.resolve.extensionAlias = {
      ...(config.resolve.extensionAlias || {}),
      '.js': ['.ts', '.tsx', '.js'],
      '.jsx': ['.tsx', '.jsx'],
    };
    return config;
  },
  experimental: {
    // typedRoutes kept off to avoid build friction across the large route tree
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 768, 1024, 1280, 1536],
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },
  async headers() {
    // CSP: app is self-contained (static + /api). Only external dependency is
    // Google Fonts. Live integrations (IBGE/ViaCEP/etc.) live in the Hono API
    // package and are proxied through /api/*, so no third-party host is needed.
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https://*.vercel.app https://*.basemaps.cartocdn.com https://*.cartocdn.com https://*.tile.openstreetmap.org https://tile.openstreetmap.org https://server.arcgisonline.com",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ');

    return [
      {
        // Static assets (hashed by Next) — long browser/CDN cache.
        source: '/:all*(svg|jpg|jpeg|png|webp|avif|gif|ico|woff2|woff|ttf|css|js|json|map)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        // Everything else — no stale cache; dynamic per-locale content.
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          { key: 'Content-Security-Policy', value: csp },
          { key: 'Permissions-Policy', value: 'geolocation=(), microphone=(), camera=()' },
          { key: 'Cache-Control', value: 'public, max-age=0, s-maxage=60, stale-while-revalidate=300' },
        ],
      },
      {
        // Service worker: nunca cachear (skill nextjs-pwa) — sem isso o browser
        // pode servir SW stale e usuários nunca recebem updates do app.
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
      {
        // Manifest: MIME correto + no-cache (skill nextjs-pwa)
        source: '/manifest.json',
        headers: [
          { key: 'Content-Type', value: 'application/manifest+json' },
          { key: 'Cache-Control', value: 'no-cache' },
        ],
      },
    ];
  },
};

export default createNextIntlPlugin('./src/i18n.ts')(nextConfig);
