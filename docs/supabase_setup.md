# Supabase Setup Instructions

## 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Enter project details:
   - Name: `money-manager`
   - Database Password: (Generate strong password)
   - Region: Choose nearest region
4. Wait for project to be created (2-3 minutes)

## 2. Run Schema SQL
1. Go to **SQL Editor** in left sidebar
2. Click **New Query**
3. Copy entire SQL from `SUPABASE_SCHEMA.sql`
4. Click **Run**
5. Verify all tables are created in **Table Editor**

## 3. Configure Authentication
1. Go to **Authentication > Providers**
2. Enable **Email Auth** (already enabled)
3. Configure **Google OAuth**:
   - Enable Google
   - Get Client ID & Secret from Google Cloud Console
   - Add to Supabase
   - Redirect URL: `https://[project-ref].supabase.co/auth/v1/callback`

## 4. Google Cloud Console Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create New Project: `money-manager-auth`
3. Enable **Google+ API**
4. Go to **Credentials > Create Credentials > OAuth Client ID**
5. Application Type: **Web Application**
6. Authorized JavaScript origins:
   - `http://localhost:3000` (development)
   - `https://your-app.onrender.com` (production)
7. Authorized redirect URIs:
   - `https://[project-ref].supabase.co/auth/v1/callback`
8. Copy **Client ID** and **Client Secret**

## 5. Environment Variables
Add to Render Environment Variables:
SUPABASE_URL=https://[project-ref].supabase.co
SUPABASE_ANON_KEY=[your-anon-key]
SUPABASE_SERVICE_ROLE_KEY=[your-service-role-key]
GOOGLE_CLIENT_ID=[from-google-console]
GOOGLE_CLIENT_SECRET=[from-google-console]

## 6. Test Database Connection
Run in SQL Editor to verify:
```sql
-- Test RLS is working
SET ROLE anon;
SELECT * FROM users; -- Should return 0 rows

-- Test as authenticated user
SET ROLE authenticated;
-- Should work with proper auth
7. Backup Strategy
Enable Point-in-Time Recovery in Database settings

Set up daily backups

Download backup before major updates



