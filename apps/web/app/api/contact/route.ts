import { NextResponse } from 'next/server';

/**
 * Same-origin proxy for the public contact form, so the browser fetch satisfies
 * the strict `connect-src 'self'` CSP. Forwards the JSON body to the FastAPI
 * public `/contact` endpoint (which owns validation, rate limiting + honeypot).
 */
const API_BASE =
  process.env.API_INTERNAL_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  'http://localhost:8000/api/v1';

export async function POST(request: Request) {
  const body = await request.text();
  try {
    const res = await fetch(`${API_BASE}/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });
    const text = await res.text();
    return new NextResponse(text, {
      status: res.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return NextResponse.json(
      { error: { code: 'UPSTREAM_ERROR', message: 'Could not reach the contact service.' } },
      { status: 502 },
    );
  }
}
