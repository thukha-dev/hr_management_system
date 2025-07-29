"use client";

import { redirect } from "next/navigation";
import { locales, defaultLocale } from "../../i18n";

export default function NotFound() {
  // This will be handled by the middleware to redirect to the login page
  // with the appropriate locale
  redirect(`/${defaultLocale}/login`);
}
