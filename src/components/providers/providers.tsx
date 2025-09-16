'use client';

import { type Session } from 'next-auth';
import { AuthSessionProvider } from './session-provider';
import { TRPCReactProvider } from './trpc-provider';
import { LoadingProvider } from './loading-provider';
import { ThemeProvider } from './theme-provider';
import { ErrorProvider } from './error-provider';
import { ErrorBoundary } from '@/components/error/error-boundary';

interface ProvidersProps {
  children: React.ReactNode;
  session?: Session | null;
}

export function Providers({ children, session }: ProvidersProps) {
  return (
    <ErrorBoundary showDetails={process.env.NODE_ENV === 'development'}>
      <AuthSessionProvider session={session}>
        <TRPCReactProvider>
          <ThemeProvider>
            <ErrorProvider>
              <LoadingProvider>{children}</LoadingProvider>
            </ErrorProvider>
          </ThemeProvider>
        </TRPCReactProvider>
      </AuthSessionProvider>
    </ErrorBoundary>
  );
}
