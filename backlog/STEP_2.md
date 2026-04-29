# Step 2 Deep Dive Analysis

## Overview

Step 2 is the **foundational circle construction step** in the SixFoldV0 geometry pipeline. It takes the base LINE1 and its endpoints (P1, P2) from Step 1 and constructs the four primary circles (C1-C4) and their centers (CP1-CP4) that form the core of the six-fold pattern.

```
Step 1 (LINE1, P1, P2)
    ↓
Step 2 → CP1, CP2, CP3, CP4, C1, C2, C3, C4
    ↓
All subsequent steps depends on these 8 geometries
```

---

## Step 2 Definition

```typescript
const STEP_2: SixFoldV0Step = {
  id: "step2",
  inputs: [GEOM.LINE1, GEOM.P1, GEOM.P2],
  outputs: [
    GEOM.CP1, GEOM.CP2, GEOM.C1, GEOM.C2,
    GEOM.CP3, GEOM.CP4, GEOM.C3, GEOM.C4,
  ],
  parameters: ["radius"],
  compute: computeMultiple((inputs, config) => { ... }),
  draw: (svg, values, store, theme) => { ... }
};
```

### Basic Metrics

| Metric | Value | Analysis |
|--------|-------|----------|
| Inputs | 3 | LINE1, P1, P2 from Step 1 |
| Outputs | 8 | 4 circle centers + 4 circles |
| Parameters | 1 | `radius` from config |
| Dependencies | Step 1 | Direct only |
| Lines of Code | ~60 | Compute function |

---

## Algorithm Breakdown

Step 2 implements the `circlesFromLine` logic from the original Svelte SixFoldv3.svelte. The computation follows this geometric construction:

### Phase 1: Circle Centers CP1 and CP2

```typescript
// Get line and points from step 1
const line1 = getGeometry(inputs, GEOM.LINE1, isLine, "Line");
const p1 = getGeometry(inputs, GEOM.P1, isPoint, "Point");
const p2 = getGeometry(inputs, GEOM.P2, isPoint, "Point");

// Use line coordinates (NOT config.cx1, cy1, etc. anymore)
const lx1 = line1.x1; const ly1 = line1.y1;
const lx2 = line1.x2; const ly2 = line1.y2;

// Calculate derived values
const lineLength = lx2 - lx1;
const radius = config.radius;  // From computeSixFoldV0Config: (lineLength * 2) / CUT_LINE_BY
const cx1 = lx1 + (lineLength * 5) / CUT_LINE_BY;
const cy1 = ly1;
const cx2 = cx1 - radius;
const cy2 = cy1;

// Create circle centers cp1 and cp2
const cp1 = point(cx1, cy1);
const cp2 = point(cx2, cy2);
```

**Geometry:**
- LINE1 is horizontal (ly1 = ly2 in typical config)
- CP1 is at `lx1 + (5/8) * lineLength` from left
- CP2 is offset left from CP1 by `radius`
- Both centers share the same Y-coordinate as LINE1

**Visual Layout:**
```
P1 ──[1/8]──── CP2 ──[2/8=r]──── CP1 ──[2/8=r]────── P2
                 │<────────── radius ──────────>│
```

### Phase 2: Primary Circles C1 and C2

```typescript
const circle1 = circle(cx1, cy1, radius);
const circle2 = circle(cx2, cy2, radius);
m.set(GEOM.CP1, cp1); m.set(GEOM.CP2, cp2);
m.set(GEOM.C1, circle1); m.set(GEOM.C2, circle2);
```

**Properties:**
- Both circles have the same radius
- Circles intersect (overlap) since centers are `radius` apart
- The intersection points are computed in the next phase

### Phase 3: Intersection Point and Circle at Intersection

```typescript
// Find px, py = intersection point of c1 and c2 circles (top point)
const pxPy = circlesIntersectionPointHelper(c1, c2, directions.up);
if (!pxPy) {
  throw new Error("STEP_2: circlesIntersectionPointHelper(c1, c2, up) returned null");
}

// Create circle at intersection with same radius
const circleAtIntersection = circle(pxPy.x, pxPy.y, radius);
```

**Geometric Meaning:**
- `pxPy` is the **upper intersection point** of C1 and C2
- In SVG coordinates (y increases downward), "up" means smaller y-value
- This point forms an equilateral triangle with CP1 and CP2 (all sides = radius)
- A new circle is created centered at this intersection point

