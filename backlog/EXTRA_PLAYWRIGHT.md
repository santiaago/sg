# Extra Playwright E2E Tests for app2

## Current Coverage

The existing `geometry-navigation.spec.ts` covers:

- Navigation between Square and SixFold v0 sections
- Step navigation (next, prev, first, last) for both components
- URL hash-based section navigation
- Step counter verification
- Button disabled states at boundaries

---

## Before Implementation

**This phase must be completed before writing any test code.** The following issues need resolution.

### App Code Clarifications

#### 1. Remove Restart Button

- **Decision:** Drop `restart.spec.ts` — use `<<` (Go to beginning) button for all reset-to-step-1 functionality
- **Action:** Remove all "Restart button" references from the plan
- **Impact:**
  - Delete `restart.spec.ts` from file structure
  - Merge restart-related test cases into `navigation.spec.ts` and `button-states.spec.ts` using `<<` button
  - Update `workflows.spec.ts` to use `<<` instead of restart

#### 2. Clarify First (<<) Button Behavior

- **Question:** Does `<<` (Go to beginning) clear geometry store and SVG content, or only reset the step?
- **Required:** Verify in app2 codebase
- **Test impact:**
  - If `<<` clears geometry/SVG → use it for all reset tests
  - If `<<` only resets step → need alternative mechanism for clearing state in tests (e.g., direct store reset via test helper)

#### 3. Verify Test Data Exists and is Stable

- **Action:** Confirm these exist in the running app:
  | Section | Step | Geometry | Purpose |
  |---------|------|----------|---------|
  | Square | 5 | `square-corner` | Selection test |
  | Square | 5 | `circle-0`, `circle-1` | Filtering test |
  | SixFold v0 | 1 | any | Baseline |
  | SixFold v0 | 45 | `polygon-0` | Dependencies test |
- **If unstable:** Replace with **semantic selectors** in helpers:
  ```typescript
  // Instead of hardcoded step 5:
  export async function goToStepWithCircles(page: Page) { ... }
  export async function goToStepWithDependencies(page: Page) { ... }
  ```

#### 4. Verify SVG Copy Format

- **Check:** What does the app copy to clipboard?
- **Expected format:** Full SVG element with:
  - `xmlns="http://www.w3.org/2000/svg"`
  - `viewBox="0 0 800 600"`
  - All `<g>` child elements
- **If different:** Update `copy.spec.ts` assertions to match actual output

#### 5. Verify Theme Storage Mechanism

- **Check:** Where is theme stored?
- **Expected:** `localStorage` with specific key name
- **Action:** Update `theme.spec.ts` to use the actual key

### Test Plan Fixes

#### 6. Fix SVG Validation to Use Browser Context

- **Problem:** `DOMParser.parseFromString()` is a browser API; Playwright tests run in Node.js
- **Fix:** All SVG validation must run inside `page.evaluate()`:
  ```typescript
  // In e2e/utils.ts
  export async function assertSVGValid(page: Page, svg: string): Promise<void> {
    await page.evaluate((svgString) => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(svgString, "image/svg+xml");
      if (doc.querySelector("parsererror")) {
        throw new Error("Invalid SVG: parse error");
      }
    }, svg);
  }
  ```

#### 7. Add Clipboard Permission Setup

- **Problem:** Clipboard API requires explicit permission grant
- **Fix:** Create `e2e/setup.ts`:

  ```typescript
  import { test } from "@playwright/test";

  test.beforeEach(async ({ context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  });
  ```

- **Note:** This file is auto-loaded by Playwright when placed in the `e2e/` directory

#### 8. Fix Performance Measurement to Use Browser Context

- **Problem:** `performance.now()` is a browser API
- **Fix:** Measure in browser context via helpers:
  ```typescript
  // In e2e/utils.ts
  export async function measureAction<T>(
    page: Page,
    action: () => Promise<T>,
  ): Promise<{ result: T; duration: number }> {
    const start = await page.evaluate(() => performance.now());
    const result = await action();
    const end = await page.evaluate(() => performance.now());
    return { result, duration: end - start };
  }
  ```

