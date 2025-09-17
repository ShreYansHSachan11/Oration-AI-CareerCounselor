'use client';

import React from 'react';
import { Bot, User } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { TypingUser } from '@/types/message';

interface EnhancedTypingIndicatorProps {
  isVisible: boolean;
  typingUsers?: TypingUser[];
  isAITyping?: boolean;
  message?: string;
  className?: string;
}

export function EnhancedTypingIndicator({
  isVisible,
  typingUsers = [],
  isAITyping = false,
  message = 'is typing...',
  className,
}: EnhancedTypingIndicatorProps) {
  if (!isVisible && typingUsers.length === 0 && !isAITyping) {
    return null;
  }

  const getTypingMessage = () => {
    if (isAITyping) {
      return 'AI is thinking...';
    }
    
    if (typingUsers.length === 0) {
      return message;
    }
    
    if (typingUsers.length === 1) {
      return `${typingUsers[0].name || 'Someone'} is typing...`;
    }
    
    if (typingUsers.length === 2) {
      return `${typingUsers[0].name || 'Someone'} and ${typingUsers[1].name || 'someone else'} are typing...`;
    }
    
    return `${typingUsers[0].name || 'Someone'} and ${typingUsers.length - 1} others are typing...`;
  };

  return (
    <AnimatePresence>
      {(isVisible || typingUsers.length > 0 || isAITyping) && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className={cn('flex gap-2 sm:gap-3 px-1 sm:px-0', className)}
        >
          {/* Avatar */}
          <motion.div
            className="flex-shrink-0"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.1, duration: 0.4, type: "spring" }}
          >
            {isAITyping ? (
              <Avatar size="default" variant="gradient" className="shadow-medium">
                <AvatarFallback className="gradient-primary text-white">
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    <Bot className="w-4 h-4" />
                  </motion.div>
                </AvatarFallback>
              </Avatar>
            ) : typingUsers.length > 0 ? (
              <div className="relative">
                <Avatar size="default" variant="glass" className="shadow-medium">
                  <AvatarImage src={typingUsers[0].image || undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                    {typingUsers[0].name?.charAt(0) || <User className="w-4 h-4" />}
                  </AvatarFallback>
                </Avatar>
                {typingUsers.length > 1 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1"
                  >
                    <Badge variant="secondary" className="h-5 w-5 p-0 text-xs flex items-center justify-center">
                      +{typingUsers.length - 1}
                    </Badge>
                  </motion.div>
                )}
              </div>
            ) : (
              <Avatar size="default" variant="glass" className="shadow-medium">
                <AvatarFallback className="bg-muted">
                  <User className="w-4 h-4" />
                </AvatarFallback>
              </Avatar>
            )}
          </motion.div>

          {/* Typing Bubble */}
          <motion.div
            className="flex flex-col max-w-[85%]"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            <motion.div
              className={cn(
                'glass backdrop-blur-xl border-white/20 dark:border-white/10 rounded-lg px-4 py-3',
                'shadow-medium mr-6 sm:mr-8 md:mr-12'
              )}
              animate={{ 
                scale: [1, 1.02, 1],
                opacity: [0.8, 1, 0.8]
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {getTypingMessage()}
                </span>
                
                {/* Animated dots */}
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full"
                      animate={{
                        scale: [1, 1.5, 1],
                        opacity: [0.5, 1, 0.5],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        delay: i * 0.2,
                        ease: "easeInOut",
                      }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>

            {/* User list for multiple typers */}
            {typingUsers.length > 1 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ delay: 0.3 }}
                className="flex items-center gap-1 mt-1 ml-2"
              >
                {typingUsers.slice(0, 3).map((user, index) => (
                  <motion.div
                    key={user.id}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                  >
                    <Avatar className="h-4 w-4">
                      <AvatarImage src={user.image || undefined} />
                      <AvatarFallback className="text-xs">
                        {user.name?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>
                  </motion.div>
                ))}
                {typingUsers.length > 3 && (
                  <Badge variant="outline" className="h-4 text-xs px-1">
                    +{typingUsers.length - 3}
                  </Badge>
                )}
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}