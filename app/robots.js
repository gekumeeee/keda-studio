import { SITE_URL } from '@/lib/site';

// Served at /robots.txt.
//
// The disallow list is the point as much as the sitemap is: /admin is a real
// login screen and /report-template renders a client's monthly report by id
// — neither belongs in search results. They're already access-controlled
// (report pages aside), but keeping them out of the index means they're
// never surfaced to someone who wasn't looking for them in the first place.
export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api/', '/report-template/'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
