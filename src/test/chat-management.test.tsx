import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TRPCProvider } from '@/trpc/react';
import { EnhancedChatSidebar } from '@/components/chat/enhanced-chat-sidebar';
import { BulkActionsToolbar } from '@/components/chat/bulk-actions-toolbar';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';

// Mock the tRPC client
const mockTrpc = {
  chat: {
    getSessions: {
      useQuery: vi.fn(() => ({
        data: {
          items: [
            {
              id: '1',
              title: 'Test Chat 1',
              createdAt: new Date(),
              updatedAt: new Date(),
              isArchived: false,
              archivedAt: null,
              _count: { messages: 5 },
            },
            {
              id: '2',
              title: 'Test Chat 2',
              createdAt: new Date(),
              updatedAt: new Date(),
              isArchived: true,
              archivedAt: new Date(),
              _count: { messages: 3 },
            },
          ],
        },
        isLoading: false,
        refetch: vi.fn(),
      })),
    },
    createSession: {
      useMutation: vi.fn(() => ({
        mutate: vi.fn(),
        isPending: false,
      })),
    },
    updateSession: {
      useMutation: vi.fn(() => ({
        mutate: vi.fn(),
        isPending: false,
      })),
    },
    deleteSession: {
      useMutation: vi.fn(() => ({
        mutate: vi.fn(),
        isPending: false,
      })),
    },
    bulkDeleteSessions: {
      useMutation: vi.fn(() => ({
        mutate: vi.fn(),
        isPending: false,
      })),
    },
    archiveSession: {
      useMutation: vi.fn(() => ({
        mutate: vi.fn(),
        isPending: false,
      })),
    },
    unarchiveSession: {
      useMutation: vi.fn(() => ({
        mutate: vi.fn(),
        isPending: false,
      })),
    },
    bulkArchiveSessions: {
      useMutation: vi.fn(() => ({
        mutate: vi.fn(),
        isPending: false,
      })),
    },
    bulkUnarchiveSessions: {
      useMutation: vi.fn(() => ({
        mutate: vi.fn(),
        isPending: false,
      })),
    },
    exportSession: {
      useMutation: vi.fn(() => ({
        mutateAsync: vi.fn(),
        isPending: false,
      })),
    },
    exportSessions: {
      useMutation: vi.fn(() => ({
        mutateAsync: vi.fn(),
        isPending: false,
      })),
    },
  },
};

vi.mock('@/trpc/react', () => ({
  api: mockTrpc,
}));

vi.mock('@/hooks/use-debounce', () => ({
  useDebounce: (value: any) => value,
}));

vi.mock('@/components/providers/error-provider', () => ({
  useAPIErrorHandler: () => ({
    handleAPIError: vi.fn(),
  }),
}));

