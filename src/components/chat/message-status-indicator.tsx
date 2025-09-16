'use client';

import React from 'react';
import { Check, CheckCheck, Clock, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/utils/cn';
import { MessageStatus } from '@/types/message';
import { motion } from 'framer-motion';

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
        return (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          >
            <Clock className="h-3 w-3" />
          </motion.div>
        );
      case 'sent':
        return (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          >
            <Check className="h-3 w-3" />
          </motion.div>
        );
      case 'delivered':
        return (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          >
            <CheckCheck className="h-3 w-3" />
          </motion.div>
        );
      case 'error':
        return (
          <motion.div
            animate={{ x: [-2, 2, -2, 2, 0] }}
            transition={{ duration: 0.5 }}
          >
            <AlertCircle className="h-3 w-3" />
          </motion.div>
        );
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

  const getBadgeVariant = () => {
    switch (status) {
      case 'sending':
        return 'outline';
      case 'sent':
        return 'secondary';
      case 'delivered':
        return 'success';
      case 'error':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <Badge 
      variant={getBadgeVariant()} 
      size="sm" 
      className={cn('flex items-center gap-1.5 font-normal', className)}
    >
      {getStatusIcon()}
      <span className="text-xs">{getStatusText()}</span>
    </Badge>
  );
}
