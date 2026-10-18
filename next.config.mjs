/** @type {import('next').NextConfig} */
const nextConfig = {
  // Baseline security headers. nosniff and the referrer policy are safe for
  // every page. Framing is only refused for the admin, where a page dressed
  // up around a hidden /admin iframe could trick a signed-in owner into
  // clicking Delete; the public pages stay embeddable as before.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
      {
        source: '/admin/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Content-Security-Policy', value: "frame-ancestors 'self'" },
        ],
      },
    ];
  },
};

export default nextConfig;
