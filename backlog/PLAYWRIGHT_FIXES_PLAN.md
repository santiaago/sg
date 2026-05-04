# Playwright E2E Test Suite - Remaining Fixes Plan

**Status:** Draft - Pending Implementation  
**Branch:** `vibe/playwright-improvements-acf463`  
**Date:** 2026-05-04  
**Related:** [`EXTRA_PLAYWRIGHT_IMPROVEMENTS.md`](EXTRA_PLAYWRIGHT_IMPROVEMENTS.md)  

---

## Overview

This document outlines **remaining fixes** needed after commits 5751202, f2f960c, and 3f5b96a.

These three commits successfully addressed most P0 and P1 issues from `EXTRA_PLAYWRIGHT_IMPROVEMENTS.md`:
- ✅ Replaced silent `test.skip()` calls with explicit expectations (5751202)
- ✅ Split monolithic `utils.ts` into modular structure (f2f960c)
- ✅ Added retries, removed `.serial`, replaced `waitForTimeout` (3f5b96a)

However, **code review identified several remaining issues** that must be fixed before this branch can be merged to main.

---

## Why These Fixes Matter

### The Core Problem

The current test suite has **false reliability** — tests appear to pass, but use patterns that:
1. **Don't actually wait** for conditions (using `expect` on primitive values)
2. **Have duplicate code** (increasing maintenance burden)
3. **Use `test.skip()` incorrectly** (inside test bodies instead of declarations)

This leads to **flaky tests** that may pass locally but fail in CI, or worse, **false passes** that hide real application bugs.

### Test Quality Principles Violated

| Principle | Current State | Why It Matters |
|-----------|---------------|----------------|
| **Proper async waits** | `await expect(value).toBeTruthy()` on primitives | Playwright `expect` only works on locators/elements; using it on strings/numbers is a synchronous check, not an async wait |
| **Single source of truth** | `assertClipboardContains` defined twice | Code duplication increases maintenance burden and risk of divergence |
| **Correct skip usage** | `test.skip()` inside test logic | Skips don't work correctly at runtime; they must be at test declaration level |
| **Defensive timeouts** | `waitForLoadState('networkidle')` without timeout | Can hang indefinitely on pending network requests |

---

## Priority Legend

| Level | Description | Target Completion |
|-------|-------------|-------------------|
| **P0** | Critical - Test may produce false passes or fail flakily | Before PR review |
| **P1** | High - Code duplication or suboptimal patterns | Before merge |
| **P2** | Medium - Improvements for long-term maintainability | Next sprint |

---

## P0: Critical Fixes (Test Correctness)

### Issue 1: `await expect(primitive).toBeTruthy()` Does NOT Wait

**Severity:** Critical - Tests may pass without actually waiting for elements  
**Files affected:** 7 files, ~20 occurrences  

#### What's Wrong

```typescript
// CURRENT (INCORRECT)
const itemText = await firstItem.textContent();
await expect(itemText).toBeTruthy(); // ❌ This is SYNC, not ASYNC

// This pattern appears in:
// - geometry-details.spec.ts (5x: lines 27, 46, 66, 107, 131, 152, 226, 251)
// - geometry-list.spec.ts (4x: lines 40, 60, 92, 93, 118)
// - input-highlighting.spec.ts (6x: lines 90, 97, 124, 135, 158, 184, 195, 219)
```

**Why it's a problem:**
- `expect(value).toBeTruthy()` is a **synchronous** assertion on a primitive (string/number)
- It does NOT wait for Playwright to poll the DOM
- If the element hasn't loaded yet, `textContent()` returns empty string, and the test fails immediately
- This defeats the purpose of Playwright's auto-waiting mechanism

#### The Fix

Replace with proper Playwright locator-based expectations:

```typescript
// CORRECT (ASYNC WAIT)
// For text content checks:
await expect(firstItem).toHaveText(/.+/);
await expect(firstItem).not.toBeEmpty();

// For count checks:
await expect(items).toHaveCount(1, { timeout: 5000 });
await expect(items).toHaveCountGreaterThan(0);
```

**Why this works:**
- Playwright automatically **polls** the locator until the condition is met or timeout expires
- Properly leverages Playwright's built-in retry/wait mechanism
- Tests actually wait for the DOM to be in the expected state

