'use client';

import React, { useState } from 'react';
import { Bookmark, Search, Filter, Calendar, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { MessageBubble } from './message-bubble';
import { cn } from '@/lib/utils';
import { trpc } from '@/trpc/react';
import { MessageWithStatus } from '@/types/message';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

interface BookmarkedMessagesProps {
  sessionId?: string;
  className?: string;
}

export function BookmarkedMessages({ sessionId, className }: BookmarkedMessagesProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBy, setFilterBy] = useState<'all' | 'session'>('all');

  // Fetch bookmarked messages
  const {
    data: bookmarkedData,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = trpc.chat.getBookmarkedMessages.useInfiniteQuery(
    {
      limit: 20,
      sessionId: filterBy === 'session' ? sessionId : undefined,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    }
  );

  const bookmarkedMessages = bookmarkedData?.pages.flatMap(page => page.items) || [];

  // Filter messages by search query
  const filteredMessages = bookmarkedMessages.filter(message =>
    message.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    message.session.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center h-64', className)}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading bookmarked messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bookmark className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Bookmarked Messages</h2>
          <Badge variant="secondary" className="text-xs">
            {bookmarkedMessages.length}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          {/* Filter Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="h-4 w-4" />
                {filterBy === 'all' ? 'All Sessions' : 'Current Session'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setFilterBy('all')}>
                All Sessions
              </DropdownMenuItem>
              {sessionId && (
                <DropdownMenuItem onClick={() => setFilterBy('session')}>
                  Current Session Only
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search bookmarked messages..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Messages */}
      {filteredMessages.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <Bookmark className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-2">No bookmarked messages</h3>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            {searchQuery 
              ? 'No bookmarked messages match your search.'
              : 'Start bookmarking important messages to save them for later reference.'
            }
          </p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {filteredMessages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="p-4 space-y-3">
                  {/* Message Header */}
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      <span className="font-medium">
                        {message.session.title || 'Untitled Chat'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}</span>
                    </div>
                  </div>

                  {/* Message Content */}
                  <div className="flex gap-3">
                    {/* Avatar */}
                    <Avatar size="sm" className="flex-shrink-0">
                      <AvatarFallback className={cn(
                        message.role === 'USER' 
                          ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white'
                          : 'gradient-primary text-white'
                      )}>
                        {message.role === 'USER' ? 'U' : 'AI'}
                      </AvatarFallback>
                    </Avatar>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm leading-relaxed break-words">
                        {message.content}
                      </div>
                      
                      {/* Reactions */}
                      {message.reactions && message.reactions.length > 0 && (
                        <div className="flex items-center gap-1 mt-2">
                          {message.reactions.map((reaction) => (
                            <Badge key={reaction.id} variant="outline" className="text-xs">
                              {reaction.emoji}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Bookmark indicator */}
                    <div className="flex-shrink-0">
                      <Badge variant="secondary" className="gap-1">
                        <Bookmark className="h-3 w-3 fill-current" />
                        Saved
                      </Badge>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Load More Button */}
          {hasNextPage && (
            <div className="text-center pt-4">
              <Button
                variant="outline"
                onClick={handleLoadMore}
                disabled={isFetchingNextPage}
                className="gap-2"
              >
                {isFetchingNextPage ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                    Loading...
                  </>
                ) : (
                  'Load More'
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}