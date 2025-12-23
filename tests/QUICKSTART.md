# E2E Testing Quick Start Guide

## ⚡ Getting Started in 3 Steps

### Step 1: Install Playwright Browsers

```bash
npm run playwright:install
```

This will download Chromium, Firefox, and WebKit browsers needed for testing.

### Step 2: Make Sure Dev Server is Running

The tests will automatically start the dev server, but you can also run it manually:

```bash
npm run dev
```

The server should be running at `http://localhost:3001`

### Step 3: Run Your First Test

```bash
# Run all tests (headless mode)
npm run test:e2e

# OR run with visual UI (recommended for first time)
npm run test:e2e:ui
```

## 🎯 What Gets Tested?

### ✅ Registration Flow
- Creating new accounts
- Email and password validation
- Industry selection
- Error handling

### ✅ Login Flow
- Signing in with credentials
- Session persistence
- Logout functionality
- Invalid credentials handling

### ✅ Password Reset
- Requesting password reset links
- Email validation
- Success messages

### ✅ Dashboard & Protected Routes
- Access control for authenticated users
- User profile display
- Protected route redirects
- Session management

## 🚀 Common Commands

```bash
# Interactive UI mode (BEST for debugging)
npm run test:e2e:ui

# Run in visible browser (see what's happening)
npm run test:e2e:headed

# Debug mode (step through tests)
npm run test:e2e:debug

# Run only on Chrome
npm run test:e2e:chromium

# View last test report
npm run test:e2e:report
```

## 📊 Understanding Test Results

### ✅ Passing Tests
- Green checkmarks indicate successful tests
- All assertions passed
- Application behaves as expected

### ❌ Failing Tests
- Red X marks indicate test failures
- Check the error message for details
- Screenshots available in `test-results/` folder
- View detailed report: `npm run test:e2e:report`

## 🐛 Troubleshooting

### "Port 3000 is in use"
✅ **This is normal!** Tests will automatically use port 3001 instead.

### "Browser not found"
Run:
```bash
npm run playwright:install
```

### "Cannot connect to server"
Make sure your `.env.local` file has valid Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key_here
```

### Tests are failing
1. Check if dev server is running
2. Verify Supabase connection
3. Look at screenshots in `test-results/`
4. Run in headed mode to see what's happening:
   ```bash
   npm run test:e2e:headed
   ```

## 📝 Running Specific Tests

```bash
# Run only registration tests
npx playwright test auth-registration

# Run only login tests
npx playwright test auth-login

# Run only dashboard tests
npx playwright test dashboard-protected

# Run only password reset tests
npx playwright test auth-password-reset
```

## 🎨 UI Mode (Recommended!)

The UI mode is the easiest way to run and debug tests:

```bash
npm run test:e2e:ui
```

Features:
- ✅ Click to run individual tests
- ✅ See test execution in real-time
- ✅ Time-travel debugger
- ✅ View screenshots and traces
- ✅ Filter and search tests

## 📈 Continuous Integration

Tests are designed to run in CI/CD pipelines:

```bash
# Run tests in CI mode
CI=true npm run test:e2e
```

This will:
- Run tests in parallel
- Retry failed tests automatically
- Generate HTML report
- Capture screenshots and videos on failure

## 🔍 Debug Mode

To step through a specific test:

```bash
# Debug all tests
npm run test:e2e:debug

# Debug specific test file
npx playwright test auth-login --debug
```

Debug mode features:
- ✅ Pause before each action
- ✅ Step forward/backward
- ✅ Inspect elements
- ✅ View console logs
- ✅ Network activity

## 💡 Pro Tips

1. **Start with UI mode** when learning: `npm run test:e2e:ui`
2. **Use headed mode** to see browser: `npm run test:e2e:headed`
3. **Check reports** after failures: `npm run test:e2e:report`
4. **Run specific browsers** for faster feedback
5. **Use debug mode** to understand failures

## 📚 Next Steps

- Read the full [README.md](./README.md) for detailed information
- Check [Playwright docs](https://playwright.dev) for advanced features
- Explore test files in `tests/e2e/` to understand test patterns

## ❓ Need Help?

1. Check test output and error messages
2. View HTML report: `npm run test:e2e:report`
3. Run in UI mode: `npm run test:e2e:ui`
4. Look at screenshots in `test-results/`
5. Check Playwright documentation

Happy Testing! 🎉
