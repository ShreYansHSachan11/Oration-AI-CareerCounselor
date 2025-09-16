import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useSession, signOut } from 'next-auth/react';
import { UserMenu } from '@/components/auth/user-menu';

// Mock next-auth
vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
  signOut: vi.fn(),
}));

// Mock UI components
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));

vi.mock('@radix-ui/react-dropdown-menu', () => ({
  DropdownMenu: ({ children }: any) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: any) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: any) => <div>{children}</div>,
  DropdownMenuItem: ({ children, onClick }: any) => (
    <div onClick={onClick}>{children}</div>
  ),
  DropdownMenuSeparator: () => <hr />,
}));

vi.mock('@radix-ui/react-avatar', () => ({
  Avatar: ({ children }: any) => <div data-testid="avatar">{children}</div>,
  AvatarImage: ({ src, alt }: any) => <img src={src} alt={alt} />,
  AvatarFallback: ({ children }: any) => <div>{children}</div>,
}));

describe('UserMenu', () => {
  const mockUser = {
    id: 'test-user-id',
    name: 'John Doe',
    email: 'john@example.com',
    image: 'https://example.com/avatar.jpg',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render user avatar and name when authenticated', () => {
    vi.mocked(useSession).mockReturnValue({
      data: { user: mockUser, expires: '2024-12-31' },
      status: 'authenticated',
      update: vi.fn(),
    });

    render(<UserMenu />);

    expect(screen.getByTestId('avatar')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('should show user initials when no image is provided', () => {
    const userWithoutImage = { ...mockUser, image: null };
    vi.mocked(useSession).mockReturnValue({
      data: { user: userWithoutImage, expires: '2024-12-31' },
      status: 'authenticated',
      update: vi.fn(),
    });

    render(<UserMenu />);

    expect(screen.getByText('JD')).toBeInTheDocument(); // Initials
  });

  it('should handle sign out when clicked', () => {
    vi.mocked(useSession).mockReturnValue({
      data: { user: mockUser, expires: '2024-12-31' },
      status: 'authenticated',
      update: vi.fn(),
    });

    render(<UserMenu />);

    const signOutButton = screen.getByText(/sign out/i);
    fireEvent.click(signOutButton);

    expect(signOut).toHaveBeenCalledWith({ callbackUrl: '/' });
  });

  it('should not render when user is not authenticated', () => {
    vi.mocked(useSession).mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: vi.fn(),
    });

    const { container } = render(<UserMenu />);

    expect(container.firstChild).toBeNull();
  });

  it('should show loading state when session is loading', () => {
    vi.mocked(useSession).mockReturnValue({
      data: null,
      status: 'loading',
      update: vi.fn(),
    });

    const { container } = render(<UserMenu />);

    expect(container.firstChild).toBeNull();
  });
});
