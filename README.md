# 🎯 AI Career Counselor Chat Application

A modern, full-stack career counseling chat application built with Next.js, TypeScript, and AI integration. Get personalized career guidance through intelligent conversations with an AI counselor.

## ✨ Features

### 🤖 AI-Powered Career Counseling
- **Intelligent Chat Interface**: Interactive AI counselor powered by Google Gemini
- **Contextual Conversations**: AI maintains conversation context for meaningful guidance
- **Career-Focused Responses**: Specialized prompts for career advice, job search, and professional development

### 💬 Chat Management
- **Session Management**: Create, view, and manage multiple chat sessions
- **Message Persistence**: All conversations saved to database with timestamps
- **Chat History**: Browse and continue previous conversations
- **Real-time Interactions**: Instant message delivery with typing indicators

### 🔐 Authentication & Security
- **Google OAuth**: Secure sign-in with Google accounts
- **Email Authentication**: Magic link authentication option
- **Protected Routes**: Secure access to chat features
- **User Preferences**: Theme and notification settings

### 🎨 Modern UI/UX
- **Responsive Design**: Optimized for desktop, tablet, and mobile
- **Dark/Light Themes**: Toggle between themes with system preference detection
- **Modern Animations**: Smooth transitions and micro-interactions
- **Glassmorphism Effects**: Contemporary design with backdrop blur effects
- **Interactive Elements**: Hover states, loading animations, and visual feedback

### ⚡ Performance & Optimization
- **Server-Side Rendering**: Fast initial page loads with Next.js
- **Database Optimization**: Indexed queries and efficient data fetching
- **Caching**: TanStack Query for intelligent data caching
- **Code Splitting**: Lazy loading for optimal bundle sizes

## 🛠️ Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **TailwindCSS v4** - Modern utility-first styling
- **Framer Motion** - Smooth animations and transitions
- **Radix UI** - Accessible component primitives

### Backend
- **tRPC** - End-to-end typesafe APIs
- **Prisma ORM** - Database toolkit and query builder
- **NextAuth.js** - Authentication solution
- **PostgreSQL/SQLite** - Database options

### AI Integration
- **Google Gemini API** - Advanced AI language model
- **Context Management** - Conversation flow handling

### Development Tools
- **ESLint** - Code linting and formatting
- **Vitest** - Unit and integration testing
- **Playwright** - End-to-end testing

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Database (PostgreSQL recommended, SQLite for development)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ShreYansHSachan11/Oration-AI-CareerCounselor.git
   cd career-counseling-chat
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Configure the following variables:
   ```env
   # Database
   DATABASE_URL="your-database-connection-string"
   
   # Authentication
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-key"
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   
   # AI Service
   GEMINI_API_KEY="your-gemini-api-key"
   ```

4. **Set up the database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:3000`

## 🗄️ Database Setup

### Option 1: SQLite (Development)
```env
DATABASE_URL="file:./dev.db"
```

### Option 2: PostgreSQL (Production)
```env
DATABASE_URL="postgresql://username:password@host:5432/database"
```

### Option 3: Supabase (Recommended)
1. Create account at [supabase.com](https://supabase.com)
2. Create new project
3. Get connection string from Settings → Database
4. Update `DATABASE_URL` in `.env.local`

## 🔑 Authentication Setup

### Google OAuth Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://your-domain.com/api/auth/callback/google` (production)
6. Copy Client ID and Secret to `.env.local`

## 🚀 Deployment

### Deploy to Vercel

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy**
   ```bash
   vercel
   ```

3. **Set up production database**
   ```bash
   # Option A: Vercel Postgres
   vercel postgres create
   
   # Option B: Use Supabase/Neon
   # Get connection string and add to Vercel environment variables
   ```

4. **Configure environment variables**
   In Vercel Dashboard → Project → Settings → Environment Variables:
   ```
   DATABASE_URL=your-production-database-url
   NEXTAUTH_URL=https://your-app.vercel.app
   NEXTAUTH_SECRET=your-production-secret
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   GEMINI_API_KEY=your-gemini-api-key
   NODE_ENV=production
   ```

5. **Redeploy**
   ```bash
   vercel --prod
   ```

## 📁 Project Structure

```
career-counseling-chat/
├── src/
│   ├── app/                 # Next.js App Router pages
│   ├── components/          # React components
│   │   ├── auth/           # Authentication components
│   │   ├── chat/           # Chat interface components
│   │   ├── ui/             # Reusable UI components
│   │   └── providers/      # Context providers
│   ├── server/             # Backend logic
│   │   ├── api/            # tRPC routers
│   │   └── services/       # Business logic services
│   ├── lib/                # Utility functions
│   ├── hooks/              # Custom React hooks
│   └── types/              # TypeScript type definitions
├── prisma/                 # Database schema and migrations
├── public/                 # Static assets
└── docs/                   # Documentation
```

## 🧪 Testing

### Run Tests
```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:coverage
```

## 📱 Features Walkthrough

### 1. Authentication
- Sign in with Google OAuth or email magic links
- Secure session management
- User profile and preferences

### 2. Chat Interface
- Clean, modern chat UI with message bubbles
- Real-time typing indicators
- Message status indicators (sent, delivered)
- Copy message functionality

### 3. Session Management
- Create new chat sessions
- View chat history with search
- Continue previous conversations
- Delete or archive sessions

### 4. AI Integration
- Context-aware career counseling
- Personalized advice and guidance
- Professional conversation flow
- Error handling and fallbacks

## 🎨 UI Components

### Modern Design System
- **Glassmorphism effects** with backdrop blur
- **Gradient backgrounds** and modern shadows
- **Smooth animations** with Framer Motion
- **Responsive layouts** for all screen sizes
- **Dark/Light theme** support

### Interactive Elements
- Hover effects and micro-interactions
- Loading states and skeleton screens
- Toast notifications
- Modal dialogs and confirmations

## 🔧 Configuration

### Environment Variables
| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | Database connection string | ✅ |
| `NEXTAUTH_URL` | Application URL | ✅ |
| `NEXTAUTH_SECRET` | Authentication secret | ✅ |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | ✅ |
| `GOOGLE_CLIENT_SECRET` | Google OAuth secret | ✅ |
| `GEMINI_API_KEY` | Google Gemini API key | ✅ |
| `NODE_ENV` | Environment (development/production) | ✅ |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with modern web technologies
- AI-powered by Google Gemini
- Designed for optimal user experience
- Deployed on Vercel platform

---

**Live Demo**: [https://oration-ai-career-counselor-shreyansh.vercel.app/](https://oration-ai-career-counselor-shreyansh.vercel.app/)  
**Repository**: [https://github.com/ShreYansHSachan11/Oration-AI-CareerCounselor](https://github.com/ShreYansHSachan11/Oration-AI-CareerCounselor)