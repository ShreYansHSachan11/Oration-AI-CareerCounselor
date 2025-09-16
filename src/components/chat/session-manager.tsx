'use client';

import React, { useState } from 'react';
import {
  Settings,
  MoreVertical,
  Trash2,
  Edit3,
  Download,
  Share,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/utils/cn';
import { api } from '@/utils/api';
import { formatDistanceToNow, format } from 'date-fns';

interface SessionManagerProps {
  sessionId: string;
  className?: string;
  onSessionDeleted?: () => void;
  onSessionUpdated?: () => void;
}

interface SessionDetails {
  id: string;
  title: string | null;
  createdAt: Date;
  updatedAt: Date;
  _count: {
    messages: number;
  };
}

export function SessionManager({
  sessionId,
  className,
  onSessionDeleted,
  onSessionUpdated,
}: SessionManagerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [showActions, setShowActions] = useState(false);

  // Fetch session details
  const { data: sessions } = api.chat.getSessions.useQuery({
    limit: 1,
  });

  const session = sessions?.items.find(s => s.id === sessionId);

  // Mutations
  const updateSessionMutation = api.chat.updateSession.useMutation({
    onSuccess: () => {
      setIsEditing(false);
      onSessionUpdated?.();
    },
  });

  const deleteSessionMutation = api.chat.deleteSession.useMutation({
    onSuccess: () => {
      onSessionDeleted?.();
    },
  });

  const handleEditStart = () => {
    setEditTitle(session?.title || 'Untitled Chat');
    setIsEditing(true);
  };

  const handleEditSave = () => {
    if (editTitle.trim()) {
      updateSessionMutation.mutate({
        sessionId,
        title: editTitle.trim(),
      });
    }
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    setEditTitle('');
  };

  const handleDelete = () => {
    if (
      confirm(
        'Are you sure you want to delete this chat session? This action cannot be undone.'
      )
    ) {
      deleteSessionMutation.mutate({ sessionId });
    }
  };

  const handleExport = () => {
    // TODO: Implement export functionality in a future task
    alert('Export functionality will be implemented in a future update.');
  };

  const handleShare = () => {
    // TODO: Implement share functionality in a future task
    alert('Share functionality will be implemented in a future update.');
  };

  if (!session) {
    return null;
  }

  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Session Settings
          </CardTitle>
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowActions(!showActions)}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>

            {showActions && (
              <div className="absolute right-0 top-full mt-1 bg-background border rounded-md shadow-lg z-10 min-w-[160px]">
                <div className="py-1">
                  <button
                    className="w-full px-3 py-2 text-left text-sm hover:bg-accent flex items-center gap-2"
                    onClick={() => {
                      handleEditStart();
                      setShowActions(false);
                    }}
                  >
                    <Edit3 className="h-4 w-4" />
                    Rename
                  </button>
                  <button
                    className="w-full px-3 py-2 text-left text-sm hover:bg-accent flex items-center gap-2"
                    onClick={() => {
                      handleExport();
                      setShowActions(false);
                    }}
                  >
                    <Download className="h-4 w-4" />
                    Export
                  </button>
                  <button
                    className="w-full px-3 py-2 text-left text-sm hover:bg-accent flex items-center gap-2"
                    onClick={() => {
                      handleShare();
                      setShowActions(false);
                    }}
                  >
                    <Share className="h-4 w-4" />
                    Share
                  </button>
                  <hr className="my-1" />
                  <button
                    className="w-full px-3 py-2 text-left text-sm hover:bg-accent text-destructive flex items-center gap-2"
                    onClick={() => {
                      handleDelete();
                      setShowActions(false);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Session Title */}
        <div>
          <Label htmlFor="session-title">Session Title</Label>
          {isEditing ? (
            <div className="flex gap-2 mt-1">
              <Input
                id="session-title"
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleEditSave();
                  if (e.key === 'Escape') handleEditCancel();
                }}
                maxLength={100}
                autoFocus
              />
              <Button
                size="sm"
                onClick={handleEditSave}
                disabled={updateSessionMutation.isPending}
              >
                Save
              </Button>
              <Button size="sm" variant="outline" onClick={handleEditCancel}>
                Cancel
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between mt-1">
              <span className="text-sm font-medium">
                {session.title || 'Untitled Chat'}
              </span>
              <Button variant="ghost" size="sm" onClick={handleEditStart}>
                <Edit3 className="h-3 w-3 mr-1" />
                Edit
              </Button>
            </div>
          )}
        </div>

        {/* Session Statistics */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-xs text-muted-foreground">Messages</Label>
            <p className="text-sm font-medium">{session._count.messages}</p>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Created</Label>
            <p className="text-sm font-medium">
              {format(new Date(session.createdAt), 'MMM d, yyyy')}
            </p>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">
              Last Updated
            </Label>
            <p className="text-sm font-medium">
              {formatDistanceToNow(new Date(session.updatedAt), {
                addSuffix: true,
              })}
            </p>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Session ID</Label>
            <p className="text-xs font-mono text-muted-foreground truncate">
              {session.id}
            </p>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="pt-4 border-t">
          <Label className="text-sm font-medium text-destructive">
            Danger Zone
          </Label>
          <p className="text-xs text-muted-foreground mb-2">
            Once you delete a session, there is no going back. Please be
            certain.
          </p>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={deleteSessionMutation.isPending}
          >
            <Trash2 className="h-3 w-3 mr-1" />
            {deleteSessionMutation.isPending ? 'Deleting...' : 'Delete Session'}
          </Button>
        </div>
      </CardContent>

      {/* Backdrop for dropdown */}
      {showActions && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowActions(false)}
        />
      )}
    </Card>
  );
}
