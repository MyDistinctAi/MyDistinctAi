# MyDistinctAI E2E Tests

Comprehensive end-to-end test suite for MyDistinctAI authentication and dashboard functionality using Playwright.

## 📋 Test Coverage

### Authentication Tests

#### 1. **Registration Flow** (`auth-registration.spec.ts`)
- ✅ Form field validation
- ✅ Email format validation
- ✅ Password strength validation
- ✅ Successful user registration
- ✅ Duplicate email handling
- ✅ Navigation to login
- ✅ Password visibility toggle
- ✅ Industry/niche selection
- ✅ Mobile responsiveness

#### 2. **Login Flow** (`auth-login.spec.ts`)
- ✅ Login form validation
- ✅ Invalid credentials handling
- ✅ Successful authentication
- ✅ Session persistence across page reloads
- ✅ Logout functionality
- ✅ Navigation to registration and password reset
- ✅ Password visibility toggle
- ✅ Loading states
- ✅ Magic link option (if available)
- ✅ Mobile responsiveness

#### 3. **Password Reset** (`auth-password-reset.spec.ts`)
- ✅ Reset form display and validation
- ✅ Email format validation
- ✅ Success messages for valid requests
- ✅ Graceful handling of non-existent emails
- ✅ Navigation flows
- ✅ Loading states
- ✅ Form submission prevention (rate limiting)
- ✅ Mobile responsiveness

#### 4. **Dashboard & Protected Routes** (`dashboard-protected.spec.ts`)
- ✅ Unauthenticated access prevention
- ✅ Login redirects for protected routes
- ✅ User information display
- ✅ Account details rendering
- ✅ Navigation menu functionality
- ✅ Session management across tabs
- ✅ Logout from all tabs
- ✅ Browser refresh persistence
- ✅ Mobile responsiveness

## 🚀 Quick Start

### Install Dependencies

```bash
npm install
```

### Install Playwright Browsers

```bash
npm run playwright:install
```

### Run Tests

```bash
# Run all E2E tests (headless mode)
npm run test:e2e

# Run with UI mode (interactive)
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed

# Debug mode (step through tests)
npm run test:e2e:debug

# Run specific browser
npm run test:e2e:chromium
npm run test:e2e:firefox
npm run test:e2e:webkit

# Run mobile tests only
npm run test:e2e:mobile

# View test report
npm run test:e2e:report
```

## 📁 Test Structure

```
tests/
├── e2e/
│   ├── auth-registration.spec.ts    # User registration tests
│   ├── auth-login.spec.ts           # Login and logout tests
│   ├── auth-password-reset.spec.ts  # Password reset tests
│   ├── dashboard-protected.spec.ts  # Dashboard and route protection
│   └── utils/
│       └── testData.ts              # Test data generators
├── README.md                        # This file
└── playwright.config.ts             # Playwright configuration
```

## 🔧 Configuration

The Playwright configuration (`playwright.config.ts`) includes:

- **Base URL**: `http://localhost:3001` (configurable via `PLAYWRIGHT_TEST_BASE_URL`)
- **Timeout**: 30 seconds per test
- **Browsers**: Chromium, Firefox, WebKit
- **Mobile**: Pixel 5, iPhone 12
- **Reporters**: HTML and list
- **Screenshots**: On failure
- **Videos**: On failure
- **Traces**: On first retry

## 📝 Writing New Tests

### Using Test Data Generators

```typescript
import { createTestUser, generateTestEmail } from './utils/testData'

test('example test', async ({ page }) => {
  // Create a complete test user
  const testUser = createTestUser()

  // Or generate specific data
  const email = generateTestEmail()
  const password = generateTestPassword()
  const name = generateTestName()
})
```

### Test User Object

```typescript
interface TestUser {
  email: string      // Unique random email
  password: string   // Secure random password
  name: string       // Random full name
  niche: string      // Industry (default: 'Creators')
}
```

## 🎯 Best Practices

### 1. **Isolation**
- Each test should be independent
- Use `test.beforeEach` for common setup
- Clean up test data when possible

### 2. **Selectors**
- Prefer role-based selectors: `page.getByRole('button', { name: /sign in/i })`
- Use label selectors for inputs: `page.getByLabel(/email/i)`
- Avoid CSS selectors when possible

### 3. **Assertions**
- Use Playwright's built-in assertions with auto-retry
- Set appropriate timeouts for async operations
- Use regex for flexible text matching: `/sign in|log in/i`

### 4. **Waiting**
- Prefer implicit waits with `expect(...).toBeVisible()`
- Avoid `waitForTimeout` unless necessary
- Use `waitForURL` for navigation

## 🐛 Debugging Tests

### Debug Mode
```bash
npm run test:e2e:debug
```
This opens Playwright Inspector for step-by-step debugging.

### Headed Mode
```bash
npm run test:e2e:headed
```
See the browser while tests run.

### UI Mode
```bash
npm run test:e2e:ui
```
Interactive UI to run and debug tests.

### View Test Reports
```bash
npm run test:e2e:report
```
Opens HTML report with screenshots and traces.

## 📊 Test Reports

After running tests, you can:

1. **View HTML Report**
   ```bash
   npm run test:e2e:report
   ```

2. **Check Screenshots** (on failure)
   - Located in `test-results/` directory

3. **View Traces** (on retry)
   - Open in Playwright Trace Viewer

## 🔐 Security Considerations

### Test Data
- All test emails use random timestamps to ensure uniqueness
- Test passwords meet security requirements
- No real user credentials in test code

### Email Enumeration
- Password reset tests verify security against email enumeration attacks
- Generic success messages prevent user discovery

## 🚨 Common Issues

### Port Already in Use
If you see "Port 3000 is in use", the test server will automatically try 3001.

### Browsers Not Installed
Run:
```bash
npm run playwright:install
```

### Timeout Errors
- Increase timeout in specific tests: `test.setTimeout(60000)`
- Check if dev server is running
- Verify Supabase configuration

### Flaky Tests
- Add explicit waits for async operations
- Use `toBeVisible({ timeout: 5000 })` for elements
- Check for race conditions

## 📈 CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps

      - name: Run E2E tests
        run: npm run test:e2e
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

## 📚 Resources

- [Playwright Documentation](https://playwright.dev)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Debugging Guide](https://playwright.dev/docs/debug)
- [CI/CD Guide](https://playwright.dev/docs/ci)

## 🤝 Contributing

When adding new tests:

1. Follow existing naming conventions
2. Add appropriate test descriptions
3. Group related tests with `test.describe`
4. Update this README with new test coverage
5. Ensure tests pass on all browsers

## 📞 Support

For issues or questions about tests:
- Check existing test files for examples
- Review Playwright documentation
- Check test output and error messages
- Use debug mode to step through failures