#### 9. Add Error Handling to Helpers

- **Problem:** Helper functions lack descriptive error messages
- **Fix:** Wrap assertions with try/catch:
  ```typescript
  export async function assertTheme(page: Page, expected: "dark" | "light"): Promise<void> {
    const hasDark = await page.evaluate(() => document.documentElement.classList.contains("dark"));
    const actual = hasDark ? "dark" : "light";
    if (actual !== expected) {
      throw new Error(`Expected theme to be ${expected}, but was ${actual}`);
    }
  }
  ```

### File Structure Updates

- **Delete:** `restart.spec.ts` (use `<<` button tests in other files)
- **Update:** `navigation.spec.ts` to include tests for `<<` and `>>` buttons
- **Update:** `button-states.spec.ts` to reference `<<` instead of restart
- **Update:** `workflows.spec.ts` to use `<<` instead of restart
- **Add:** `e2e/setup.ts` for global test setup (permissions)

### Priority Adjustments

- Move **Accessibility** from Medium → **High Priority** (production-critical)
- Add to **P0**: Console warning checks (not just errors)

### Before Implementation Checklist

- [ ] App uses `<<` button for reset-to-step-1 (no separate Restart button)
- [ ] `<<` button behavior confirmed and documented
- [ ] All test data geometries verified in running app
- [ ] SVG copy format verified and documented
- [ ] Theme storage mechanism confirmed
- [ ] `e2e/setup.ts` created with clipboard permissions
- [ ] All browser-API-dependent helpers use `page.evaluate()`
- [ ] Performance tests use browser-context timing
- [ ] Helper functions include descriptive error messages

---

## Test Infrastructure

### Shared Test Helpers

Create `e2e/utils.ts` with reusable helper functions:

```typescript
// Navigation
export async function goToSection(page: Page, section: "square" | "sixfold-v0");
export async function goToStep(page: Page, step: number);

// State
export async function resetApp(page: Page); // Restart + clear all
export async function selectGeometry(page: Page, name: string);

// Assertions
export async function assertTheme(page: Page, expected: "dark" | "light");
export async function assertClipboardContains(page: Page, expected: string);
export async function assertSVGValid(page: Page, svg: string);
export async function assertGeometrySelected(page: Page, name: string);
```

### Test Data

Use known, stable data points for reliable tests:

| Purpose                       | Section    | Step | Geometry               |
| ----------------------------- | ---------- | ---- | ---------------------- |
| Baseline (minimal geometries) | SixFold v0 | 1    | -                      |
| Geometry selection            | Square     | 5    | `square-corner`        |
| Circle filtering              | Square     | 5    | `circle-0`, `circle-1` |
| Multiple dependencies         | SixFold v0 | 45   | `polygon-0`            |

**Requirements:**

- Clipboard write permission required for copy tests
- SVG validation uses `DOMParser.parseFromString()`
- Theme detection via `document.documentElement.classList.contains('dark')`

### Performance Budgets

| Action             | Target (ms) | Test Method                      |
| ------------------ | ----------- | -------------------------------- |
| Section navigation | < 500       | `performance.now()` before/after |
| Step navigation    | < 200       | Same                             |
| SVG copy           | < 300       | Same                             |
| Geometry selection | < 100       | Same                             |
| Filter apply       | < 150       | Same                             |

### Handling Flakiness

- Use `test.describe.serial` for tests that must run sequentially
- Add `test.slow()` for tests > 500ms
- Retry strategy: `test.retry(2)` for clipboard tests
- Timeout: `test.setTimeout(60000)` for workflow tests
- Visual assertions: Use `expect(page).toHaveScreenshot()` sparingly (only for critical visual states)

---

## Missing Test Cases

### 1. Initial Page Load

**File:** `initial-load.spec.ts`
**Priority:** P0 (Prerequisite for all other tests)