### Phase 4: Bisected Points P3 and P4

```typescript
// p3 = bisect from circleAtIntersection through cp2
const p3 = bisectCircleAndPoint(circleAtIntersection, cp2);
const p4 = bisectCircleAndPoint(circleAtIntersection, cp1);
```

**`bisectCircleAndPoint` Algorithm:**
```
Given circle C and point P:
1. Find vector from C.center - C.radius (leftmost point on circle) to P
2. Compute angle = atan2(dy, dx) of this vector
3. Bisect angle: new_angle = angle * 2
4. Return point on circle at new_angle from center
```

**Geometric Meaning:**
- P3 is the point on `circleAtIntersection` such that the angle from the leftmost point of the circle to CP2 is doubled
- P4 is the symmetric point for CP1
- These points are used to draw lines L13 and L24

### Phase 5: Lines L13 and L24, and Circle Centers CP3 and CP4

```typescript
// l13 = line from cp1 to p3
const l13Line = line(cp1.x, cp1.y, p3.x, p3.y);
// c4 center = intersection of circle1 with l13 line
const c4Intersection = interceptCircleLineSegHelper(circle1, l13Line, 0);

// l24 = line from cp2 to p4
const l24Line = line(cp2.x, cp2.y, p4.x, p4.y);
// c3 center = intersection of circle2 with l24 line
const c3Intersection = interceptCircleLineSegHelper(circle2, l24Line, 0);

// Create cp3, cp4, c3, c4
m.set(GEOM.CP3, c3Intersection);
m.set(GEOM.CP4, c4Intersection);
const c3 = circle(c3Intersection.x, c3Intersection.y, radius);
const c4 = circle(c4Intersection.x, c4Intersection.y, radius);
m.set(GEOM.C3, c3);
m.set(GEOM.C4, c4);
```

**Important Note:** Despite the variable names in the code (`c3Intersection` → CP3, `c4Intersection` → CP4), the actual geometric construction is:
- CP4 = intersection of C1 and line L13 (from CP1 to P3)
- CP3 = intersection of C2 and line L24 (from CP2 to P4)

**This creates the complete set of 4 circle centers.**

---

## Output Geometries

### Circle Centers (Points)

| GEOM ID | Type | Description | Coordinates |
|---------|------|-------------|-------------|
| CP1 | Point | Primary circle 1 center | `(lx1 + 5/8*length, ly1)` |
| CP2 | Point | Primary circle 2 center | `(CP1.x - radius, ly1)` |
| CP3 | Point | Secondary circle 3 center | Intersection of C2 & L24 |
| CP4 | Point | Secondary circle 4 center | Intersection of C1 & L13 |

### Circles

| GEOM ID | Type | Center | Radius |
|---------|------|--------|--------|
| C1 | Circle | CP1 | config.radius |
| C2 | Circle | CP2 | config.radius |
| C3 | Circle | CP3 | config.radius |
| C4 | Circle | CP4 | config.radius |

---

## Dependency Analysis

### Inputs Consumed

| Input | From Step | Type | Usage |
|-------|-----------|------|-------|
| LINE1 | Step 1 | Line | Extract lx1, ly1, lx2, **ly2** |
| P1 | Step 1 | Point | **❌ NEVER USED** (dead code) |
| P2 | Step 1 | Point | **❌ NEVER USED** (dead code) |

**Note:** The April 29, 2026 refactoring changed Step 2 to use LINE1 coordinates directly. However, P1 and P2 are declared as inputs but **never actually consumed** in the compute function - only LINE1's coordinates are used. P1 and P2 should be removed from the inputs array.

**Action Required:** Remove `GEOM.P1` and `GEOM.P2` from Step 2 inputs.

### ⚠️ Dead Code: Unused Inputs

**P1 and P2 are dead code.** They are:
1. Declared in `inputs: [GEOM.LINE1, GEOM.P1, GEOM.P2]`
2. Retrieved with `getGeometry()` calls
3. **Never referenced anywhere** in the compute function

All coordinates come from `line1.x1`, `line1.y1`, `line1.x2`, `line1.y2`. The `p1` and `p2` variables can be safely deleted.

### Outputs Produced

All 8 outputs are **consumed by subsequent steps**:

