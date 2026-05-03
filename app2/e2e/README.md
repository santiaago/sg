# E2E Tests for Geometry Components

This directory contains Playwright end-to-end tests for the Square and SixFoldV0 geometry components.

## Test Coverage

The tests verify navigation functionality for both components:

### Square Component (16 steps)

- Can click next all the way to the end
- Can click fast forward (»»)
- Can click back (prev)
- Can click all the way to the beginning with backwards (<<)
- Multiple navigation cycles

### SixFoldV0 Component (93 steps)

- Can click next all the way to the end
- Can click fast forward (»»)
- Can click back (prev)
- Can click all the way to the beginning with backwards (<<)
- Multiple navigation cycles

## Running Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run with UI mode (interactive)
npm run test:e2e:ui

# Run with headed browsers (visible)
npm run test:e2e:headed

# Run with debug mode
npm run test:e2e:debug
```

## Configuration

See `playwright.config.ts` for test configuration including:

- Browser support (Chromium, Firefox, WebKit, Mobile Chrome, Edge)
- Timeout settings
- Test server configuration
- Artifact output directories

## Test Results

Test results are stored in:

- `test-results/` - Screenshots, videos, traces
- `playwright-report/` - HTML test report

These directories are ignored by git (see `.gitignore`).

## Adding New Tests

When adding new E2E tests:

1. Create a new `.spec.ts` file in this directory
2. Use the existing patterns for navigation and assertions
3. Follow the same structure for component-specific selectors
4. Keep tests focused on user interactions and visible behavior
