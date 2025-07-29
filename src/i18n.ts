import { getRequestConfig } from "next-intl/server";

// Define default locale
export const defaultLocale = "en" as const;

// Export supported locales
export const locales = ["en", "my"] as const;

export type Locale = (typeof locales)[number];

// Helper function to validate locale
export function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale);
}

// Request config for next-intl
export default getRequestConfig(async ({ locale = defaultLocale }) => {
  if (!locale || !isValidLocale(locale)) {
    throw new Error(`Locale '${locale}' is not supported.`);
  }

  return {
    messages: (await import(`./messages/${locale}.json`)).default,
    locale,
  };
});
