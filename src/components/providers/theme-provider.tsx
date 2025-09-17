'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { api } from '@/trpc/react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'theme',
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);
  const { data: session, status } = useSession();

  // Only fetch user profile if authenticated
  const { data: userProfile } = api.user.getProfile.useQuery(undefined, {
    enabled: status === 'authenticated' && !!session?.user,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const updatePreferences = api.user.updatePreferences.useMutation();

  // Initialize theme from user preferences or localStorage
  useEffect(() => {
    if (userProfile?.theme) {
      const dbTheme = userProfile.theme.toLowerCase() as Theme;
      setThemeState(dbTheme);
    } else {
      const storedTheme = localStorage.getItem(storageKey) as Theme;
      if (storedTheme) {
        setThemeState(storedTheme);
      }
    }
    setMounted(true);
  }, [userProfile, storageKey]);

  // Update resolved theme based on current theme and system preference
  useEffect(() => {
    const updateResolvedTheme = () => {
      if (theme === 'system') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)')
          .matches
          ? 'dark'
          : 'light';
        setResolvedTheme(systemTheme);
      } else {
        setResolvedTheme(theme as 'light' | 'dark');
      }
    };

    updateResolvedTheme();

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', updateResolvedTheme);

    return () => mediaQuery.removeEventListener('change', updateResolvedTheme);
  }, [theme]);

  // Apply theme to document
  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;

    // Remove existing theme classes
    root.classList.remove('light', 'dark');

    // Add current theme class
    root.classList.add(resolvedTheme);

    // Update CSS custom properties for monochromatic black and white theme
    if (resolvedTheme === 'dark') {
      // Sleek dark theme with black backgrounds and white accents
      root.style.setProperty('--background', '#000000');
      root.style.setProperty('--foreground', '#ffffff');
      root.style.setProperty('--card', '#0a0a0a');
      root.style.setProperty('--card-foreground', '#ffffff');
      root.style.setProperty('--popover', '#0a0a0a');
      root.style.setProperty('--popover-foreground', '#ffffff');
      root.style.setProperty('--primary', '#ffffff');
      root.style.setProperty('--primary-foreground', '#000000');
      root.style.setProperty('--secondary', '#1a1a1a');
      root.style.setProperty('--secondary-foreground', '#e5e5e5');
      root.style.setProperty('--muted', '#1a1a1a');
      root.style.setProperty('--muted-foreground', '#a3a3a3');
      root.style.setProperty('--accent', '#262626');
      root.style.setProperty('--accent-foreground', '#f5f5f5');
      root.style.setProperty('--destructive', '#404040');
      root.style.setProperty('--destructive-foreground', '#ffffff');
      root.style.setProperty('--border', '#404040');
      root.style.setProperty('--input', '#262626');
      root.style.setProperty('--ring', '#ffffff');
      root.style.setProperty('--success', '#737373');
      root.style.setProperty('--success-foreground', '#ffffff');
      root.style.setProperty('--warning', '#525252');
      root.style.setProperty('--warning-foreground', '#ffffff');
    } else {
      // Elegant light theme with white backgrounds and black accents
      root.style.setProperty('--background', '#ffffff');
      root.style.setProperty('--foreground', '#000000');
      root.style.setProperty('--card', '#fafafa');
      root.style.setProperty('--card-foreground', '#000000');
      root.style.setProperty('--popover', '#ffffff');
      root.style.setProperty('--popover-foreground', '#000000');
      root.style.setProperty('--primary', '#000000');
      root.style.setProperty('--primary-foreground', '#ffffff');
      root.style.setProperty('--secondary', '#f5f5f5');
      root.style.setProperty('--secondary-foreground', '#262626');
      root.style.setProperty('--muted', '#f5f5f5');
      root.style.setProperty('--muted-foreground', '#737373');
      root.style.setProperty('--accent', '#e5e5e5');
      root.style.setProperty('--accent-foreground', '#0a0a0a');
      root.style.setProperty('--destructive', '#d4d4d4');
      root.style.setProperty('--destructive-foreground', '#000000');
      root.style.setProperty('--border', '#e5e5e5');
      root.style.setProperty('--input', '#f5f5f5');
      root.style.setProperty('--ring', '#000000');
      root.style.setProperty('--success', '#a3a3a3');
      root.style.setProperty('--success-foreground', '#000000');
      root.style.setProperty('--warning', '#d4d4d4');
      root.style.setProperty('--warning-foreground', '#000000');
    }
  }, [resolvedTheme, mounted]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);

    // Store in localStorage
    localStorage.setItem(storageKey, newTheme);

    // Update user preferences in database if authenticated
    if (status === 'authenticated' && session?.user && userProfile) {
      const dbTheme =
        newTheme === 'system'
          ? 'LIGHT'
          : (newTheme.toUpperCase() as 'LIGHT' | 'DARK');
      updatePreferences.mutate({ theme: dbTheme });
    }
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return <div className="opacity-0">{children}</div>;
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
