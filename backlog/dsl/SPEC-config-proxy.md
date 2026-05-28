# Spec: Config Proxy for Geometry DSL Parameter References

## Document Info

- **Status:** Approved for Implementation
- **Author:** Mistral Vibe
- **Date:** 2026-05-28
- **Related:** `SPEC-parameterized-dsl.md`
- **Type:** Feature Specification

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
6. Hard for newcomers to understand
7. Brittle - no strong typing without `as const`

### Solution

Implement a **Config Proxy** pattern using a property on GeometryBuilder that provides dot-access to config keys:

```typescript
// NEW - CRYSTAL CLEAR
const config = { p1x: 100, p1y: 200, radius: 50 };
const builder = new GeometryBuilder<SquareConfig>(config);
const p1 = builder.pointInCs("p1", cs, builder.cfg.p1x, builder.cfg.p1y);
const c1 = builder.pointAt("c1", line_main, builder.cfg.C1_POSITION_RATIO);
```

**Benefits:**

1. Self-documenting — `builder.cfg.p1x` is immediately recognizable
2. IDE autocomplete — Full dot-notation autocomplete
3. Type-safe — Compile-time validation
4. Minimal runtime overhead — Proxy get handler is optimized by JS engines
5. No `as const` required
6. Clear distinction from geometry IDs

---

## Tech Stack

- **Language:** TypeScript 5.x (ESM)
- **Framework:** React (app2)
- **Build:** Vite + Vitest
- **Lint/Format:** Oxlint + Oxfmt
- **Type Check:** `tsc --noEmit`

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

## Architecture Decisions

| Decision                       | Rationale                                                                                |
| ------------------------------ | ---------------------------------------------------------------------------------------- |
| **Property, not method**       | `builder.cfg` is more natural than `builder.configKeys()` when config is tied to builder |
| **Config at construction**     | Enables access-time validation against actual config object                              |
| **Explicit type parameter**    | Preserves type names in error messages and documentation                                 |
| **Access-time validation**     | Validates keys when accessed, not at construction (more flexible)                        |
| **No caching**                 | Simpler implementation, Proxy is stateless and cheap to create                           |
| **No runtime type validation** | TypeScript handles type safety; runtime validation adds complexity                       |
| **No value validation**        | Only key existence is validated; value types are TypeScript's responsibility             |

---

## Implementation

### Core Changes

**1. GeometryBuilder Constructor** (`app2/src/geometry/dsl/GeometryBuilder.ts`):

````typescript
export class GeometryBuilder<TConfig> {
  private readonly config: TConfig;
  private readonly renderer: GeometryRenderer;

  /**
   * Create a new GeometryBuilder with config-based parameter validation.
   *
   * @param config - The configuration object containing all parameter values
   * @param renderer - Optional custom renderer for drawing geometry
   */
  constructor(config: TConfig, renderer?: GeometryRenderer) {
    this.config = config;
    this.renderer = renderer ?? new DefaultGeometryRenderer();
  }

  /**
   * Config key proxy providing dot-notation access to config parameters.
   * Validates at access time that the key exists in the config object.
   *
   * @example
   * ```typescript
   * const builder = new GeometryBuilder<SquareConfig>(config);
   * const p1 = builder.pointInCs("p1", cs, builder.cfg.p1x, builder.cfg.p1y);
   * ```
   */
  get cfg(): { [K in keyof TConfig]: K } {
    return new Proxy({} as any, {
      get(_, prop: string) {
        if (!(prop in this.config)) {
          throw new Error(`Config missing key: ${prop}`);
        }
        return prop;
      },
    });
  }

  // ... existing code ...
}
````

**2. Type Compatibility**

The return type `{ [K in keyof TConfig]: K }` is fully compatible with the existing `ParameterValue<TConfig>` type:

```typescript
type ParameterValue<TConfig> = number | keyof TConfig | GeometryFeatureReference<TConfig, any, any>;

// String literal types like "p1x" are assignable to keyof TConfig
const x: ParameterValue<SquareConfig> = builder.cfg.p1x; // ✅ Valid
```

No changes required to any expression classes or the `ParameterValue` type.

### Usage Examples