```typescript
- [ ] Page loads without console errors
- [ ] Page loads without unhandled promise rejections
- [ ] Defaults to first section in navigation order
- [ ] First section starts at step 1
- [ ] Non-first sections are not visible initially
- [ ] Theme is dark by default
- [ ] Navigation bar is visible and interactive
- [ ] Both SVGs have correct dimensions (800x600)
- [ ] Geometry List shows all items for current section
- [ ] Geometry Details panel is empty initially
```

### 2. Theme Toggling

**File:** `theme.spec.ts`
**Priority:** High
**Setup:** None required

```typescript
// Toggle behavior
- [ ] Clicking theme toggle switches from dark to light
- [ ] Clicking theme toggle switches from light to dark
- [ ] Theme toggle button icon changes (moon <-> sun)

// Persistence
- [ ] Theme toggle persists across page navigation
- [ ] Theme toggle persists across page reload
- [ ] Theme stored in localStorage

// Visual feedback
- [ ] Theme toggle updates SVG background color
- [ ] Theme toggle updates body CSS class
- [ ] All UI elements adapt to theme change
```

### 3. Geometry List

**File:** `geometry-list.spec.ts`
**Priority:** High
**Setup:** Navigate to section with geometries (SixFold v0 step 1 or Square step 5)

```typescript
// Selection
- [ ] Clicking geometry item selects it (highlights red/yellow)
- [ ] Clicking selected item deselects it
- [ ] Clicking different item selects new, deselects previous
- [ ] Selected item count shown correctly in UI

// Filtering
- [ ] Name filter reduces list when typing
- [ ] Name filter is case-insensitive
- [ ] Name filter clears with "Clear filters" button
- [ ] Type filter buttons toggle correctly (point, line, circle, polygon)
- [ ] Multiple type filters can be active simultaneously
- [ ] Filtered count updates correctly (Showing X of Y items)
- [ ] Clear filters button resets all filters

// Edge cases
- [ ] Empty filter state shows all items
- [ ] Filter with no matches shows "No items" message
- [ ] Special characters in geometry names display correctly
```

### 4. Geometry Details Panel

**File:** `geometry-details.spec.ts`
**Priority:** High
**Setup:** Requires geometry to be selected (use test data from section 2)

```typescript
// Display
- [ ] Shows "Details" header
- [ ] Displays selected geometry name
- [ ] Displays selected geometry type
- [ ] Displays step ID that created the geometry
- [ ] Displays inputs list (dependsOn)
- [ ] Displays parameters with types
- [ ] Displays outputs list

// Edge cases
- [ ] Shows "No inputs" when geometry has no dependencies
- [ ] Shows "No parameters" when geometry has no parameters
- [ ] Shows "No outputs" when geometry has no outputs
- [ ] Panel is empty when no geometry selected
- [ ] Step ID is clickable and navigates to that step
```

### 5. Copy URL Functionality

**File:** `copy-url.spec.ts`
**Priority:** High
**Setup:** Requires clipboard write permission (handled in `e2e/setup.ts`)

```typescript
// Copy URL
- [ ] Copy URL button copies current URL with hash to clipboard
- [ ] Copied URL matches `window.location.href`
- [ ] Copy URL button shows "Copied!" feedback temporarily
- [ ] Copy URL works from Square section
- [ ] Copy URL works from SixFold v0 section
- [ ] Copied URL includes section hash
- [ ] Copied URL includes step hash if applicable
```

### 6. Copy SVG Functionality

**File:** `copy-svg.spec.ts`
**Priority:** High
**Setup:** Requires clipboard write permission + SVG validation helpers
**Note:** SVG validation runs in browser context via `page.evaluate()`

```typescript
// Copy SVG
- [ ] Copy SVG button copies SVG element to clipboard (SixFold v0)
- [ ] Copy SVG button copies SVG element to clipboard (Square)
- [ ] Copy SVG button shows "Copied!" feedback temporarily
- [ ] Copied SVG contains `xmlns="http://www.w3.org/2000/svg"`
- [ ] Copied SVG contains `viewBox="0 0 800 600"`
- [ ] Copied SVG passes validation without parse errors (via assertSVGValid)
- [ ] Copied SVG contains all `<g>` child elements from original
```

