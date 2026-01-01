# API Reference Section - Temporary Removal for User Testing

## Summary

The API Reference section has been temporarily removed from public access during the user testing phase to protect sensitive API documentation from unauthenticated users.

## Changes Made

### 1. Public Documentation `/docs` (File: `src/app/docs/page.tsx`)
- **Lines 84-220**: API Reference section commented out
- Section ID: `api-reference`
- This prevents public (unauthenticated) users from viewing API documentation

### 2. Dashboard Documentation `/dashboard/docs` (File: `src/app/dashboard/docs/page.tsx`)
- **Lines 193-352**: API Documentation section commented out
- Section ID: `api-docs`
- This prevents authenticated users from viewing API documentation during testing

### 3. Footer Navigation (File: `src/components/landing/Footer.tsx`)
- **Line 27**: API Reference link commented out
- Removed from the Resources section in the footer

## What Users Will Experience

✅ **Visiting `/docs` or `/dashboard/docs`**:
- Page loads normally
- All other documentation sections remain accessible
- API Reference section simply won't appear in the navigation or content

✅ **No Error Pages**:
- Users don't see any 404 or error pages
- The site continues to function normally

✅ **No API Details Exposed**:
- No API routes visible
- No request/response schemas shown
- No code examples accessible
- No rate limits or endpoints documented

## How to Re-Enable API Documentation

When you're ready to restore access to the API Reference section for beta testers or production:

### Step 1: Uncomment Public Docs
In `src/app/docs/page.tsx` (around lines 84-220):
1. Remove the opening comment: `// API Reference section temporarily removed for user testing`
2. Remove the `/*` before the section
3. Remove the `*/` after the section

### Step 2: Uncomment Dashboard Docs
In `src/app/dashboard/docs/page.tsx` (around lines 193-352):
1. Remove the opening comment: `// API Documentation section temporarily removed for user testing`
2. Remove the `/*` before the section
3. Remove the `*/` after the section

### Step 3: Restore Footer Link
In `src/components/landing/Footer.tsx` (around line 27):
1. Uncomment the line: `{ label: 'API Reference', href: '/dashboard/docs#api' },`
2. Remove the comment explaining the removal

### Quick Re-Enable Commands
```bash
# Search for all temporary removal comments
grep -r "temporarily removed for user testing" src/

# The comments mark exactly where to uncomment
```

## Alternative: Protected Access for Beta Testers

If you want to provide controlled access to specific beta testers instead of completely re-enabling:

### Option 1: Feature Flag
Add a feature flag check:
```typescript
const showApiDocs = process.env.NEXT_PUBLIC_SHOW_API_DOCS === 'true'

// Then conditionally include the section
...(showApiDocs ? [apiReferenceSection] : []),
```

### Option 2: Role-Based Access
Check user role before showing:
```typescript
// Only show to users with 'beta_tester' role
if (user?.role === 'beta_tester') {
  sections.push(apiReferenceSection)
}
```

### Option 3: Password Protection
Create a separate `/docs/api` route with password protection using middleware.

## Files Modified

1. `src/app/docs/page.tsx` - Public documentation
2. `src/app/dashboard/docs/page.tsx` - Dashboard documentation  
3. `src/components/landing/Footer.tsx` - Footer navigation

## Verification

To verify the changes are working:

1. **Visit Public Docs**: Navigate to `/docs`
   - ✅ Should NOT see "API Reference" in the sidebar
   - ✅ Other sections (Getting Started, Self-Hosting, etc.) should work

2. **Visit Dashboard Docs**: Navigate to `/dashboard/docs`
   - ✅ Should NOT see "API Documentation" in the sidebar
   - ✅ Other sections should work normally

3. **Check Footer**: Look at the footer on any page
   - ✅ "API Reference" link should NOT appear in Resources section

4. **View Page Source**: Right-click → View Page Source
   - ✅ API documentation content should NOT be visible in the HTML
   - ✅ The section is commented out at the JavaScript level, not just hidden with CSS

## Notes

- The actual API routes (`/api/*`) are still functional - this only removes documentation visibility
- The `docs/architecture/API_REFERENCE.md` file still exists but is not publicly linked
- This solution is easily reversible by uncommenting the sections
- No database changes or complex authentication required
- Safe for production deployment

---

**Date**: 2026-01-01  
**Purpose**: User testing phase - prevent API documentation exposure  
**Reversibility**: High - simple uncomment to restore
