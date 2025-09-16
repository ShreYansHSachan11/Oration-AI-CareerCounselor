import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display login form when not authenticated', async ({ page }) => {
    // Should redirect to auth page or show login form
    await expect(page.locator('text=Welcome Back')).toBeVisible();
    await expect(page.locator('text=Continue with Google')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('text=Send Sign-in Link')).toBeVisible();
  });

  test('should show validation for empty email', async ({ page }) => {
    const sendButton = page.locator('text=Send Sign-in Link');

    // Button should be disabled when email is empty
    await expect(sendButton).toBeDisabled();
  });

  test('should enable send button when email is provided', async ({ page }) => {
    const emailInput = page.locator('input[type="email"]');
    const sendButton = page.locator('text=Send Sign-in Link');

    await emailInput.fill('test@example.com');
    await expect(sendButton).toBeEnabled();
  });

  test('should show loading state when sending email', async ({ page }) => {
    const emailInput = page.locator('input[type="email"]');
    const sendButton = page.locator('text=Send Sign-in Link');

    await emailInput.fill('test@example.com');
    await sendButton.click();

    // Should show loading state
    await expect(page.locator('text=Sending...')).toBeVisible();
  });

  test('should handle Google OAuth button click', async ({ page }) => {
    const googleButton = page.locator('text=Continue with Google');

    // Click should not throw error (actual OAuth flow would redirect)
    await googleButton.click();
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    // Login form should still be visible and usable on mobile
    await expect(page.locator('text=Welcome Back')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();

    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill('test@example.com');

    const sendButton = page.locator('text=Send Sign-in Link');
    await expect(sendButton).toBeEnabled();
  });
});
