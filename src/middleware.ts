import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ipRateLimiter, getClientIP, RateLimitError } from '@/lib/edge-rate-limit';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip rate limiting for auth routes to avoid OAuth issues
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth/')) {
    try {
      const clientIP = getClientIP(request);
      await ipRateLimiter.checkLimit(clientIP);
    } catch (error) {
      if (error instanceof RateLimitError) {
        return NextResponse.json(
          { 
            error: error.message,
            resetTime: error.resetTime 
          },
          { 
            status: 429,
            headers: {
              'Retry-After': Math.ceil((error.resetTime - Date.now()) / 1000).toString(),
            }
          }
        );
      }
      
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }
  }

  // Special handling for auth routes
  if (pathname.startsWith('/api/auth/')) {
    const response = NextResponse.next();
    // Add CORS headers for auth routes
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return response;
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
