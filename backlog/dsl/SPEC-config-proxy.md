# Spec: Config Proxy for Geometry DSL Parameter References

## Document Info

- **Status:** Draft for Review
- **Author:** Mistral Vibe
- **Date:** 2025-01-XX
- **Related Spec:** `SPEC-parameterized-dsl.md` (Proposal D)
- **Type:** Feature Proposal - Alternative Syntax

---

## Objective

### Problem Statement

The current parameter reference syntax using `as const` is not self-documenting:

```typescript
// CURRENT - NOT OBVIOUS
const p1 = builder.pointInCs("p1", cs, "p1x" as const, "p1y" as const);
const c1 = builder.pointAt("c1", line_main, "C1_POSITION_RATIO" as const);
```

**Issues:**

1. `"p1x"` and `"p1y"` look like magic strings
2. Not obvious these are config parameter keys from `SquareConfig`
3. `as const` adds visual noise
4. No IDE autocomplete for config keys
5. Hard to distinguish parameter references from geometry IDs

### Solution

Implement a **Config Proxy** pattern using a Proxy object that provides dot-access to config keys:

```typescript
// PROPOSED - CRYSTAL CLEAR
const cfg = builder.configKeys<SquareConfig>();
const p1 = builder.pointInCs("p1", cs, cfg.p1x, cfg.p1y);
const c1 = builder.pointAt("c1", line_main, cfg.C1_POSITION_RATIO);
```

**Benefits:**

1. Self-documenting — `cfg.p1x` is immediately recognizable
2. IDE autocomplete — Full dot-notation autocomplete
3. Type-safe — Compile-time validation
4. Minimal runtime overhead — Proxy get handler is optimized by JS engines
5. No `as const` required
6. Visually distinct from geometry IDs

---

## Tech Stack

- **Language:** TypeScript 5.0+
- **Target:** app2 React application
- **Build:** Vite + Vitest
- **Type Check:** `tsc --noEmit` with `strict: true`

---

## Commands

```bash
# Type check the changes
cd app2 && npx tsc --noEmit

# Run tests to verify no regressions
cd app2 && pnpm test

# Lint and format
pnpm check
```

---

## Project Structure

```
app2/
├── src/
│   └── geometry/
│       └── dsl/
│           └── GeometryBuilder.ts      # Add configKeys() method here
└── test/
    └── config-proxy.test.ts          # New test file for this feature
```

---

## Implementation

### The Core Idea

Use a Proxy object that intercepts property access and returns the property name itself:

```typescript
configKeys<T extends object>(): { [K in keyof T]: K } {
  return new Proxy({} as { [K in keyof T]: K }, {
    get(_, prop: string & keyof T) {
      return prop;  // Returns the property name as the value
    }
  });
}
```

### Complete Implementation in GeometryBuilder.ts

````typescript
/**
 * Create a type-safe config key reference object.
 *
 * This creates a Proxy where each property access returns the property name,
 * enabling dot-notation access to config keys with full type safety and IDE autocomplete.
 *
 * @example
 * ```typescript
 * const cfg = builder.configKeys<SquareConfig>();
 * const p1 = builder.pointInCs("p1", cs, cfg.p1x, cfg.p1y);
 * // cfg.p1x evaluates to "p1x" at runtime
 * // TypeScript knows cfg.p1x has type "p1x"
 * ```
 */
configKeys<T extends object>(): { [K in keyof T]: K } {
  return new Proxy({} as { [K in keyof T]: K }, {
    get(_, prop: string & keyof T) {
      return prop;
    }
  });
}
````

### How It Works

1. **Type Level:** `configKeys<SquareConfig>()` returns type `{ p1x: "p1x", p1y: "p1y", ... }`
2. **Runtime Level:** The Proxy intercepts `cfg.p1x` and returns `"p1x"`
3. **Expression Level:** Expressions receive the string `"p1x"` which they already know how to handle

### Usage Example

