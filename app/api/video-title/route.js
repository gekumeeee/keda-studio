import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth';

// Pulls a video's own title so the admin doesn't have to retype it — reads
// the page's Open Graph tags, which Facebook/Instagram/TikTok/YouTube all
// render server-side for link-preview purposes (that's what og:title is
// for), so no platform API keys are needed. Requesting with a crawler-style
// User-Agent matters: some of these platforms serve a stripped-down shell to
// ordinary browsers but still render full OG meta for known preview bots.
const CRAWLER_UA = 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)';
const WORD_LIMIT = 6;

// HTML entities on these pages are mostly numeric character references
// (Arabic/emoji text comes through almost entirely as &#x...; / &#...;), not
// the handful of named ones — both need decoding or non-Latin titles come
// out as raw entity codes.
function decodeEntities(str) {
  return str
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#0?39;/g, "'")
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ');
}

function extractMeta(html, property) {
  const m = html.match(new RegExp(`<meta[^>]+property=["']${property}["'][^>]*content=["']([^"']*)["']`, 'i'))
    || html.match(new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*property=["']${property}["']`, 'i'));
  return m ? decodeEntities(m[1]).trim() : null;
}

function extractTitle(html, url) {
  const ogTitle = extractMeta(html, 'og:title');
  const ogDescription = extractMeta(html, 'og:description');
  // Facebook/Instagram's og:title is often "12K views · 340 reactions | the
  // actual caption | Page Name" — view-count noise ahead of the real text.
  // og:description on these two is just the caption, much cleaner. Every
  // other platform (YouTube, TikTok, Vimeo) puts the real title in og:title.
  const preferDescription = /(?:facebook\.com|fb\.watch|fb\.me|instagram\.com)/i.test(url);
  const primary = preferDescription ? ogDescription : ogTitle;
  const fallback = preferDescription ? ogTitle : ogDescription;
  if (primary) return primary;
  if (fallback) return fallback;
  const m = html.match(/<title>([^<]*)<\/title>/i);
  return m ? decodeEntities(m[1]).trim() : null;
}

function firstWords(text, limit) {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length <= limit) return words.join(' ');
  return words.slice(0, limit).join(' ');
}

export async function GET(request) {
  const gate = await requirePermission('projects');
  if (gate.error) return gate.error;

  const { searchParams } = new URL(request.url);
  const url = (searchParams.get('url') || '').trim();
  if (!/^https?:\/\//i.test(url)) {
    return NextResponse.json({ title: null });
  }

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': CRAWLER_UA, Accept: 'text/html' },
      redirect: 'follow',
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return NextResponse.json({ title: null });
    const html = await res.text();
    const rawTitle = extractTitle(html, url);
    if (!rawTitle) return NextResponse.json({ title: null });
    return NextResponse.json({ title: firstWords(rawTitle, WORD_LIMIT) });
  } catch {
    return NextResponse.json({ title: null });
  }
}
