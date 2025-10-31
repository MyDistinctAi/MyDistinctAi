# MyDistinctAI - Bug Tracking

## Active Bugs

*No active bugs*

---

## Resolved Bugs

### [FIXED] User Registration Fails with "Profile Setup Failed" Error
**Date Reported:** 2025-10-21
**Severity:** Critical
**Status:**  Resolved

**Description:**
When users tried to register a new account, they received the error message:
```
Account created but profile setup failed. Please contact support.
```

The Supabase auth account was created successfully, but the profile insert into the `users` table failed.

**Root Cause:**
Missing Row Level Security (RLS) INSERT policy on the `users` table. The schema had SELECT and UPDATE policies, but no INSERT policy to allow new users to create their profile during registration.

**Location:**
- `scripts/001_initial_schema.sql` (lines 216-224)
- `src/lib/auth/actions.ts` (line 71-84)

**Fix:**
Added INSERT policy to the users table:
```sql
CREATE POLICY "Users can create own profile" ON users
    FOR INSERT
    WITH CHECK (auth.uid() = id);
```

**Files Changed:**
- `scripts/001_initial_schema.sql` - Updated with INSERT policy
- `scripts/002_fix_user_insert_policy.sql` - Migration script created

**How to Apply Fix:**
Run the migration script in your Supabase SQL Editor:
```bash
# Option 1: Via Supabase Dashboard
# Copy and paste contents of scripts/002_fix_user_insert_policy.sql into SQL Editor

# Option 2: Via CLI (if supabase CLI is set up)
supabase db push
```

**Tested:** Pending user confirmation
**Fixed By:** Claude Code

---
