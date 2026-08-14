import { NextResponse } from 'next/server';

import { API_BASE } from '@/lib/admin/server-api';

/**
 * Proxy login to the API and forward its Set-Cookie (the HTTP-only session
 * cookie) to the browser, re-scoped to this origin. The token never touches
 * client JavaScript.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'Invalid request body' } },
      { status: 400 },
    );
  }

  const apiRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

  const payload = await apiRes.json().catch(() => ({}));
  const res = NextResponse.json(payload, { status: apiRes.status });

  for (const cookie of apiRes.headers.getSetCookie()) {
    res.headers.append('set-cookie', cookie);
  }
  return res;
}
