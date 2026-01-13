# End-to-End Testing Guide

This guide explains how to run the comprehensive E2E test suite for Entropic Aura.

## Prerequisites

- Node.js 17.0 or higher
- All dependencies installed: `npm install`
- Backend server (API) running
- Frontend dev server running
- (Optional) ComfyUI running for full integration tests

## Installation

E2E tests use Playwright. Install Playwright browsers:

```bash
npx playwright install
```

This will download Chromium, Firefox, and WebKit browsers.

## Running Tests

### All Tests

```bash
npm run test:e2e
```

### With UI Mode (Interactive)

```bash
npm run test:e2e:ui
```

This opens Playwright's interactive test runner where you can:
- See tests execute in real-time
- Debug failing tests
- View traces and screenshots
- Re-run individual tests

### Specific Test File

```bash
npx playwright test e2e/entropic-aura.spec.js
```

### Specific Test Suite

```bash
npx playwright test --grep "Navigation"
```

### Single Browser

```bash
npx playwright test --project=chromium
```

## Test Categories

### 1. Health and Connectivity
- Backend API health check
- Frontend loads successfully
- Navigation bar visibility

### 2. Navigation
- All main pages accessible
- Active link highlighting
- Route changes work correctly

### 3. Soundscape Creation
- Page elements present
- Mood selection
- Prompt entry and validation
- Character counter
- Generate button state

### 4. Preset Management
- Page loads with presets
- Tab switching (All/Favorites)
- Search functionality
- Mood filtering
- Sort order

### 5. Playlist Management
- Page loads correctly
- Empty state display
- Create playlist navigation
- Playlist CRUD operations

### 6. Settings Management
- All settings sections present
- Volume slider adjustment
- Visualizer style selection
- Checkbox toggles
- Save/Reset functionality
- Export/Import buttons

### 7. Background Visualizer
- Canvas element present
- Style changes reflect in UI
- Persistence across pages

### 8. API Integration
- Moods endpoint
- Presets endpoint
- Playlists endpoint
- Create operations

### 9. Responsive Design
- Mobile viewport (375x667)
- Tablet viewport (768x1024)
- Desktop viewport (1920x1080)

### 10. Performance
- Page load time < 5s
- Navigation speed < 2s

### 11. Error Handling
- 404 pages
- API errors
- Network failures

### 12. Accessibility
- Heading hierarchy
- Button labels
- Form input labels

## Environment Variables

Configure test environment:

```bash
# Frontend URL (default: http://localhost:8080)
export FRONTEND_URL=http://localhost:8080

# Backend URL (default: http://localhost:3000)
export BACKEND_URL=http://localhost:3000

# Run in CI mode
export CI=true
```

## Test Output

### HTML Report

After running tests, view the HTML report:

```bash
npx playwright show-report
```

This opens a detailed report showing:
- Test results by browser
- Screenshots of failures
- Video recordings
- Trace files for debugging

### Screenshots

Failed tests automatically capture screenshots:
- Location: `test-results/`
- Named by test and browser
- Useful for visual debugging

### Videos

Videos are recorded for failed tests:
- Location: `test-results/`
- Full test execution captured
- Helps understand failure context

### Traces

Playwright traces include:
- DOM snapshots at each step
- Network requests
- Console logs
- Action timeline

View traces:
```bash
npx playwright show-trace test-results/trace.zip
```

## Writing New Tests

### Basic Structure

```javascript
const { test, expect } = require('@playwright/test');

test.describe('Feature Name', () => {
  test('should do something', async ({ page }) => {
    await page.goto('/page');
    await expect(page.locator('selector')).toBeVisible();
  });
});
```

### Best Practices

1. **Use data-testid attributes** for stable selectors
   ```html
   <button data-testid="generate-button">Generate</button>
   ```
   ```javascript
   await page.click('[data-testid="generate-button"]');
   ```

2. **Wait for elements explicitly**
   ```javascript
   await expect(page.locator('selector')).toBeVisible();
   ```

3. **Use descriptive test names**
   ```javascript
   test('user can create a playlist with multiple presets', async ({ page }) => {
     // ...
   });
   ```

4. **Group related tests**
   ```javascript
   test.describe('Playlist Management', () => {
     test('creates playlist', ...);
     test('edits playlist', ...);
     test('deletes playlist', ...);
   });
   ```

5. **Clean up test data**
   ```javascript
   test.afterEach(async ({ request }) => {
     // Delete test playlists
     await request.delete('/api/playlists/test-*');
   });
   ```

## Debugging

### Debug Mode

Run tests in debug mode with Playwright Inspector:

```bash
npx playwright test --debug
```

This opens the Playwright Inspector where you can:
- Step through tests
- Pick selectors
- View console logs
- Inspect DOM

### Headed Mode

See browser while tests run:

```bash
npx playwright test --headed
```

### Slow Motion

Run tests in slow motion:

```bash
npx playwright test --headed --slow-mo=1000
```

### Specific Test

Debug a specific test:

```bash
npx playwright test --debug --grep "can create a preset"
```

## CI/CD Integration

### GitHub Actions

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
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

## Troubleshooting

### Tests fail with "page closed"
- Increase timeout in playwright.config.js
- Check for JavaScript errors in console
- Verify servers are running

### "Cannot find module"
```bash
npm install
npx playwright install
```

### "Target closed" errors
- Increase timeout values
- Check network connectivity
- Verify API endpoints are responding

### Flaky tests
- Add explicit waits: `await expect().toBeVisible()`
- Use `test.slow()` for slow tests
- Disable parallelization for specific tests

### Screenshots are blank
- Check if elements are actually visible
- Verify CSS/styling is loaded
- Wait for animations to complete

## Performance Tips

1. **Run tests in parallel** (config default)
2. **Use headed mode only for debugging**
3. **Reuse browser contexts** when possible
4. **Mock slow APIs** for faster tests
5. **Use specific selectors** instead of text matching

## Test Coverage

Current E2E test coverage:
- ✅ Navigation (5 tests)
- ✅ Soundscape creation (6 tests)
- ✅ Preset management (5 tests)
- ✅ Playlist management (3 tests)
- ✅ Settings (8 tests)
- ✅ Visualizer (2 tests)
- ✅ API integration (4 tests)
- ✅ Responsive design (3 tests)
- ✅ Performance (2 tests)
- ✅ Error handling (2 tests)
- ✅ Accessibility (3 tests)

**Total: 43+ E2E tests**

## Next Steps

1. Add tests for:
   - Audio playback functionality
   - Preset favoriting
   - Playlist rotation
   - Settings persistence across sessions

2. Integrate with CI/CD pipeline

3. Add visual regression testing

4. Create performance benchmarks

## Resources

- **Playwright Docs**: https://playwright.dev/
- **Best Practices**: https://playwright.dev/docs/best-practices
- **API Reference**: https://playwright.dev/docs/api/class-test
- **Debugging Guide**: https://playwright.dev/docs/debug

## Support

If tests fail:
1. Check console output for errors
2. View HTML report: `npx playwright show-report`
3. Review screenshots in `test-results/`
4. Run in debug mode: `npx playwright test --debug`
5. Check server logs for API errors
