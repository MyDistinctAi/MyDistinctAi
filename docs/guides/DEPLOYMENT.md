# Deployment Guide

This guide covers deploying MyDistinctAI to production environments.

## Web Application (Vercel)

### Prerequisites
- Vercel account
- GitHub repository connected
- Environment variables configured

### Environment Variables

Set these in Vercel dashboard (Settings → Environment Variables):

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenRouter (AI)
OPENROUTER_API_KEY=your-openrouter-key

# App Configuration
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NODE_ENV=production
```

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy (production)
vercel --prod
```

### Automatic Deployments
- Push to `main` branch triggers production deploy
- Pull requests create preview deployments
- Environment variables are per-environment

---

## Database (Supabase)

### Initial Setup

1. Create project at [supabase.com](https://supabase.com)
2. Run migrations from `supabase/migrations/`
3. Configure Row Level Security (RLS)
4. Set up storage buckets

### Running Migrations

```bash
# Using Supabase CLI
supabase db push

# Or run SQL directly in Supabase dashboard
# Copy contents of scripts/001_initial_schema.sql
```

### Storage Buckets

Create three buckets in Supabase Storage:
- `avatars` (public) - User profile pictures
- `logos` (public) - Company branding logos  
- `training-data` (private) - Training files

---

## Desktop Application

### Building Installers

```bash
# Windows
npm run tauri:build:windows

# macOS (requires macOS)
npm run tauri:build:mac

# Linux
npm run tauri:build:linux
```

### Distribution

Installers are in `src-tauri/target/release/bundle/`:
- Windows: `.msi` and `.exe` installers
- macOS: `.dmg` disk image
- Linux: `.AppImage` and `.deb` packages

### Code Signing (Optional)

For production distribution:
1. Obtain code signing certificate
2. Configure in `tauri.conf.json`
3. Rebuild with signing enabled

---

## Production Checklist

### Before Deployment
- [ ] All environment variables set
- [ ] Database migrations applied
- [ ] Storage buckets created with RLS
- [ ] Build passes: `npm run build`
- [ ] No lint errors: `npm run lint`

### After Deployment
- [ ] Verify login/registration works
- [ ] Test file upload functionality
- [ ] Confirm chat works with AI models
- [ ] Check all API routes respond
- [ ] Verify SSL certificate active

---

## Monitoring

### Vercel Analytics
- Enabled automatically
- View at vercel.com/analytics

### Error Tracking
- Consider adding Sentry
- Or use Vercel's built-in error tracking

### Logs
- Vercel: Logs tab in dashboard
- Supabase: Logs in database dashboard
