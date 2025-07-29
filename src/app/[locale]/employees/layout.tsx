"use client";

import { useState, ReactNode, useEffect } from "react";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { cn } from "@/lib/utils";

export default function EmployeesLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSidebar = () => {
    // On mobile, toggle the sidebar open/closed
    // On desktop, toggle between collapsed/expanded states
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setSidebarOpen(!sidebarOpen);
    } else {
      setIsCollapsed(!isCollapsed);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      {/* Sticky header */}
      <Header onMenuClick={toggleSidebar} isSidebarOpen={sidebarOpen} />

      <div className="flex flex-1">
        {/* Sidebar */}
        <Sidebar
          isOpen={sidebarOpen}
          isCollapsed={isCollapsed}
          onClose={() => setSidebarOpen(false)}
          activePath="/employees"
        />

        {/* Main content */}
        <main
          className={cn(
            "flex-1 overflow-y-auto bg-background transition-all duration-300 ease-in-out",
          )}
        >
          <div className="mx-auto max-w-7xl p-4 md:p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