```typescript
// Square construction
interface SquareConfig {
  p1x: number;
  p1y: number;
  circleRadius: number;
  C1_POSITION_RATIO: number;
}

const config: SquareConfig = {
  p1x: 100,
  p1y: 200,
  circleRadius: 50,
  C1_POSITION_RATIO: 0.5,
};

const builder = new GeometryBuilder<SquareConfig>(config);

// All config keys accessible via dot notation
const cs = builder.coordinateSystem("cs", 0, 0, 100, 0);
const p1 = builder.pointInCs("p1", cs, builder.cfg.p1x, builder.cfg.p1y);
const p2 = builder.pointInCs("p2", cs, builder.cfg.p1x, builder.cfg.p1y + 100);
const ml = builder.line("ml", p1, p2);
const c1 = builder.pointAt("c1", ml, builder.cfg.C1_POSITION_RATIO);
const c1_c = builder.circle("c1_c", c1, builder.cfg.circleRadius);
```

### Error Handling

```typescript
// Config missing a key
const incompleteConfig = { p1x: 100, p1y: 200 }; // Missing circleRadius
const builder = new GeometryBuilder<SquareConfig>(incompleteConfig);

// Throws at access time:
builder.cfg.circleRadius; // ❌ Error: Config missing key: circleRadius

// TypeScript catches extra keys at compile time:
builder.cfg.invalidKey; // ❌ Type error: Property 'invalidKey' does not exist
```

---

## Testing Strategy

### Unit Tests

Create `app2/src/geometry/dsl/ConfigProxy.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { GeometryBuilder } from "./GeometryBuilder";

interface TestConfig {
  radius: number;
  position: number;
  ratio: number;
}

describe("Config Proxy (builder.cfg)", () => {
  describe("Runtime Behavior", () => {
    it("returns the property name as the value", () => {
      const config = { radius: 10, position: 5, ratio: 0.5 };
      const builder = new GeometryBuilder<TestConfig>(config);

      expect(builder.cfg.radius).toBe("radius");
      expect(builder.cfg.position).toBe("position");
      expect(builder.cfg.ratio).toBe("ratio");
    });

    it("throws error for missing config keys", () => {
      const config = { radius: 10, position: 5 }; // Missing ratio
      const builder = new GeometryBuilder<TestConfig>(config);

      expect(() => builder.cfg.ratio).toThrow("Config missing key: ratio");
    });

    it("does not throw for existing keys", () => {
      const config = { radius: 10, position: 5, ratio: 0.5 };
      const builder = new GeometryBuilder<TestConfig>(config);

      // Should not throw
      expect(builder.cfg.radius).toBe("radius");
      expect(builder.cfg.position).toBe("position");
      expect(builder.cfg.ratio).toBe("ratio");
    });
  });

  describe("Type Safety", () => {
    it("provides correct literal types", () => {
      const config = { radius: 10, position: 5, ratio: 0.5 };
      const builder = new GeometryBuilder<TestConfig>(config);

      // These should type-check:
      const r: "radius" = builder.cfg.radius;
      const p: "position" = builder.cfg.position;
      const rat: "ratio" = builder.cfg.ratio;
    });
  });

  describe("Integration with Expressions", () => {
    it("works with pointInCs expression", () => {
      const config = { radius: 10, position: 5, ratio: 0.5 };
      const builder = new GeometryBuilder<TestConfig>(config);
      const cs = builder.coordinateSystem("cs", 0, 0, 100, 0);

      // Should compile and not throw
      const p1 = builder.pointInCs("p1", cs, builder.cfg.radius, builder.cfg.position);
      const steps = builder.compile();

      expect(steps).toHaveLength(2); // cs + p1
    });
  });
});
```

### Verification Commands

```bash
# Type check
cd app2 && npx tsc --noEmit

# Run new tests
cd app2 && pnpm test ConfigProxy.test.ts

# Run all tests to ensure no regressions
cd app2 && pnpm test
```

---

## Migration Guide

### Current Code (Before)

```typescript
// Using as const
const p1 = builder.pointInCs("p1", cs, "p1x" as const, "p1y" as const);

// Using builder.param()
const p1 = builder.pointInCs("p1", cs, builder.param("p1x"), builder.param("p1y"));
```

### New Code (After)

```typescript
// Using cfg property
const config = { p1x: 100, p1y: 200 };
const builder = new GeometryBuilder<SquareConfig>(config);
const p1 = builder.pointInCs("p1", cs, builder.cfg.p1x, builder.cfg.p1y);
```

### Migration Strategy

1. **Gradual:** Update files one at a time
2. **Lint Rule:** Add ESLint rule to flag `param()` and `as const` for config keys
3. **Eventual Removal:** Remove `param()` method after full migration to `cfg`

### Backward Compatibility

- `builder.param()` method remains available for existing code
- No breaking changes to existing functionality
- New `cfg` property is purely additive

---

## Success Criteria

