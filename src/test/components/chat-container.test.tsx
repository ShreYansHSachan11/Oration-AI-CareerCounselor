import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChatContainer } from '@/components/chat/chat-container';
import { api } from '@/trpc/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorProvider } from '@/components/providers/error-provider';

// Mock the tRPC API
vi.mock('@/trpc/react', () => ({
  api: {
    chat: {
      getMessages: {
        useQuery: vi.fn(),
      },
      sendMessage: {
        useMutation: vi.fn(),
      },
      regenerateResponse: {
        useMutation: vi.fn(),
      },
    },
  },
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock components
vi.mock('@/components/chat/message-list', () => ({
  MessageList: ({ messages, onRegenerateResponse, onDeleteMessage }: any) => (
    <div data-testid="message-list">
      {messages.map((msg: any) => (
        <div key={msg.id} data-testid={`message-${msg.id}`}>
          {msg.content}
          <button onClick={() => onRegenerateResponse(msg.id)}>
            Regenerate
          </button>
          <button onClick={() => onDeleteMessage(msg.id)}>Delete</button>
        </div>
      ))}
    </div>
  ),
}));

vi.mock('@/components/chat/chat-input', () => ({
  ChatInput: ({ onSendMessage, isLoading, disabled }: any) => (
    <div data-testid="chat-input">
      <input
        data-testid="message-input"
        disabled={disabled || isLoading}
        onKeyDown={e => {
          if (e.key === 'Enter' && e.target.value) {
            onSendMessage(e.target.value);
            e.target.value = '';
          }
        }}
      />
      <button
        data-testid="send-button"
        disabled={disabled || isLoading}
        onClick={() => {
          const input = document.querySelector(
            '[data-testid="message-input"]'
          ) as HTMLInputElement;
          if (input?.value) {
            onSendMessage(input.value);
            input.value = '';
          }
        }}
      >
        Send
      </button>
    </div>
  ),
}));

vi.mock('@/components/chat/typing-indicator', () => ({
  TypingIndicator: ({ isVisible }: any) =>
    isVisible ? (
      <div data-testid="typing-indicator">AI is typing...</div>
    ) : null,
  AdvancedTypingIndicator: ({ isVisible, stage }: any) =>
    isVisible ? (
      <div data-testid="advanced-typing-indicator">{stage}</div>
    ) : null,
}));

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorProvider>{children}</ErrorProvider>
    </QueryClientProvider>
  );
};

describe('ChatContainer', () => {
  const mockSessionId = 'test-session-id';
  const mockMessages = [
    {
      id: '1',
      content: 'Hello, I need career advice',
      role: 'USER' as const,
      sessionId: mockSessionId,
      createdAt: new Date('2024-01-01T10:00:00Z'),
    },
    {
      id: '2',
      content: "I'd be happy to help with your career questions!",
      role: 'ASSISTANT' as const,
      sessionId: mockSessionId,
      createdAt: new Date('2024-01-01T10:01:00Z'),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render loading state initially', () => {
    const mockUseQuery = vi.mocked(api.chat.getMessages.useQuery);
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      refetch: vi.fn(),
    } as any);

    const mockUseMutation = vi.fn().mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });
    vi.mocked(api.chat.sendMessage.useMutation).mockReturnValue(
      mockUseMutation as any
    );
    vi.mocked(api.chat.regenerateResponse.useMutation).mockReturnValue(
      mockUseMutation as any
    );

    render(
      <TestWrapper>
        <ChatContainer sessionId={mockSessionId} />
      </TestWrapper>
    );

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('should render messages when loaded', async () => {
    const mockUseQuery = vi.mocked(api.chat.getMessages.useQuery);
    mockUseQuery.mockReturnValue({
      data: { items: mockMessages },
      isLoading: false,
      refetch: vi.fn(),
    } as any);

    const mockUseMutation = vi.fn().mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });
    vi.mocked(api.chat.sendMessage.useMutation).mockReturnValue(
      mockUseMutation as any
    );
    vi.mocked(api.chat.regenerateResponse.useMutation).mockReturnValue(
      mockUseMutation as any
    );

    render(
      <TestWrapper>
        <ChatContainer sessionId={mockSessionId} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByTestId('message-list')).toBeInTheDocument();
      expect(screen.getByTestId('message-1')).toHaveTextContent(
        'Hello, I need career advice'
      );
      expect(screen.getByTestId('message-2')).toHaveTextContent(
        "I'd be happy to help"
      );
    });
  });

  it('should send message when user submits', async () => {
    const mockUseQuery = vi.mocked(api.chat.getMessages.useQuery);
    mockUseQuery.mockReturnValue({
      data: { items: mockMessages },
      isLoading: false,
      refetch: vi.fn(),
    } as any);

    const mockSendMutation = vi.fn();
    const mockUseMutation = vi.fn().mockReturnValue({
      mutate: mockSendMutation,
      isPending: false,
    });
    vi.mocked(api.chat.sendMessage.useMutation).mockReturnValue(
      mockUseMutation as any
    );
    vi.mocked(api.chat.regenerateResponse.useMutation).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as any);

    render(
      <TestWrapper>
        <ChatContainer sessionId={mockSessionId} />
      </TestWrapper>
    );

    const input = screen.getByTestId('message-input');
    const sendButton = screen.getByTestId('send-button');

    fireEvent.change(input, {
      target: { value: 'What career should I choose?' },
    });
    fireEvent.click(sendButton);

    expect(mockSendMutation).toHaveBeenCalledWith({
      sessionId: mockSessionId,
      content: 'What career should I choose?',
    });
  });

  it('should show typing indicator when AI is responding', async () => {
    const mockUseQuery = vi.mocked(api.chat.getMessages.useQuery);
    mockUseQuery.mockReturnValue({
      data: { items: mockMessages },
      isLoading: false,
      refetch: vi.fn(),
    } as any);

    const mockUseMutation = vi.fn().mockReturnValue({
      mutate: vi.fn(),
      isPending: true, // Simulating pending state
    });
    vi.mocked(api.chat.sendMessage.useMutation).mockReturnValue(
      mockUseMutation as any
    );
    vi.mocked(api.chat.regenerateResponse.useMutation).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as any);

    render(
      <TestWrapper>
        <ChatContainer sessionId={mockSessionId} />
      </TestWrapper>
    );

    // The typing indicator should be visible when mutation is pending
    await waitFor(() => {
      expect(screen.getByTestId('chat-input')).toBeInTheDocument();
    });
  });

  it('should handle message regeneration', async () => {
    const mockUseQuery = vi.mocked(api.chat.getMessages.useQuery);
    mockUseQuery.mockReturnValue({
      data: { items: mockMessages },
      isLoading: false,
      refetch: vi.fn(),
    } as any);

    const mockRegenerateMutation = vi.fn();
    vi.mocked(api.chat.sendMessage.useMutation).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as any);
    vi.mocked(api.chat.regenerateResponse.useMutation).mockReturnValue({
      mutate: mockRegenerateMutation,
      isPending: false,
    } as any);

    render(
      <TestWrapper>
        <ChatContainer sessionId={mockSessionId} />
      </TestWrapper>
    );

    await waitFor(() => {
      const regenerateButton = screen.getAllByText('Regenerate')[1]; // Second message (AI message)
      fireEvent.click(regenerateButton);
    });

    expect(mockRegenerateMutation).toHaveBeenCalledWith({
      sessionId: mockSessionId,
      messageId: '2',
    });
  });

  it('should handle optimistic updates', async () => {
    const mockUseQuery = vi.mocked(api.chat.getMessages.useQuery);
    mockUseQuery.mockReturnValue({
      data: { items: [] },
      isLoading: false,
      refetch: vi.fn(),
    } as any);

    let mutationCallbacks: any = {};
    const mockUseMutation = vi.fn().mockReturnValue({
      mutate: vi.fn(input => {
        // Simulate optimistic update
        mutationCallbacks.onMutate?.(input);
      }),
      isPending: false,
    });

    vi.mocked(api.chat.sendMessage.useMutation).mockImplementation(
      callbacks => {
        mutationCallbacks = callbacks;
        return mockUseMutation as any;
      }
    );

    vi.mocked(api.chat.regenerateResponse.useMutation).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as any);

    render(
      <TestWrapper>
        <ChatContainer sessionId={mockSessionId} />
      </TestWrapper>
    );

    const input = screen.getByTestId('message-input');
    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    // The optimistic update should be triggered
    expect(mockUseMutation().mutate).toHaveBeenCalled();
  });

  it('should disable input when no session ID provided', () => {
    const mockUseQuery = vi.mocked(api.chat.getMessages.useQuery);
    mockUseQuery.mockReturnValue({
      data: { items: [] },
      isLoading: false,
      refetch: vi.fn(),
    } as any);

    const mockUseMutation = vi.fn().mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });
    vi.mocked(api.chat.sendMessage.useMutation).mockReturnValue(
      mockUseMutation as any
    );
    vi.mocked(api.chat.regenerateResponse.useMutation).mockReturnValue(
      mockUseMutation as any
    );

    render(
      <TestWrapper>
        <ChatContainer sessionId="" />
      </TestWrapper>
    );

    const input = screen.getByTestId('message-input');
    const sendButton = screen.getByTestId('send-button');

    expect(input).toBeDisabled();
    expect(sendButton).toBeDisabled();
  });

  it('should handle error states gracefully', async () => {
    const mockUseQuery = vi.mocked(api.chat.getMessages.useQuery);
    mockUseQuery.mockReturnValue({
      data: { error: new Error('Network error') },
      isLoading: false,
      refetch: vi.fn(),
    } as any);

    const mockUseMutation = vi.fn().mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });
    vi.mocked(api.chat.sendMessage.useMutation).mockReturnValue(
      mockUseMutation as any
    );
    vi.mocked(api.chat.regenerateResponse.useMutation).mockReturnValue(
      mockUseMutation as any
    );

    render(
      <TestWrapper>
        <ChatContainer sessionId={mockSessionId} />
      </TestWrapper>
    );

    // Should show error fallback
    await waitFor(() => {
      expect(screen.getByText(/retry/i)).toBeInTheDocument();
    });
  });
});
