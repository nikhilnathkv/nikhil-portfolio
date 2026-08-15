import type { NextConfig } from 'next';

const isProd = process.env.NODE_ENV === 'production';

/** Origin browsers load uploaded media from (MinIO in dev, a CDN in prod). */
const mediaOrigin = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_MEDIA_URL ?? 'http://localhost:9000').origin;
  } catch {
    return 'http://localhost:9000';
  }
})();

/**
 * Relaxed-but-present CSP: allows self, inline styles (Tailwind), data:/blob:
 * and MinIO images, and same-origin XHR (the admin proxy). Next's runtime needs
 * inline/eval scripts; a strict nonce-based CSP is an M5 item.
 */
const csp = [
  "default-src 'self'",
  `img-src 'self' data: blob: ${mediaOrigin}`,
  "style-src 'self' 'unsafe-inline'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "font-src 'self' data:",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
]
  .join('; ')
  .concat(isProd ? '; upgrade-insecure-requests' : '');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  ...(isProd
    ? [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' }]
    : []),
];

const mediaUrl = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_MEDIA_URL ?? 'http://localhost:9000');
  } catch {
    return new URL('http://localhost:9000');
  }
})();

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Compile the shared workspace packages (shipped as TypeScript source) as
  // part of the web build instead of expecting a pre-built dist bundle.
  transpilePackages: ['@nikhil-portfolio/types', '@nikhil-portfolio/ui'],
  // Allow next/image to optimize uploaded media served from the MinIO origin
  // (CDN in prod). The same origin is whitelisted in the CSP img-src above.
  images: {
    remotePatterns: [
      {
        protocol: mediaUrl.protocol.replace(':', '') as 'http' | 'https',
        hostname: mediaUrl.hostname,
        port: mediaUrl.port || undefined,
      },
    ],
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default nextConfig;
