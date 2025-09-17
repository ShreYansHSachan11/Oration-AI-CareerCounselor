'use client';

import * as React from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from '@/components/providers/theme-provider';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { cn } from '@/lib/utils';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          className={cn(
            'inline-flex items-center justify-center rounded-xl text-sm font-medium',
            'h-10 w-10 px-0',
            'bg-background hover:bg-accent hover:text-accent-foreground',
            'border border-border shadow-soft hover:shadow-medium',
            'transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            'disabled:pointer-events-none disabled:opacity-50 hover-lift focus-ring'
          )}
          aria-label="Toggle theme"
        >
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all duration-300 dark:-rotate-90 dark:scale-0 icon-monochrome" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all duration-300 dark:rotate-0 dark:scale-100 icon-monochrome" />
          <span className="sr-only">Toggle theme</span>
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className={cn(
            'z-50 min-w-[8rem] overflow-hidden rounded-xl border border-border bg-popover p-2 text-popover-foreground shadow-large glass',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
            'data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2',
            'data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2'
          )}
          align="end"
          sideOffset={8}
        >
          <DropdownMenu.Item
            onClick={() => setTheme('light')}
            className={cn(
              'relative flex cursor-default select-none items-center rounded-lg px-3 py-2 text-sm outline-none',
              'transition-all duration-300 focus:bg-accent focus:text-accent-foreground hover:bg-accent/50',
              'data-[disabled]:pointer-events-none data-[disabled]:opacity-50 hover-fade',
              theme === 'light' && 'bg-accent text-accent-foreground shadow-soft'
            )}
          >
            <Sun className="mr-3 h-4 w-4 icon-monochrome" />
            <span className="font-medium">Light</span>
          </DropdownMenu.Item>
          <DropdownMenu.Item
            onClick={() => setTheme('dark')}
            className={cn(
              'relative flex cursor-default select-none items-center rounded-lg px-3 py-2 text-sm outline-none',
              'transition-all duration-300 focus:bg-accent focus:text-accent-foreground hover:bg-accent/50',
              'data-[disabled]:pointer-events-none data-[disabled]:opacity-50 hover-fade',
              theme === 'dark' && 'bg-accent text-accent-foreground shadow-soft'
            )}
          >
            <Moon className="mr-3 h-4 w-4 icon-monochrome" />
            <span className="font-medium">Dark</span>
          </DropdownMenu.Item>
          <DropdownMenu.Item
            onClick={() => setTheme('system')}
            className={cn(
              'relative flex cursor-default select-none items-center rounded-lg px-3 py-2 text-sm outline-none',
              'transition-all duration-300 focus:bg-accent focus:text-accent-foreground hover:bg-accent/50',
              'data-[disabled]:pointer-events-none data-[disabled]:opacity-50 hover-fade',
              theme === 'system' && 'bg-accent text-accent-foreground shadow-soft'
            )}
          >
            <Monitor className="mr-3 h-4 w-4 icon-monochrome" />
            <span className="font-medium">System</span>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
