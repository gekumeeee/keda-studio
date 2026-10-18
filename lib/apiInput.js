import { NextResponse } from 'next/server';

// Request-body helpers shared by the API routes. Every write route used to
// call request.json() bare and then .trim() on whatever came in, so a body
// that wasn't JSON, was `null`, or carried a number where a string was
// expected (`{ "clientId": 5 }`) crashed the handler into a 500 — including
// the two routes anyone can reach without signing in (login and the contact
// form). These turn all of that into a plain 400 instead.

// The parsed body when it's a JSON object, otherwise null.
export async function readBody(request) {
  try {
    const body = await request.json();
    return body && typeof body === 'object' && !Array.isArray(body) ? body : null;
  } catch {
    return null;
  }
}

export function badBody() {
  return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
}

// A trimmed string from a field that should be one. Numbers are kept as their
// text (a price typed as 5000 rather than "5000"); anything else becomes ''.
export function str(value) {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return '';
}
