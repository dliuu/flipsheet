# Setup Guide

## Supabase Configuration

To use the signup functionality, you need to set up Supabase environment variables.

### Step 1: Create a Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Note down your project URL and anon key

### Step 2: Create Environment File
Create a `.env.local` file in the root directory with:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### Step 3: Find Your Supabase Credentials
1. In your Supabase dashboard, go to Settings > API
2. Copy the "Project URL" and paste it as `NEXT_PUBLIC_SUPABASE_URL`
3. Copy the "anon public" key and paste it as `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Step 4: Restart Development Server
After creating the `.env.local` file, restart your development server:

```bash
npm run dev
```

## Current Status
- The app will work in development mode with a mock Supabase client
- For full functionality, you need to set up the environment variables
- The signup page is accessible at `/signup_page` 