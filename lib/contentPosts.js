// The content calendar's vocabulary, shared by the API (which normalises what
// it stores against it) and the admin (which draws it). Plain data only, so
// both sides can import it.

export const POST_STATUSES = [
  { key: 'idea', label: 'Idea', ar: 'فكرة' },
  { key: 'writing', label: 'Writing', ar: 'بيتكتب' },
  { key: 'ready', label: 'Ready for design', ar: 'جاهز للتصميم' },
  { key: 'design', label: 'In design', ar: 'في التصميم' },
  { key: 'approved', label: 'Approved', ar: 'متوافق عليه' },
  { key: 'published', label: 'Published', ar: 'اتنشر' },
];

export const POST_PLATFORMS = [
  { key: 'facebook', label: 'Facebook' },
  { key: 'instagram', label: 'Instagram' },
  { key: 'tiktok', label: 'TikTok' },
  { key: 'linkedin', label: 'LinkedIn' },
  { key: 'x', label: 'X' },
  { key: 'youtube', label: 'YouTube' },
];

export const POST_FORMATS = [
  { key: 'post', label: 'Post' },
  { key: 'carousel', label: 'Carousel' },
  { key: 'reel', label: 'Reel' },
  { key: 'story', label: 'Story' },
  { key: 'video', label: 'Video' },
];

export const CONTENT_TYPES = ['Social Design', 'Motion Graphics', 'Video', 'Photo Shoot', 'UGC', 'Copy only'];

const has = (list, key) => list.some((x) => x.key === key);
const text = (v, max) => String(v ?? '').slice(0, max);

// Everything the API stores goes through here, so a record is always complete
// and never carries fields it doesn't know about.
export function normalizePost(input = {}, existing = {}) {
  const pick = (key, fallback) => (input[key] !== undefined ? input[key] : existing[key] ?? fallback);
  const date = text(pick('date', ''), 10);
  const time = text(pick('time', ''), 5);
  const platforms = (Array.isArray(pick('platforms', [])) ? pick('platforms', []) : []).filter((p) => has(POST_PLATFORMS, p));
  const status = pick('status', 'idea');
  const format = pick('format', 'post');
  return {
    clientId: text(pick('clientId', ''), 64).trim(),
    clientName: text(pick('clientName', ''), 120).trim(),
    date: /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : '',
    time: /^\d{2}:\d{2}$/.test(time) ? time : '',
    platforms: [...new Set(platforms)],
    format: has(POST_FORMATS, format) ? format : 'post',
    contentType: text(pick('contentType', 'Social Design'), 60).trim(),
    headline: text(pick('headline', ''), 300),
    subText: text(pick('subText', ''), 300),
    caption: text(pick('caption', ''), 6000),
    direction: text(pick('direction', ''), 3000),
    reference: text(pick('reference', ''), 600).trim(),
    status: has(POST_STATUSES, status) ? status : 'idea',
  };
}

export function statusOf(key) {
  return POST_STATUSES.find((s) => s.key === key) || POST_STATUSES[0];
}
