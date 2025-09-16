import { test, expect } from '@playwright/test';

test.describe('Chat Interface', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication for chat tests
    await page.goto('/chat');
  });

  test('should display chat interface elements', async ({ page }) => {
    // Check for main chat elements
    await expect(page.locator('[data-testid="chat-container"]')).toBeVisible();
    await expect(page.locator('[data-testid="chat-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="chat-sidebar"]')).toBeVisible();
  });

  test('should allow creating a new chat session', async ({ page }) => {
    const newChatButton = page.locator('[data-testid="new-chat-button"]');
    await newChatButton.click();

    // Should create a new session and show empty chat
    await expect(page.locator('[data-testid="message-list"]')).toBeEmpty();
  });

  test('should handle message input and sending', async ({ page }) => {
    const messageInput = page.locator('[data-testid="message-input"]');
    const sendButton = page.locator('[data-testid="send-button"]');

    // Type a message
    await messageInput.fill('Hello, I need career advice');
    await expect(sendButton).toBeEnabled();

    // Send the message
    await sendButton.click();

    // Should show the user message
    await expect(
      page.locator('text=Hello, I need career advice')
    ).toBeVisible();
  });

  test('should show typing indicator when AI is responding', async ({
    page,
  }) => {
    const messageInput = page.locator('[data-testid="message-input"]');

    await messageInput.fill('Test message');
    await messageInput.press('Enter');

    // Should show typing indicator
    await expect(
      page.locator('[data-testid="typing-indicator"]')
    ).toBeVisible();
  });

  test('should display message actions on hover', async ({ page }) => {
    // Assuming there's already a message in the chat
    const message = page.locator('[data-testid^="message-"]').first();

    await message.hover();

    // Should show copy button
    await expect(page.locator('[title="Copy message"]')).toBeVisible();
  });

  test('should handle message copying', async ({ page }) => {
    const message = page.locator('[data-testid^="message-"]').first();
    await message.hover();

    const copyButton = page.locator('[title="Copy message"]');
    await copyButton.click();

    // Should show success indicator
    await expect(page.locator('[data-testid="check-icon"]')).toBeVisible();
  });

  test('should handle session management', async ({ page }) => {
    // Test session renaming
    const sessionItem = page.locator('[data-testid^="session-"]').first();
    await sessionItem.click({ button: 'right' });

    const renameOption = page.locator('text=Rename');
    if (await renameOption.isVisible()) {
      await renameOption.click();

      const titleInput = page.locator('[data-testid="session-title-input"]');
      await titleInput.fill('New Session Title');
      await titleInput.press('Enter');

      await expect(page.locator('text=New Session Title')).toBeVisible();
    }
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    // Chat should adapt to mobile layout
    await expect(page.locator('[data-testid="chat-container"]')).toBeVisible();

    // Mobile navigation should be available
    const mobileMenuButton = page.locator('[data-testid="mobile-menu-button"]');
    if (await mobileMenuButton.isVisible()) {
      await mobileMenuButton.click();
      await expect(
        page.locator('[data-testid="mobile-sidebar"]')
      ).toBeVisible();
    }
  });

  test('should handle theme switching', async ({ page }) => {
    const themeToggle = page.locator('[data-testid="theme-toggle"]');

    if (await themeToggle.isVisible()) {
      await themeToggle.click();

      // Should toggle between light and dark themes
      const body = page.locator('body');
      const hasLightClass = await body.evaluate(el =>
        el.classList.contains('light')
      );
      const hasDarkClass = await body.evaluate(el =>
        el.classList.contains('dark')
      );

      expect(hasLightClass || hasDarkClass).toBeTruthy();
    }
  });

  test('should handle error states gracefully', async ({ page }) => {
    // Simulate network error by intercepting API calls
    await page.route('**/api/trpc/**', route => {
      route.abort('failed');
    });

    const messageInput = page.locator('[data-testid="message-input"]');
    await messageInput.fill('Test message');
    await messageInput.press('Enter');

    // Should show error message
    await expect(page.locator('text=Failed to send message')).toBeVisible();
  });

  test('should persist chat sessions across page reloads', async ({ page }) => {
    // Send a message to create session history
    const messageInput = page.locator('[data-testid="message-input"]');
    await messageInput.fill('Test persistence');
    await messageInput.press('Enter');

    // Wait for message to appear
    await expect(page.locator('text=Test persistence')).toBeVisible();

    // Reload the page
    await page.reload();

    // Message should still be visible
    await expect(page.locator('text=Test persistence')).toBeVisible();
  });
});
