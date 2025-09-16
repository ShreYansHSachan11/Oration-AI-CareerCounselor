/**
 * Debug component for testing chat functionality
 * Only shows in development mode
 */

'use client';

import React from 'react';
import { api } from '@/trpc/react';
import { useSession } from 'next-auth/react';

export function ChatDebug() {
  const { data: session, status } = useSession();
  const [debugInfo, setDebugInfo] = React.useState<string[]>([]);
  const [testMessage, setTestMessage] = React.useState('I need help with my career path');

  const createSessionMutation = api.chat.createSession.useMutation({
    onSuccess: (session) => {
      setDebugInfo(prev => [...prev, `✅ Session created: ${session.id}`]);
    },
    onError: (error) => {
      setDebugInfo(prev => [...prev, `❌ Create session error: ${error.message}`]);
    },
  });

  const sendMessageMutation = api.chat.sendMessage.useMutation({
    onSuccess: (result) => {
      setDebugInfo(prev => [...prev, `✅ Message sent, AI responded: ${result.aiMessage.content.substring(0, 50)}...`]);
    },
    onError: (error) => {
      setDebugInfo(prev => [...prev, `❌ Send message error: ${error.message}`]);
    },
  });

  const handleTestNewChat = () => {
    setDebugInfo(prev => [...prev, '🔄 Creating new session...']);
    createSessionMutation.mutate({});
  };

  const handleTestMessage = () => {
    if (!createSessionMutation.data?.id) {
      setDebugInfo(prev => [...prev, '❌ No session created yet']);
      return;
    }
    
    setDebugInfo(prev => [...prev, '🔄 Sending test message...']);
    sendMessageMutation.mutate({
      sessionId: createSessionMutation.data.id,
      content: testMessage,
    });
  };

  const clearDebug = () => {
    setDebugInfo([]);
  };

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/90 text-white p-4 rounded-lg max-w-md z-50 max-h-96 overflow-y-auto">
      <h3 className="font-bold mb-2 text-green-400">Chat Debug Panel</h3>
      
      <div className="space-y-2 text-sm mb-3">
        <div>Auth Status: <span className="text-blue-300">{status}</span></div>
        <div>User ID: <span className="text-blue-300">{session?.user?.id || 'None'}</span></div>
        <div>Session Loading: <span className="text-blue-300">{createSessionMutation.isLoading ? 'Yes' : 'No'}</span></div>
        <div>Message Loading: <span className="text-blue-300">{sendMessageMutation.isLoading ? 'Yes' : 'No'}</span></div>
        <div>Created Session: <span className="text-blue-300">{createSessionMutation.data?.id || 'None'}</span></div>
      </div>

      <div className="mb-3">
        <input
          type="text"
          value={testMessage}
          onChange={(e) => setTestMessage(e.target.value)}
          className="w-full px-2 py-1 text-black rounded text-sm"
          placeholder="Test message"
        />
      </div>

      <div className="space-x-2 mb-3">
        <button
          onClick={handleTestNewChat}
          disabled={createSessionMutation.isLoading}
          className="px-3 py-1 bg-blue-600 rounded text-sm disabled:opacity-50 hover:bg-blue-700"
        >
          Test New Chat
        </button>
        <button
          onClick={handleTestMessage}
          disabled={sendMessageMutation.isLoading || !createSessionMutation.data?.id}
          className="px-3 py-1 bg-green-600 rounded text-sm disabled:opacity-50 hover:bg-green-700"
        >
          Test Message
        </button>
        <button
          onClick={clearDebug}
          className="px-3 py-1 bg-gray-600 rounded text-sm hover:bg-gray-700"
        >
          Clear
        </button>
      </div>

      <div className="max-h-32 overflow-y-auto border-t border-gray-600 pt-2">
        {debugInfo.length === 0 ? (
          <div className="text-gray-400 text-xs">No debug info yet...</div>
        ) : (
          debugInfo.map((info, i) => (
            <div key={i} className="text-xs mb-1 break-words">{info}</div>
          ))
        )}
      </div>
    </div>
  );
}