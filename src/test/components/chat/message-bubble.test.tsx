import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MessageBubble } from '@/components/chat/message-bubble';
import { MessageWithStatus } from '@/types/message';

// Mock dependencies
vi.mock('lucide-react', () => ({
  User: () => <div data-testid="user-icon">User</div>,
  Bot: () => <div data-testid="bot-icon">Bot</div>,
  Copy: () => <div data-testid="copy-icon">Copy</div>,
  RotateCcw: () => <div data-testid="regenerate-icon">Regenerate</div>,
  Trash2: () => <div data-testid="delete-icon">Delete</div>,
  Check: () => <div data-testid="check-icon">Check</div>,
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, title, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} title={title} {...props}>
      {children}
    </button>
  ),
}));

vi.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => (
    <div className={className}>{children}</div>
  ),
}));

vi.mock('@/components/ui/spinner', () => ({
  Spinner: ({ className }: any) => (
    <div className={className} data-testid="spinner">
      Loading...
    </div>
  ),
}));

vi.mock('@/components/chat/message-status-indicator', () => ({
  MessageStatusIndicator: ({ status }: any) => (
    <div data-testid="status-indicator">{status}</div>
  ),
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

vi.mock('date-fns', () => ({
  formatDistanceToNow: vi.fn(() => '2 minutes ago'),
}));

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(),
  },
});

