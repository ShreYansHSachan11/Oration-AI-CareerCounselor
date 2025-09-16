'use client';

import React from 'react';
import { Check, CheckCheck, Clock, AlertCircle } from 'lucide-react';
import { cn } from '@/utils/cn';
import { MessageStatus } from '@/types/message';

interface MessageStatusIndicatorProps {
  status: MessageStatus;
  timestamp?: Date;
  className?: string;
}

export function MessageStatusIndicator({
  status,
  timestamp,
  className,
}: MessageStatusIndicatorProps) {
  const getStatusIcon = () => {
    switch (status) {
      case 'sending':
        return <Clock className="h-3 w-3 animate-pulse" />;
      case 'sent':
        return <Check className="h-3 w-3" />;
      case 'delivered':
        return <CheckCheck className="h-3 w-3" />;
      case 'error':
        return <AlertCircle className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'sending':
        return 'Sending...';
      case 'sent':
        return 'Sent';
      case 'delivered':
        return 'Delivered';
      case 'error':
        return 'Failed to send';
      default:
        return '';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'sending':
        return 'text-muted-foreground';
      case 'sent':
        return 'text-muted-foreground';
      case 'delivered':
        return 'text-green-600';
      case 'error':
        return 'text-destructive';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <div className={cn('flex items-center gap-1', getStatusColor(), className)}>
      {getStatusIcon()}
      <span className="text-xs">{getStatusText()}</span>
    </div>
  );
}
