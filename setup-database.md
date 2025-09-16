# Database Setup Options

Since Docker is having network connectivity issues, here are your best options:

## Option 1: Neon (Recommended - Free & Fast)

1. Go to [https://neon.tech/](https://neon.tech/)
2. Sign up (free account)
3. Create a new project named "career-counseling-chat"
4. Copy the connection string from the dashboard
5. Replace the DATABASE_URL in your `.env.local` file

**Format:** `postgresql://username:password@endpoint/dbname?sslmode=require`

## Option 2: Supabase (Also Free)

1. Go to [https://supabase.com/](https://supabase.com/)
2. Create account and new project
3. Go to Settings > Database
4. Copy the connection string
5. Replace the DATABASE_URL in your `.env.local` file

**Format:** `postgresql://postgres:password@db.project-ref.supabase.co:5432/postgres`

## Option 3: Fix Docker (If you prefer local)

Try these commands to fix Docker networking:

```bash
# Reset Docker network
docker network prune -f

# Try pulling the image directly
docker pull postgres:15

# If that works, then run:
docker run --name career-counseling-postgres -e POSTGRES_DB=career_counseling_chat -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:15
```

## After Setting Up Database:

1. Update your `.env.local` with the correct DATABASE_URL
2. Run: `npm run db:push` to create the tables
3. Run: `npx tsx scripts/test-db-connection.ts` to verify connection

## Current Status:

- ✅ Database services implemented
- ✅ Prisma schema ready
- ❌ Database connection needed
- ⏳ Waiting for database setup

Choose any option above and I'll help you complete the setup!
