"use client";

import { Button } from "@/components/ui/button";
import { Menu, Moon, Sun, X } from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

interface HeaderProps {
  onMenuClick?: () => void;
  isSidebarOpen?: boolean;
}

interface HeaderProps {
  onMenuClick?: () => void;
  isSidebarOpen?: boolean;
}

export function Header({ onMenuClick, isSidebarOpen = false }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const t = useTranslations();
  const pathname = usePathname();
  const router = useRouter();

  // Extract the current locale from the pathname
  const segments = pathname.split("/");
  const currentLocale =
    segments[1] && ["en", "my"].includes(segments[1]) ? segments[1] : "en";

  const switchLanguage = (newLocale: string) => {
    const newSegments = [...segments];
    if (["en", "my"].includes(segments[1])) {
      newSegments[1] = newLocale;
    } else {
      newSegments.splice(1, 0, newLocale);
    }
    const newPath = newSegments.join("/");
    router.push(newPath);
  };

  return (
    <header className="sticky top-0 z-[9999] w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          {/* Sidebar Toggle Button */}
          {!pathname.includes("/login") && (
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-8 w-8 rounded-md transition-colors hover:bg-accent hover:text-accent-foreground",
                "md:h-9 md:w-9",
              )}
              onClick={onMenuClick}
              aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
            >
              <Menu className="h-4 w-4 md:h-5 md:w-5" />
            </Button>
          )}

          {/* Logo - Hidden on mobile */}
          <div className="hidden items-center md:flex">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-lg font-bold">HR Management System</span>
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-md md:h-9 md:w-9"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          {/* Language Toggle */}
          <div className="flex items-center rounded-md border p-0.5">
            {["en", "my"].map((locale) => (
              <Button
                key={locale}
                variant={currentLocale === locale ? "default" : "ghost"}
                size="sm"
                className={cn(
                  "h-7 px-2 text-xs font-medium",
                  currentLocale !== locale && "text-muted-foreground",
                )}
                onClick={() => switchLanguage(locale)}
              >
                {t(`language.${locale}`)}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
