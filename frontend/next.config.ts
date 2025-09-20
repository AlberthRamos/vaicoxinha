import type { NextConfig } from "next";
import withPWA from "next-pwa";

const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "connect-src 'self' http://localhost:8080",
      "font-src 'self' data:",
      "frame-ancestors 'none'",
    ].join('; '),
  },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'geolocation=(self)' },
];

const baseConfig: NextConfig = {
  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
    ];
  },
  images: { unoptimized: true },
};

export default withPWA({ dest: 'public', disable: process.env.NODE_ENV === 'development' })(baseConfig);