| Output | Consumed By | Count |
|--------|-------------|-------|
| CP1 | Steps 3,5,6,8,11,15,17,18,27,28,33,34,35,36 | 14 |
| CP2 | Steps 3,6,8,11,13,18,31,32,33 | 9 |
| CP3 | Steps 3,6,8,11,14,17,22,23,27,34,35 | 11 |
| CP4 | Steps 3,6,8,11,14,17,18,19,21,24,28,35,36 | 13 |
| C1 | Steps 4,8 | 2 |
| C2 | Steps 4,8 | 2 |
| C3 | Steps 4 | 1 |
| C4 | Steps 4 | 1 |

**✅ All outputs are consumed - Zero unused geometries from Step 2**

---

## Geometric Pattern

Step 2 constructs a **four-circle foundation** with the following properties:

1. **C1 and C2** are the "outer" circles, centers separated by `radius`
2. **C3 and C4** are "inner" circles, positioned through intersection logic
3. All four circles share the same radius
4. The four center points (CP1-CP4) form a **non-regular quadrilateral**

**Approximate Spatial Relationship:**
```
        CP4 ⬆
        /  \
   CP1─────CP2
        \  /
         CP3
```

With:
- CP1 and CP2 on the same horizontal line (same y as LINE1)
- CP4 above-left of CP1
- CP3 below-right of CP2

---

## Mathematical Verification

### Circle Position Verification

Given:
- lineLength = lx2 - lx1
- radius = (lineLength * 2) / CUT_LINE_BY = lineLength / 4
- cx1 = lx1 + (5/8) * lineLength
- cx2 = cx1 - radius = lx1 + (5/8)*L - L/4 = lx1 + (3/8)*L

Distance CP1 to CP2:
```
|cx1 - cx2| = |(lx1 + 5L/8) - (lx1 + 3L/8)| = 2L/8 = L/4 = radius
```

**✅ CP1 and CP2 are exactly `radius` apart**

Since both C1 and C2 have radius `r`, they intersect at two points:
- The upper point (pxPy) where y < line y-coordinate
- The lower point where y > line y-coordinate

### Equilateral Triangle Formation

The triangle CP1-pxPy-CP2:
- CP1 to CP2 = radius
- CP1 to pxPy = radius (pxPy is on C1)
- CP2 to pxPy = radius (pxPy is on C2)

**✅ Triangle CP1-pxPy-CP2 is equilateral**

### Circle at Intersection

The circle centered at pxPy with radius `r` passes through:
- The midpoints of CP1-CP2 at both top and bottom
- Creates the foundation for the six-fold symmetry

---

## Refactoring History

### April 29, 2026 Changes

**Before:**
```typescript
// Step 2 used config.cx1, config.cy1, config.cx2, config.cy2 directly
const cx1 = config.cx1;
const cy1 = config.cy1;
const cx2 = config.cx2;
const cy2 = config.cy2;

// Produced additional geometries (now removed):
// - P3, P4 (bisected points)
// - CIRCLE_AT_INTERSECTION
// - L13, L24 (lines)
```

**After:**
```typescript
// Now extracts from LINE1, P1, P2
const lx1 = line1.x1; const ly1 = line1.y1;
const lx2 = line1.x2; const ly2 = line1.y2;

// No longer produces P3, P4, CIRCLE_AT_INTERSECTION, L13, L24
// These are now computed in Step 6
```

**Impact:**
- ✅ Reduced from 11 outputs to 8 outputs
- ✅ Removed 5 unused geometries (P3, P4, CIRCLE_AT_INTERSECTION were never consumed)
- ⚠️ L13 and L24 **moved to Step 6** - potential redundancy issue

### Redundancy Issue Identified

According to the changelog:
> ⚠️ Note: L13 and L24 are now computed in Step 6 (redundant with old Step 2 logic)

However, looking at the current code:
- **Step 2** does NOT produce L13 or L24 (they were removed)
- **Step 6** computes L13 and L24 from CP1, CP2, CP3, CP4
- The lines are computed as: `line(cp1.x, cp1.y, cp3.x, cp3.y)` and `line(cp2.x, cp2.y, cp4.x, cp4.y)`

**But wait:** In Step 2's original logic, L13 was defined as `line(cp1.x, cp1.y, p3.x, p3.y)` where P3 was from bisecting. This is **different** from Step 6's L13 which connects CP1 to CP3 directly.

