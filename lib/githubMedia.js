import { randomBytes } from 'node:crypto';

// Stores uploaded images in the site's GitHub repo instead of Vercel, and
// serves them from jsDelivr's free CDN — so neither the storage nor the
// bandwidth of a picture counts against the Vercel plan.
//
// Files go to their own branch (GITHUB_MEDIA_BRANCH, "media" by default),
// never main: a commit to main redeploys the whole site, and nobody wants a
// rebuild per photo. vercel.json turns deployments off for that branch too.
//
// The URL handed back pins the exact commit (…@<sha>/…) rather than the
// branch name. jsDelivr caches a branch→commit lookup for hours, so a brand
// new file on "@media" could 404 for a while; a commit URL is immutable and
// resolves the moment it exists.
//
// Needs GITHUB_TOKEN: a fine-grained token with "Contents: read and write"
// on this one repository. The repo must stay public for jsDelivr to serve it.

const API = 'https://api.github.com';

function config() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) return null;
  return {
    token,
    repo: process.env.GITHUB_REPO || 'gekumeeee/keda-studio',
    branch: process.env.GITHUB_MEDIA_BRANCH || 'media',
  };
}

export function mediaUploadsConfigured() {
  return config() !== null;
}

async function gh(cfg, path, init = {}) {
  const res = await fetch(`${API}/repos/${cfg.repo}${path}`, {
    ...init,
    cache: 'no-store',
    headers: {
      Authorization: `Bearer ${cfg.token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'keda-site/media-upload',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
    },
  });
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  return { status: res.status, data };
}

// The media branch is created on the first upload, from main's current
// commit. After that it only ever gains image files.
async function ensureBranch(cfg) {
  const existing = await gh(cfg, `/git/ref/heads/${cfg.branch}`);
  if (existing.status === 200) return;
  if (existing.status !== 404) throw new Error(`GitHub: couldn't read branch "${cfg.branch}" (${existing.status})`);

  const repo = await gh(cfg, '');
  if (repo.status !== 200) throw new Error(`GitHub: couldn't read the repository (${repo.status})`);
  const base = await gh(cfg, `/git/ref/heads/${repo.data.default_branch}`);
  if (base.status !== 200) throw new Error(`GitHub: couldn't read the default branch (${base.status})`);

  const created = await gh(cfg, '/git/refs', {
    method: 'POST',
    body: JSON.stringify({ ref: `refs/heads/${cfg.branch}`, sha: base.data.object.sha }),
  });
  // 422 = someone else created it a moment ago, which is just as good
  if (created.status !== 201 && created.status !== 422) {
    throw new Error(`GitHub: couldn't create branch "${cfg.branch}" (${created.status})`);
  }
}

// Commits one image and returns its public CDN URL.
export async function uploadImage(buffer, ext) {
  const cfg = config();
  if (!cfg) throw new Error('not configured');

  await ensureBranch(cfg);

  const now = new Date();
  const month = `${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
  // random, not derived from the file name: names collide, and they can
  // carry things that shouldn't end up in a public repo
  const path = `uploads/${month}/${Date.now().toString(36)}-${randomBytes(4).toString('hex')}.${ext}`;
  const body = JSON.stringify({
    message: `Upload ${path}`,
    content: buffer.toString('base64'),
    branch: cfg.branch,
  });

  // A new file never conflicts with itself, but two uploads landing at the
  // same instant can race on the branch head — GitHub answers 409 and a
  // second attempt goes through.
  let put = await gh(cfg, `/contents/${path}`, { method: 'PUT', body });
  if (put.status === 409) put = await gh(cfg, `/contents/${path}`, { method: 'PUT', body });
  if (put.status !== 201) {
    const reason = put.data?.message ? `: ${put.data.message}` : '';
    throw new Error(`GitHub: upload failed (${put.status}${reason})`);
  }

  return `https://cdn.jsdelivr.net/gh/${cfg.repo}@${put.data.commit.sha}/${path}`;
}
