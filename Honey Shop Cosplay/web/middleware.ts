import { NextRequest, NextResponse } from 'next/server';

const publicAdminRoutes = ['/admin/login', '/admin/forgot-password', '/admin/reset-password', '/admin/accept-invite'];
export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (!path.startsWith('/admin') || publicAdminRoutes.some(route => path.startsWith(route))) return NextResponse.next();
  if (!request.cookies.get('honey_session')) return NextResponse.redirect(new URL(`/admin/login?next=${encodeURIComponent(path)}`, request.url));
  return NextResponse.next();
}
export const config = { matcher: ['/admin/:path*'] };
