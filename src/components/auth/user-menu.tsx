'use client';

import { useState } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import Link from 'next/link';
import Image from 'next/image';

export function UserMenu() {
  const { data: session, status } = useSession();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut({ callbackUrl: '/auth/signin' });
    } catch (error) {
      console.error('Sign out error:', error);
      setIsSigningOut(false);
    }
  };

  if (status === 'loading') {
    return <Spinner size="sm" />;
  }

  if (status === 'unauthenticated') {
    return (
      <Link href={'/auth/signin' as any}>
        <Button variant="outline" size="sm">
          Sign In
        </Button>
      </Link>
    );
  }

  if (!session?.user) {
    return null;
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          {session.user.image ? (
            <Image
              src={session.user.image}
              alt={session.user.name || 'Profile'}
              width={32}
              height={32}
              className="h-8 w-8 rounded-full"
            />
          ) : (
            <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
              {session.user.name?.charAt(0) ||
                session.user.email?.charAt(0) ||
                'U'}
            </div>
          )}
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="min-w-56 bg-popover text-popover-foreground rounded-md border shadow-md p-1 z-50"
          align="end"
          sideOffset={4}
        >
          <div className="px-2 py-1.5 text-sm font-medium">
            {session.user.name || 'Anonymous'}
          </div>
          <div className="px-2 py-1.5 text-xs text-muted-foreground">
            {session.user.email}
          </div>
          <DropdownMenu.Separator className="h-px bg-border my-1" />
          <DropdownMenu.Item asChild>
            <Link
              href={'/profile' as any}
              className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
            >
              Profile Settings
            </Link>
          </DropdownMenu.Item>
          <DropdownMenu.Separator className="h-px bg-border my-1" />
          <div className="px-2 py-1.5">
            <div className="flex items-center justify-between">
              <span className="text-sm">Theme</span>
              <ThemeToggle />
            </div>
          </div>
          <DropdownMenu.Separator className="h-px bg-border my-1" />
          <DropdownMenu.Item
            className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
            onClick={handleSignOut}
            disabled={isSigningOut}
          >
            {isSigningOut ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Signing out...
              </>
            ) : (
              'Sign Out'
            )}
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
