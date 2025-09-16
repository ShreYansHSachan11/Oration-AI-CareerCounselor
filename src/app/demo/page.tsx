'use client';

import React, { useState } from 'react';
import {
  ChatSidebar,
  NewChatButton,
  SessionSearch,
  SessionManager,
} from '@/components/chat';

export default function DemoPage() {
  const [selectedSessionId, setSelectedSessionId] = useState<
    string | undefined
  >();

  const handleSessionSelect = (sessionId: string) => {
    setSelectedSessionId(sessionId);
  };

  const handleNewChat = () => {
    console.log('Creating new chat...');
  };

  const handleChatCreated = (sessionId: string) => {
    setSelectedSessionId(sessionId);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6">Chat Components Demo</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar Demo */}
          <div className="lg:col-span-1">
            <h2 className="text-lg font-semibold mb-4">Chat Sidebar</h2>
            <div className="h-96 border rounded-lg">
              <ChatSidebar
                selectedSessionId={selectedSessionId}
                onSessionSelect={handleSessionSelect}
                onNewChat={handleNewChat}
              />
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* New Chat Button Demo */}
            <div>
              <h2 className="text-lg font-semibold mb-4">New Chat Button</h2>
              <div className="flex gap-4">
                <NewChatButton
                  onChatCreated={handleChatCreated}
                  variant="button"
                />
                <NewChatButton
                  onChatCreated={handleChatCreated}
                  variant="card"
                  className="flex-1"
                />
              </div>
            </div>

            {/* Session Search Demo */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Session Search</h2>
              <SessionSearch onSessionSelect={handleSessionSelect} />
            </div>

            {/* Session Manager Demo */}
            {selectedSessionId && (
              <div>
                <h2 className="text-lg font-semibold mb-4">Session Manager</h2>
                <SessionManager
                  sessionId={selectedSessionId}
                  onSessionDeleted={() => setSelectedSessionId(undefined)}
                  onSessionUpdated={() => console.log('Session updated')}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
