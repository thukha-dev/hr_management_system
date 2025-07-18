import createIntlMiddleware from 'next-intl/middleware';
import { NextResponse, NextRequest } from 'next/server';
import { locales, defaultLocale } from './i18n';

const publicRoutes = ['/login', '/register'];

const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always',
  localeDetection: true,
});

export default async function middleware(request: NextRequest) {
  const { pathname } = new URL(request.url);
  const pathLocale = locales.find(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );
  
  // Handle internationalization
  const response = intlMiddleware(request);
  
  // Check if the path is a public route
  const isPublicRoute = publicRoutes.some(route => 
    pathname.endsWith(route) || 
    pathname.endsWith(`${route}/`)
  );
  
  // If it's a non-existent route, redirect to login with the appropriate locale
  if (!isPublicRoute && !pathLocale && !pathname.startsWith('/_next')) {
    const locale = pathLocale || defaultLocale;
    return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
  }
  
  return response;
}

export const config = {
  matcher: [
    // Match all paths except for the ones starting with:
    // - api (API routes)
    // - _next/static (static files)
    // - _next/image (image optimization files)
    // - favicon.ico (favicon file)
    '/((?!api|_next/static|_next/image|favicon.ico).*)'
  ]
};
