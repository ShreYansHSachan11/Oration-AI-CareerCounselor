'use client';

import React, { useState } from 'react';
import { Plus, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/utils/api';

interface NewChatButtonProps {
  onChatCreated: (sessionId: string) => void;
  variant?: 'button' | 'card';
  className?: string;
}

export function NewChatButton({
  onChatCreated,
  variant = 'button',
  className,
}: NewChatButtonProps) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');

  const createSessionMutation = api.chat.createSession.useMutation({
    onSuccess: session => {
      onChatCreated(session.id);
      setShowForm(false);
      setTitle('');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createSessionMutation.mutate({
      title: title.trim() || undefined,
    });
  };

  const handleQuickCreate = () => {
    createSessionMutation.mutate({});
  };

  if (variant === 'card') {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Start New Conversation
          </CardTitle>
        </CardHeader>
        <CardContent>
          {showForm ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="chat-title">Chat Title (Optional)</Label>
                <Input
                  id="chat-title"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g., Career Change Discussion"
                  maxLength={100}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={createSessionMutation.isPending}
                  className="flex-1"
                >
                  {createSessionMutation.isPending
                    ? 'Creating...'
                    : 'Create Chat'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setTitle('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground mb-4">
                Start a new conversation with your AI career counselor
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={handleQuickCreate}
                  disabled={createSessionMutation.isPending}
                  className="flex-1"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Quick Start
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowForm(true)}
                  className="flex-1"
                >
                  Custom Title
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Button
      onClick={handleQuickCreate}
      disabled={createSessionMutation.isPending}
      className={className}
    >
      <Plus className="h-4 w-4 mr-2" />
      {createSessionMutation.isPending ? 'Creating...' : 'New Chat'}
    </Button>
  );
}