#### Implementation

**Files to modify:**
1. `app2/e2e/geometry-details.spec.ts` - 8 occurrences
2. `app2/e2e/geometry-list.spec.ts` - 5 occurrences
3. `app2/e2e/input-highlighting.spec.ts` - 8 occurrences

**Pattern mapping:**
```typescript
// Pattern 1: itemText check
- BEFORE: const itemText = await firstItem.textContent(); await expect(itemText).toBeTruthy();
- AFTER: await expect(firstItem).toHaveText(/.+/);

// Pattern 2: count check  
- BEFORE: const count = await items.count(); await expect(count).toBeGreaterThan(0);
- AFTER: await expect(items).toHaveCountGreaterThan(0);

// Pattern 3: count >= N check
- BEFORE: const count = await items.count(); await expect(count).toBeGreaterThanOrEqual(2);
- AFTER: await expect(items).toHaveCount(2, { timeout: 5000 });
// OR: await expect(items).toHaveCountGreaterThanOrEqual(2);
```

---

## P1: High Priority Fixes (Code Quality)

### Issue 2: Duplicate `assertClipboardContains` Function

**Severity:** High - Code duplication  
**Files affected:** `app2/e2e/utils/assertions.ts`, `app2/e2e/utils/clipboard.ts`  

#### What's Wrong

The function `assertClipboardContains` exists in **both** files:
- `utils/assertions.ts` (line 69)
- `utils/clipboard.ts` (line 25)

Both exports are re-exported from `utils/index.ts`, creating ambiguity about which version is used.

