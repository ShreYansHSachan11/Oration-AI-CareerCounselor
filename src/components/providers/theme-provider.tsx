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

    // Update CSS custom properties for theme with modern colors
    if (resolvedTheme === 'dark') {
      root.style.setProperty('--background', '#0f0f23');
      root.style.setProperty('--foreground', '#f8fafc');
      root.style.setProperty('--card', '#1a1a2e');
      root.style.setProperty('--card-foreground', '#f8fafc');
      root.style.setProperty('--popover', '#1a1a2e');
      root.style.setProperty('--popover-foreground', '#f8fafc');
      root.style.setProperty('--primary', '#667eea');
      root.style.setProperty('--primary-foreground', '#ffffff');
      root.style.setProperty('--secondary', '#16213e');
      root.style.setProperty('--secondary-foreground', '#e2e8f0');
      root.style.setProperty('--muted', '#16213e');
      root.style.setProperty('--muted-foreground', '#94a3b8');
      root.style.setProperty('--accent', '#1e293b');
      root.style.setProperty('--accent-foreground', '#f1f5f9');
      root.style.setProperty('--destructive', '#ff6b6b');
      root.style.setProperty('--destructive-foreground', '#ffffff');
      root.style.setProperty('--border', '#334155');
      root.style.setProperty('--input', '#334155');
      root.style.setProperty('--ring', '#667eea');
    } else {
      root.style.setProperty('--background', '#fefefe');
      root.style.setProperty('--foreground', '#1a202c');
      root.style.setProperty('--card', '#ffffff');
      root.style.setProperty('--card-foreground', '#1a202c');
      root.style.setProperty('--popover', '#ffffff');
      root.style.setProperty('--popover-foreground', '#1a202c');
      root.style.setProperty('--primary', '#667eea');
      root.style.setProperty('--primary-foreground', '#ffffff');
      root.style.setProperty('--secondary', '#f7fafc');
      root.style.setProperty('--secondary-foreground', '#2d3748');
      root.style.setProperty('--muted', '#f7fafc');
      root.style.setProperty('--muted-foreground', '#718096');
      root.style.setProperty('--accent', '#edf2f7');
      root.style.setProperty('--accent-foreground', '#2d3748');
      root.style.setProperty('--destructive', '#ff6b6b');
      root.style.setProperty('--destructive-foreground', '#ffffff');
      root.style.setProperty('--border', '#e2e8f0');
      root.style.setProperty('--input', '#e2e8f0');
      root.style.setProperty('--ring', '#667eea');
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
