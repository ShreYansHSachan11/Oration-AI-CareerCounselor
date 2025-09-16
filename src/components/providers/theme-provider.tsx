'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
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

  const { data: userProfile } = api.user.getProfile.useQuery(undefined, {
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

    // Update CSS custom properties for theme
    if (resolvedTheme === 'dark') {
      root.style.setProperty('--background', '#0a0a0a');
      root.style.setProperty('--foreground', '#ededed');
      root.style.setProperty('--card', '#0a0a0a');
      root.style.setProperty('--card-foreground', '#ededed');
      root.style.setProperty('--popover', '#0a0a0a');
      root.style.setProperty('--popover-foreground', '#ededed');
      root.style.setProperty('--primary', '#3b82f6');
      root.style.setProperty('--primary-foreground', '#ffffff');
      root.style.setProperty('--secondary', '#1e293b');
      root.style.setProperty('--secondary-foreground', '#f8fafc');
      root.style.setProperty('--muted', '#1e293b');
      root.style.setProperty('--muted-foreground', '#94a3b8');
      root.style.setProperty('--accent', '#1e293b');
      root.style.setProperty('--accent-foreground', '#f8fafc');
      root.style.setProperty('--destructive', '#ef4444');
      root.style.setProperty('--destructive-foreground', '#ffffff');
      root.style.setProperty('--border', '#334155');
      root.style.setProperty('--input', '#334155');
      root.style.setProperty('--ring', '#3b82f6');
    } else {
      root.style.setProperty('--background', '#ffffff');
      root.style.setProperty('--foreground', '#171717');
      root.style.setProperty('--card', '#ffffff');
      root.style.setProperty('--card-foreground', '#171717');
      root.style.setProperty('--popover', '#ffffff');
      root.style.setProperty('--popover-foreground', '#171717');
      root.style.setProperty('--primary', '#2563eb');
      root.style.setProperty('--primary-foreground', '#ffffff');
      root.style.setProperty('--secondary', '#f1f5f9');
      root.style.setProperty('--secondary-foreground', '#0f172a');
      root.style.setProperty('--muted', '#f8fafc');
      root.style.setProperty('--muted-foreground', '#64748b');
      root.style.setProperty('--accent', '#f1f5f9');
      root.style.setProperty('--accent-foreground', '#0f172a');
      root.style.setProperty('--destructive', '#ef4444');
      root.style.setProperty('--destructive-foreground', '#ffffff');
      root.style.setProperty('--border', '#e2e8f0');
      root.style.setProperty('--input', '#e2e8f0');
      root.style.setProperty('--ring', '#2563eb');
    }
  }, [resolvedTheme, mounted]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);

    // Store in localStorage
    localStorage.setItem(storageKey, newTheme);

    // Update user preferences in database if authenticated
    if (userProfile) {
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
