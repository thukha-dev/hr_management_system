import { getRequestConfig } from "next-intl/server";

// This is the configuration for server-side translations
export default getRequestConfig(async ({ locale }) => {
  if (!locale) {
    throw new Error("Locale is required");
  }

  return {
    messages: (await import(`../messages/${locale}.json`)).default,
    locale,
  };
});
