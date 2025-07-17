import * as React from 'react';

declare module 'next-themes' {
  export interface ThemeProviderProps {
    children: React.ReactNode;
    defaultTheme?: string;
    storageKey?: string;
    attribute?: string | boolean;
    enableSystem?: boolean;
    enableColorScheme?: boolean;
    disableTransitionOnChange?: boolean;
    themes?: string[];
    forcedTheme?: string | null;
    nonce?: string;
  }

  export const ThemeProvider: React.ComponentType<ThemeProviderProps>;
  
  export function useTheme(): {
    theme: string | undefined;
    setTheme: (theme: string) => void;
    themes: string[];
  };
}
