# Regression Tests for Infinite Render Loop Bug

This directory contains tests designed to prevent and detect the infinite render loop issue that was fixed in the Square component and related store hooks.

## Background

The original bug occurred when:

1. **Store hooks** (`useGeometryStoreSquare`, `useGeometryStore`, etc.) returned a **new object on every render**
2. **Callback props** (`updateStepsSquare`, `updateStepsv3`, `updateStepsv4`) in App.tsx were **recreated on every render**
3. **Square component** had `useEffect` dependencies that included these unstable values
4. This caused: Store changes → Square re-renders → useEffect runs → Store changes → ... infinite loop

## Fixed Issues

The following fixes were applied:

- **react-store.ts**: All store hooks now use `useMemo` to memoize their return objects
- **Square.tsx**: useEffect dependencies trimmed to only essential values; first useEffect uses `[]` dependency array
- **App.tsx**: Callbacks wrapped with `useCallback` to prevent recreation

## Test Files

### `render-loop.test.tsx`

General utilities for detecting render loops. Tests:

- Safe patterns (memoized callbacks, stable objects)
- Regression tests for common patterns that cause loops
- Demonstrates the fix for unstable object references

### `react-store.test.tsx`

Tests for store hook reference stability. Verifies:

- All store hooks return stable object references across renders
- Store methods (`add`, `update`, `clear`, etc.) remain stable
- Store references DO change when internal state (items/geometries) changes
- Methods remain stable even when store state changes

### `Square.test.tsx`

Tests for the Square component specifically. Verifies:

- Component renders without crashing
- `updateSteps` callback is called exactly once (on mount)
- Component works with real hooks from react-store
- Component works with memoized callbacks from parent

### `app-patterns.test.tsx`

Regression tests for patterns used in App.tsx. Verifies:

- Memoized callbacks (`updateStepsSquare`, `updateStepsv3`, `updateStepsv4`) remain stable
- Callbacks don't cause infinite re-renders when passed to Square
- Edge cases with `useCallback` dependency arrays

## Running Tests

```bash
# Run all tests
pnpm test

# Run with watch mode
pnpm test:watch

# Run with coverage
pnpm test:coverage
```

## Key Test Principles

1. **Detect Reference Changes**: Tests verify that objects/callbacks remain the same reference across renders
2. **Avoid Actual Loops**: Tests demonstrate patterns without causing real infinite loops that hang the test suite
3. **Regression Prevention**: Tests document both the broken patterns (commented) and the fixed patterns

## Adding New Tests

When adding new components or hooks that use useEffect with dependencies:

1. Add tests to verify stable references
2. Add tests that would catch infinite loops
3. Document the expected behavior

## Related Files

- `app2/src/react-store.ts` - Store hooks with useMemo
- `app2/src/components/Square.tsx` - Square component with fixed useEffect dependencies
- `app2/src/App.tsx` - Parent component with memoized callbacks
