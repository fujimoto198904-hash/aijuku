import type { NextConfig } from 'next';

const isVercelBuild =
  process.env.VERCEL === '1' || process.env.NITRO_PRESET === 'vercel';
const isDevelopment = process.env.NODE_ENV !== 'production';
const publicLinkBasePath =
  isDevelopment && !isVercelBuild ? '' : '/aijuku';

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "form-action 'self'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  `script-src 'self' 'unsafe-inline'${isDevelopment ? " 'unsafe-eval'" : ''}`,
  `connect-src 'self'${isDevelopment ? ' ws: wss:' : ''}`,
  "worker-src 'self' blob:",
  "frame-src 'none'",
  "frame-ancestors 'none'",
  "manifest-src 'self'",
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: contentSecurityPolicy },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  },
];

const privateNoStoreHeaders = [
  {
    key: 'Cache-Control',
    value: 'private, no-cache, no-store, max-age=0, must-revalidate',
  },
  { key: 'Pragma', value: 'no-cache' },
  { key: 'Expires', value: '0' },
  { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' },
];

const privateRouteRoots = [
  '/login',
  '/account',
  '/join',
  '/reserve',
  '/mypage',
  '/aikanri',
  '/admin',
  '/review',
  '/skills',
  '/api',
];
const privateRoutes = privateRouteRoots.flatMap((root) => [
  root,
  `${root}/:path*`,
]);

const nextConfig: NextConfig = {
  basePath: isVercelBuild ? '/aijuku' : '',
  env: {
    // Sites serves the application at its root, while mon-ai.jp exposes it
    // through a reverse proxy below /aijuku. Keep links and browser requests
    // on the public branded path in every production build.
    NEXT_PUBLIC_SITE_BASE_PATH: publicLinkBasePath,
  },
  images: {
    // Vinext's image optimizer endpoint is rooted at /_next/image. The public
    // Vercel build lives below /aijuku, so serve its already-built image files
    // directly instead of escaping into the MON-Ai parent site's root path.
    unoptimized: isVercelBuild,
  },
  async headers() {
    return [
      // Some Vinext runtimes do not treat `/:path*` as matching the root URL.
      // Keep `/` explicit so the public landing page receives the same baseline.
      { source: '/', headers: securityHeaders },
      { source: '/:path*', headers: securityHeaders },
      ...privateRoutes.map((source) => ({
        source,
        headers:
          source === '/review' || source === '/review/:path*'
            ? [
                ...privateNoStoreHeaders,
                { key: 'Referrer-Policy', value: 'no-referrer' },
              ]
            : privateNoStoreHeaders,
      })),
      ...['/signin-with-chatgpt', '/signout-with-chatgpt', '/callback'].map(
        (source) => ({
          source,
          basePath: false,
          headers: [
            ...privateNoStoreHeaders,
            { key: 'Referrer-Policy', value: 'no-referrer' },
          ],
        }),
      ),
    ];
  },
  async redirects() {
    if (!isVercelBuild) return [];
    return [
      {
        source: '/',
        destination: '/aijuku',
        permanent: false,
        basePath: false,
      },
    ];
  },
};

export default nextConfig;
