// Application constants
export const APP_NAME = 'Career Counseling Chat';
export const APP_DESCRIPTION =
  'AI-powered career guidance through interactive chat';

// API constants
export const API_ROUTES = {
  AUTH: '/api/auth',
  TRPC: '/api/trpc',
} as const;

// Database constants
export const DB_LIMITS = {
  MAX_MESSAGE_LENGTH: 4000,
  MAX_SESSION_TITLE_LENGTH: 100,
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;

// UI constants
export const UI_CONSTANTS = {
  SIDEBAR_WIDTH: 280,
  MOBILE_BREAKPOINT: 768,
  ANIMATION_DURATION: 200,
} as const;

// Theme constants
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
} as const;

export type Theme = (typeof THEMES)[keyof typeof THEMES];
