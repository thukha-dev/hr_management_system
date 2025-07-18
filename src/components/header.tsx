"use client";

import { useTranslations } from "next-intl";
import { ThemeToggle } from "./theme-toggle";
import { usePathname, useRouter } from "next/navigation";
import { locales } from "@/i18n";
import { useEffect } from "react";

export function Header() {
  const t = useTranslations();
  const pathname = usePathname();
  const router = useRouter();

  // Extract the current locale from the pathname
  const segments = pathname.split("/");
  const currentLocale =
    segments[1] && locales.includes(segments[1] as any) ? segments[1] : "en";

  // Debug logging
  useEffect(() => {
    console.log("Current locale:", currentLocale);
    console.log("Available locales:", locales);
  }, [currentLocale, t]);

  const switchLanguage = (newLocale: string) => {
    console.log("Switching to locale:", newLocale);
    // Update the URL with the new locale
    const newSegments = [...segments];
    if (locales.includes(segments[1] as any)) {
      newSegments[1] = newLocale;
    } else {
      newSegments.splice(1, 0, newLocale);
    }
    const newPath = newSegments.join("/");
    console.log("Navigating to:", newPath);
    router.push(newPath);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="h-16 items-center p-4">
        <div className="flex flex-1 items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-lg font-semibold tracking-tight">
              {t("header.title")}
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              {locales.map((locale) => (
                <button
                  key={locale}
                  onClick={() => switchLanguage(locale)}
                  className={`px-2 py-1 rounded ${
                    currentLocale === locale
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-accent hover:text-accent-foreground"
                  }`}
                >
                  {t(`language.${locale}`)}
                </button>
              ))}
            </div>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
