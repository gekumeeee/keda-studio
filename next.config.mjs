const isDev = process.env.NODE_ENV !== 'production';

// Content-Security-Policy, kept to what the site really loads:
//  - scripts: our own, plus inline. Next.js writes small inline scripts into
//    every page (its data and hydration bootstrap), and the root layout's
//    theme script must run before first paint. A nonce would avoid
//    'unsafe-inline', but needs a per-request proxy on every page — left out
//    on purpose (see the handover notes); the rest of the policy still holds.
//    Dev mode also needs 'unsafe-eval' for fast refresh.
//  - styles: ours, inline (React style props) and Google Fonts' CSS.
//  - fonts: ours and Google Fonts' files.
//  - images and media: any https host, because work and logos are hosted
//    wherever the owner puts them (jsDelivr, postimg, Vercel Blob, YouTube
//    thumbnails, clients' own sites); data:/blob: for uploads and exports.
//  - frames: the video platforms a project can embed.
//  - connections: our own API, plus https/data:/blob: for the admin's PDF and brief export,
//    which re-fetches the page's images and fonts to draw them.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https:",
  "media-src 'self' data: blob: https:",
  "frame-src https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com https://www.facebook.com https://web.facebook.com https://www.instagram.com https://www.tiktok.com",
  `connect-src 'self' https: data: blob:${isDev ? ' ws: wss:' : ''}`,
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  ...(isDev ? [] : ['upgrade-insecure-requests']),
].join('; ');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Security headers on every response. Framing is refused site-wide (the
  // site's own pages may still frame each other): a page dressed up around a
  // hidden iframe of the admin could trick a signed-in owner into clicking
  // Delete, and nothing needs to embed the public pages either.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Content-Security-Policy', value: csp },
          // the site and admin use none of these; embeds keep their own
          // allow= list for autoplay, fullscreen and picture-in-picture
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()' },
          // HTTPS only, for two years, subdomains included. Not "preload":
          // that's a one-way listing in browsers and the owner's call.
          ...(isDev ? [] : [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' }]),
        ],
      },
    ];
  },
};

export default nextConfig;
