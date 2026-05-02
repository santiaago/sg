# Phase 2: Integration Layer

## Overview

This phase creates the integration layer that bridges the new Construction DSL to the existing step-based infrastructure. This enables compatibility between the new declarative API and the existing codebase.

**Status**: NOT STARTED  
**Priority**: HIGH  
**Estimated Duration**: 1-2 days  
**Prerequisites**: Phase 1 (Core Construction DSL) must be complete

---

## Objectives

By the end of this phase, we will have:

1. ✅ Step adapter that converts Construction output to Step[] format
2. ✅ Updated geometry/index.ts exports
3. ✅ Verified no circular dependencies
4. ✅ Tested conversion with square construction

---

## Architecture Decisions

### 1. Adapter Pattern

**Decision**: Create a separate adapter module (`construction-to-steps.ts`) rather than putting the conversion logic in the Construction class.

**Rationale**:

- Separation of concerns: Construction doesn't need to know about Step format
- Easier to test independently
- Can be extended or replaced without changing Construction
- Optional dependency - users of Construction don't need to import Step types

### 2. Eager Evaluation in Adapter

**Decision**: The adapter's `compute` function returns pre-computed values from Construction (eager evaluation).

**Rationale**:

- Construction already uses eager evaluation (values are computed when methods are called)
- The `InternalStep.compute()` function returns the already-computed value
- This is intentional: Construction is a builder, not a lazy DAG
- Both systems use the same app2 GeometryValue types - no conversion needed

---

## Files to Create

### 1. `app2/src/geometry/construction-to-steps.ts` (NEW)

This file contains the adapter that converts Construction output to Step[] format.

```typescript
/**
 * construction-to-steps.ts
 *
 * Adapter that converts Construction output to Step[] format.
 * Bridges the new Construction DSL to the existing step-based infrastructure.
 */

import type { Step, GeometryValue } from "../types/geometry";
import { Construction } from "./construction";

/**
 * Convert a Construction to an array of Step objects.
 *
 * This enables the new Construction DSL to work with existing infrastructure
 * that expects Step[] format (e.g., Square component, GeometryList, etc.).
 *
 * @param construction - The Construction to convert
 * @returns Array of Step objects compatible with existing step system
 */
export function constructionToSteps(construction: Construction): Step[] {
  return construction.getAllSteps().map((internalStep, index) => {
    const stepId = `step_${internalStep.id}`;

    return {
      id: stepId,
      inputs: internalStep.dependencies,
      outputs: [internalStep.id],
      parameters: [], // Construction doesn't have parameterized steps yet

      compute: (inputs: Map<string, GeometryValue>, config: any) => {
        // NOTE: Construction uses EAGER evaluation
        // Values are pre-computed and stored in Construction._values Map
        // internalStep.compute() returns the already-computed value
        // The `inputs` parameter is NOT used (values don't depend on step inputs)
        // This is intentional: Construction is a builder, not a lazy DAG

        const value = internalStep.compute();
        return new Map([[internalStep.id, value]]);
      },

      draw: (svg: SVGSVGElement, values: Map<string, GeometryValue>, store: any, theme: any) => {
        // Drawing is handled by SvgRenderer, not here
        // This is a placeholder to satisfy the Step interface
        // In practice, SvgRenderer.drawConstruction() or similar should be used
      },
    };
  });
}
```

### 2. Update `app2/src/geometry/index.ts`

Add exports for the new Construction module and adapter.

```typescript
// app2/src/geometry/index.ts

// Existing exports
export * from "./operations";
export * from "./squareSteps";
export * from "./constructors";

// New exports for Construction DSL
export * from "./construction";
export * from "./construction-to-steps";
```

---

## Implementation Checklist

### Step 1: Create the Adapter File

- [ ] Create `app2/src/geometry/construction-to-steps.ts`
- [ ] Add header comment with file purpose
- [ ] Import required types
- [ ] Implement `constructionToSteps()` function
- [ ] Export the function

### Step 2: Update Index Exports

- [ ] Update `app2/src/geometry/index.ts`
- [ ] Add exports for construction module
- [ ] Add exports for construction-to-steps adapter

### Step 3: Verify No Circular Dependencies

- [ ] Check import chain for cycles
- [ ] Verify Construction can import from both app2/types and @sg/geometry safely
- [ ] Verify construction-to-steps can import Construction without issues

**Import Chain Analysis**:

```
construction-to-steps.ts
    ↓ imports
construction.ts
    ├──→ ../types/geometry.ts (EXISTING)
    │       └──→ ../react-store.ts
    │       └──→ ../themes.ts
    │       └──→ ../geometry/operations.ts
    │               └──→ @sg/geometry (coordinate-based utilities)
    │
    └──→ @sg/geometry (coordinate-based utility functions)
            └──→ NOTHING from app2 ✅

NO CIRCULAR DEPENDENCY - All imports flow in one direction.
```

### Step 4: Create Adapter Tests

- [ ] Create `app2/src/geometry/construction-to-steps.test.ts`
- [ ] Test conversion of Construction to Step[]
- [ ] Test that Step IDs are correctly formatted
- [ ] Test that inputs and outputs are correctly mapped
- [ ] Test that compute function returns correct values
- [ ] Test with square construction example

