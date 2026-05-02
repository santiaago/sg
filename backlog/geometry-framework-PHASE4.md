# Phase 4: Proof of Concept - SquaresV2 Component

## Overview

This phase creates the first component using the new geometry framework: **SquaresV2**. This serves as a proof of concept that validates the entire architecture works together.

**Status**: NOT STARTED  
**Priority**: HIGH  
**Estimated Duration**: 2-3 days  
**Prerequisites**: Phase 1 (Core Construction DSL), Phase 2 (Integration Layer), Phase 3 (Rendering Layer) must be complete

---

## Objectives

By the end of this phase, we will have:

1. ✅ SquaresV2 component that uses Construction and SvgRenderer
2. ✅ All 16 square construction steps implemented using the new DSL
3. ✅ Step navigation working
4. ✅ Responsive sizing
5. ✅ Error handling
6. ✅ Tests for the component

---

## Architecture Decisions

### 1. Component Structure

**Decision**: SquaresV2 is a standalone React component that:

- Creates a Construction in useMemo
- Manages step navigation
- Uses SvgRenderer for drawing
- Does NOT modify existing Square component

**Rationale**:

- Isolated proof of concept
- Can be tested independently
- Demonstrates the new framework's capabilities
- Existing Square component remains unchanged

### 2. Step Index Management

**Decision**: Use React's useEffect to update Construction's step index when props change.

**Rationale**:

- React manages the component lifecycle
- Construction's goTo() method handles navigation
- Clean separation: React manages UI state, Construction manages geometry state

### 3. Configuration Reuse

**Decision**: Reuse existing `computeSquareConfig` from operations.ts.

**Rationale**:

- Avoids duplication
- Maintains consistency with existing Square component
- Proves the new framework can use existing utilities

---

## Files to Create

### 1. `app2/src/components/SquaresV2.tsx` (NEW)