```typescript
// squareDslSteps.ts
import { GOLDEN_RATIO } from "./operations";

export function buildSquareDslSteps(_width: number, height: number): Step<SquareConfig>[] {
  const builder = new GeometryBuilder<SquareConfig>();

  // Create config key reference
  const cfg = builder.configKeys<SquareConfig>();

  const cs = builder.coordinateSystem("cs", 0, 0, height * 0.1, 0);

  // Dot notation with full autocomplete!
  const p1 = builder.pointInCs("p1", cs, cfg.p1x, cfg.p1y);
  const p2 = builder.pointInCs("p2", cs, cfg.p2x, cfg.p2y);
  const c1 = builder.pointAt("c1", line_main, cfg.C1_POSITION_RATIO);
  const c1_c = builder.circle("c1_c", c1, cfg.circleRadius);
  const line_c2_pi = builder.lineTowards("line_c2_pi", c2, pi, cfg.LINE_EXTENSION_LENGTH);

  return builder.compile();
}
```

---

## Testing Strategy

### Unit Tests

Create `app2/test/config-proxy.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { GeometryBuilder } from "@/geometry/dsl/GeometryBuilder";
import type { Step } from "@/types/geometry";

interface TestConfig {
  radius: number;
  position: number;
  ratio: number;
}

describe("Config Proxy (configKeys)", () => {
  describe("Runtime Behavior", () => {
    it("returns the property name as the value", () => {
      const builder = new GeometryBuilder<TestConfig>();
      const cfg = builder.configKeys<TestConfig>();

      expect(cfg.radius).toBe("radius");
      expect(cfg.position).toBe("position");
      expect(cfg.ratio).toBe("ratio");
    });
  });

  describe("Type Safety", () => {
    it("provides correct literal types", () => {
      const builder = new GeometryBuilder<TestConfig>();
      const cfg = builder.configKeys<TestConfig>();

      // These should type-check:
      const r: "radius" = cfg.radius;
      const p: "position" = cfg.position;
    });
  });

  describe("Integration with Expressions", () => {
    it("works with circle expression", () => {
      const builder = new GeometryBuilder<TestConfig>();
      const cfg = builder.configKeys<TestConfig>();
      const center = builder.point("center", 0, 0);

      const circle = builder.circle("c1", center, cfg.radius);
      const steps = builder.compile();

      expect(steps).toHaveLength(2);
    });
  });
});
```

### Verification Commands

```bash
# Type check
cd app2 && npx tsc --noEmit

# Run new tests
cd app2 && pnpm test config-proxy.test.ts

# Run all tests to ensure no regressions
cd app2 && pnpm test
```

---

## Migration Guide

### Current Code (Before)

```typescript
// Requires as const, not self-documenting
const p1 = builder.pointInCs("p1", cs, "p1x" as const, "p1y" as const);
```

### New Code (After)

```typescript
// Self-documenting with autocomplete
const cfg = builder.configKeys<SquareConfig>();
const p1 = builder.pointInCs("p1", cs, cfg.p1x, cfg.p1y);
```

### Backward Compatibility

**100% backward compatible.** Existing code continues to work unchanged.

---

## Files to Modify

| File                                       | Change                    | Lines         |
| ------------------------------------------ | ------------------------- | ------------- |
| `app2/src/geometry/dsl/GeometryBuilder.ts` | Add `configKeys()` method | +15           |
| `app2/src/geometry/squareDslSteps.ts`      | Use `configKeys()`        | ~0 (refactor) |
| `app2/test/config-proxy.test.ts`           | New test file             | +60           |
| **Total**                                  |                           | **+75**       |

---

## Comparison with Other Proposals

