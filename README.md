
# We-Trend: AI-Based IT Trend Platform

This project is a Next.js 14 application that aggregates and summarizes IT/AI news using Google Gemini.

## Features
- **Daily AI Summaries**: Auto-fetches news from GNews/Naver and summarizes them in SNS style.
- **Community**: Users can write posts, like, comment, and bookmark.
- **Tech Stack**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Supabase, Vercel.

## Getting Started

1. **Clone & Install**
   ```bash
   git clone <repo>
   cd wenners-next
   npm install
   ```

2. **Environment Setup**
   Copy `env.example` to `.env.local` and fill in the keys.
   ```bash
   cp env.example .env.local
   ```
   Required Keys:
   - Supabase URL & Anon Key & Service Role Key
   - Google AI API Key (Gemini)
   - GNews API Key
   - Naver Client ID & Secret
   - `CRON_SECRET` (For Vercel Cron security)

3. **Database Setup**
   - Run the SQL queries in `supabase/schema.sql` in your Supabase SQL Editor.
   - Create a user with display_name "We-Trend AI" manually or via Sign Up to serve as the system bot.
   - Note the ID of this user and update `app/api/fetch-news/route.ts` if needed (currently it searches for "We-Trend AI").

4. **Run Locally**
   ```bash
   npm run dev
   ```

## Vercel Deployment

1. **Push to GitHub**.
2. **Import in Vercel**.
3. **Environment Variables**: Add all variables from `.env.local` to Vercel Project Settings.
4. **Deploy**.

## Vercel Cron (Auto News)

- The `vercel.json` file configures the Cron job to run daily.
- Endpoint: `/api/fetch-news`
- Ensure `CRON_SECRET` is set in Vercel Environment Variables.
