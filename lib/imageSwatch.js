import http from 'node:http';
import https from 'node:https';
import { unstable_cache } from 'next/cache';

// The dominant colour of an image, used to pick which brand character sits on
// a hero card while that image is showing.
//
// Worked out on the server rather than in the browser. Reading pixels from a
// cross-origin image in the browser needs the host to send CORS headers, and
// asking for them on the displayed <img> makes the image fail to load outright
// when the host doesn't — so a colour nicety could cost the picture itself.
// Here nothing touches the <img> the visitor sees.
//
// Returns { h } (hue, 0–360) for an image with a clear colour, { neutral: true }
// for one that's mostly greys, or null if it couldn't be fetched or decoded in
// time — the caller falls back to a default character in both of the last two.

const TIMEOUT_MS = 2500;
const MAX_BYTES = 8 * 1024 * 1024;
const MAX_REDIRECTS = 3;
const SAMPLE = 40;
const BINS = 12;

// Downloads with Node's own http/https rather than the global fetch. Next
// wraps fetch with its caching layer, and during a render that wrapped fetch
// sat waiting until the timeout on every image — the same request outside
// Next finished in a fraction of a second. node:https isn't wrapped, so it
// just downloads. Follows redirects (image CDNs use them), caps the size, and
// gives each hop a hard deadline so a slow host can't hold up the page.
function download(url, redirectsLeft = MAX_REDIRECTS) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https:') ? https : url.startsWith('http:') ? http : null;
    if (!lib) return reject(new Error('not an http(s) URL'));

    const req = lib.get(url, { headers: { 'user-agent': 'keda-site/image-swatch' } }, (res) => {
      const { statusCode = 0, headers } = res;
      if (statusCode >= 300 && statusCode < 400 && headers.location) {
        res.resume();
        clearTimeout(deadline);
        if (redirectsLeft <= 0) return reject(new Error('too many redirects'));
        return resolve(download(new URL(headers.location, url).href, redirectsLeft - 1));
      }
      if (statusCode !== 200) {
        res.resume();
        clearTimeout(deadline);
        return reject(new Error(`HTTP ${statusCode}`));
      }
      const chunks = [];
      let size = 0;
      res.on('data', (chunk) => {
        size += chunk.length;
        if (size > MAX_BYTES) req.destroy(new Error('image too large'));
        else chunks.push(chunk);
      });
      res.on('end', () => {
        clearTimeout(deadline);
        resolve(Buffer.concat(chunks));
      });
      res.on('error', (err) => {
        clearTimeout(deadline);
        reject(err);
      });
    });

    const deadline = setTimeout(() => req.destroy(new Error(`timed out after ${TIMEOUT_MS}ms`)), TIMEOUT_MS);
    req.on('error', (err) => {
      clearTimeout(deadline);
      reject(err);
    });
  });
}

async function computeSwatch(url) {
  try {
    const buf = await download(url);
    const { default: sharp } = await import('sharp');
    const { data, info } = await sharp(buf, { failOn: 'none' })
      .resize(SAMPLE, SAMPLE, { fit: 'cover' })
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    // Hue histogram weighted by chroma, so a small patch of strong colour
    // outweighs a large grey or near-black area. An average of all pixels
    // would drift to brown on almost any photo.
    const weight = new Array(BINS).fill(0);
    const vx = new Array(BINS).fill(0);
    const vy = new Array(BINS).fill(0);
    let chroma = 0;
    const pixels = data.length / info.channels;

    for (let i = 0; i < data.length; i += info.channels) {
      const r = data[i] / 255;
      const g = data[i + 1] / 255;
      const b = data[i + 2] / 255;
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const c = max - min;
      if (c < 0.1) continue;
      let h;
      if (max === r) h = ((g - b) / c) % 6;
      else if (max === g) h = (b - r) / c + 2;
      else h = (r - g) / c + 4;
      h = (h * 60 + 360) % 360;
      const bin = Math.floor(h / (360 / BINS)) % BINS;
      const rad = (h * Math.PI) / 180;
      weight[bin] += c;
      vx[bin] += c * Math.cos(rad);
      vy[bin] += c * Math.sin(rad);
      chroma += c;
    }

    if (chroma / pixels < 0.06) return { neutral: true };

    // Score each bin together with half its neighbours, so a colour sitting on
    // a bin boundary isn't split in two and outvoted.
    let best = 0;
    let bestScore = -1;
    for (let k = 0; k < BINS; k++) {
      const score = weight[k] + 0.5 * (weight[(k + BINS - 1) % BINS] + weight[(k + 1) % BINS]);
      if (score > bestScore) {
        bestScore = score;
        best = k;
      }
    }
    const around = [(best + BINS - 1) % BINS, best, (best + 1) % BINS];
    const x = around.reduce((sum, k) => sum + vx[k], 0);
    const y = around.reduce((sum, k) => sum + vy[k], 0);
    return { h: Math.round(((Math.atan2(y, x) * 180) / Math.PI + 360) % 360) };
  } catch (err) {
    // Worth a line in the log: a silent null here just looks like "the
    // colour matching doesn't work" with nothing to go on.
    console.warn(`[imageSwatch] couldn't read ${url} (${err?.code || err?.message}) — using a default character`);
    return null;
  }
}

// Cached per URL for a day, failures included: a broken or slow image link
// shouldn't be re-fetched on every page view, and images don't change often
// enough to need fresher than that.
//
// Concurrent renders asking for the same image share one download instead of
// each starting their own.
const inflight = new Map();

export function getSwatch(url) {
  if (!inflight.has(url)) {
    const job = unstable_cache(() => computeSwatch(url), ['image-swatch-v2', url], { revalidate: 86400 })();
    inflight.set(url, job);
    job.finally(() => inflight.delete(url));
  }
  return inflight.get(url);
}