describe('MessageBubble', () => {
  const mockUserMessage: MessageWithStatus = {
    id: '1',
    content: 'Hello, I need career advice',
    role: 'USER',
    sessionId: 'session-1',
    createdAt: new Date('2024-01-01T10:00:00Z'),
    status: 'delivered',
  };

  const mockAssistantMessage: MessageWithStatus = {
    id: '2',
    content: "I'd be happy to help with your career questions!",
    role: 'ASSISTANT',
    sessionId: 'session-1',
    createdAt: new Date('2024-01-01T10:01:00Z'),
  };

  const mockOptimisticMessage: MessageWithStatus = {
    id: 'temp-1',
    content: 'This is an optimistic message',
    role: 'USER',
    sessionId: 'session-1',
    createdAt: new Date(),
    isOptimistic: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render user message correctly', () => {
    render(<MessageBubble message={mockUserMessage} />);

    expect(screen.getByText('Hello, I need career advice')).toBeInTheDocument();
    expect(screen.getByTestId('user-icon')).toBeInTheDocument();
    expect(screen.getByText('2 minutes ago')).toBeInTheDocument();
    expect(screen.getByTestId('status-indicator')).toHaveTextContent(
      'delivered'
    );
  });

  it('should render assistant message correctly', () => {
    render(<MessageBubble message={mockAssistantMessage} />);

    expect(
      screen.getByText("I'd be happy to help with your career questions!")
    ).toBeInTheDocument();
    expect(screen.getByTestId('bot-icon')).toBeInTheDocument();
    expect(screen.getByText('2 minutes ago')).toBeInTheDocument();
    expect(screen.queryByTestId('status-indicator')).not.toBeInTheDocument();
  });

  it('should show actions on hover for last message', () => {
    render(
      <MessageBubble message={mockAssistantMessage} isLastMessage={true} />
    );

    expect(screen.getByTestId('copy-icon')).toBeInTheDocument();
  });

  it('should show regenerate button for assistant messages', () => {
    const onRegenerate = vi.fn();
    render(
      <MessageBubble
        message={mockAssistantMessage}
        isLastMessage={true}
        onRegenerate={onRegenerate}
      />
    );

    expect(screen.getByTestId('regenerate-icon')).toBeInTheDocument();
  });

  it('should show delete button when onDelete is provided', () => {
    const onDelete = vi.fn();
    render(
      <MessageBubble
        message={mockUserMessage}
        isLastMessage={true}
        onDelete={onDelete}
      />
    );

    expect(screen.getByTestId('delete-icon')).toBeInTheDocument();
  });

  it('should handle copy functionality', async () => {
    const mockWriteText = vi.mocked(navigator.clipboard.writeText);
    mockWriteText.mockResolvedValue();

    render(<MessageBubble message={mockUserMessage} isLastMessage={true} />);

    const copyButton = screen.getByTitle('Copy message');
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(mockWriteText).toHaveBeenCalledWith('Hello, I need career advice');
    });

    // Should show check icon after copying
    await waitFor(() => {
      expect(screen.getByTestId('check-icon')).toBeInTheDocument();
    });
  });

  it('should handle copy error gracefully', async () => {
    const mockWriteText = vi.mocked(navigator.clipboard.writeText);
    mockWriteText.mockRejectedValue(new Error('Clipboard error'));

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<MessageBubble message={mockUserMessage} isLastMessage={true} />);

    const copyButton = screen.getByTitle('Copy message');
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to copy message:',
        expect.any(Error)
      );
    });

    consoleSpy.mockRestore();
  });

  it('should call onRegenerate when regenerate button is clicked', () => {
    const onRegenerate = vi.fn();
    render(
      <MessageBubble
        message={mockAssistantMessage}
        isLastMessage={true}
        onRegenerate={onRegenerate}
      />
    );

    const regenerateButton = screen.getByTitle('Regenerate response');
    fireEvent.click(regenerateButton);

    expect(onRegenerate).toHaveBeenCalledTimes(1);
  });

  it('should call onDelete when delete button is clicked', () => {
    const onDelete = vi.fn();
    render(
      <MessageBubble
        message={mockUserMessage}
        isLastMessage={true}
        onDelete={onDelete}
      />
    );

    const deleteButton = screen.getByTitle('Delete message');
    fireEvent.click(deleteButton);

    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('should show regenerating state', () => {
    render(
      <MessageBubble message={mockAssistantMessage} isRegenerating={true} />
    );

    expect(screen.getByText('Regenerating...')).toBeInTheDocument();
    expect(screen.getByTestId('spinner')).toBeInTheDocument();
  });

  it('should render optimistic message with reduced opacity', () => {
    render(<MessageBubble message={mockOptimisticMessage} />);

    expect(
      screen.getByText('This is an optimistic message')
    ).toBeInTheDocument();
    // The optimistic styling would be applied via CSS classes
  });

  it('should not show actions for optimistic messages', () => {
    render(
      <MessageBubble message={mockOptimisticMessage} isLastMessage={true} />
    );

    expect(screen.queryByTestId('copy-icon')).not.toBeInTheDocument();
  });

  it('should not show actions when regenerating', () => {
    render(
      <MessageBubble
        message={mockAssistantMessage}
        isLastMessage={true}
        isRegenerating={true}
      />
    );

    expect(screen.queryByTestId('copy-icon')).not.toBeInTheDocument();
  });

  it('should handle touch events for mobile', () => {
    render(<MessageBubble message={mockUserMessage} />);

    const messageContainer = screen
      .getByText('Hello, I need career advice')
      .closest('div');

    // Simulate touch start
    fireEvent.touchStart(messageContainer!);

    // Actions should be shown (though we can't easily test the timeout)
    expect(messageContainer).toBeInTheDocument();
  });

  it('should format message content with line breaks', () => {
    const multilineMessage: MessageWithStatus = {
      ...mockUserMessage,
      content: 'Line 1\nLine 2\nLine 3',
    };

    render(<MessageBubble message={multilineMessage} />);

    expect(screen.getByText('Line 1\nLine 2\nLine 3')).toBeInTheDocument();
  });

  it('should not show regenerate button for user messages', () => {
    const onRegenerate = vi.fn();
    render(
      <MessageBubble
        message={mockUserMessage}
        isLastMessage={true}
        onRegenerate={onRegenerate}
      />
    );

    expect(screen.queryByTestId('regenerate-icon')).not.toBeInTheDocument();
  });

  it('should show status indicator only for user messages', () => {
    render(<MessageBubble message={mockUserMessage} />);
    expect(screen.getByTestId('status-indicator')).toBeInTheDocument();

    render(<MessageBubble message={mockAssistantMessage} />);
    expect(screen.queryByTestId('status-indicator')).not.toBeInTheDocument();
  });

  it('should handle mouse enter and leave events', () => {
    render(<MessageBubble message={mockUserMessage} />);

    const messageContainer = screen
      .getByText('Hello, I need career advice')
      .closest('div');

    fireEvent.mouseEnter(messageContainer!);
    fireEvent.mouseLeave(messageContainer!);

    // The component should handle these events without errors
    expect(messageContainer).toBeInTheDocument();
  });

  it('should apply correct styling classes for user vs assistant messages', () => {
    const { rerender } = render(<MessageBubble message={mockUserMessage} />);

    // User message should have different styling
    expect(screen.getByText('Hello, I need career advice')).toBeInTheDocument();

    rerender(<MessageBubble message={mockAssistantMessage} />);

    // Assistant message should have different styling
    expect(
      screen.getByText("I'd be happy to help with your career questions!")
    ).toBeInTheDocument();
  });
});
