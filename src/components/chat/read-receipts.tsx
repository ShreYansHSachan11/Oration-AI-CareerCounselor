'use client';

import React from 'react';
import { Check, CheckCheck, Eye } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { ReadReceipt } from '@/types/message';
import { formatDistanceToNow } from 'date-fns';

interface ReadReceiptsProps {
  messageId: string;
  readReceipts?: ReadReceipt[];
  isRead?: boolean;
  readAt?: Date | null;
  showReadStatus?: boolean;
  className?: string;
}

export function ReadReceipts({
  messageId,
  readReceipts = [],
  isRead = false,
  readAt,
  showReadStatus = true,
  className,
}: ReadReceiptsProps) {
  if (!showReadStatus && readReceipts.length === 0) {
    return null;
  }

  const formatReadTime = (date: Date) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };

  const getReadStatusIcon = () => {
    if (readReceipts.length > 0 || isRead) {
      return <CheckCheck className="h-3 w-3 text-blue-500" />;
    }
    return <Check className="h-3 w-3 text-muted-foreground" />;
  };

  const getReadStatusText = () => {
    if (readReceipts.length === 0 && !isRead) {
      return 'Sent';
    }
    
    if (readReceipts.length === 1) {
      return `Read by ${readReceipts[0].user?.name || 'someone'}`;
    }
    
    if (readReceipts.length > 1) {
      return `Read by ${readReceipts.length} people`;
    }
    
    if (isRead && readAt) {
      return `Read ${formatReadTime(readAt)}`;
    }
    
    return 'Read';
  };

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {/* Read Status Icon */}
      {showReadStatus && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          className="flex items-center"
        >
          {getReadStatusIcon()}
        </motion.div>
      )}

      {/* Read Receipts */}
      <AnimatePresence>
        {readReceipts.length > 0 && (
          <Popover>
            <PopoverTrigger asChild>
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                transition={{ delay: 0.3 }}
                className="flex items-center gap-1 cursor-pointer hover:bg-muted/50 rounded px-1 py-0.5 transition-colors"
              >
                {/* Show up to 3 avatars */}
                <div className="flex -space-x-1">
                  {readReceipts.slice(0, 3).map((receipt, index) => (
                    <motion.div
                      key={receipt.userId}
                      initial={{ scale: 0, x: -10 }}
                      animate={{ scale: 1, x: 0 }}
                      transition={{ delay: 0.4 + index * 0.1 }}
                      className="relative"
                    >
                      <Avatar className="h-4 w-4 border border-background">
                        <AvatarImage src={receipt.user?.image || undefined} />
                        <AvatarFallback className="text-xs bg-blue-500 text-white">
                          {receipt.user?.name?.charAt(0) || '?'}
                        </AvatarFallback>
                      </Avatar>
                    </motion.div>
                  ))}
                </div>

                {/* Count badge for more than 3 readers */}
                {readReceipts.length > 3 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.7 }}
                  >
                    <Badge variant="secondary" className="h-4 text-xs px-1">
                      +{readReceipts.length - 3}
                    </Badge>
                  </motion.div>
                )}

                <Eye className="h-3 w-3 text-muted-foreground ml-1" />
              </motion.div>
            </PopoverTrigger>
            
            <PopoverContent className="w-64 p-3" side="top">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    Read by {readReceipts.length} {readReceipts.length === 1 ? 'person' : 'people'}
                  </span>
                </div>
                
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {readReceipts.map((receipt) => (
                    <motion.div
                      key={receipt.userId}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-2"
                    >
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={receipt.user?.image || undefined} />
                        <AvatarFallback className="text-xs">
                          {receipt.user?.name?.charAt(0) || '?'}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {receipt.user?.name || 'Anonymous'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatReadTime(receipt.readAt)}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </AnimatePresence>

      {/* Simple read status text */}
      {showReadStatus && readReceipts.length === 0 && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-xs text-muted-foreground"
        >
          {getReadStatusText()}
        </motion.span>
      )}
    </div>
  );
}