| Criteria                  | Config Proxy (This)      | `builder.param()`      | `*FromConfig` Methods             |
| ------------------------- | ------------------------ | ---------------------- | --------------------------------- |
| **Syntax**                | `cfg.p1x`                | `builder.param("p1x")` | `pointInCsFromConfig(..., "p1x")` |
| **Self-documenting**      | ⭐⭐⭐⭐⭐ Best          | ⭐⭐⭐⭐ Very Good     | ⭐⭐⭐⭐ Good                     |
| **IDE autocomplete**      | ⭐⭐⭐⭐⭐ Best          | ⭐⭐⭐⭐ Very Good     | ⭐⭐⭐⭐ Good                     |
| **Type safety**           | ⭐⭐⭐⭐⭐               | ⭐⭐⭐⭐⭐             | ⭐⭐⭐⭐⭐                        |
| **Runtime overhead**      | ⭐⭐⭐⭐ Minimal (Proxy) | ⭐⭐⭐⭐⭐ None        | ⭐⭐⭐⭐⭐ None                   |
| **Backward compatible**   | ⭐⭐⭐⭐⭐               | ⭐⭐⭐⭐⭐             | ⭐⭐⭐⭐⭐                        |
| **API surface**           | ⭐⭐⭐⭐⭐ Minimal       | ⭐⭐⭐⭐⭐ Minimal     | ⭐⭐ Poor                         |
| **Implementation effort** | ⭐⭐⭐⭐ Easy            | ⭐⭐⭐⭐⭐ Trivial     | ⭐⭐ Hard                         |
| **Overall**               | **⭐⭐⭐⭐⭐**           | **⭐⭐⭐⭐⭐**         | **⭐⭐⭐**                        |

### When to Choose Config Proxy

**Choose Config Proxy if:**

- You want the best developer experience (dot notation + autocomplete)
- Minimal Proxy overhead is acceptable
- You want the most readable code

**Choose `builder.param()` if:**

- You want zero runtime overhead
- You want the simplest implementation
- You prefer explicit method calls

---

## Success Criteria

- [ ] `configKeys()` method added to `GeometryBuilder`
- [ ] Type-safe with full generic constraints
- [ ] Runtime behavior: `cfg.key` returns `"key"` for any key
- [ ] IDE autocomplete works for config keys
- [ ] All existing tests pass (327 tests)
- [ ] New tests in `config-proxy.test.ts` pass
- [ ] `pnpm type-check:app2` succeeds
- [ ] `pnpm test` succeeds

---

## Open Questions

1. **Naming:** Should the method be `configKeys()`, `configRef()`, or `cfg()`?
   - `configKeys()` — Emphasizes it returns key names
   - `configRef()` — Emphasizes it's a reference
   - `cfg()` — Shortest, but less descriptive

---

## Decision Log

| Date | Decision | Rationale       |
| ---- | -------- | --------------- |
| TBD  | TBD      | Awaiting review |

---

## References

- **Parent Spec:** `SPEC-parameterized-dsl.md` (main parameterization spec)
- **Related Code:** `app2/src/geometry/dsl/GeometryBuilder.ts`
- **Tests:** `app2/test/GeometryBuilder.test.ts`

---

## Appendix: Type Deep Dive

### The Type Transformation

```typescript
// Given:
interface SquareConfig {
  p1x: number;
  p1y: number;
  circleRadius: number;
}

// configKeys<SquareConfig>() returns type:
{
  [K in keyof SquareConfig]: K;
}
// Which expands to:
{
  p1x: "p1x";
  p1y: "p1y";
  circleRadius: "circleRadius";
}

// So cfg.p1x has type "p1x" which satisfies keyof SquareConfig
```

### The Proxy Mechanism

```typescript
const cfg = new Proxy(
  {} as { p1x: "p1x"; p1y: "p1y" }, // Type assertion
  {
    get(target, prop: string) {
      return prop; // Return the property name
    },
  },
);

// cfg.p1x at runtime:
// 1. Proxy.get called with prop = "p1x"
// 2. Returns "p1x"
// 3. Expression receives "p1x"
// cfg.p1x at compile time:
// 1. TypeScript sees type "p1x"
// 2. Validates against keyof SquareConfig
```

---

## Revision History

| Date       | Author       | Change               |
| ---------- | ------------ | -------------------- |
| 2025-01-XX | Mistral Vibe | Initial spec drafted |