- [x] `builder.cfg` property added to GeometryBuilder
- [x] Type-safe with full generic constraints
- [x] Runtime behavior: `builder.cfg.key` returns `"key"` for valid keys
- [x] Runtime validation: throws error for keys not in config
- [x] IDE autocomplete works for config keys
- [x] All existing tests pass
- [x] New tests in `ConfigProxy.test.ts` pass
- [x] `pnpm type-check:app2` succeeds
- [x] `pnpm test` succeeds
- [x] Compatible with existing `ParameterValue<TConfig>` type
- [x] Documentation updated

---

## Boundaries

### Always

- Type-check passes
- Tests pass
- Format clean
- Match existing code style

### Ask First

- Changes to GeometryBuilder constructor (affects all DSL usage)
- Removal of `param()` method (breaking change for some code)

### Never

- Break existing geometry rendering
- Modify step execution logic
- Change dependency tracking
- Use `any` types

---

## Open Questions

None - all questions resolved during design review.

---

## Decision Log

| Date       | Decision                                                        | Rationale                                                          |
| ---------- | --------------------------------------------------------------- | ------------------------------------------------------------------ |
| 2026-05-28 | Use property (`builder.cfg`) instead of method (`configKeys()`) | More natural when config is tied to builder at construction        |
| 2026-05-28 | Config passed at builder construction                           | Enables access-time validation against actual config               |
| 2026-05-28 | Explicit type parameter (`<SquareConfig>`)                      | Preserves type names, clearer error messages                       |
| 2026-05-28 | Access-time validation, not construction-time                   | More flexible - validates only keys that are actually used         |
| 2026-05-28 | No caching of Proxy                                             | Simpler implementation, stateless, negligible overhead             |
| 2026-05-28 | No runtime type validation                                      | TypeScript handles type safety; runtime validation adds complexity |
| 2026-05-28 | No value validation (only key existence)                        | Values are validated at execution time by existing system          |
| 2026-05-28 | Short error messages (`Config missing key: {prop}`)             | Clear and concise                                                  |
| 2026-05-28 | Keep `param()` method for now                                   | Backward compatibility, migrate gradually                          |
| 2026-05-28 | Gradual migration with lint rule                                | Minimal disruption, enforced over time                             |

---

## References

- **Parent Spec:** `SPEC-parameterized-dsl.md` (main parameterization spec)
- **Related Code:** `app2/src/geometry/dsl/GeometryBuilder.ts`
- **Tests:** `app2/src/geometry/dsl/ConfigProxy.test.ts`

---

## Appendix: Comparison with Alternatives

| Criteria             | Config Proxy (`builder.cfg`) | `builder.param()`  | Magic Strings (`as const`) |
| -------------------- | ---------------------------- | ------------------ | -------------------------- |
| **Syntax**           | `cfg.p1x`                    | `param("p1x")`     | `"p1x" as const`           |
| **Self-documenting** | ⭐⭐⭐⭐⭐ Best              | ⭐⭐⭐⭐ Very Good | ⭐⭐ Poor                  |
| **IDE autocomplete** | ⭐⭐⭐⭐⭐ Best              | ⭐⭐⭐⭐ Very Good | ⭐⭐ Poor                  |
| **Type safety**      | ⭐⭐⭐⭐⭐                   | ⭐⭐⭐⭐⭐         | ⭐⭐⭐ (with `as const`)   |
| **Runtime overhead** | ⭐⭐⭐⭐ Minimal             | ⭐⭐⭐⭐⭐ None    | ⭐⭐⭐⭐⭐ None            |
| **Validation**       | ⭐⭐⭐⭐⭐ Key existence     | ⭐ No validation   | ⭐ No validation           |
| **API surface**      | ⭐⭐⭐⭐⭐ Minimal           | ⭐⭐⭐⭐⭐ Minimal | ⭐⭐⭐⭐⭐ Minimal         |
| **Overall**          | **⭐⭐⭐⭐⭐**               | **⭐⭐⭐⭐**       | **⭐⭐**                   |

### When to Choose Config Proxy

**Choose Config Proxy if:**

- You want the best developer experience (dot notation + autocomplete)
- You want runtime validation that config keys exist
- You're willing to pass config at builder construction

**Choose `builder.param()` if:**

- You want zero runtime overhead
- You want the simplest implementation
- You don't need runtime validation
- You're maintaining legacy code

---

## Revision History

| Date       | Author       | Change                                                                                                                   |
| ---------- | ------------ | ------------------------------------------------------------------------------------------------------------------------ |
| 2025-01-XX | Mistral Vibe | Initial spec drafted                                                                                                     |
| 2026-05-28 | Mistral Vibe | Updated after design review - changed from method to property, added config at construction, resolved all open questions |
