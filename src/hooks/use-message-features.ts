import { useState, useCallback } from 'react';
import { api } from '@/trpc/react';
import { useToast } from './use-toast';

export function useMessageFeatures() {
  const { toast } = useToast();
  const utils = api.useUtils();

  // Mutations
  const addReactionMutation = api.chat.addReaction.useMutation({
    onSuccess: () => {
      // Invalidate queries to refresh reactions
      utils.chat.getMessages.invalidate();
      utils.chat.getMessageReactions.invalidate();
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to add reaction',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const removeReactionMutation = api.chat.removeReaction.useMutation({
    onSuccess: () => {
      utils.chat.getMessages.invalidate();
      utils.chat.getMessageReactions.invalidate();
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to remove reaction',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const toggleBookmarkMutation = api.chat.toggleBookmark.useMutation({
    onSuccess: (data: any) => {
      utils.chat.getMessages.invalidate();
      utils.chat.getBookmarkedMessages.invalidate();
      toast({
        title: data.isBookmarked ? 'Message bookmarked' : 'Bookmark removed',
        description: data.isBookmarked 
          ? 'Message saved to your bookmarks' 
          : 'Message removed from bookmarks',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to update bookmark',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const editMessageMutation = api.chat.editMessage.useMutation({
    onSuccess: () => {
      utils.chat.getMessages.invalidate();
      toast({
        title: 'Message updated',
        description: 'Your message has been successfully edited',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to edit message',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const markAsReadMutation = api.chat.markMessageAsRead.useMutation({
    onSuccess: () => {
      utils.chat.getMessages.invalidate();
    },
    onError: (error: any) => {
      console.error('Failed to mark message as read:', error);
    },
  });

  const markSessionAsReadMutation = api.chat.markSessionAsRead.useMutation({
    onSuccess: () => {
      utils.chat.getMessages.invalidate();
      utils.chat.getSessions.invalidate();
    },
    onError: (error: any) => {
      console.error('Failed to mark session as read:', error);
    },
  });

  // Action handlers
  const handleAddReaction = useCallback((messageId: string, emoji: string) => {
    addReactionMutation.mutate({ messageId, emoji });
  }, [addReactionMutation]);

  const handleRemoveReaction = useCallback((messageId: string) => {
    removeReactionMutation.mutate({ messageId });
  }, [removeReactionMutation]);

  const handleToggleBookmark = useCallback((messageId: string) => {
    toggleBookmarkMutation.mutate({ messageId });
  }, [toggleBookmarkMutation]);

  const handleEditMessage = useCallback((messageId: string, newContent: string) => {
    editMessageMutation.mutate({ messageId, newContent });
  }, [editMessageMutation]);

  const handleMarkAsRead = useCallback((messageId: string) => {
    markAsReadMutation.mutate({ messageId });
  }, [markAsReadMutation]);

  const handleMarkSessionAsRead = useCallback((sessionId: string) => {
    markSessionAsReadMutation.mutate({ sessionId });
  }, [markSessionAsReadMutation]);

  return {
    // Actions
    handleAddReaction,
    handleRemoveReaction,
    handleToggleBookmark,
    handleEditMessage,
    handleMarkAsRead,
    handleMarkSessionAsRead,
    
    // Loading states
    isAddingReaction: addReactionMutation.isPending,
    isRemovingReaction: removeReactionMutation.isPending,
    isTogglingBookmark: toggleBookmarkMutation.isPending,
    isEditingMessage: editMessageMutation.isPending,
    isMarkingAsRead: markAsReadMutation.isPending,
    isMarkingSessionAsRead: markSessionAsReadMutation.isPending,
  };
}