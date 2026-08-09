// Turns a project's "video" URL into how it should be shown:
//   { kind: 'file' }                 → a direct media file, use a <video> tag
//   { kind: 'embed', embedUrl }      → a platform page, use an <iframe>
//   { kind: 'none' }                 → no video
// Supports Facebook, YouTube, Instagram and Vimeo page links; anything ending
// in a media extension (or a blob:/data: URL) stays a native <video>. An
// unrecognised http(s) URL falls back to <video> — same as the old behaviour,
// no worse for a link that happens to be a direct file.
export function getVideoEmbed(url) {
  const src = (url || '').trim();
  if (!src) return { kind: 'none' };

  if (/\.(mp4|webm|ogg|ogv|mov|m4v)(\?.*)?$/i.test(src) || src.startsWith('blob:') || src.startsWith('data:')) {
    return { kind: 'file' };
  }

  // YouTube (watch, youtu.be, shorts, embed)
  let m = src.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([\w-]{11})/i);
  if (m) return { kind: 'embed', embedUrl: `https://www.youtube.com/embed/${m[1]}` };

  // Vimeo
  m = src.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
  if (m) return { kind: 'embed', embedUrl: `https://player.vimeo.com/video/${m[1]}` };

  // Instagram (reel / reels / post / tv)
  m = src.match(/instagram\.com\/(reel|reels|p|tv)\/([\w-]+)/i);
  if (m) {
    const kind = m[1] === 'reels' ? 'reel' : m[1];
    return { kind: 'embed', embedUrl: `https://www.instagram.com/${kind}/${m[2]}/embed` };
  }

  // Facebook (videos, watch, reels, share links, fb.watch) — the plugin player
  // takes the original URL as an encoded href, no access token needed. Passing
  // width/height (Facebook's own embed generator always includes these) gets
  // a better-proportioned player than leaving Facebook to guess from a bare
  // percentage iframe.
  if (/(?:facebook\.com|fb\.watch|fb\.me)\//i.test(src)) {
    const [w, h] = guessEmbedOrientation(src) === 'portrait' ? [340, 605] : [560, 315];
    return { kind: 'embed', embedUrl: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(src)}&show_text=false&width=${w}&height=${h}` };
  }

  return { kind: 'file' };
}

// Best-effort orientation guess for an embed link, used only when the admin
// leaves orientation on "Auto" — embeds can't self-report their real size
// (it's inside a cross-origin iframe), so we go by URL shape: reels/shorts
// paths are near-universally vertical, everything else defaults landscape.
export function guessEmbedOrientation(url) {
  const src = (url || '').trim();
  if (/\/(reel|reels)\//i.test(src)) return 'portrait'; // Facebook & Instagram reels
  if (/youtube\.com\/shorts\//i.test(src)) return 'portrait';
  return 'landscape';
}