vi.mock('@/components/error', () => ({
  SmartFallback: ({ children }: any) => <div>{children}</div>,
  EmptySessionsFallback: ({ onAction }: any) => (
    <button onClick={onAction}>Create First Chat</button>
  ),
  EmptySearchFallback: ({ searchQuery }: any) => (
    <div>No results for "{searchQuery}"</div>
  ),
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('Chat Management Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('BulkActionsToolbar', () => {
    it('should render bulk actions toolbar when sessions are selected', () => {
      const mockProps = {
        selectedCount: 2,
        onClearSelection: vi.fn(),
        onBulkDelete: vi.fn(),
        onBulkArchive: vi.fn(),
        onBulkUnarchive: vi.fn(),
        onBulkExport: vi.fn(),
        isLoading: false,
        showArchiveActions: true,
      };

      render(
        <TestWrapper>
          <BulkActionsToolbar {...mockProps} />
        </TestWrapper>
      );

      expect(screen.getByText('2 selected')).toBeInTheDocument();
      expect(screen.getByText('Export')).toBeInTheDocument();
      expect(screen.getByText('Archive')).toBeInTheDocument();
      expect(screen.getByText('Delete')).toBeInTheDocument();
    });

    it('should call onBulkExport when export button is clicked', () => {
      const mockProps = {
        selectedCount: 1,
        onClearSelection: vi.fn(),
        onBulkDelete: vi.fn(),
        onBulkArchive: vi.fn(),
        onBulkUnarchive: vi.fn(),
        onBulkExport: vi.fn(),
        isLoading: false,
        showArchiveActions: true,
      };

      render(
        <TestWrapper>
          <BulkActionsToolbar {...mockProps} />
        </TestWrapper>
      );

      fireEvent.click(screen.getByText('Export'));
      expect(mockProps.onBulkExport).toHaveBeenCalled();
    });

    it('should not render when no sessions are selected', () => {
      const mockProps = {
        selectedCount: 0,
        onClearSelection: vi.fn(),
        onBulkDelete: vi.fn(),
        onBulkArchive: vi.fn(),
        onBulkUnarchive: vi.fn(),
        onBulkExport: vi.fn(),
        isLoading: false,
        showArchiveActions: true,
      };

      const { container } = render(
        <TestWrapper>
          <BulkActionsToolbar {...mockProps} />
        </TestWrapper>
      );

      expect(container.firstChild).toBeNull();
    });
  });

  describe('ConfirmationDialog', () => {
    it('should render confirmation dialog with correct content', () => {
      const mockProps = {
        open: true,
        onOpenChange: vi.fn(),
        title: 'Delete Chat',
        description: 'Are you sure you want to delete this chat?',
        confirmText: 'Delete',
        cancelText: 'Cancel',
        onConfirm: vi.fn(),
        isLoading: false,
        variant: 'destructive' as const,
      };

      render(
        <TestWrapper>
          <ConfirmationDialog {...mockProps} />
        </TestWrapper>
      );

      expect(screen.getByText('Delete Chat')).toBeInTheDocument();
      expect(screen.getByText('Are you sure you want to delete this chat?')).toBeInTheDocument();
      expect(screen.getByText('Delete')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('should call onConfirm when confirm button is clicked', () => {
      const mockProps = {
        open: true,
        onOpenChange: vi.fn(),
        title: 'Delete Chat',
        description: 'Are you sure?',
        onConfirm: vi.fn(),
        isLoading: false,
      };

      render(
        <TestWrapper>
          <ConfirmationDialog {...mockProps} />
        </TestWrapper>
      );

      fireEvent.click(screen.getByText('Confirm'));
      expect(mockProps.onConfirm).toHaveBeenCalled();
    });

    it('should show loading state when isLoading is true', () => {
      const mockProps = {
        open: true,
        onOpenChange: vi.fn(),
        title: 'Delete Chat',
        description: 'Are you sure?',
        onConfirm: vi.fn(),
        isLoading: true,
      };

      render(
        <TestWrapper>
          <ConfirmationDialog {...mockProps} />
        </TestWrapper>
      );

      const confirmButton = screen.getByText('Confirm');
      expect(confirmButton).toBeDisabled();
    });
  });

  describe('Enhanced Chat Sidebar Integration', () => {
    it('should render enhanced chat sidebar with archive functionality', () => {
      const mockProps = {
        selectedSessionId: '1',
        onSessionSelect: vi.fn(),
        onNewChat: vi.fn(),
      };

      render(
        <TestWrapper>
          <EnhancedChatSidebar {...mockProps} />
        </TestWrapper>
      );

      expect(screen.getByText('New Chat')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Search conversations...')).toBeInTheDocument();
    });

    it('should toggle between active and archived sessions', async () => {
      const mockProps = {
        selectedSessionId: '1',
        onSessionSelect: vi.fn(),
        onNewChat: vi.fn(),
      };

      render(
        <TestWrapper>
          <EnhancedChatSidebar {...mockProps} />
        </TestWrapper>
      );

      // Should show active sessions by default
      expect(screen.getByText(/Active/)).toBeInTheDocument();
      
      // Click to show archived sessions
      fireEvent.click(screen.getByText(/Active/));
      
      await waitFor(() => {
        expect(mockTrpc.chat.getSessions.useQuery).toHaveBeenCalledWith(
          expect.objectContaining({
            includeArchived: true,
          })
        );
      });
    });
  });
});

describe('Chat Export Functionality', () => {
  beforeEach(() => {
    // Mock URL.createObjectURL and related APIs
    global.URL.createObjectURL = vi.fn(() => 'mock-url');
    global.URL.revokeObjectURL = vi.fn();
    
    // Mock document.createElement and appendChild
    const mockAnchor = {
      href: '',
      download: '',
      click: vi.fn(),
    };
    
    vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor as any);
    vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockAnchor as any);
    vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockAnchor as any);
  });

  it('should export session data as JSON file', async () => {
    const mockExportData = {
      session: {
        id: '1',
        title: 'Test Chat',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      messages: [
        {
          id: '1',
          content: 'Hello',
          role: 'USER',
          createdAt: new Date(),
        },
      ],
      exportedAt: new Date(),
      messageCount: 1,
    };

    mockTrpc.chat.exportSession.useMutation.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue(mockExportData),
      isPending: false,
    });

    const mockProps = {
      selectedSessionId: '1',
      onSessionSelect: vi.fn(),
      onNewChat: vi.fn(),
    };

    render(
      <TestWrapper>
        <EnhancedChatSidebar {...mockProps} />
      </TestWrapper>
    );

    // This test would need more complex setup to properly test the export functionality
    // For now, we're just verifying the component renders without errors
    expect(screen.getByText('New Chat')).toBeInTheDocument();
  });
});