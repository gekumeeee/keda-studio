import { NextResponse } from 'next/server';
import { getSettings, saveSettings } from '@/lib/store';
import { DEFAULTS, mergeSettings } from '@/lib/defaults';
import { requirePermission } from '@/lib/auth';

function isLoc(v) {
  return v && typeof v === 'object' && !Array.isArray(v) && ('en' in v || 'ar' in v);
}
function cleanLoc(v) {
  const s = v && typeof v === 'object' ? v : {};
  return { en: typeof s.en === 'string' ? s.en.trim() : '', ar: typeof s.ar === 'string' ? s.ar.trim() : '' };
}

export async function GET() {
  const gate = await requirePermission('settings');
  if (gate.error) return gate.error;
  const saved = await getSettings();
  return NextResponse.json(mergeSettings(saved));
}

export async function PUT(request) {
  const gate = await requirePermission('settings');
  if (gate.error) return gate.error;
  const body = await request.json();
  const clean = {};

  for (const key of Object.keys(DEFAULTS)) {
    const def = DEFAULTS[key];
    const val = body[key];

    if (key === 'heroWords') {
      clean[key] = Array.isArray(val)
        ? val.map((w) => ({ text: cleanLoc(w?.text), color: typeof w?.color === 'string' ? w.color : 'var(--orange-soft)' }))
        : def;
    } else if (key === 'services') {
      clean[key] = Array.isArray(val)
        ? val.map((s) => ({
            title: cleanLoc(s?.title),
            desc: cleanLoc(s?.desc),
            stat: typeof s?.stat === 'string' ? s.stat.trim() : '',
            image: typeof s?.image === 'string' ? s.image.trim() : '',
          }))
        : def;
    } else if (key === 'impact') {
      clean[key] = Array.isArray(val)
        ? val.map((it) => ({
            value: typeof it?.value === 'string' ? it.value.trim() : '',
            color: typeof it?.color === 'string' ? it.color : 'var(--green)',
            label: cleanLoc(it?.label),
            sub: cleanLoc(it?.sub),
          }))
        : def;
    } else if (isLoc(def)) {
      clean[key] = cleanLoc(val);
    } else {
      clean[key] = typeof val === 'string' ? val.trim() : '';
    }
  }

  await saveSettings(clean);
  return NextResponse.json(mergeSettings(clean));
}
