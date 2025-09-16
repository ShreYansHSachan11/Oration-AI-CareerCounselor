# Deployment Guide

## Pre-Deployment Checklist

### ✅ Environment Setup
- [ ] Switch from SQLite to PostgreSQL in `prisma/schema.prisma`
- [ ] Set up production database (Vercel Postgres, Supabase, or Railway)
- [ ] Configure all environment variables
- [ ] Generate secure NEXTAUTH_SECRET
- [ ] Set up Google OAuth credentials for production domain
- [ ] Configure AI API keys (OpenAI or Gemini)

### ✅ Code Preparation
- [ ] Run `npm run build` locally to test
- [ ] Run `npm run lint` to check for issues
- [ ] Run `npm run test:run` to ensure tests pass
- [ ] Commit and push all changes to GitHub

### ✅ Database Migration
- [ ] Run `npx prisma migrate dev` locally first
- [ ] Ensure migration files are committed
- [ ] Plan production migration strategy

## Deployment Steps

### Option 1: Vercel (Recommended)

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Login and Deploy:**
   ```bash
   vercel login
   vercel
   ```

3. **Set up Database:**
   ```bash
   vercel postgres create
   ```

4. **Configure Environment Variables:**
   - Go to Vercel Dashboard → Project → Settings → Environment Variables
   - Add all required environment variables

5. **Deploy to Production:**
   ```bash
   vercel --prod
   ```

### Option 2: Railway

1. **Install Railway CLI:**
   ```bash
   npm install -g @railway/cli
   ```

2. **Initialize and Deploy:**
   ```bash
   railway login
   railway init
   railway add postgresql
   railway up
   ```

3. **Set Environment Variables:**
   ```bash
   railway variables set NEXTAUTH_SECRET=your-secret
   railway variables set GOOGLE_CLIENT_ID=your-id
   # ... add all other variables
   ```

## Environment Variables Required

```env
DATABASE_URL=postgresql://...
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-secret-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GEMINI_API_KEY=your-gemini-api-key
NODE_ENV=production
```

## Post-Deployment

### ✅ Verification
- [ ] Test authentication flow
- [ ] Test chat functionality
- [ ] Test database operations
- [ ] Test AI responses
- [ ] Check error handling
- [ ] Test on mobile devices

### ✅ Monitoring
- [ ] Set up error monitoring (Sentry)
- [ ] Monitor database performance
- [ ] Check API rate limits
- [ ] Monitor response times

## Troubleshooting

### Common Issues

1. **Database Connection Issues:**
   - Verify DATABASE_URL format
   - Check database is accessible from deployment platform
   - Ensure migrations are applied

2. **Authentication Issues:**
   - Verify NEXTAUTH_URL matches deployment URL
   - Check Google OAuth redirect URIs
   - Ensure NEXTAUTH_SECRET is set

3. **AI Service Issues:**
   - Verify API keys are correct
   - Check API rate limits
   - Monitor API usage

4. **Build Issues:**
   - Check TypeScript errors
   - Verify all dependencies are installed
   - Check for missing environment variables

## Performance Optimization

- [ ] Enable Vercel Analytics
- [ ] Set up caching headers
- [ ] Optimize images
- [ ] Monitor bundle size
- [ ] Set up CDN for static assets