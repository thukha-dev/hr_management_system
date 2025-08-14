import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import createIntlMiddleware from "next-intl/middleware";
import { locales, defaultLocale } from "./i18n";
import { getUserFromToken } from "./lib/auth";
import logger from "./lib/logger";

// Define public routes (no auth required)
const publicRoutes = ["/login", "/register", "/api/auth", "/api/auth/logout"];

// Define paths that should be excluded from middleware processing
const excludedPaths = [
  "/_next",
  "/favicon.ico",
  "/images",
  "/avatars",
  "/assets",
];

// Define protected routes with required roles
const protectedRoutes = [
  {
    path: "/dashboard",
    roles: ["user", "admin", "Super Admin"], // Both user and admin can access
  },
  {
    path: "/admin",
    roles: ["admin"], // Only admin can access
  },
  {
    path: "/profile",
    roles: ["user", "admin"], // Both user and admin can access
  },
];

const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale,
  localePrefix: "always",
  localeDetection: true,
});

export default async function middleware(request: NextRequest) {
  const { pathname } = new URL(request.url);

  // Skip middleware for static files and excluded paths
  if (excludedPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  logger.info(`[Middleware] Path: ${pathname}`);
  logger.info(`[Middleware] request url: ${request.url}`);
  const token = request.cookies.get("auth_token")?.value;
  const user = token ? await getUserFromToken(token) : null;
  logger.info("user is --- ", user);

  // Extract locale and path without locale
  const pathSegments = pathname.split("/").filter(Boolean);
  const pathLocale = locales.includes(pathSegments[0] as any)
    ? pathSegments[0]
    : null;
  const pathWithoutLocale = pathLocale
    ? "/" + pathSegments.slice(1).join("/")
    : pathname;

  // Check if the current route is public (ignore locale prefix)
  const isPublicRoute = publicRoutes.some(
    (route) =>
      pathWithoutLocale === `/${route}` ||
      pathWithoutLocale.startsWith(`/${route}/`),
  );

  logger.info(
    `[Middleware] Path without locale: ${pathWithoutLocale}, isPublic: ${isPublicRoute}`,
  );

  // Get the authentication token from cookies
  const authToken = request.cookies.get("auth_token")?.value;
  logger.info(`[Middleware] Auth token exists: ${!!authToken}`);

  if (authToken) {
    logger.info("[Middleware] User is authenticated, checking path...");
    logger.info(`[Middleware] Available locales: ${locales}`);
    logger.info(
      `[Middleware] Path: ${pathname}, Path without locale: ${pathWithoutLocale}`,
    );

    const currentLocale = pathLocale || defaultLocale;

    // If user is authenticated and trying to access login/register, redirect to dashboard
    if (
      pathWithoutLocale === "/login" ||
      pathWithoutLocale === "/register" ||
      pathWithoutLocale.startsWith("/login/") ||
      pathWithoutLocale.startsWith("/register/")
    ) {
      logger.info(`[Middleware] Redirecting to ${currentLocale}/dashboard`);
      logger.info(
        `[Middleware] redirect route`,
        new URL(`/${currentLocale}/dashboard`, request.url),
      );
      return NextResponse.redirect(
        new URL(`/${currentLocale}/dashboard`, request.url),
      );
    }
  }

  // For other public routes, continue with the request
  if (isPublicRoute) {
    return intlMiddleware(request);
  }

  // Get the matched protected route configuration (using path without locale)
  const matchedRoute = protectedRoutes.find(
    (route) =>
      pathWithoutLocale === route.path ||
      pathWithoutLocale.startsWith(`${route.path}/`),
  );

  logger.info(
    "[Middleware] Matched route:",
    matchedRoute ? matchedRoute.path : "none",
  );

  if (matchedRoute) {
    // If we get here, the route is protected and requires authentication
    if (!authToken) {
      const currentLocale = pathLocale || defaultLocale;
      const loginUrl = new URL(`/${currentLocale}/login`, request.url);
      logger.info(
        `[Middleware] Unauthenticated user, redirecting to: ${loginUrl}`,
      );
      return NextResponse.redirect(loginUrl);
    }

    // Check if user has required role (if roles are implemented)
    // Note: This is a placeholder - you'll need to implement proper role checking
    // based on your authentication system
    const hasRequiredRole =
      matchedRoute.roles.length === 0 ||
      matchedRoute.roles.some((role) => user?.role === role);

    if (!hasRequiredRole) {
      logger.warn(`[Middleware] Unauthorized access to ${pathname}`);
      return NextResponse.redirect(
        new URL(`/${pathLocale || defaultLocale}/unauthorized`, request.url),
      );
    }
  }

  return intlMiddleware(request);
}

export const config = {
  // Match all request paths except for the ones starting with:
  // - api (API routes)
  // - _next/static (static files)
  // - _next/image (image optimization files)
  // - favicon.ico (favicon file)
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
