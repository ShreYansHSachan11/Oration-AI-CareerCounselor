'use client';

import React, { useState } from 'react';
import { Plus, Smile } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { ReactionSummary } from '@/types/message';

interface MessageReactionsProps {
  messageId: string;
  reactions: ReactionSummary[];
  onAddReaction: (emoji: string) => void;
  onRemoveReaction: () => void;
  className?: string;
}

const COMMON_EMOJIS = [
  '👍', '👎', '❤️', '😂', '😮', '😢', '😡', '🎉', '🤔', '👏',
  '🔥', '💯', '✅', '❌', '⭐', '💡', '🚀', '🎯', '💪', '🙏'
];

export function MessageReactions({
  messageId,
  reactions,
  onAddReaction,
  onRemoveReaction,
  className,
}: MessageReactionsProps) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [hoveredReaction, setHoveredReaction] = useState<string | null>(null);

  const handleReactionClick = (reaction: ReactionSummary) => {
    if (reaction.userReacted) {
      onRemoveReaction();
    } else {
      onAddReaction(reaction.emoji);
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    onAddReaction(emoji);
    setShowEmojiPicker(false);
  };

  if (reactions.length === 0) {
    return (
      <div className={cn('flex items-center gap-1', className)}>
        <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            >
              <Plus className="h-3 w-3" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-2">
            <div className="grid grid-cols-5 gap-1">
              {COMMON_EMOJIS.map((emoji) => (
                <Button
                  key={emoji}
                  variant="ghost"
                  size="icon-sm"
                  className="h-8 w-8 text-lg hover:bg-muted"
                  onClick={() => handleEmojiSelect(emoji)}
                >
                  {emoji}
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-1 flex-wrap', className)}>
      <AnimatePresence>
        {reactions.map((reaction) => (
          <motion.div
            key={reaction.emoji}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.2, type: "spring" }}
            onMouseEnter={() => setHoveredReaction(reaction.emoji)}
            onMouseLeave={() => setHoveredReaction(null)}
          >
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={reaction.userReacted ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    'h-6 px-2 text-xs gap-1 transition-all duration-200',
                    reaction.userReacted && 'bg-primary/20 border-primary/50 hover:bg-primary/30',
                    'hover:scale-105'
                  )}
                  onClick={() => handleReactionClick(reaction)}
                >
                  <span className="text-sm">{reaction.emoji}</span>
                  <span className="font-medium">{reaction.count}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-2" side="top">
                <div className="space-y-2">
                  <div className="text-sm font-medium">
                    {reaction.users.length === 1 
                      ? `${reaction.users[0].name || 'Someone'} reacted with ${reaction.emoji}`
                      : `${reaction.count} people reacted with ${reaction.emoji}`
                    }
                  </div>
                  {reaction.users.length > 1 && (
                    <div className="flex items-center gap-1 flex-wrap">
                      {reaction.users.slice(0, 5).map((user) => (
                        <div key={user.id} className="flex items-center gap-1">
                          <Avatar className="h-5 w-5">
                            <AvatarImage src={user.image || undefined} />
                            <AvatarFallback className="text-xs">
                              {user.name?.charAt(0) || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-muted-foreground">
                            {user.name || 'Anonymous'}
                          </span>
                        </div>
                      ))}
                      {reaction.users.length > 5 && (
                        <span className="text-xs text-muted-foreground">
                          +{reaction.users.length - 5} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Add reaction button */}
      <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
        <PopoverTrigger asChild>
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Button
              variant="ghost"
              size="icon-sm"
              className="h-6 w-6 opacity-60 hover:opacity-100 transition-opacity duration-200"
            >
              <Plus className="h-3 w-3" />
            </Button>
          </motion.div>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-2">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Smile className="h-4 w-4" />
              Choose a reaction
            </div>
            <div className="grid grid-cols-5 gap-1">
              {COMMON_EMOJIS.map((emoji) => (
                <motion.div
                  key={emoji}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="h-8 w-8 text-lg hover:bg-muted transition-colors duration-200"
                    onClick={() => handleEmojiSelect(emoji)}
                  >
                    {emoji}
                  </Button>
                </motion.div>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}