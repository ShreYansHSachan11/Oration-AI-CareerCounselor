'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Loader2, Type } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RichTextEditor } from './rich-text-editor';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface RichTextContent {
  plainText: string;
  formattedText: string;
  hasFormatting: boolean;
}

interface ChatInputProps {
  onSendMessage: (content: string, richContent?: RichTextContent) => void;
  isLoading?: boolean;
  disabled?: boolean;
  placeholder?: string;
  maxLength?: number;
  enableRichText?: boolean;
  className?: string;
}

export function ChatInput({
  onSendMessage,
  isLoading = false,
  disabled = false,
  placeholder = 'Type your message...',
  maxLength = 4000,
  enableRichText = false,
  className,
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [useRichText, setUseRichText] = useState(enableRichText);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, [message]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim() || isLoading || disabled) return;

    onSendMessage(message.trim());
    setMessage('');

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleRichTextSend = (content: string, richContent?: RichTextContent) => {
    if (!content.trim() || isLoading || disabled) return;
    onSendMessage(content, richContent);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= maxLength) {
      setMessage(value);
    }
  };

  const canSend = message.trim().length > 0 && !isLoading && !disabled;
  const characterCount = message.length;
  const isNearLimit = characterCount > maxLength * 0.8;

  if (useRichText) {
    return (
      <div className={cn('w-full', className)}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground">Rich text mode</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setUseRichText(false)}
            className="h-6 text-xs"
          >
            Switch to simple
          </Button>
        </div>
        <RichTextEditor
          onSendMessage={handleRichTextSend}
          isLoading={isLoading}
          disabled={disabled}
          placeholder={placeholder}
          maxLength={maxLength}
        />
      </div>
    );
  }

  return (
    <motion.div
      className={cn('w-full', className)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <form onSubmit={handleSubmit} className="relative">
        <motion.div
          className={cn(
            'relative flex items-end gap-2 sm:gap-3 p-2 sm:p-3 border rounded-lg bg-background transition-all duration-200',
            'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
            'touch-manipulation', // Better touch handling
            isLoading && 'ring-2 ring-primary/20'
          )}
          animate={{
            borderColor: isLoading ? 'rgb(59 130 246 / 0.5)' : undefined,
          }}
        >
          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || isLoading}
            className={cn(
              'flex-1 resize-none bg-transparent border-0 outline-none',
              'placeholder:text-muted-foreground',
              'min-h-[20px] max-h-[100px] sm:max-h-[120px] md:max-h-[200px]', // Progressive max heights
              'text-base leading-relaxed', // Consistent text size to prevent zoom
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'touch-manipulation' // Better touch handling
            )}
            rows={1}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="sentences"
            spellCheck="true"
          />

          {/* Rich Text Toggle */}
          {enableRichText && (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => setUseRichText(true)}
              className="flex-shrink-0 h-8 w-8"
              title="Enable rich text formatting"
            >
              <Type className="h-4 w-4" />
            </Button>
          )}

          {/* Send Button */}
          <motion.div
            whileHover={canSend ? { scale: 1.05 } : {}}
            whileTap={canSend ? { scale: 0.95 } : {}}
          >
            <Button
              type="submit"
              size="icon"
              disabled={!canSend}
              className={cn(
                'flex-shrink-0 h-9 w-9 sm:h-8 sm:w-8 transition-all duration-200 touch-manipulation',
                canSend
                  ? 'bg-primary hover:bg-primary/90'
                  : 'bg-muted text-muted-foreground cursor-not-allowed'
              )}
            >
              <AnimatePresence mode="wait">
                {isLoading ? (
                  <motion.div
                    key="loading"
                    initial={{ scale: 0, rotate: 0 }}
                    animate={{ scale: 1, rotate: 360 }}
                    exit={{ scale: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Loader2 className="h-4 w-4" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="send"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Send className="h-4 w-4" />
                  </motion.div>
                )}
              </AnimatePresence>
            </Button>
          </motion.div>
        </motion.div>

        {/* Character count and hints */}
        <motion.div
          className="flex items-center justify-between mt-2 text-xs text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
            <motion.span
              animate={{ opacity: isLoading ? 0.5 : 1 }}
              transition={{ duration: 0.2 }}
              className="truncate text-xs"
            >
              {isLoading ? (
                'Sending message...'
              ) : (
                <>
                  <span className="hidden sm:inline">
                    Press Enter to send, Shift+Enter for new line
                  </span>
                  <span className="sm:hidden">
                    Tap send button or press Enter
                  </span>
                </>
              )}
            </motion.span>
            {enableRichText && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setUseRichText(true)}
                className="h-5 text-xs opacity-60 hover:opacity-100"
              >
                Enable formatting
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <AnimatePresence>
              {isNearLimit && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className={cn(
                    'font-medium transition-colors duration-200 text-xs tabular-nums',
                    characterCount >= maxLength
                      ? 'text-destructive'
                      : 'text-warning'
                  )}
                >
                  {characterCount}/{maxLength}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </form>
    </motion.div>
  );
}