```typescript
/**
 * SquaresV2.tsx
 *
 * Proof-of-concept component using the new Construction DSL and SvgRenderer.
 * Demonstrates the higher-level declarative geometry construction framework.
 *
 * This component:
 * - Creates geometry using Construction DSL
 * - Renders using SvgRenderer
 * - Supports step-by-step navigation
 * - Is completely independent of the existing Square component
 */

import { useEffect, useMemo, useRef } from "react";
import type { SvgConfig } from "../config/svgConfig";
import type { GeometryStore } from "../react-store";
import type { Theme } from "../themes";
import { Construction } from "../geometry/construction";
import { SvgRenderer } from "../geometry/renderers/svgRenderer";
import { computeSquareConfig, LINE_EXTENSION_MULTIPLIER, C1_POSITION_RATIO } from "../geometry/operations";
import { useGeometryStore } from "../react-store";

/**
 * Props for the SquaresV2 component.
 */
export interface SquaresV2Props {
  // Store for managing SVG elements and tooltips
  store: GeometryStore;

  // SVG configuration (dimensions, classes)
  svgConfig: SvgConfig;

  // Current step index (0-based)
  currentStep: number;

  // Theme for styling
  theme?: Theme;
}

/**
 * SquaresV2 component - Proof of concept for the new geometry framework.
 *
 * Creates a square using compass and straightedge techniques, rendering
 * step-by-step as the user navigates through the construction.
 */
export function SquaresV2({ store, svgConfig, currentStep, theme }: SquaresV2Props): React.JSX.Element {
  const svgRef = useRef<SVGSVGElement>(null);

  // Memoize the square configuration (derived from SVG dimensions)
  const config = useMemo(() => {
    return computeSquareConfig(svgConfig.width, svgConfig.height);
  }, [svgConfig.width, svgConfig.height]);

  // Create the construction (pure geometry, no rendering)
  const construction = useMemo(() => {
    const c = new Construction();

    // Step 1: Main line (base line for the entire construction)
    const ml = c.line(
      config.lx1, config.ly1,
      config.lx2, config.ly2,
      "main_line"
    );

    // Step 2: C1 - First circle center at C1_POSITION_RATIO along main line
    const c1 = c.pointAt(ml, C1_POSITION_RATIO, "c1");

    // Step 3: C1_C - First circle centered at C1 with configured radius
    const c1_c = c.circle(c1, config.circleRadius, "c1_circle");

    // Step 4: C2 - Second circle center at left intersection of C1_C with main line
    // The left intersection is the one with smaller x-coordinate
    const c2 = c.intersection(c1_c, ml, "left", "c2");

    // Step 5: C2_C - Second circle centered at C2 with same radius as C1_C
    const c1_circle = c.get<Circle>(c1_c);
    const c2_c = c.circle(c2, c1_circle.r, "c2_circle");

    // Step 6: PI - Intersection point of both circles (north = smaller y in SVG)
    const pi = c.intersection(c1_c, c2_c, "north", "pi");

    // Step 7: CI - Circle centered at PI with same radius
    const ci = c.circle(pi, c1_circle.r, "ci");

    // Step 8-9: Extended lines from C2 and C1 towards PI
    // Length = LINE_EXTENSION_MULTIPLIER * radius (1.1 * diameter = 2.2 * radius)
    const line_c2_pi = c.lineTowards(
      c2, pi,
      LINE_EXTENSION_MULTIPLIER * c1_circle.r,
      "line_c2_pi"
    );
    const line_c1_pi = c.lineTowards(
      c1, pi,
      LINE_EXTENSION_MULTIPLIER * c1_circle.r,
      "line_c1_pi"
    );

    // Step 10-11: P3 and P4 - Intersections of extended lines with CI
    // Use { exclude } to get the "other" intersection point (not the circle center)
    const p3 = c.intersection(line_c2_pi, ci, { exclude: c2 }, "p3");
    const p4 = c.intersection(line_c1_pi, ci, { exclude: c1 }, "p4");

    // Step 12-13: Connecting lines
    const line_c2_p4 = c.line(c2, p4, "line_c2_p4");
    const line_c1_p3 = c.line(c1, p3, "line_c1_p3");

    // Step 14-15: PL and PR - Tangent points
    // These are the intersections of the connecting lines with the original circles
    // excluding the points we already know (p4 for c2_c, p3 for c1_c)
    const pl = c.intersection(line_c2_p4, c2_c, { exclude: p4 }, "pl");
    const pr = c.intersection(line_c1_p3, c1_c, { exclude: p3 }, "pr");

    // Step 16: Final square polygon
    // Connect the four corner points: C1, C2, PR, PL
    // Note: Order matters for polygon rendering
    const square = c.polygon([c1, c2, pr, pl], "square");

    return c;
  }, [config]);

  // Navigate to requested step
  useEffect(() => {
    construction.goTo(currentStep);
  }, [currentStep, construction]);

  // Render the construction up to the current step
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = svgRef.current;
    const renderer = new SvgRenderer(svg, store);

    // Clear previous rendering
    renderer.clear();

    // Draw all geometries up to the current step
    renderer.drawConstructionUpTo(construction, currentStep);
  }, [currentStep, store, construction, theme]);

  return (
    <div className={`${svgConfig.containerClass} flex justify-center`}>
      <svg
        ref={svgRef}
        className={`${svgConfig.svgClass} block`}
        data-testid="squaresv2-svg"
      />
    </div>
  );
}

// Type imports for JSDoc (not runtime dependencies)
import type { Circle } from "../types/geometry";
```

---

## Implementation Checklist

### Step 1: Create the Component File

- [ ] Create `app2/src/components/SquaresV2.tsx`
- [ ] Add header comment with file purpose
- [ ] Import required types and hooks
- [ ] Define SquaresV2Props interface
- [ ] Implement SquaresV2 component

### Step 2: Implement Construction Logic

- [ ] Step 1: Main line
- [ ] Step 2: C1 at ratio
- [ ] Step 3: Circle at C1
- [ ] Step 4: C2 at left intersection
- [ ] Step 5: Circle at C2
- [ ] Step 6: PI (north intersection)
- [ ] Step 7: Circle at PI
- [ ] Step 8-9: Extended lines
- [ ] Step 10-11: P3 and P4 with exclude
- [ ] Step 12-13: Connecting lines
- [ ] Step 14-15: Tangent points with exclude
- [ ] Step 16: Final square polygon

### Step 3: Add Step Navigation

- [ ] Use useEffect to update Construction's step index
- [ ] Call construction.goTo(currentStep)

### Step 4: Add Rendering

- [ ] Use useEffect for rendering
- [ ] Create SvgRenderer with svgRef and store
- [ ] Clear before each render
- [ ] Call drawConstructionUpTo with current step

### Step 5: Add SVG Container

- [ ] Return div with container class
- [ ] Include svg element with ref
- [ ] Add test id for testing

### Step 6: Update Component Exports

- [ ] Update `app2/src/components/index.ts` or add direct export
- [ ] Ensure SquaresV2 can be imported from components

### Step 7: Create Component Tests

- [ ] Create `app2/src/components/SquaresV2.test.tsx`
- [ ] Test component renders without errors
- [ ] Test all 16 steps render correctly
- [ ] Test step navigation works
- [ ] Test final square geometry is correct
- [ ] Test responsive sizing
- [ ] Test error handling

