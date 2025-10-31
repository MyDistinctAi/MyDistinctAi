# Xray Route Setup - Test Users

The xray route (`/xray/{username}`) allows instant login for testing without entering credentials.

---

## 🎯 Purpose

- **E2E Testing**: Quickly authenticate as different users in Playwright tests
- **Manual Testing**: Test features as different user types
- **Development**: Skip login flow during development

⚠️ **DEV ONLY** - Automatically disabled in production

---

## 👥 Test Users

The following test users are configured:

| Username | Email | Password (Dev) |
|----------|-------|----------------|
| johndoe | john.doe@example.com | TestPassword123! |
| janesmith | jane.smith@example.com | TestPassword123! |
| bobwilson | bob.wilson@example.com | TestPassword123! |
| luluconcurseira | lulu@example.com | TestPassword123! |
| danielbergholz | daniel@example.com | TestPassword123! |

---

## 🚀 Setup Instructions

### Step 1: Create Test Users in Supabase

You need to create these users in your Supabase project. Run this SQL in the Supabase SQL Editor:

```sql
-- Note: Supabase will hash passwords automatically
-- You'll need to create users via the Auth UI or API

-- Or use the Supabase dashboard:
-- 1. Go to Authentication > Users
-- 2. Click "Add User"
-- 3. Enter email and password for each test user
```

### Step 2: Create User Profiles

After creating auth users, create their profiles:

```sql
-- Insert test user profiles
-- Replace the UUIDs with the actual user IDs from Supabase Auth

INSERT INTO users (id, email, name, niche, subscription_status)
VALUES
  ('user-id-1', 'john.doe@example.com', 'John Doe', 'Content Creators', 'free'),
  ('user-id-2', 'jane.smith@example.com', 'Jane Smith', 'Legal / Law Firms', 'pro'),
  ('user-id-3', 'bob.wilson@example.com', 'Bob Wilson', 'Healthcare / Medical', 'free'),
  ('user-id-4', 'lulu@example.com', 'Lulu Concurseira', 'Education', 'free'),
  ('user-id-5', 'daniel@example.com', 'Daniel Bergholz', 'Technology', 'enterprise');
```

---

## 📝 Usage

### In Browser
Simply navigate to:
```
http://localhost:4000/xray/johndoe
```

This will instantly log you in as John Doe and redirect to the dashboard.

### In Playwright Tests
```typescript
// Navigate to xray route to login
await page.goto('http://localhost:4000/xray/johndoe')

// Now you're logged in as johndoe
await expect(page).toHaveURL('/dashboard')
```

### Available Routes
- `/xray/johndoe` - Login as John Doe
- `/xray/janesmith` - Login as Jane Smith
- `/xray/bobwilson` - Login as Bob Wilson
- `/xray/luluconcurseira` - Login as Lulu
- `/xray/danielbergholz` - Login as Daniel

---

## 🔧 How It Works

1. User navigates to `/xray/{username}`
2. Route looks up email from username mapping
3. Calls `supabase.auth.signInWithPassword()` with dev password
4. Creates session and redirects to dashboard
5. User is now authenticated

---

## 🐛 Troubleshooting

### "Login Failed" Error

**Problem**: Test user doesn't exist in Supabase Auth

**Solution**: Create the user in Supabase:
1. Go to Supabase Dashboard → Authentication → Users
2. Click "Add User"
3. Email: (from table above)
4. Password: `TestPassword123!`
5. Auto Confirm User: ✅ Yes

### "User Not Found" Error

**Problem**: Username not in the test users list

**Solution**: Use one of the available usernames: johndoe, janesmith, bobwilson, luluconcurseira, danielbergholz

### Session Not Persisting

**Problem**: Cookies not being set correctly

**Solution**: 
- Make sure you're on `localhost:4000` (not 127.0.0.1)
- Check browser console for cookie errors
- Clear cookies and try again

---

## 🔒 Security

### Production Safety
The xray route is automatically disabled in production:
```typescript
if (process.env.NODE_ENV === 'production') {
  redirect('/login')
}
```

### Best Practices
1. ✅ Only use in development/testing
2. ✅ Never commit real user credentials
3. ✅ Use a simple, known password for test users
4. ✅ Don't use test users for sensitive data

---

## 🧪 Testing with Xray

### Example E2E Test
```typescript
import { test, expect } from '@playwright/test'

test('user can upload file', async ({ page }) => {
  // Quick login via xray
  await page.goto('http://localhost:4000/xray/johndoe')
  
  // Now test the feature
  await page.goto('/dashboard/data')
  await page.click('text=Upload Files')
  // ... rest of test
})
```

### Testing Different User Types
```typescript
test('pro user sees advanced features', async ({ page }) => {
  await page.goto('http://localhost:4000/xray/janesmith') // Pro user
  await expect(page.locator('text=Advanced Features')).toBeVisible()
})

test('free user sees upgrade prompt', async ({ page }) => {
  await page.goto('http://localhost:4000/xray/johndoe') // Free user
  await expect(page.locator('text=Upgrade to Pro')).toBeVisible()
})
```

---

## 📊 Next Steps

1. ✅ Create test users in Supabase Auth
2. ✅ Create user profiles in database
3. ✅ Test xray route manually
4. ✅ Update E2E tests to use xray
5. ✅ Run full test suite

---

## 🎯 Quick Setup Script

Use the Supabase MCP to create test users:

```javascript
// Create test users via Supabase API
const testUsers = [
  { email: 'john.doe@example.com', password: 'TestPassword123!', name: 'John Doe' },
  { email: 'jane.smith@example.com', password: 'TestPassword123!', name: 'Jane Smith' },
  { email: 'bob.wilson@example.com', password: 'TestPassword123!', name: 'Bob Wilson' },
  { email: 'lulu@example.com', password: 'TestPassword123!', name: 'Lulu Concurseira' },
  { email: 'daniel@example.com', password: 'TestPassword123!', name: 'Daniel Bergholz' },
]

// You'll need to create these via Supabase Dashboard or Admin API
```
