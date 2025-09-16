# tRPC API Documentation

This directory contains the tRPC API setup for the Career Counseling Chat application.

## Structure

```
src/server/api/
├── trpc.ts           # tRPC configuration and middleware
├── root.ts           # Main router that combines all sub-routers
├── routers/
│   ├── chat.ts       # Chat session and message procedures
│   └── user.ts       # User profile and preferences procedures
└── __tests__/
    └── trpc.test.ts  # Tests for tRPC infrastructure
```

## Features

### Authentication Middleware

- **Protected Procedures**: Automatically verify user authentication
- **Session Context**: Access to user session data in all procedures
- **Error Handling**: Proper UNAUTHORIZED errors for unauthenticated requests

### Chat Router (`/api/trpc/chat`)

- `getSessions` - Get paginated list of user's chat sessions
- `getMessages` - Get paginated messages for a specific session
- `createSession` - Create a new chat session
- `sendMessage` - Send a message and get AI response (placeholder)
- `updateSession` - Update session title
- `deleteSession` - Delete a session and all its messages

### User Router (`/api/trpc/user`)

- `getProfile` - Get current user profile
- `updatePreferences` - Update user preferences (theme, notifications)

## Usage

### Client-side (React Components)

```typescript
import { api } from '@/components/providers/trpc-provider';

function ChatComponent() {
  // Query data
  const { data: sessions } = api.chat.getSessions.useQuery({ limit: 20 });

  // Mutations
  const createSession = api.chat.createSession.useMutation();

  const handleCreateSession = () => {
    createSession.mutate({ title: 'New Chat' });
  };
}
```

### Type Safety

```typescript
import type { RouterInputs, RouterOutputs } from '@/utils/api';

// Input types
type CreateSessionInput = RouterInputs['chat']['createSession'];
type GetSessionsInput = RouterInputs['chat']['getSessions'];

// Output types
type ChatSession = RouterOutputs['chat']['getSessions']['items'][0];
type UserProfile = RouterOutputs['user']['getProfile'];
```

## Configuration

The tRPC setup includes:

- **SuperJSON transformer** for serializing complex data types
- **Error formatting** with Zod validation error details
- **Logger link** for development debugging
- **HTTP batch link** for efficient request batching

## Testing

Run the tRPC tests:

```bash
npm run test:run -- src/server/api/__tests__/trpc.test.ts
```

## Next Steps

1. Implement AI service integration in `sendMessage` procedure
2. Add real-time features with WebSocket support
3. Implement rate limiting for API endpoints
4. Add more comprehensive error handling and logging
