import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { signIn } from 'next-auth/react';
import { LoginForm } from '@/components/auth/login-form';

// Mock next-auth
vi.mock('next-auth/react', () => ({
  signIn: vi.fn(),
}));

// Mock UI components
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} {...props}>
      {children}
    </button>
  ),
}));

vi.mock('@/components/ui/input', () => ({
  Input: ({ onChange, value, ...props }: any) => (
    <input onChange={onChange} value={value} {...props} />
  ),
}));

vi.mock('@/components/ui/label', () => ({
  Label: ({ children, ...props }: any) => <label {...props}>{children}</label>,
}));

vi.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => (
    <div className={className}>{children}</div>
  ),
  CardContent: ({ children, className }: any) => (
    <div className={className}>{children}</div>
  ),
  CardDescription: ({ children, className }: any) => (
    <div className={className}>{children}</div>
  ),
  CardHeader: ({ children, className }: any) => (
    <div className={className}>{children}</div>
  ),
  CardTitle: ({ children, className }: any) => (
    <h1 className={className}>{children}</h1>
  ),
}));

vi.mock('@/components/ui/spinner', () => ({
  Spinner: ({ className }: any) => (
    <div className={className} data-testid="spinner">
      Loading...
    </div>
  ),
}));

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render login form with email input and buttons', () => {
    render(<LoginForm />);

    expect(screen.getByText('Welcome Back')).toBeInTheDocument();
    expect(
      screen.getByText('Sign in to continue your career counseling journey')
    ).toBeInTheDocument();
    expect(screen.getByText('Continue with Google')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByText('Send Sign-in Link')).toBeInTheDocument();
  });

  it('should handle email input changes', () => {
    render(<LoginForm />);

    const emailInput = screen.getByLabelText('Email');
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    expect(emailInput).toHaveValue('test@example.com');
  });

  it('should disable send button when email is empty', () => {
    render(<LoginForm />);

    const sendButton = screen.getByText('Send Sign-in Link');
    expect(sendButton).toBeDisabled();
  });

  it('should enable send button when email is provided', () => {
    render(<LoginForm />);

    const emailInput = screen.getByLabelText('Email');
    const sendButton = screen.getByText('Send Sign-in Link');

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    expect(sendButton).not.toBeDisabled();
  });

  it('should handle successful email sign-in', async () => {
    const mockSignIn = vi.mocked(signIn);
    mockSignIn.mockResolvedValue({
      error: null,
      ok: true,
      status: 200,
      url: null,
    });

    render(<LoginForm />);

    const emailInput = screen.getByLabelText('Email');
    const sendButton = screen.getByText('Send Sign-in Link');

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('email', {
        email: 'test@example.com',
        redirect: false,
        callbackUrl: '/',
      });
    });

    await waitFor(() => {
      expect(
        screen.getByText('Check your email for a sign-in link!')
      ).toBeInTheDocument();
    });
  });

  it('should handle email sign-in error', async () => {
    const mockSignIn = vi.mocked(signIn);
    mockSignIn.mockResolvedValue({
      error: 'EmailSignin',
      ok: false,
      status: 400,
      url: null,
    });

    render(<LoginForm />);

    const emailInput = screen.getByLabelText('Email');
    const sendButton = screen.getByText('Send Sign-in Link');

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(
        screen.getByText('Failed to send sign-in email. Please try again.')
      ).toBeInTheDocument();
    });
  });

  it('should handle Google sign-in', async () => {
    const mockSignIn = vi.mocked(signIn);
    mockSignIn.mockResolvedValue({
      error: null,
      ok: true,
      status: 200,
      url: 'https://accounts.google.com/oauth/authorize?...',
    });

    // Mock window.location.href
    Object.defineProperty(window, 'location', {
      value: { href: '' },
      writable: true,
    });

    render(<LoginForm />);

    const googleButton = screen.getByText('Continue with Google');
    fireEvent.click(googleButton);

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('google', {
        callbackUrl: '/',
        redirect: false,
      });
    });
  });

  it('should handle Google sign-in error', async () => {
    const mockSignIn = vi.mocked(signIn);
    mockSignIn.mockResolvedValue({
      error: 'OAuthSignin',
      ok: false,
      status: 400,
      url: null,
    });

    render(<LoginForm />);

    const googleButton = screen.getByText('Continue with Google');
    fireEvent.click(googleButton);

    await waitFor(() => {
      expect(
        screen.getByText('Failed to sign in with Google. Please try again.')
      ).toBeInTheDocument();
    });
  });

  it('should show loading state during email sign-in', async () => {
    const mockSignIn = vi.mocked(signIn);
    mockSignIn.mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 100))
    );

    render(<LoginForm />);

    const emailInput = screen.getByLabelText('Email');
    const sendButton = screen.getByText('Send Sign-in Link');

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(sendButton);

    expect(screen.getByText('Sending...')).toBeInTheDocument();
    expect(screen.getByTestId('spinner')).toBeInTheDocument();
  });

  it('should show loading state during Google sign-in', async () => {
    const mockSignIn = vi.mocked(signIn);
    mockSignIn.mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 100))
    );

    render(<LoginForm />);

    const googleButton = screen.getByText('Continue with Google');
    fireEvent.click(googleButton);

    expect(screen.getByTestId('spinner')).toBeInTheDocument();
  });

  it('should disable all inputs during loading', async () => {
    const mockSignIn = vi.mocked(signIn);
    mockSignIn.mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 100))
    );

    render(<LoginForm />);

    const emailInput = screen.getByLabelText('Email');
    const sendButton = screen.getByText('Send Sign-in Link');
    const googleButton = screen.getByText('Continue with Google');

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(sendButton);

    expect(emailInput).toBeDisabled();
    expect(googleButton).toBeDisabled();
  });

  it('should use custom callback URL', () => {
    const callbackUrl = '/dashboard';
    render(<LoginForm callbackUrl={callbackUrl} />);

    const emailInput = screen.getByLabelText('Email');
    const sendButton = screen.getByText('Send Sign-in Link');

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(sendButton);

    expect(signIn).toHaveBeenCalledWith('email', {
      email: 'test@example.com',
      redirect: false,
      callbackUrl,
    });
  });

  it('should handle form submission with Enter key', async () => {
    const mockSignIn = vi.mocked(signIn);
    mockSignIn.mockResolvedValue({
      error: null,
      ok: true,
      status: 200,
      url: null,
    });

    render(<LoginForm />);

    const emailInput = screen.getByLabelText('Email');

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.keyDown(emailInput, { key: 'Enter', code: 'Enter' });

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('email', {
        email: 'test@example.com',
        redirect: false,
        callbackUrl: '/',
      });
    });
  });

  it('should handle network errors gracefully', async () => {
    const mockSignIn = vi.mocked(signIn);
    mockSignIn.mockRejectedValue(new Error('Network error'));

    render(<LoginForm />);

    const emailInput = screen.getByLabelText('Email');
    const sendButton = screen.getByText('Send Sign-in Link');

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(
        screen.getByText('An error occurred. Please try again.')
      ).toBeInTheDocument();
    });
  });

  it('should clear message when starting new sign-in attempt', async () => {
    const mockSignIn = vi.mocked(signIn);
    mockSignIn.mockResolvedValueOnce({
      error: 'EmailSignin',
      ok: false,
      status: 400,
      url: null,
    });
    mockSignIn.mockResolvedValueOnce({
      error: null,
      ok: true,
      status: 200,
      url: null,
    });

    render(<LoginForm />);

    const emailInput = screen.getByLabelText('Email');
    const sendButton = screen.getByText('Send Sign-in Link');

    // First attempt - error
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(
        screen.getByText('Failed to send sign-in email. Please try again.')
      ).toBeInTheDocument();
    });

    // Second attempt - should clear previous message
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(
        screen.queryByText('Failed to send sign-in email. Please try again.')
      ).not.toBeInTheDocument();
    });
  });
});
