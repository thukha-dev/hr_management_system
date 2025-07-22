'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import {
  Home,
  Users,
  Settings,
  LogOut,
  User,
  ChevronDown,
  Menu,
  X,
  Loader2,
  Calendar,
  FileText,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

type NavItem = {
  name: string;
  href: string;
  icon: React.ReactNode;
};

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
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
    window.addEventListener('resize', handleResize);
    
    // Clean up
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    const toastId = toast.loading('Signing out...');
    
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('response --- ', response);

      if (response.ok) {
        // Clear client-side storage
        localStorage.removeItem('user');
        sessionStorage.removeItem('user');
        
        // Function to delete cookie by name
        const deleteCookie = (name: string) => {
          document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
          document.cookie = `${name}=; path=/; domain=${window.location.hostname}; expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
          document.cookie = `${name}=; path=/; domain=.${window.location.hostname}; expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
        };
        
        // Delete all possible cookie variations
        deleteCookie('auth_token');
        deleteCookie('auth-token');
        
        // Also clear all cookies that might be set on subdomains
        const hostname = window.location.hostname.split('.');
        if (hostname.length > 1) {
          const domain = hostname.slice(-2).join('.');
          document.cookie = `auth_token=; path=/; domain=${domain}; expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
          document.cookie = `auth-token=; path=/; domain=${domain}; expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
        }
        
        toast.success('Signed out successfully', { id: toastId });
        
        // Always redirect to login page with current locale
        const currentPath = window.location.pathname;
        const locale = currentPath.split('/')[1] || 'en';
        
        // Force a full page reload to ensure all auth state is cleared
        window.location.href = `/${locale}/login`;
      } else {
        const error = await response.json().catch(() => ({}));
        toast.error(error.message || 'Failed to sign out. Please try again.', { id: toastId });
      }
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('An unexpected error occurred', { id: toastId });
    } finally {
      setIsLoggingOut(false);
      onClose();
    }
  };

  const navigation: NavItem[] = [
    { name: 'Dashboard', href: '/dashboard', icon: <Home className="h-5 w-5" /> },
    { name: 'Employees', href: '/employees', icon: <Users className="h-5 w-5" /> },
    { name: 'Leave', href: '/leave', icon: <Calendar className="h-5 w-5" /> },
    { name: 'Documents', href: '/documents', icon: <FileText className="h-5 w-5" /> },
    { name: 'Settings', href: '/settings', icon: <Settings className="h-5 w-5" /> },
  ];

  return (
    <>


      {/* Overlay - Only on mobile */}
      {isOpen && isMobile && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <div 
        className={`fixed md:sticky top-0 left-0 h-screen transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 transition-transform duration-200 ease-in-out z-30 w-64 flex-shrink-0 flex flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700`}
      >
        <div className="flex flex-col w-64 h-full bg-white border-r">
        <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-4">
            <h1 className="text-xl font-bold">HR Portal</h1>
          </div>
          <div className="mt-5 flex-1 flex flex-col">
            <nav className="flex-1 px-2 space-y-1">
              {navigation.map((item) => {
                const isActive = pathname?.startsWith(item.href);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                      isActive
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <span className="mr-3">{item.icon}</span>
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
        <div className="mt-auto flex-shrink-0 border-t border-gray-200 p-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-between h-auto py-2 px-3 hover:bg-gray-100">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left">
                    <p className="text-sm font-medium">Admin User</p>
                    <p className="text-xs text-muted-foreground">admin@example.com</p>
                  </div>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" side="top">
              <DropdownMenuItem asChild>
                <Link href="/profile" className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-red-600 focus:bg-red-50 focus:text-red-700 dark:text-red-400 dark:focus:bg-red-900/20 dark:focus:text-red-300 cursor-pointer"
                onClick={handleLogout}
                disabled={isLoggingOut}
              >
                {isLoggingOut ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <LogOut className="mr-2 h-4 w-4" />
                )}
                <span>{isLoggingOut ? 'Signing out...' : 'Log out'}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      </div>
      
      {/* Add padding to main content when sidebar is open on mobile */}
      <style jsx global>{`
        @media (max-width: 767px) {
          body {
            padding-left: ${isOpen ? '16rem' : '0'};
            transition: padding-left 200ms ease-in-out;
            overflow-x: hidden;
          }
        }
      `}</style>
    </>
  );
}
