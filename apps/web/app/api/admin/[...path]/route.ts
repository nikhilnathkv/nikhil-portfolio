import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { API_BASE, SESSION_COOKIE } from '@/lib/admin/server-api';

/**
 * Authenticated proxy: browser → this route → FastAPI admin API.
 *
 * Client components call `/api/admin/...`; this handler forwards the request to
 * the FastAPI `/admin/...` endpoints with the caller's HTTP-only session cookie
 * attached. The token never touches client JavaScript, and calls stay same-origin
 * (a direct browser→:8000 request would not carry the cookie).
 */
async function proxy(request: Request, path: string[]): Promise<Response> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;

  const search = new URL(request.url).search;
  const target = `${API_BASE}/admin/${path.join('/')}${search}`;

  const headers = new Headers();
  if (token) headers.set('cookie', `${SESSION_COOKIE}=${token}`);

  const method = request.method.toUpperCase();
  let body: string | undefined;
  if (method !== 'GET' && method !== 'DELETE') {
    body = await request.text();
    if (body) headers.set('content-type', 'application/json');
  }

  const apiRes = await fetch(target, { method, headers, body, cache: 'no-store' });

  // 204 No Content (delete) — nothing to relay.
  if (apiRes.status === 204) {
    return new NextResponse(null, { status: 204 });
  }

  const text = await apiRes.text();
  return new NextResponse(text, {
    status: apiRes.status,
    headers: { 'content-type': apiRes.headers.get('content-type') ?? 'application/json' },
  });
}

type Ctx = { params: Promise<{ path: string[] }> };

export async function GET(request: Request, ctx: Ctx) {
  return proxy(request, (await ctx.params).path);
}
export async function POST(request: Request, ctx: Ctx) {
  return proxy(request, (await ctx.params).path);
}
export async function PUT(request: Request, ctx: Ctx) {
  return proxy(request, (await ctx.params).path);
}
export async function PATCH(request: Request, ctx: Ctx) {
  return proxy(request, (await ctx.params).path);
}
export async function DELETE(request: Request, ctx: Ctx) {
  return proxy(request, (await ctx.params).path);
}