```typescript
// app2/src/components/SquaresV2.test.tsx

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { SquaresV2 } from "./SquaresV2";
import { GeometryStore } from "../react-store";
import type { SvgConfig } from "../config/svgConfig";
import { darkTheme } from "../themes";

// Mock GeometryStore
const mockStore: any = {
  add: vi.fn(),
  clear: vi.fn(),
  update: vi.fn(),
  get: vi.fn(),
};

const mockSvgConfig: SvgConfig = {
  width: 800,
  height: 600,
  viewBox: "0 0 800 600",
  containerClass: "container",
  svgClass: "svg",
};

describe("SquaresV2", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render without errors", () => {
    render(
      <SquaresV2
        store={mockStore}
        svgConfig={mockSvgConfig}
        currentStep={0}
        theme={darkTheme}
      />
    );

    expect(screen.getByTestId("squaresv2-svg")).toBeInTheDocument();
  });

  it("should render all 16 steps when currentStep is 15", () => {
    render(
      <SquaresV2
        store={mockStore}
        svgConfig={mockSvgConfig}
        currentStep={15}
        theme={darkTheme}
      />
    );

    // Verify SVG element exists
    const svg = screen.getByTestId("squaresv2-svg");
    expect(svg).toBeInTheDocument();

    // Note: Testing the actual rendered geometries requires more complex setup
    // with a real DOM environment. This is a basic smoke test.
  });

  it("should render only first step when currentStep is 0", () => {
    render(
      <SquaresV2
        store={mockStore}
        svgConfig={mockSvgConfig}
        currentStep={0}
        theme={darkTheme}
      />
    );

    expect(screen.getByTestId("squaresv2-svg")).toBeInTheDocument();
  });

  it("should update rendering when currentStep changes", () => {
    const { rerender } = render(
      <SquaresV2
        store={mockStore}
        svgConfig={mockSvgConfig}
        currentStep={0}
        theme={darkTheme}
      />
    );

    // Change step
    rerender(
      <SquaresV2
        store={mockStore}
        svgConfig={mockSvgConfig}
        currentStep={5}
        theme={darkTheme}
      />
    );

    expect(screen.getByTestId("squaresv2-svg")).toBeInTheDocument();
  });
});
```

---

## Testing Strategy

### 1. Unit Tests

- Test component renders without errors
- Test with different step indices
- Test with different SVG configurations

### 2. Integration Tests

- Verify all 16 steps render correctly
- Verify step-by-step navigation
- Verify final square geometry matches expected result

### 3. Geometry Verification

Create a test that verifies the Construction produces the correct geometry:

```typescript
// In SquaresV2.test.tsx or a separate file

describe("SquaresV2 geometry", () => {
  it("should produce correct final square geometry", () => {
    // Create the same construction as in SquaresV2
    const c = new Construction();
    const config = computeSquareConfig(800, 600);

    // ... all 16 steps ...

    // Get the final square
    const square = c.get<Polygon>({ id: "square" });

    // Verify it has 4 points
    expect(square.points).toHaveLength(4);

    // Verify it's a valid polygon (not self-intersecting, etc.)
    // This requires more sophisticated geometry verification
  });
});
```

---

## Success Criteria

Phase 4 is complete when:

- [ ] `app2/src/components/SquaresV2.tsx` exists and compiles
- [ ] All 16 square construction steps are implemented using Construction DSL
- [ ] Step navigation works (goTo, next, prev)
- [ ] SvgRenderer integration works
- [ ] GeometryStore integration works
- [ ] `app2/src/components/SquaresV2.test.tsx` exists with tests
- [ ] All tests pass (`pnpm test`)
- [ ] TypeScript compilation succeeds (`pnpm type-check`)
- [ ] Component renders correctly in browser
- [ ] Code follows project conventions (Oxlint/Oxfmt pass)

---

## Next Phase

Once Phase 4 is complete, proceed to **Phase 5: Advanced Features** (`backlog/geometry-framework-PHASE5.md`)

---

## See Also

- `backlog/PLAN geometry-framework.md` - Full architecture overview
- `backlog/geometry-framework-PHASE3.md` - Previous phase (Rendering Layer)
- `backlog/geometry-framework-PHASE5.md` - Next phase (Advanced Features)
- `app2/src/components/Square.tsx` - Reference component (existing)
- `app2/src/geometry/squareSteps.ts` - Reference step definitions
- `app2/src/geometry/operations.ts` - Configuration utilities
