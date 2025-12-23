# Database Migration Guide

## Quick Start

### Step 1: Access Supabase SQL Editor

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/ekfdbotohslpalnyvdpk
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query** button

### Step 2: Run the Migration

1. Open the file: `scripts/001_initial_schema.sql`
2. Copy the entire SQL script (Ctrl+A, Ctrl+C)
3. Paste it into the Supabase SQL Editor
4. Click **Run** button (or press Ctrl+Enter)

### Step 3: Verify Success

You should see a success message with:
- ✅ Database schema created successfully
- List of 8 tables created
- 3 storage buckets created
- RLS policies enabled

### Step 4: Test Connection

Run the test script to verify everything works:
```bash
node scripts/test-supabase.mjs
```

---

## What This Migration Creates

### Tables (8 total)

1. **users** - User accounts and profiles
   - Stores email, name, niche, avatar, subscription status
   - Indexed on email and subscription_status

2. **models** - Custom AI models
   - Links to users, stores model config and training status
   - Indexed on user_id, status, created_at

3. **branding_config** - White-label branding
   - Company name, logo, colors, custom domain
   - Indexed on user_id and domain

4. **training_data** - Uploaded training files
   - File metadata, processing status
   - Links to models via model_id

5. **chat_sessions** - Conversation sessions
   - Links users and models
   - Tracks conversation history

6. **chat_messages** - Individual messages
   - User and AI messages
   - Links to chat_sessions

7. **subscriptions** - Stripe payment data
   - Plan type, status, billing period
   - Links to Stripe customer and subscription IDs

8. **waitlist** - Pre-launch signups
   - Name, email, niche, company
   - Public insert allowed (no auth required)

### Storage Buckets (3 total)

1. **avatars** (public)
   - User profile pictures
   - Users can upload/update/delete their own

2. **logos** (public)
   - Company logos for white-labeling
   - Users can upload/update/delete their own

3. **training-data** (private)
   - PDF, DOCX, TXT files for model training
   - Users can only access their own files

### Security Features

✅ **Row Level Security (RLS)** enabled on all tables
- Users can only access their own data
- Enforced at database level (can't be bypassed)

✅ **Automatic Triggers**
- `updated_at` timestamps automatically updated
- Applied to: users, models, branding_config, chat_sessions, subscriptions

✅ **Foreign Key Constraints**
- Maintains referential integrity
- Cascading deletes where appropriate

✅ **Check Constraints**
- Validates enum values (status, roles, etc.)
- Enforces data quality rules

---

## Troubleshooting

### Error: "relation already exists"
This means tables are already created. You can either:
- Skip the migration (tables already exist)
- Drop tables first (⚠️ WARNING: destroys data!)

### Error: "permission denied"
Make sure you're using the service_role key in SQL Editor, not the anon key.

### Error: "function uuid_generate_v4 does not exist"
The UUID extension wasn't created. Run:
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

---

## Next Steps After Migration

1. ✅ Verify tables exist: Check Tables section in Supabase Dashboard
2. ✅ Test connection: `node scripts/test-supabase.mjs`
3. ⏭️ Set up authentication (Prompt 4 in claude.md)
4. ⏭️ Create first user and test RLS policies

---

## Migration History

| Version | File | Description | Date |
|---------|------|-------------|------|
| 001 | 001_initial_schema.sql | Initial database schema | 2025-10-20 |

---

## Rollback (⚠️ Destructive!)

If you need to completely reset the database:

```sql
-- Drop all tables (WARNING: DESTROYS ALL DATA)
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS chat_sessions CASCADE;
DROP TABLE IF EXISTS training_data CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS branding_config CASCADE;
DROP TABLE IF EXISTS models CASCADE;
DROP TABLE IF EXISTS waitlist CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop storage buckets
DELETE FROM storage.buckets WHERE id IN ('avatars', 'logos', 'training-data');

-- Drop triggers and functions
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_models_updated_at ON models;
DROP TRIGGER IF EXISTS update_branding_config_updated_at ON branding_config;
DROP TRIGGER IF EXISTS update_chat_sessions_updated_at ON chat_sessions;
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
DROP FUNCTION IF EXISTS update_updated_at_column();
```

Then re-run the migration from scratch.
