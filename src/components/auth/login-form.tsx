'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';

interface LoginFormProps {
  callbackUrl?: string;
}

export function LoginForm({ callbackUrl = '/' }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    setMessage('');

    try {
      const result = await signIn('email', {
        email,
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        setMessage('Failed to send sign-in email. Please try again.');
      } else {
        setMessage('Check your email for a sign-in link!');
      }
    } catch {
      setMessage('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setMessage('');

    try {
      const result = await signIn('google', {
        callbackUrl,
        redirect: false,
      });

      if (result?.error) {
        setMessage('Failed to sign in with Google. Please try again.');
        setIsGoogleLoading(false);
      } else if (result?.url) {
        // Redirect to Google OAuth
        window.location.href = result.url;
      }
    } catch {
      setMessage('An error occurred. Please try again.');
      setIsGoogleLoading(false);
    }
  };

  return (
    <Card variant="glass" className="w-full max-w-md mx-auto shadow-xl hover-lift">
      <CardHeader className="space-y-4 text-center">
        <div className="mx-auto w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center shadow-large">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Welcome Back
        </CardTitle>
        <CardDescription className="text-base text-muted-foreground/80">
          Sign in to continue your career counseling journey
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Google Sign In */}
        <Button
          variant="glass"
          size="lg"
          className="w-full relative font-semibold"
          onClick={handleGoogleSignIn}
          disabled={isGoogleLoading || isLoading}
        >
          {isGoogleLoading ? (
            <Spinner size="sm" className="mr-2" />
          ) : (
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
          )}
          Continue with Google
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-white/20" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="glass px-4 py-2 rounded-full text-muted-foreground font-medium">
              Or continue with email
            </span>
          </div>
        </div>

        {/* Email Sign In */}
        <form onSubmit={handleEmailSignIn} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              disabled={isLoading || isGoogleLoading}
              variant="glass"
              size="lg"
            />
          </div>
          <Button
            type="submit"
            variant="gradient"
            size="lg"
            className="w-full font-semibold"
            disabled={isLoading || isGoogleLoading || !email}
          >
            {isLoading ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Sending...
              </>
            ) : (
              'Send Sign-in Link'
            )}
          </Button>
        </form>

        {message && (
          <div
            className={`text-sm text-center p-4 rounded-xl glass backdrop-blur-sm border ${
              message.includes('Check your email')
                ? 'border-green-200/50 text-green-700 dark:text-green-400 bg-green-50/50 dark:bg-green-950/50'
                : 'border-red-200/50 text-red-700 dark:text-red-400 bg-red-50/50 dark:bg-red-950/50'
            }`}
          >
            {message}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