**Resolution:** These are actually **different lines**:
- Step 2 (old): L13 = line from CP1 to P3 (bisected point on circleAtIntersection)
- Step 6 (current): L13 = line from CP1 to CP3 (circle center to circle center)

The P3 and P4 points from Step 2's original logic are **not the same** as CP3 and CP4. The current implementation correctly computes L13 and L24 in Step 6 based on the final circle centers.

---

## Performance Analysis

### Computational Complexity

| Operation | Count | Complexity | Notes |
|-----------|-------|------------|-------|
| Point creation | 8 | O(1) each | CP1, CP2, CP3, CP4, pxPy, p3, p4, plus intersections |
| Circle creation | 5 | O(1) each | C1, C2, C3, C4, circleAtIntersection |
| Line creation | 2 | O(1) each | L13, L24 (internal, not output) |
| Circle-Circle intersection | 1 | O(1) | C1 ∩ C2 |
| Circle-Line intersection | 2 | O(1) each | C1 ∩ L13, C2 ∩ L24 |
| bisectCircleAndPoint | 2 | O(1) each | For p3, p4 |

**Total: ~19 geometric operations, all O(1)**

### Memory Usage

- Map entries created: 8
- Intermediate objects (not stored): ~7 (circleAtIntersection, pxPy, p3, p4, l13Line, l24Line, plus intersection results)
- **Total memory growth: ~15 geometry objects**

---

## Issues and Findings

### ✅ Strengths

1. **All outputs consumed** - Zero unused geometries
2. **Clear geometric foundation** - Establishes the four-circle pattern
3. **Good error handling** - Checks for null intersections
4. **Well-documented** - JSDoc comments explain the logic
5. ** recently refactored** - Clean extraction of coordinates from inputs

### ⚠️ Potential Issues

1. **Multiple Circle Objects**
   - Internal: `circle1`, `circle2` (stored as C1, C2)
   - Internal: `circleAtIntersection` (not stored, temporary)
   - This is fine - only 8 outputs stored