**Why it's a problem:**
- Violates DRY (Don't Repeat Yourself) principle
- If one version is updated, the other becomes stale
- Confusing for developers - which one should they use?
- Increases bundle size unnecessarily

#### The Fix

Keep only in `clipboard.ts` (more semantically appropriate), remove from `assertions.ts`.

```typescript
// In utils/assertions.ts: DELETE lines 69-77
// export async function assertClipboardContains(page: Page, expected: string): Promise<void> {
//   ...
// }

// In utils/clipboard.ts: KEEP (already correct)
```

**Files to modify:**
1. `app2/e2e/utils/assertions.ts` - Remove `assertClipboardContains`

---

### Issue 3: `waitForLoadState('networkidle')` Without Timeout

**Severity:** High - Potential for hanging tests  
**Files affected:** `app2/e2e/initial-load.spec.ts` (line 52)  

#### What's Wrong

```typescript
// CURRENT (RISKY)
await page.waitForLoadState('networkidle');
```

**Why it's a problem:**
- `networkidle` waits for **no network connections for at least 500ms**
- If the page has pending requests that never complete, the test hangs **indefinitely**
- CI pipelines have timeout limits; hanging tests waste resources
- Local development becomes frustrating

#### The Fix

Always specify a timeout:

```typescript
// CORRECT (SAFE)
await page.waitForLoadState('networkidle', { timeout: 5000 });
```

**Why this works:**
- Test fails fast (within 5 seconds) if network doesn't idle
- Prevents indefinite hangs
- Matches the default test timeout configuration

**Files to modify:**
1. `app2/e2e/initial-load.spec.ts` - Line 52

---

### Issue 4: `test.skip()` Used Inside Test Body

**Severity:** High - Incorrect Playwright usage  
**Files affected:** `app2/e2e/accessibility.spec.ts` (3 occurrences)  

#### What's Wrong

```typescript
// CURRENT (INCORRECT)
test('Skip to main content link exists', async ({ page }) => {
  const skipLink = page.getByRole('link', { name: /skip|main content/i });
  test.skip('Skip to main content link not implemented in app yet'); // ❌ WRONG LOCATION
});
```

**Why it's a problem:**
- `test.skip()` **only works at test declaration time**, not inside test logic
- When called inside a test, it doesn't actually skip the test - it throws an error
- The test will appear as **failed**, not **skipped**
- Misleads developers about test status

#### The Fix

Move `test.skip()` to the test declaration level:

```typescript
// CORRECT
test.skip('Skip to main content link not implemented in app yet', async ({ page }) => {
  // Test logic here (never executed)
  const skipLink = page.getByRole('link', { name: /skip|main content/i });
  await expect(skipLink).toBeVisible();
});
```

**Files to modify:**
1. `app2/e2e/accessibility.spec.ts` - Lines 110, 143, 160

---

## P2: Medium Priority Fixes (Nice to Have)

### Issue 5: Brittle Text-Based Feedback Detection

**Severity:** Medium - Test coupled to UI strings  
**Files affected:** `app2/e2e/copy-url.spec.ts` (line 47)  

#### What's Wrong

```typescript
// CURRENT (BRITTLE)
await expect(page.getByText('Copied!')).toBeVisible();
```

**Why it's a problem:**
- Couples test to specific UI text that may change
- If app changes "Copied!" to "Copied to clipboard!" or uses localization, test breaks
- Text-based selectors are less reliable than test IDs

#### The Fix

Use `data-testid` (requires app change) or more stable selector:

```typescript
// OPTION A (RECOMMENDED - requires app change)
// App: <span data-testid="copy-feedback">Copied!</span>
// Test:
await expect(page.getByTestId('copy-feedback')).toBeVisible();

// OPTION B (if app change not possible)
await expect(page.getByRole('status')).toHaveText(/copied/i);
```

**Files to modify:**
1. `app2/e2e/copy-url.spec.ts` - Line 47

**Depends on:** App adding `data-testid` attributes (tracked separately)

---

## Summary Table

| # | Priority | Issue | Files | Effort | Status |
|---|----------|-------|-------|--------|--------|
| 1 | P0 | `expect(primitive)` doesn't wait | 3 spec files | 1-2 hrs | ⬜ |
| 2 | P1 | Duplicate `assertClipboardContains` | 1 utils file | 15 min | ⬜ |
| 3 | P1 | `networkidle` without timeout | 1 spec file | 5 min | ⬜ |
| 4 | P1 | `test.skip()` inside test body | 1 spec file | 15 min | ⬜ |
| 5 | P2 | Brittle text selector | 1 spec file | 15 min | ⬜ |
| **Total** | | **5 issues** | **5 files** | **~2-3 hrs** | |

---

## Implementation Plan

### Phase 1: P0 Fixes (1-2 hours)

1. **Fix `expect(primitive)` pattern** (2 hours)
   - Update `geometry-details.spec.ts`
   - Update `geometry-list.spec.ts`
   - Update `input-highlighting.spec.ts`
   - Run tests to verify: `pnpm test:e2e`

### Phase 2: P1 Fixes (30 minutes)

2. **Remove duplicate `assertClipboardContains`** (15 min)
   - Delete from `utils/assertions.ts`
   - Verify imports still work

3. **Add timeout to `networkidle`** (5 min)
   - Update `initial-load.spec.ts`

4. **Fix `test.skip()` location** (15 min)
   - Update `accessibility.spec.ts`

### Phase 3: P2 Fixes (15 minutes)

5. **Improve feedback text selector** (15 min)
   - Update `copy-url.spec.ts`
   - Consider adding app `data-testid` (separate task)

### Verification

After all fixes:
```bash
# Run all E2E tests
cd app2 && pnpm test:e2e

# Check for remaining issues
grep -rn "await expect.*toBeTruthy\|toBeGreaterThan" app2/e2e/*.spec.ts
grep -rn "test.skip" app2/e2e/*.spec.ts | grep -v "test.skip("
grep -rn "assertClipboardContains" app2/e2e/utils/
```

---

## Acceptance Criteria

- [ ] No `await expect(value).toBeTruthy()` on primitive values
- [ ] No `await expect(count).toBeGreaterThan(N)` on primitive values
- [ ] Only one definition of `assertClipboardContains` exists
- [ ] All `waitForLoadState` calls have explicit timeouts
- [ ] No `test.skip()` calls inside test bodies (all at declaration level)
- [ ] All tests pass in CI

---

## Related Documents

- [`EXTRA_PLAYWRIGHT_IMPROVEMENTS.md`](EXTRA_PLAYWRIGHT_IMPROVEMENTS.md) - Original improvement plan
- [`EXTRA_PLAYWRIGHT.md`](EXTRA_PLAYWRIGHT.md) - Original test plan
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)

---

## Changelog

| Date | Author | Changes |
|------|--------|---------|
| 2026-05-04 | Code Review | Initial fixes plan created |