### 7. Input Highlighting

**File:** `input-highlighting.spec.ts`
**Priority:** Medium
**Setup:** Navigate to section with geometries that have dependencies

```typescript
// Toggle
- [ ] Inputs button toggles highlight mode on/off
- [ ] Inputs button stays blue when active
- [ ] Inputs button is gray when inactive

// Visual feedback
- [ ] Selecting geometry highlights its dependencies in orange
- [ ] Deselecting geometry clears orange highlights
- [ ] Orange highlight applies to all dependency types (point, line, circle, polygon)
- [ ] Toggle off clears all orange highlights
- [ ] Highlighted elements have correct CSS class/attribute
```

### 8. Slider Navigation

**File:** `slider.spec.ts`
**Priority:** Medium

```typescript
// Square
- [ ] Slider exists for Square section
- [ ] Slider min = 1, max = total steps for Square
- [ ] Slider value matches current step
- [ ] Dragging slider updates current step
- [ ] Slider thumb position matches step percentage
- [ ] Slider step labels show 1 and max
- [ ] Slider is keyboard accessible (arrow keys change value)

// SixFold v0
- [ ] Slider exists for SixFold v0 section
- [ ] Slider min = 1, max = total steps (93)
- [ ] Slider value matches current step
- [ ] Dragging slider updates current step
- [ ] Slider thumb position matches step percentage
```

### 9. Navigation & URL Hash

**File:** `navigation.spec.ts`
**Priority:** Medium
**Note:** Merges existing hash tests with new edge cases. Includes `<<` and `>>` button tests.

```typescript
// Direct navigation
- [ ] Loading `/#square` scrolls to Square section
- [ ] Loading `/#sixfold-v0` scrolls to SixFold v0 section
- [ ] Loading `/#square` activates Square nav button
- [ ] Loading `/#sixfold-v0` activates SixFold v0 nav button

// Manual hash change
- [ ] Manually setting `window.location.hash = "square"` navigates to Square
- [ ] Manually setting `window.location.hash = "sixfold-v0"` navigates to SixFold v0
- [ ] Invalid hash does not break navigation
- [ ] Hash with query parameters works correctly
- [ ] Navigating back/forward in browser preserves hash state
```

### 10. Button States

**File:** `button-states.spec.ts`
**Priority:** Medium
**Note:** Uses `<<` (Go to beginning) button instead of restart

```typescript
// At step 1
- [ ] Prev button is disabled for Square
- [ ] Prev button is disabled for SixFold v0
- [ ] First (<<) button is disabled for Square
- [ ] First (<<) button is disabled for SixFold v0
- [ ] Next button is enabled for Square
- [ ] Next button is enabled for SixFold v0
- [ ] Last (>>) button is enabled for Square
- [ ] Last (>>) button is enabled for SixFold v0

// At last step
- [ ] Next button is disabled for Square
- [ ] Next button is disabled for SixFold v0
- [ ] Last (>>) button is disabled for Square
- [ ] Last (>>) button is disabled for SixFold v0
- [ ] Prev button is enabled for Square
- [ ] Prev button is enabled for SixFold v0
- [ ] First (<<) button is enabled for Square
- [ ] First (<<) button is enabled for SixFold v0

// At middle step
- [ ] Prev button is enabled
- [ ] Next button is enabled
- [ ] First (<<) button is enabled
- [ ] Last (>>) button is enabled
- [ ] All navigation buttons have correct aria-labels
```

### 11. Accessibility

**File:** `accessibility.spec.ts`
**Priority:** High

```typescript
// General
- [ ] All buttons have aria-labels or aria-labeledby
- [ ] All interactive elements are keyboard focusable
- [ ] Focus indicators are visible on all interactive elements
- [ ] Color contrast meets WCAG AA in dark theme
- [ ] Color contrast meets WCAG AA in light theme

// Navigation
- [ ] Skip to main content link exists
- [ ] Section navigation announces active section
- [ ] Step navigation announces current step

