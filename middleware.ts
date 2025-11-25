import createMiddleware from 'next-intl/middleware';
import { routing } from './lib/i18n/routing';
import { NextRequest, NextResponse } from 'next/server';

const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  const response = intlMiddleware(request);
  
  if (response) {
    const pathname = request.nextUrl.pathname;
    response.headers.set('x-pathname', pathname);
  }
  
  return response;
}

export const config = {
  matcher: ['/', '/(pl|en)/:path*']
};

