import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This middleware is intentionally minimal since we're using client-side auth
// It only handles protecting specific routes that require authentication
export function middleware(request: NextRequest) {
  // Public pages that don't require authentication
  const publicPaths = ['/login', '/signup', '/', '/track'];
  
  // Check if the current path is public or starts with a public path
  const isPublicPath = publicPaths.some(path => 
    request.nextUrl.pathname === path || 
    request.nextUrl.pathname.startsWith(`${path}/`)
  );

  // Allow access to public paths without authentication
  if (isPublicPath) {
    return NextResponse.next();
  }

  // For protected paths, we'll let the client-side auth handle most of the logic
  // But we can add additional checks here if needed in the future
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}; 