// SVG
- [ ] SVG elements have aria labels or descriptions
- [ ] Geometry items announce selection state
```

### 12. Combined Workflows

**File:** `workflows.spec.ts`
**Priority:** Low
**Note:** Run after core tests pass; use `test.describe.serial` for sequence-dependent tests. Uses `<<` instead of restart.

```typescript
// Complete exploration flow
- [ ] Navigate to Square
- [ ] Step through all steps
- [ ] Navigate to SixFold v0
- [ ] Step through all steps
- [ ] Toggle theme at each section
- [ ] Copy SVG at step 1 and final step
- [ ] Copy URL at different sections

// Filter and select flow
- [ ] Navigate to Square
- [ ] Filter by type "circle"
- [ ] Select a circle geometry
- [ ] Verify details show circle info
- [ ] Toggle inputs highlight
- [ ] Verify dependencies highlighted in orange
- [ ] Clear filters
- [ ] Verify all items visible again

// Full reset flow
- [ ] Navigate to Square
- [ ] Go to step 10
- [ ] Select a geometry
- [ ] Click `<<` (Go to beginning) button
- [ ] Verify back at step 1
- [ ] Verify no geometry selected
- [ ] Repeat for SixFold v0
```

---

## Test File Structure

```
e2e/
├── setup.ts                       # Global test setup (NEW) - permissions, viewport
├── utils.ts                       # Shared helpers (NEW)
├── fixtures.ts                    # Test data constants (NEW)
├── geometry-navigation.spec.ts    # Existing - merge hash tests here
├── initial-load.spec.ts           # P0: Page load, defaults
├── theme.spec.ts                  # Theme toggling
├── copy-url.spec.ts               # Copy URL functionality (NEW - split from copy.spec.ts)
├── copy-svg.spec.ts               # Copy SVG functionality (NEW - split from copy.spec.ts)
├── geometry-list.spec.ts          # List filtering/selection
├── geometry-details.spec.ts       # Details panel
├── input-highlighting.spec.ts     # Inputs toggle
├── slider.spec.ts                 # Slider navigation
├── navigation.spec.ts             # All navigation incl. << and >> buttons (merged)
├── button-states.spec.ts          # Disabled/enabled states
├── accessibility.spec.ts          # Accessibility tests (NEW)
└── workflows.spec.ts              # End-to-end workflows
```

---

## Priority Order

1. **P0 - Prerequisite**
   - Initial page load (includes console error **and warning** checks)

2. **High Priority** (Core functionality)
   - Theme toggling
   - Copy actions (URL + SVG)
   - Geometry List filtering and selection
   - Geometry Details display
   - Accessibility

3. **Medium Priority** (Important interactions)
   - Input highlighting
   - Slider navigation
   - Button states
   - Navigation (including URL hash, `<<` and `>>` buttons)

4. **Low Priority** (Edge cases, combined flows)
   - End-to-end workflows

---

## Implementation Notes

- **Independence:** Each test should be independent. Use `test.beforeEach(resetApp)` to reset state.
- **Focus:** Keep tests focused on user-facing behavior. Avoid testing internal store state.
- **Patterns:** Use the existing helper functions from `geometry-navigation.spec.ts` as patterns.
- **Clipboard:** Mock clipboard API for copy tests using `page.setClipboardText()` expectations. Permissions are granted in `e2e/setup.ts`.
- **Cleanup:** Each test file should include `test.afterEach` to clean up any modified state.
- **Test Data:** Prefer known, stable geometry names and steps (see Test Data section above). Use semantic helpers where possible.
- **Performance:** Monitor test execution time against performance budgets. Use `measureAction()` helper for browser-context timing.
- **Browser APIs:** All DOM/Window APIs (`DOMParser`, `performance.now()`, `localStorage`) must be executed via `page.evaluate()`.
- **File splitting:** Copy functionality is split into `copy-url.spec.ts` and `copy-svg.spec.ts` due to different flakiness profiles and setup requirements.
