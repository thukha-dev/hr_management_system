"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  Home,
  Users,
  Settings,
  LogOut,
  User,
  ChevronDown,
  Loader2,
  Calendar,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

type NavItem = {
  name: string;
  href: string;
  icon: React.ReactNode;
};

interface SidebarProps {
  isOpen: boolean;
  isCollapsed?: boolean;
  onClose: () => void;
  activePath: string;
}

export function Sidebar({
  isOpen,
  isCollapsed = false,
  onClose,
}: SidebarProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const pathname = usePathname();

  // Handle mobile detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Set initial value
    handleResize();

    // Add event listener
    window.addEventListener("resize", handleResize);

    // Clean up
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    const toastId = toast.loading("Signing out...");

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        // Clear client-side storage
        localStorage.removeItem("user");
        sessionStorage.removeItem("user");

        // Function to delete cookie by name
        const deleteCookie = (name: string) => {
          document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
          document.cookie = `${name}=; path=/; domain=${window.location.hostname}; expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
          document.cookie = `${name}=; path=/; domain=.${window.location.hostname}; expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
        };

        // Delete all possible cookie variations
        deleteCookie("auth_token");

        // Also clear all cookies that might be set on subdomains
        const hostname = window.location.hostname.split(".");
        if (hostname.length > 1) {
          const domain = hostname.slice(-2).join(".");
          document.cookie = `auth_token=; path=/; domain=${domain}; expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
        }

        toast.success("Signed out successfully", { id: toastId });

        // Always redirect to login page with current locale
        const currentPath = window.location.pathname;
        const locale = currentPath.split("/")[1] || "en";

        // Force a full page reload to ensure all auth state is cleared
        window.location.href = `/${locale}/login`;
      } else {
        const error = await response.json().catch(() => ({}));
        toast.error(error.message || "Failed to sign out. Please try again.", {
          id: toastId,
        });
      }
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("An unexpected error occurred", { id: toastId });
    } finally {
      setIsLoggingOut(false);
      onClose();
    }
  };

  const navigation: NavItem[] = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: <Home className="h-5 w-5" />,
    },
    {
      name: "Employees",
      href: "/employees",
      icon: <Users className="h-5 w-5" />,
    },
    { name: "Leave", href: "/leave", icon: <Calendar className="h-5 w-5" /> },
    {
      name: "Documents",
      href: "/documents",
      icon: <FileText className="h-5 w-5" />,
    },
    {
      name: "Settings",
      href: "/settings",
      icon: <Settings className="h-5 w-5" />,
    },
  ];

  // Sidebar content as a function for reuse
  const sidebarContent = (
    <>
      {/* Visually hidden title for accessibility */}
      {isMobile && (
        <DrawerTitle asChild>
          <VisuallyHidden>Sidebar navigation</VisuallyHidden>
        </DrawerTitle>
      )}
      {/* Sticky header section */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="flex items-center justify-between h-16 px-4">
          <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            MOT
          </h1>
        </div>
      </div>
      {/* Scrollable content */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        <nav className="flex-1 px-2 py-4 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "group flex items-center text-sm font-medium rounded-md transition-colors",
                  "px-3 py-2",
                  isActive
                    ? "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700",
                  isCollapsed && "justify-center px-0",
                )}
                title={isCollapsed ? item.name : undefined}
              >
                <span className={cn("flex-shrink-0", !isCollapsed && "mr-3")}>
                  {item.icon}
                </span>
                {!isCollapsed && <span className="truncate">{item.name}</span>}
              </Link>
            );
          })}
        </nav>
      </div>
      {/* Sticky footer */}
      <div className="sticky bottom-0 border-t border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start h-auto py-2 transition-colors",
                isCollapsed ? "px-0 justify-center" : "px-3 justify-between",
              )}
            >
              <div className="flex items-center">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/avatars/01.png" alt="User" />
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
                {!isCollapsed && (
                  <div className="ml-3 text-left">
                    <p className="text-sm font-medium">User Name</p>
                    <p className="text-xs text-muted-foreground">Admin</p>
                  </div>
                )}
              </div>
              {!isCollapsed && (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-56"
            align="start"
            side="top"
            sideOffset={10}
          >
            <DropdownMenuItem asChild>
              <Link
                href="/profile"
                className="w-full cursor-pointer flex items-center"
              >
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
              onClick={handleLogout}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="mr-2 h-4 w-4" />
              )}
              <span>{isLoggingOut ? "Signing out..." : "Log out"}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );

  // Render Drawer for mobile, sidebar for desktop
  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DrawerContent>{sidebarContent}</DrawerContent>
      </Drawer>
    );
  }

  // Desktop sidebar
  return (
    <aside
      className={cn(
        "sidebar-container sticky top-0 left-0 z-40 h-screen border-r bg-background transition-all duration-300 ease-in-out",
        isCollapsed ? "md:w-16" : "md:w-64",
        "flex flex-col",
      )}
    >
      {sidebarContent}
    </aside>
  );
}
