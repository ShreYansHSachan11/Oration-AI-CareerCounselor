'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Bold, 
  Italic, 
  Underline, 
  Strikethrough, 
  Code, 
  Link, 
  Type,
  Send,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface RichTextEditorProps {
  onSendMessage: (content: string, richContent?: RichTextContent) => void;
  isLoading?: boolean;
  disabled?: boolean;
  placeholder?: string;
  maxLength?: number;
  className?: string;
}

interface RichTextContent {
  plainText: string;
  formattedText: string;
  hasFormatting: boolean;
}

interface FormatState {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strikethrough: boolean;
  code: boolean;
}

export function RichTextEditor({
  onSendMessage,
  isLoading = false,
  disabled = false,
  placeholder = 'Type your message...',
  maxLength = 4000,
  className,
}: RichTextEditorProps) {
  const [content, setContent] = useState('');
  const [formatState, setFormatState] = useState<FormatState>({
    bold: false,
    italic: false,
    underline: false,
    strikethrough: false,
    code: false,
  });
  const [showFormatting, setShowFormatting] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  
  const editorRef = useRef<HTMLDivElement>(null);
  const linkInputRef = useRef<HTMLInputElement>(null);

  // Auto-resize editor
  useEffect(() => {
    const editor = editorRef.current;
    if (editor) {
      editor.style.height = 'auto';
      editor.style.height = `${Math.min(editor.scrollHeight, 200)}px`;
    }
  }, [content]);

  // Focus link input when dialog opens
  useEffect(() => {
    if (showLinkDialog && linkInputRef.current) {
      linkInputRef.current.focus();
    }
  }, [showLinkDialog]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim() || isLoading || disabled) return;

    const plainText = editorRef.current?.textContent || content;
    const formattedText = editorRef.current?.innerHTML || content;
    const hasFormatting = formattedText !== plainText;

    const richContent: RichTextContent = {
      plainText: plainText.trim(),
      formattedText: hasFormatting ? formattedText : plainText.trim(),
      hasFormatting,
    };

    onSendMessage(plainText.trim(), richContent);
    
    // Clear editor
    setContent('');
    if (editorRef.current) {
      editorRef.current.innerHTML = '';
      editorRef.current.style.height = 'auto';
    }
    setFormatState({
      bold: false,
      italic: false,
      underline: false,
      strikethrough: false,
      code: false,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }

    // Handle keyboard shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault();
          toggleFormat('bold');
          break;
        case 'i':
          e.preventDefault();
          toggleFormat('italic');
          break;
        case 'u':
          e.preventDefault();
          toggleFormat('underline');
          break;
        case 'k':
          e.preventDefault();
          setShowLinkDialog(true);
          break;
      }
    }
  };

  const toggleFormat = (format: keyof FormatState) => {
    document.execCommand(format, false);
    setFormatState(prev => ({
      ...prev,
      [format]: !prev[format],
    }));
  };

  const insertLink = () => {
    if (!linkUrl || !linkText) return;

    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      
      const link = document.createElement('a');
      link.href = linkUrl;
      link.textContent = linkText;
      link.className = 'text-blue-500 underline hover:text-blue-600';
      
      range.insertNode(link);
      range.setStartAfter(link);
      range.setEndAfter(link);
      selection.removeAllRanges();
      selection.addRange(range);
    }

    setLinkUrl('');
    setLinkText('');
    setShowLinkDialog(false);
    editorRef.current?.focus();
  };

  const handleInput = () => {
    const editor = editorRef.current;
    if (editor) {
      const text = editor.textContent || '';
      setContent(text);
      
      // Update format state based on current selection
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        setFormatState({
          bold: document.queryCommandState('bold'),
          italic: document.queryCommandState('italic'),
          underline: document.queryCommandState('underline'),
          strikethrough: document.queryCommandState('strikeThrough'),
          code: document.queryCommandState('formatBlock') === 'code',
        });
      }
    }
  };

  const canSend = content.trim().length > 0 && !isLoading && !disabled;
  const characterCount = content.length;
  const isNearLimit = characterCount > maxLength * 0.8;

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
            'relative border rounded-lg bg-background transition-all duration-200',
            'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
            isLoading && 'ring-2 ring-primary/20'
          )}
          animate={{
            borderColor: isLoading ? 'rgb(59 130 246 / 0.5)' : undefined,
          }}
        >
          {/* Formatting Toolbar */}
          <AnimatePresence>
            {showFormatting && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-1 p-2 border-b bg-muted/50"
              >
                <Button
                  type="button"
                  variant={formatState.bold ? "default" : "ghost"}
                  size="icon-sm"
                  onClick={() => toggleFormat('bold')}
                  className="h-7 w-7"
                  title="Bold (Ctrl+B)"
                >
                  <Bold className="h-3.5 w-3.5" />
                </Button>
                
                <Button
                  type="button"
                  variant={formatState.italic ? "default" : "ghost"}
                  size="icon-sm"
                  onClick={() => toggleFormat('italic')}
                  className="h-7 w-7"
                  title="Italic (Ctrl+I)"
                >
                  <Italic className="h-3.5 w-3.5" />
                </Button>
                
                <Button
                  type="button"
                  variant={formatState.underline ? "default" : "ghost"}
                  size="icon-sm"
                  onClick={() => toggleFormat('underline')}
                  className="h-7 w-7"
                  title="Underline (Ctrl+U)"
                >
                  <Underline className="h-3.5 w-3.5" />
                </Button>
                
                <Button
                  type="button"
                  variant={formatState.strikethrough ? "default" : "ghost"}
                  size="icon-sm"
                  onClick={() => toggleFormat('strikethrough')}
                  className="h-7 w-7"
                  title="Strikethrough"
                >
                  <Strikethrough className="h-3.5 w-3.5" />
                </Button>
                
                <Button
                  type="button"
                  variant={formatState.code ? "default" : "ghost"}
                  size="icon-sm"
                  onClick={() => toggleFormat('code')}
                  className="h-7 w-7"
                  title="Code"
                >
                  <Code className="h-3.5 w-3.5" />
                </Button>

                <Popover open={showLinkDialog} onOpenChange={setShowLinkDialog}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="h-7 w-7"
                      title="Insert Link (Ctrl+K)"
                    >
                      <Link className="h-3.5 w-3.5" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="link-text">Link Text</Label>
                        <Input
                          id="link-text"
                          ref={linkInputRef}
                          value={linkText}
                          onChange={(e) => setLinkText(e.target.value)}
                          placeholder="Enter link text"
                        />
                      </div>
                      <div>
                        <Label htmlFor="link-url">URL</Label>
                        <Input
                          id="link-url"
                          value={linkUrl}
                          onChange={(e) => setLinkUrl(e.target.value)}
                          placeholder="https://example.com"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          onClick={insertLink}
                          disabled={!linkUrl || !linkText}
                        >
                          Insert Link
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setShowLinkDialog(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Editor Area */}
          <div className="flex items-end gap-2 sm:gap-3 p-2 sm:p-3">
            {/* Rich Text Editor */}
            <div
              ref={editorRef}
              contentEditable={!disabled && !isLoading}
              onInput={handleInput}
              onKeyDown={handleKeyDown}
              className={cn(
                'flex-1 min-h-[20px] max-h-[200px] overflow-y-auto',
                'outline-none resize-none bg-transparent',
                'text-base leading-relaxed',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                '[&_a]:text-blue-500 [&_a]:underline [&_a:hover]:text-blue-600',
                '[&_strong]:font-bold [&_em]:italic [&_u]:underline',
                '[&_code]:bg-muted [&_code]:px-1 [&_code]:rounded [&_code]:font-mono [&_code]:text-sm'
              )}
              data-placeholder={placeholder}
              style={{
                wordWrap: 'break-word',
                overflowWrap: 'break-word',
              }}
            />

            {/* Formatting Toggle */}
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => setShowFormatting(!showFormatting)}
              className="flex-shrink-0 h-8 w-8"
              title="Toggle formatting options"
            >
              <Type className="h-4 w-4" />
            </Button>

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
                  'flex-shrink-0 h-9 w-9 sm:h-8 sm:w-8 transition-all duration-200',
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
          </div>
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

      {/* Add empty placeholder styling */}
      <style jsx>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: rgb(156 163 175);
          pointer-events: none;
        }
      `}</style>
    </motion.div>
  );
}