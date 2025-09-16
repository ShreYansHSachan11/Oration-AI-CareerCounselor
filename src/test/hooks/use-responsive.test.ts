import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useResponsive } from '@/hooks/use-responsive';

// Mock window.matchMedia
const mockMatchMedia = vi.fn();

describe('useResponsive', () => {
  beforeEach(() => {
    // Mock window.matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: mockMatchMedia,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return correct breakpoint for mobile', () => {
    const mockMediaQuery = {
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };

    mockMatchMedia.mockImplementation(query => {
      if (query === '(max-width: 768px)') {
        return { ...mockMediaQuery, matches: true };
      }
      return { ...mockMediaQuery, matches: false };
    });

    const { result } = renderHook(() => useResponsive());

    expect(result.current.isMobile).toBe(true);
    expect(result.current.isTablet).toBe(false);
    expect(result.current.isDesktop).toBe(false);
  });

  it('should return correct breakpoint for tablet', () => {
    const mockMediaQuery = {
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };

    mockMatchMedia.mockImplementation(query => {
      if (query === '(min-width: 769px) and (max-width: 1024px)') {
        return { ...mockMediaQuery, matches: true };
      }
      return { ...mockMediaQuery, matches: false };
    });

    const { result } = renderHook(() => useResponsive());

    expect(result.current.isMobile).toBe(false);
    expect(result.current.isTablet).toBe(true);
    expect(result.current.isDesktop).toBe(false);
  });

  it('should return correct breakpoint for desktop', () => {
    const mockMediaQuery = {
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };

    mockMatchMedia.mockImplementation(query => {
      if (query === '(min-width: 1025px)') {
        return { ...mockMediaQuery, matches: true };
      }
      return { ...mockMediaQuery, matches: false };
    });

    const { result } = renderHook(() => useResponsive());

    expect(result.current.isMobile).toBe(false);
    expect(result.current.isTablet).toBe(false);
    expect(result.current.isDesktop).toBe(true);
  });

  it('should update breakpoint when window size changes', () => {
    let mediaQueryCallback: ((e: any) => void) | null = null;

    const mockMediaQuery = {
      matches: true, // Start with mobile
      addEventListener: vi.fn((event, callback) => {
        if (event === 'change') {
          mediaQueryCallback = callback;
        }
      }),
      removeEventListener: vi.fn(),
    };

    mockMatchMedia.mockImplementation(query => {
      if (query === '(max-width: 768px)') {
        return mockMediaQuery;
      }
      return { ...mockMediaQuery, matches: false };
    });

    const { result } = renderHook(() => useResponsive());

    expect(result.current.isMobile).toBe(true);

    // Simulate window resize to desktop
    mockMediaQuery.matches = false;
    act(() => {
      if (mediaQueryCallback) {
        mediaQueryCallback({ matches: false });
      }
    });

    expect(result.current.isMobile).toBe(false);
  });

  it('should cleanup event listeners on unmount', () => {
    const mockMediaQuery = {
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };

    mockMatchMedia.mockReturnValue(mockMediaQuery);

    const { unmount } = renderHook(() => useResponsive());

    unmount();

    expect(mockMediaQuery.removeEventListener).toHaveBeenCalled();
  });

  it('should handle matchMedia not being available', () => {
    // Remove matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: undefined,
    });

    const { result } = renderHook(() => useResponsive());

    // Should default to desktop when matchMedia is not available
    expect(result.current.isMobile).toBe(false);
    expect(result.current.isTablet).toBe(false);
    expect(result.current.isDesktop).toBe(true);
  });
});
