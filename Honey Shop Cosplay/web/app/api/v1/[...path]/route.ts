import type { NextRequest } from 'next/server';
import { getCloudflareApi } from '../../../../lib/cloudflare-env';

export const dynamic = 'force-dynamic';
const origin = process.env.API_ORIGIN || (process.env.NODE_ENV === 'development' ? 'http://127.0.0.1:8787' : 'https://api.honeyshopcosplay.likecactus.com');

async function proxy(request: NextRequest) {
  const incoming = new URL(request.url);
  const target = new URL(`${incoming.pathname}${incoming.search}`, origin);
  const headers = new Headers(request.headers);
  headers.delete('host');
  headers.delete('content-length');
  headers.delete('connection');
  const init: RequestInit = {
    method: request.method,
    headers,
    body: ['GET', 'HEAD'].includes(request.method) ? undefined : request.body,
    // @ts-expect-error Required by Node fetch for a streamed request body; ignored on Workers.
    duplex: 'half',
    redirect: 'manual',
    cache: 'no-store',
  };
  const api = await getCloudflareApi();
  const response = api
    ? await api.fetch(new Request(target, init))
    : await fetch(target, init);
  return new Response(response.body, { status: response.status, headers: response.headers });
}
export const GET = proxy;
export const HEAD = proxy;
export const POST = proxy;
export const PATCH = proxy;
export const PUT = proxy;
export const DELETE = proxy;
export const OPTIONS = proxy;
