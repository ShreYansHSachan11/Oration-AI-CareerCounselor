# Vercel Environment Variables Setup

## Required Environment Variables for Vercel Deployment

Add these environment variables in your Vercel project dashboard (Settings > Environment Variables):

### Database
```
DATABASE_URL=your-vercel-postgres-connection-string-here

PRISMA_DATABASE_URL=your-prisma-accelerate-connection-string-here
```

### NextAuth.js
```
NEXTAUTH_URL=https://your-app-name.vercel.app
NEXTAUTH_SECRET=your-production-secret-key-here
```

### OAuth (Google)
```
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here
```

### AI Service
```
GEMINI_API_KEY=your-gemini-api-key-here
```

### Application
```
NODE_ENV=production
```

## Steps to Add Environment Variables in Vercel:

1. Go to your Vercel dashboard
2. Select your project
3. Go to Settings > Environment Variables
4. Add each variable above with your actual values
5. Make sure to set them for all environments (Production, Preview, Development)

## Important Notes:

- Replace `your-app-name` in NEXTAUTH_URL with your actual Vercel app URL
- Generate a strong NEXTAUTH_SECRET for production (you can use: `openssl rand -base64 32`)
- Use your actual database credentials from Vercel Postgres
- Make sure your Google OAuth app is configured with the correct redirect URLs for your Vercel domain

## Security Best Practices:

- Never commit actual API keys or secrets to Git
- Use environment variables for all sensitive data
- Rotate secrets regularly
- Use different credentials for development and production