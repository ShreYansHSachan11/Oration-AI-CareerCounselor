# Database and Authentication Setup

This document explains how to set up the PostgreSQL database and NextAuth.js authentication for the Career Counseling Chat application.

## Prerequisites

- PostgreSQL database (local or cloud-hosted)
- Google OAuth application (for Google sign-in)
- SMTP server (optional, for email authentication)

## Environment Variables

Copy `.env.example` to `.env.local` and configure the following variables:

### Database Configuration

```bash
DATABASE_URL="postgresql://username:password@localhost:5432/career_counseling_chat"
```

### NextAuth.js Configuration

```bash
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"  # Generate with: openssl rand -base64 32
```

### OAuth Providers

```bash
# Google OAuth (required)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Email Provider (optional)
EMAIL_SERVER_HOST="smtp.gmail.com"
EMAIL_SERVER_PORT="587"
EMAIL_SERVER_USER="your-email@gmail.com"
EMAIL_SERVER_PASSWORD="your-app-password"
EMAIL_FROM="noreply@yourapp.com"
```

## Database Setup

1. **Generate Prisma Client**

   ```bash
   npm run db:generate
   ```

2. **Push Schema to Database**

   ```bash
   npm run db:push
   ```

3. **Seed Development Data** (optional)

   ```bash
   npm run db:seed
   ```

4. **Test Setup**
   ```bash
   npm run test:setup
   ```

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
5. Set application type to "Web application"
6. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://yourdomain.com/api/auth/callback/google` (production)

## Database Schema

The application uses the following main models:

- **User**: User accounts with preferences
- **ChatSession**: Individual chat conversations
- **Message**: Messages within chat sessions
- **Account/Session**: NextAuth.js authentication tables

## Available Scripts

- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema changes to database
- `npm run db:migrate` - Create and run migrations
- `npm run db:studio` - Open Prisma Studio (database GUI)
- `npm run db:seed` - Seed database with sample data
- `npm run test:setup` - Test database connection and setup

## Troubleshooting

### Database Connection Issues

- Verify DATABASE_URL format and credentials
- Ensure PostgreSQL server is running
- Check firewall settings for database port

### Authentication Issues

- Verify NEXTAUTH_SECRET is set and secure
- Check Google OAuth credentials and redirect URIs
- Ensure NEXTAUTH_URL matches your domain

### Migration Issues

- Use `npm run db:push` for development
- Use `npm run db:migrate` for production deployments
- Reset database with `npx prisma migrate reset` if needed

## Security Notes

- Never commit `.env.local` to version control
- Use strong, unique NEXTAUTH_SECRET in production
- Regularly rotate OAuth client secrets
- Use environment-specific database credentials
