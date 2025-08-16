"use client";

import { useState, type ReactNode, useMemo, useCallback } from "react";
import { usePathname } from "next/navigation";
import { Header } from "@/components/header";
import { Sidebar } from "@/components/sidebar";
import { cn } from "@/lib/utils";

export type AppShellProps = {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  // Optionally force an active path in the sidebar (e.g., "/employees").
  activePath?: string;
};

export function AppShell({
  children,
  className,
  contentClassName,
  activePath,
}: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

  const resolvedActivePath = useMemo(() => {
    if (activePath) return activePath;
    const path = pathname || "/";
    // Strip locale prefix like /en or /my (SSR-safe)
    const parts = path.split("/"); // ["", "en", "dashboard"]
    const locales = new Set(["en", "my"]);
    const first = parts[1];
    const withoutLocale = locales.has(first)
      ? "/" + (parts.slice(2).join("/") || "")
      : path;
    return withoutLocale.startsWith("/") ? withoutLocale : "/" + withoutLocale;
  }, [activePath, pathname]);

  const toggleSidebar = useCallback(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setSidebarOpen((v) => !v);
    } else {
      setIsCollapsed((v) => !v);
    }
  }, []);

  return (
    <div className={cn("flex min-h-screen flex-col", className)}>
      <Header onMenuClick={toggleSidebar} isSidebarOpen={sidebarOpen} />
      <div className="flex flex-1">
        <Sidebar
          isOpen={sidebarOpen}
          isCollapsed={isCollapsed}
          onClose={() => setSidebarOpen(false)}
          activePath={resolvedActivePath}
        />
        <main
          className={cn(
            "flex-1 overflow-y-auto bg-background transition-all duration-300 ease-in-out",
            contentClassName,
          )}
        >
          <div className="mx-auto max-w-7xl p-4 md:p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
