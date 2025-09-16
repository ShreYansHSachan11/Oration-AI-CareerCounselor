'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AppLoading } from '@/components/layout/app-loading';

export default function Home() {
  const router = useRouter();
  const { status } = useSession();

  useEffect(() => {
    if (status === 'loading') return; // Still loading

    if (status === 'unauthenticated') {
      // Redirect to sign in page
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      // Redirect to chat page
      router.push('/chat');
    }
  }, [status, router]);

  // Show loading while redirecting
  return <AppLoading isLoading={true} />;
}
