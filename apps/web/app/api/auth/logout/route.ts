import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { API_BASE, SESSION_COOKIE } from '@/lib/admin/server-api';

/** Revoke the session on the API and clear the browser cookie. */
export async function POST() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;

  await fetch(`${API_BASE}/auth/logout`, {
    method: 'POST',
    headers: token ? { cookie: `${SESSION_COOKIE}=${token}` } : undefined,
  }).catch(() => undefined);

  const res = NextResponse.json({ data: { message: 'Logged out' } });
  res.cookies.set(SESSION_COOKIE, '', { maxAge: 0, path: '/' });
  return res;
}
