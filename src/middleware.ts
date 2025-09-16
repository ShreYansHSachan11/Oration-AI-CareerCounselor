import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ipRateLimiter, getClientIP } from '@/lib/rate-limit';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Apply rate limiting to API routes
  if (pathname.startsWith('/api/')) {
    try {
      const clientIP = getClientIP(request);
      await ipRateLimiter.checkLimit(clientIP);
    } catch (error: any) {
      return NextResponse.json(
        { error: error.message || 'Rate limit exceeded' },
        { status: 429 }
      );
    }
  }

  // Add performance headers for static assets
  if (pathname.startsWith('/_next/static/') || pathname.includes('.')) {
    const response = NextResponse.next();

    // Cache static assets for 1 year
    response.headers.set(
      'Cache-Control',
      'public, max-age=31536000, immutable'
    );

    return response;
  }

  // Add security headers
  const response = NextResponse.next();

  // Security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  );

  // Performance headers for API routes
  if (pathname.startsWith('/api/trpc/')) {
    response.headers.set(
      'Cache-Control',
      'private, no-cache, no-store, must-revalidate'
    );
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