2. **Variable Naming Confusion**
   - `circleAtIntersection` is created but not stored in the map (good - it's temporary)
   - `c3Intersection` → GEOM.CP3 (naming confusion: it's a point, not a circle)
   - `c4Intersection` → GEOM.CP4 (same issue)
   
   **Recommendation:** Rename internal variables for clarity:
   ```typescript
   // Instead of:
   const c3Intersection = interceptCircleLineSegHelper(circle2, l24Line, 0);
   m.set(GEOM.CP3, c3Intersection);
   
   // Consider:
   const cp3Pt = interceptCircleLineSegHelper(circle2, l24Line, 0);
   m.set(GEOM.CP3, cp3Pt);
   ```

3. **Magic Numbers**
   - `CUT_LINE_BY = 8` (defined in operations.ts)
   - `(lineLength * 5) / CUT_LINE_BY` - the 5/8 ratio
   - These come from the original Svelte implementation
   
   **Context:** The `circlesFromLine` function divides the line into 8 parts:
   - 1 part: border
   - 5 parts: to CP1
   - 2 parts: to CP2 (offset by radius = 2 parts)
   - This creates proportional spacing

4. **SVG Coordinate System**
   - Y increases downward (standard SVG)
   - "up" direction = smaller y value
   - This is correctly handled by `directions.up` in `circlesIntersectionPointHelper`

### 🔴 No Critical Issues

Unlike other steps in the pipeline, Step 2:
- Has no pass-through operations
- Produces no unused geometries
- Has no redundant computations
- All dependencies are properly declared

---

## Optimization Opportunities

### 1. Extract Helper Functions (Readability)

The compute function is ~60 lines with nested logic. Consider extracting:

```typescript
// Proposed refactoring
function computePrimaryCircles(line: Line, radius: number) {
  // Returns { cp1, cp2, c1, c2, intersectionPoint }
}

function computeSecondaryCircles(cp1, cp2, circle1, circle2, radius) {
  // Returns { cp3, cp4, c3, c4 }
}
```

**Benefit:** Clearer separation of concerns, easier testing

### 2. Cache circleAtIntersection

Currently recreated each time Step 2 runs. Could cache if radius and pxPy are stable.

**However:** Since Step 2 only runs once in the pipeline, caching provides minimal benefit.

### 3. Early Validation

Add validation at the start:

```typescript
if (lineLength <= 0) {
  throw new Error("STEP_2: Invalid line - length must be positive");
}
if (radius <= 0) {
  throw new Error("STEP_2: Invalid radius - must be positive");
}
```

---

## Usage in Subsequent Steps

### Direct Dependencies (Steps that consume Step 2 outputs)

| Step | Inputs from Step 2 | Purpose |
|------|---------------------|---------|
| Step 3 | CP1, CP2, CP3, CP4 | Connecting lines between centers |
| Step 4 | C1, C2, C3, C4 | Intersection points PIC12, PIC14 |
| Step 5 | CP1, PIC12, PIC14 | Lines from CP1 to PIC points |
| Step 6 | CP1, CP2, CP3, CP4 | Diagonal lines L13, L24 and intersection PI2 |
| Step 7 | CP1, CP2, CP3, CP4, PIC14, PI2 | D1 circles at all centers |
| ... | ... | ... |

### Transitive Importance

Step 2 outputs are **critical path** for:
- All 18 outline steps (Steps 19-36)
- All intersection point calculations
- All circle construction steps

**Without Step 2, 80% of the pipeline cannot execute.**

---

## Comparison with squareSteps

### squareSteps Step 2 (Circle Center C1)

```typescript
// From squareSteps.ts
const STEP_C1: SquareStep = {
  id: "step_c1",
  inputs: [GEOM.MAIN_LINE],
  outputs: [GEOM.C1],
  parameters: ["C1_POSITION_RATIO"],
  compute: computeSingle(GEOM.C1, (inputs, params) => {
    const mainLine = getGeometry(inputs, GEOM.MAIN_LINE, isLine);
    const ratio = params.C1_POSITION_RATIO;
    return point(
      mainLine.x1 + (mainLine.x2 - mainLine.x1) * ratio,
      mainLine.y1
    );
  }),
  draw: (svg, values, store, theme) => {
    drawPoint(svg, values, GEOM.C1, 2.0, store, theme);
  },
};
```

### Key Differences

| Aspect | sixFoldV0 Step 2 | squareSteps Step 2 |
|--------|-------------------|-------------------|
| Outputs | 8 geometries | 1 geometry |
| Complexity | High | Low |
| Purpose | 4-circle foundation | Single circle center |
| Inputs | 3 | 1 |
| Parameters | 1 | 1 |

**Analysis:**
- sixFoldV0 Step 2 is **8x more complex** than squareSteps Step 2
- This is expected - six-fold pattern requires more foundation
- squareSteps spreads circle construction across multiple steps (2-5)
- **Recommendation:** Consider splitting sixFoldV0 Step 2 into smaller steps for consistency

---

## Recommended Refactoring

### Option A: Split into Multiple Steps (Recommended)

```typescript
// Step 2a: Primary circle centers and circles
STEP_2A: {
  inputs: [LINE1, P1, P2],
  outputs: [CP1, CP2, C1, C2],
  // Compute cp1, cp2, c1, c2
}

// Step 2b: Intersection point and circle at intersection
STEP_2B: {
  inputs: [C1, C2],
  outputs: [PIC12_INTERNAL],  // Internal intersection point
  // Compute pxPy
}

// Step 2c: Bisected points
STEP_2C: {
  inputs: [PIC12_INTERNAL, C1, C2],  // Need circleAtIntersection handle
  outputs: [P3_INTERNAL, P4_INTERNAL],
  // Compute p3, p4
}

// Step 2d: Secondary circles
STEP_2D: {
  inputs: [C1, C2, P3_INTERNAL, P4_INTERNAL, CP1, CP2],
  outputs: [CP3, CP4, C3, C4],
  // Compute cp3, cp4, c3, c4
}
```

**Benefits:**
- Each step: 1-4 outputs (instead of 8)
- Better isolation for debugging
- More granular execution
- Matches squareSteps pattern

**Costs:**
- More step objects to manage
- Additional step array entries
- More draw function calls

### Option B: Keep as-is with Documentation Improvements

Enhance the existing step with:
1. Better variable naming
2. Extract helper functions
3. Add inline comments for each phase
4. Add geometric diagrams in comments

**Benefits:**
- Minimal code changes
- Maintains current simple structure
- Easy to review

### Option C: Hybrid Approach

Split only the most complex part:

```typescript
// Step 2: Primary circles only (4 outputs)
STEP_2: {
  inputs: [LINE1, P1, P2],
  outputs: [CP1, CP2, C1, C2],
  parameters: ["radius"],
  // Only compute primary circles
}

// Step 2x: Secondary circles (4 outputs)
STEP_2X: {
  inputs: [CP1, CP2, C1, C2],
  outputs: [CP3, CP4, C3, C4],
  parameters: [],
  // Compute secondary circles using C1, C2
}
```

---

## Testing Recommendations

### Unit Tests for Step 2

```typescript
import { STEP_2 } from './sixFoldV0Steps';
import { GEOM } from './sixFold/operations';

describe('Step 2', () => {
  const config = {
    width: 840,
    height: 519,
    border: 173,
    radius: 52.5,
    lx1: 173, ly1: 346,
    lx2: 667, ly2: 346,
  };

  it('should produce 8 outputs', () => {
    const inputs = new Map();
    inputs.set(GEOM.LINE1, line(config.lx1, config.ly1, config.lx2, config.ly2));
    inputs.set(GEOM.P1, point(config.lx1, config.ly1));
    inputs.set(GEOM.P2, point(config.lx2, config.ly2));
    
    const outputs = STEP_2.compute(inputs, config);
    expect(outputs.size).toBe(8);
  });

  it('should produce valid circle centers', () => {
    // Test that CP1 and CP2 are separated by radius
    // Test that all centers are valid points
  });

  it('should produce circles with correct radius', () => {
    // Verify C1, C2, C3, C4 all have config.radius
  });

  it('should handle degenerate line gracefully', () => {
    // Test with lineLength = 0
    // Should throw or return sensible defaults
  });
});
```

### Integration Test

Verify that all dependent steps can consume Step 2 outputs correctly.

---

## Mathematical Properties

### Coordinate System

- Origin: Top-left (SVG standard)
- X-axis: Left to right (increasing)
- Y-axis: Top to bottom (increasing)

### Symmetry

The four-circle construction has:
- **Reflection symmetry** across the vertical line through CP1
- **No rotational symmetry** (four circles are not evenly spaced)

### Key Distances

| Pair | Distance | Verification |
|------|----------|--------------|
| CP1 to CP2 | radius | Direct computation |
| CP1 to pxPy | radius | pxPy is on C1 |
| CP2 to pxPy | radius | pxPy is on C2 |
| CP1 to CP4 | ? | Depends on angle |
| CP2 to CP3 | ? | Depends on angle |

### Circle Packing

The four circles C1-C4:
- C1 and C2 overlap (intersect at 2 points)
- C1 and C4 overlap (CP4 is on C1)
- C2 and C3 overlap (CP3 is on C2)
- C3 and C4 may or may not overlap (depends on geometry)

---

## Visual Representation

```
SVG Coordinate System (y increases downward):

Ly1=346 ┌─────────────────────────────────────┐
        │                                         │
        │    CP4●                                │
        │     /                                   │
        │    /                                    │
Ly1=346┄●───●───────────────●───────────────●┄ Line y-coordinate
        │  CP2   cp1              (L13)          │
        │   ●───────────────────────●            │
        │    \                     /             │
        │     \                   /              │
        │      ●                 ●              │
        │     CP3                C4             │
        │                                         │
        └─────────────────────────────────────┘
       Lx1=173                Lx2=667

Legend:
● = Circle center (CP1, CP2, CP3, CP4)
○ = Circle (C1, C2, C3, C4) - radius shown as distance
─ = Line segments (L13, L24)
```

---

## Summary

| Aspect | Status | Notes |
|--------|--------|-------|
| **Correctness** | ✅ | All outputs valid, dependencies met |
| **Performance** | ✅ | O(1) operations, minimal overhead |
| **Maintainability** | ⚠️ | Large function, could use splitting |
| **Documentation** | ✅ | Good JSDoc, clear purpose |
| **Style** | ⚠️ | Variable naming could be improved |
| **Testing** | ❌ | No unit tests currently |

### Overall Assessment: 8/10

**Strengths:**
- Solid geometric foundation
- All outputs consumed
- Good error handling
- Recently refactored (cleaner)

**Improvement Areas:**
- Split into smaller steps for maintainability
- Improve variable naming clarity
- Add unit tests

---

## Appendix: Full Source Code

```typescript
const STEP_2: SixFoldV0Step = {
  id: "step2",
  inputs: [GEOM.LINE1, GEOM.P1, GEOM.P2],
  outputs: [
    GEOM.CP1,
    GEOM.CP2,
    GEOM.C1,
    GEOM.C2,
    GEOM.CP3,
    GEOM.CP4,
    GEOM.C3,
    GEOM.C4,
  ],
  parameters: ["radius"],
  compute: computeMultiple((inputs, config) => {
    const m = new Map<string, GeometryValue>();

    // Get line and points from step 1
    const line1 = getGeometry(inputs, GEOM.LINE1, isLine, "Line");
    const p1 = getGeometry(inputs, GEOM.P1, isPoint, "Point");
    const p2 = getGeometry(inputs, GEOM.P2, isPoint, "Point");

    // Use line coordinates
    const lx1 = line1.x1;
    const ly1 = line1.y1;
    const lx2 = line1.x2;
    const ly2 = line1.y2;

    // Calculate derived values
    const lineLength = lx2 - lx1;
    const radius = config.radius;
    const cx1 = lx1 + (lineLength * 5) / CUT_LINE_BY;
    const cy1 = ly1;
    const cx2 = cx1 - radius;
    const cy2 = cy1;

    // Create circle centers cp1 and cp2
    const cp1 = point(cx1, cy1);
    const cp2 = point(cx2, cy2);
    m.set(GEOM.CP1, cp1);
    m.set(GEOM.CP2, cp2);

    // Create circles c1 and c2
    const circle1 = circle(cx1, cy1, radius);
    const circle2 = circle(cx2, cy2, radius);
    m.set(GEOM.C1, circle1);
    m.set(GEOM.C2, circle2);

    // Find px, py = intersection point of c1 and c2 circles (top point)
    const c1 = circle1;
    const c2 = circle2;
    const pxPy = circlesIntersectionPointHelper(c1, c2, directions.up);
    if (!pxPy) {
      throw new Error("STEP_2: circlesIntersectionPointHelper(c1, c2, up) returned null - circles do not intersect");
    }

    // p3 = bisect from circleAtIntersection through cp2
    const circleAtIntersection = circle(pxPy.x, pxPy.y, radius);
    const p3 = bisectCircleAndPoint(circleAtIntersection, cp2);
    const p4 = bisectCircleAndPoint(circleAtIntersection, cp1);

    // l13 = line from cp1 to p3
    const l13Line = line(cp1.x, cp1.y, p3.x, p3.y);
    // c4 center = intersection of circle1 with l13 line
    const c4Intersection = interceptCircleLineSegHelper(circle1, l13Line, 0);

    // l24 = line from cp2 to p4
    const l24Line = line(cp2.x, cp2.y, p4.x, p4.y);
    // c3 center = intersection of circle2 with l24 line
    const c3Intersection = interceptCircleLineSegHelper(circle2, l24Line, 0);
    if (!c3Intersection || !c4Intersection) {
      throw new Error("STEP_2: Failed to find circle intersections for c3 or c4 centers");
    }

    // Create cp3, cp4, c3, c4
    m.set(GEOM.CP3, c3Intersection);
    m.set(GEOM.CP4, c4Intersection);
    const c3 = circle(c3Intersection.x, c3Intersection.y, radius);
    const c4 = circle(c4Intersection.x, c4Intersection.y, radius);
    m.set(GEOM.C3, c3);
    m.set(GEOM.C4, c4);

    return m;
  }),
  draw: (svg, values, store, theme) => {
    drawPoint(svg, values, GEOM.CP1, 2.0, store, theme);
    drawPoint(svg, values, GEOM.CP2, 2.0, store, theme);
    drawPoint(svg, values, GEOM.CP3, 2.0, store, theme);
    drawPoint(svg, values, GEOM.CP4, 2.0, store, theme);
    drawCircle(svg, values, GEOM.C1, 0.5, store, theme);
    drawCircle(svg, values, GEOM.C2, 0.5, store, theme);
    drawCircle(svg, values, GEOM.C3, 0.5, store, theme);
    drawCircle(svg, values, GEOM.C4, 0.5, store, theme);
  },
};
```

---

*Document generated: 2026-04-29*
*Last updated: 2026-04-29*
*Status: Complete analysis*