```typescript
// app2/src/geometry/construction-to-steps.test.ts

import { describe, it, expect } from "vitest";
import { Construction } from "./construction";
import { constructionToSteps } from "./construction-to-steps";

describe("constructionToSteps", () => {
  it("should convert Construction to Step array", () => {
    const c = new Construction();
    c.point(0, 0, "p1");
    c.point(10, 10, "p2");
    c.line("p1", "p2", "line1"); // Note: This won't work with current API, need to adjust

    const steps = constructionToSteps(c);
    expect(steps).toHaveLength(3);
    expect(steps[0].id).toBe("step_p1");
    expect(steps[1].id).toBe("step_p2");
    expect(steps[2].id).toBe("step_line1");
  });

  it("should map inputs and outputs correctly", () => {
    const c = new Construction();
    const p1 = c.point(0, 0, "p1");
    const p2 = c.point(10, 10, "p2");
    const l = c.line(p1, p2, "line1");

    const steps = constructionToSteps(c);
    const lineStep = steps.find((s) => s.id === "step_line1");
    expect(lineStep).toBeDefined();
    expect(lineStep?.inputs).toContain("p1");
    expect(lineStep?.inputs).toContain("p2");
    expect(lineStep?.outputs).toContain("line1");
  });

  it("should include all geometry in compute output", () => {
    const c = new Construction();
    const p1 = c.point(0, 0, "p1");

    const steps = constructionToSteps(c);
    const inputMap = new Map<string, any>();
    const config = {};

    const output = steps[0].compute(inputMap, config);
    expect(output.size).toBe(1);
    expect(output.get("p1")).toBeDefined();
  });
});
```

### Step 5: Test with Square Construction

Create a test that verifies the adapter works with a realistic square construction.

```typescript
// In construction-to-steps.test.ts

describe("constructionToSteps with square", () => {
  it("should convert square construction to steps", () => {
    const c = new Construction();

    // Recreate the square construction steps
    // Step 1: Main line
    const ml = c.line(100, 500, 700, 500, "main_line");

    // Step 2: C1 at ratio
    const c1 = c.pointAt(ml, 5 / 8, "c1");

    // Step 3: Circle at C1
    const c1_c = c.circle(c1, 150, "c1_circle");

    // Step 4: C2 at left intersection
    const c2 = c.intersection(c1_c, ml, "left", "c2");

    // Step 5: Circle at C2
    const c1_circle = c.get<Circle>(c1_c);
    const c2_c = c.circle(c2, c1_circle.r, "c2_circle");

    // Step 6: PI - north intersection
    const pi = c.intersection(c1_c, c2_c, "north", "pi");

    // Step 7: Circle at PI
    const ci = c.circle(pi, c1_circle.r, "ci");

    // Step 8-9: Extended lines
    const line_c2_pi = c.lineTowards(c2, pi, 2.2 * c1_circle.r, "line_c2_pi");
    const line_c1_pi = c.lineTowards(c1, pi, 2.2 * c1_circle.r, "line_c1_pi");

    // Step 10-11: P3 and P4
    const p3 = c.intersection(line_c2_pi, ci, { exclude: c2 }, "p3");
    const p4 = c.intersection(line_c1_pi, ci, { exclude: c1 }, "p4");

    // Step 12-13: Connecting lines
    const line_c2_p4 = c.line(c2, p4, "line_c2_p4");
    const line_c1_p3 = c.line(c1, p3, "line_c1_p3");

    // Step 14-15: Tangent points
    const pl = c.intersection(line_c2_p4, c2_c, { exclude: p4 }, "pl");
    const pr = c.intersection(line_c1_p3, c1_c, { exclude: p3 }, "pr");

    // Step 16: Final square
    const square = c.polygon([c1, c2, pr, pl], "square");

    const steps = constructionToSteps(c);
    expect(steps).toHaveLength(16);

    // Verify all expected geometry IDs are present
    const stepIds = steps.map((s) => s.id);
    expect(stepIds).toContain("step_main_line");
    expect(stepIds).toContain("step_c1");
    expect(stepIds).toContain("step_c1_circle");
    expect(stepIds).toContain("step_c2");
    expect(stepIds).toContain("step_square");
  });
});
```

---

## Verification Steps

### 1. TypeScript Compilation

Run TypeScript compiler to verify no type errors:

```bash
cd app2 && npx tsc --noEmit
```

Expected: No errors

### 2. Circular Dependency Check

Manually verify the import chain:

```
✅ construction-to-steps.ts → construction.ts
✅ construction.ts → ../types/geometry.ts
✅ construction.ts → @sg/geometry (coordinate-based functions only)
✅ ../types/geometry.ts → ../react-store.ts
✅ ../types/geometry.ts → ../geometry/operations.ts
✅ ../geometry/operations.ts → @sg/geometry
✅ @sg/geometry → nothing from app2

NO CIRCULAR DEPENDENCIES ✅
```

### 3. Test Suite

Run all tests:

```bash
pnpm test
```

Expected: All tests pass, including:

- construction.test.ts tests
- construction-to-steps.test.ts tests

---

## Success Criteria

Phase 2 is complete when:

- [ ] `app2/src/geometry/construction-to-steps.ts` exists and compiles
- [ ] `constructionToSteps()` function correctly converts Construction to Step[]
- [ ] `app2/src/geometry/index.ts` exports new modules
- [ ] All tests pass (`pnpm test`)
- [ ] TypeScript compilation succeeds (`pnpm type-check`)
- [ ] No circular dependencies exist
- [ ] Code follows project conventions (Oxlint/Oxfmt pass)

---

## Next Phase

Once Phase 2 is complete, proceed to **Phase 3: Rendering Layer** (`backlog/geometry-framework-PHASE3.md`)

---

## See Also

- `backlog/PLAN geometry-framework.md` - Full architecture overview
- `backlog/geometry-framework-PHASE1.md` - Previous phase (Core Construction DSL)
- `backlog/geometry-framework-PHASE3.md` - Next phase (Rendering Layer)
- `app2/src/geometry/squareSteps.ts` - Reference step definitions
- `app2/src/types/geometry.ts` - Step type definition
