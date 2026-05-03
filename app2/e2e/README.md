# E2E Tests for Geometry Components

This directory contains Playwright end-to-end tests for the Square and SixFoldV0 geometry components.

## Test Coverage

Each component has 4 tests:

### Square Component (16 steps)

- Starts at step 1
- Can navigate to end with next button
- Last button (>>) jumps to end
- First button (<<) resets to start

### SixFoldV0 Component (93 steps)

- Starts at step 1
- Can navigate to end with next button
- Last button (>>) jumps to end
- First button (<<) resets to start

## Setup

Install Playwright browsers (one-time):

```bash
pnpm exec playwright install --with-deps
```

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

- Browser: Chromium
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
