import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n';

export default createMiddleware({
  // A list of all locales that are supported
  locales,
  
  // Used when no locale matches
  defaultLocale,
  
  // Always use locale prefix in the URL
  localePrefix: 'always',
  
  // Optional: configure the locale detection
  localeDetection: true,
});

export const config = {
  // Match all paths except for:
  // - api routes
  // - static files
  // - _next/static
  // - _next/image
  // - favicon.ico
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
    '/',
    `/(en|my)/:path*`
  ]
};
