# Spec: SixFoldV0 Mirror Construction

## Objective

Create a new SixFold construction component that produces a mirror image of the existing `SixFoldV0Svg` construction, reflected across the line defined by points `c2` and `cp4` from the original construction.

**Purpose**: This is the first of four sixfold sections that will eventually combine to create the complete sixfold geometric pattern. Each section is rotated by π/2 relative to the previous one (higher goal, not part of this task).

## Background

### Current Construction (SixFoldV0)

The existing `SixFoldV0Svg` component performs a 94-step geometric construction:

1. **Initial Setup**: Creates coordinate system, base line (LINE1) from P1 to P2
2. **Circle Centers**: Computes cp1 and cp2 on LINE1
3. **Circles**: Creates circles c1 at cp1, c2 at cp2
4. **Intersections**: Computes intersection points (pic12, cp3, cp4, etc.)
5. **Connecting Lines**: Creates lines between points
6. **Derived Circles**: Creates additional circles with computed radii
7. **Outline Paths**: Creates the final outline geometry

### Mirror Line: (c2, cp4)

- **c2**: Circle centered at point cp2 (on LINE1, to the left of cp1)
- **cp4**: Point computed in step 14 as intersection of circle C1 with line L13
- The line passing through these two points is a diagonal line in the construction

### The Challenge

The construction contains many **implicit direction-based choices**:

```typescript
// Examples from sixFoldV0Steps.ts:
circlesIntersectionPointHelper(c1, c2, directions.up)      // Step 8
interceptCircleLineDirHelper(c1, line1, directions.left)  // Step 6
interceptCircleLineSegHelper(circle, line, 0)             // Steps 14, 15, etc.
```

These choices select specific intersection points from potentially multiple valid solutions. When the entire construction is mirrored across a diagonal line, these directional choices must be systematically inverted to maintain geometric correctness.

A naive approach of simply flipping `left↔right` and `up↔down` globally **will break** because:
1. Some directions are relative to lines, not absolute
2. Index-based selections (0, 1) may need different handling
3. The geometry itself changes, so "left" in the original may not correspond to "right" in the mirror

## Solution: Transformation-Based Approach

### Core Idea

Instead of manually recreating all 94 steps with flipped directions, we apply a **geometric transformation** to the entire construction:

1. **Pre-compute** the mirror line (c2, cp4) from configuration parameters
2. **Transform** all initial points by reflecting them across this line
3. **Invert** all direction choices systematically
4. **Reuse** the existing step computation logic with transformed inputs

This ensures that the geometric relationships are preserved while achieving the mirror effect.

### Why This Works

Geometric reflection is a **structure-preserving transformation**:
- Lines reflect to lines
- Circles reflect to circles
- Intersection points reflect to intersection points
- Distances are preserved

By transforming the inputs and inverting the selection criteria, we get correct mirrored outputs from the same computation logic.

## Implementation Plan

### New Files to Create

```
app2/src/
├── geometry/
│   ├── transformations.ts          # Reflection utilities
│   ├── sixFoldV0MirrorSteps.ts     # Mirror step definitions
│   └── sixFold/
│       └── mirrorOperations.ts    # Mirror config & GEOM IDs
│
└── components/
    └── SixFoldV0MirrorSvg.tsx      # React component
```

### File 1: `transformations.ts`

Geometric transformation utilities.

```typescript
import type { Point, Line } from "../types/geometry";
import { point } from "../types/geometry";

/**
 * Reflect a point across a line defined by two points.
 * Uses the formula for reflection of a point across a line in 2D.
 */
export function reflectPointAcrossLine(
  p: Point,
  lineStart: Point,
  lineEnd: Point,
): Point {
  // Implementation using vector projection
  // Formula: p' = p - 2 * proj_n((p - p0)) * n
  // where n is the normal vector to the line
}

/**
 * Reflect a line across a mirror line.
 * Both endpoints are reflected.
 */
export function reflectLineAcrossLine(
  line: Line,
  mirrorStart: Point,
  mirrorEnd: Point,
): Line {
  const p1 = reflectPointAcrossLine(
    point(line.x1, line.y1),
    mirrorStart,
    mirrorEnd,
  );
  const p2 = reflectPointAcrossLine(
    point(line.x2, line.y2),
    mirrorStart,
    mirrorEnd,
  );
  return line(p1.x, p1.y, p2.x, p2.y);
}

/**
 * Mirror-aware direction constants.
 * When in mirror mode, directions are flipped.
 */
export const MIRROR_DIRECTIONS = {
  left: "right" as const,
  right: "left" as const,
  up: "down" as const,
  down: "up" as const,
} as const;

type MirrorDirections = typeof MIRROR_DIRECTIONS;
```

### File 2: `mirrorOperations.ts`

Configuration and constants for the mirror construction.

```typescript
import type { SixFoldV0Config } from "./operations";

// Mirror-specific geometry IDs (prefixed to avoid conflicts)
export const GEOM_MIRROR = {
  COORDINATE_SYSTEM: "mirror_cs",
  LINE1: "mirror_line1",
  P1: "mirror_p1",
  P2: "mirror_p2",
  CP1: "mirror_cp1",
  CP2: "mirror_cp2",
  C1: "mirror_c1",
  C2: "mirror_c2",
  // ... all other geometry IDs mirrored
  CP4: "mirror_cp4",
  // ... etc
} as const;

// Mirror configuration extends the original config with mirror line data
export interface SixFoldV0MirrorConfig extends SixFoldV0Config {
  mirrorLine: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  };
}

/**
 * Compute the mirror configuration.
 * Pre-computes the mirror line (cp2, cp4) from the base config.
 */
export function computeSixFoldV0MirrorConfig(
  width: number,
  height: number,
): SixFoldV0MirrorConfig {
  const baseConfig = computeSixFoldV0Config(width, height);
  
  // Compute cp2 position (from original construction)
  // cp2.x = border + lineLength * 3/8
  // cp2.y = height - border
  
  // Compute cp4 position analytically
  // This requires deriving the formula from steps 8-14
  
  return {
    ...baseConfig,
    mirrorLine: {
      x1: cp2.x,  // c2 center
      y1: cp2.y,
      x2: cp4.x,  // computed cp4
      y2: cp4.y,
    },
  };
}
```

**Note**: Computing cp4 analytically requires deriving the exact formulas from steps 8-14. See the [Analytical Computation](#analytical-computation-of-cp4) section below.

### File 3: `sixFoldV0MirrorSteps.ts`

Mirror step definitions. Two approaches:

#### Approach A: Transformed Steps (Recommended)

Each step wraps the original step's logic but applies transformations:

```typescript
import { reflectPointAcrossLine, MIRROR_DIRECTIONS } from "../transformations";
import { computeSingle } from "./operations";

// Example: Mirror of STEP_6 (cp2 as left intersection)
const MIRROR_STEP_6: SixFoldV0Step = {
  id: "mirror_step6",
  inputs: [GEOM_MIRROR.C1, GEOM_MIRROR.LINE1],
  outputs: [GEOM_MIRROR.CP2],
  parameters: [],
  compute: computeSingle(GEOM_MIRROR.CP2, (inputs, config) => {
    const c1 = getGeometry(inputs, GEOM_MIRROR.C1, isCircle, "Circle");
    const line1 = getGeometry(inputs, GEOM_MIRROR.LINE1, isLine, "Line");
    
    // Use RIGHT instead of LEFT (mirrored direction)
    const cp2 = interceptCircleLineDirHelper(
      c1,
      line1,
      directions[MIRROR_DIRECTIONS.left]  // = directions.right
    );
    
    if (!cp2) throw new Error("MIRROR_STEP_6: intersection not found");
    return cp2;
  }),
  draw: (svg, values, store, theme) => {
    drawPoint(svg, values, GEOM_MIRROR.CP2, 2.0, store, theme);
  },
};
```

#### Approach B: Mirror-Transformed Inputs

Transform all input geometry before passing to original step logic:

```typescript
const MIRROR_STEP_6: SixFoldV0Step = {
  id: "mirror_step6",
  inputs: [GEOM_MIRROR.C1, GEOM_MIRROR.LINE1, "mirror_line"],
  outputs: [GEOM_MIRROR.CP2],
  parameters: [],
  compute: computeSingle(GEOM_MIRROR.CP2, (inputs, config) => {
    // Transform inputs back to original space
    const mirrorLine = inputs.get("mirror_line") as Line;
    const c1 = getGeometry(inputs, GEOM_MIRROR.C1, isCircle, "Circle");
    const line1 = getGeometry(inputs, GEOM_MIRROR.LINE1, isLine, "Line");
    
    // Reflect geometry back to original coordinate system
    const c1Original = reflectCircleAcrossLine(c1, 
      point(mirrorLine.x1, mirrorLine.y1),
      point(mirrorLine.x2, mirrorLine.y2)
    );
    const line1Original = reflectLineAcrossLine(line1, 
      point(mirrorLine.x1, mirrorLine.y1),
      point(mirrorLine.x2, mirrorLine.y2)
    );
    
    // Use original step logic
    const cp2Original = interceptCircleLineDirHelper(
      c1Original,
      line1Original,
      directions.left
    );
    
    // Reflect result back to mirror space
    return reflectPointAcrossLine(
      cp2Original,
      point(mirrorLine.x1, mirrorLine.y1),
      point(mirrorLine.x2, mirrorLine.y2)
    );
  }),
  draw: (svg, values, store, theme) => {
    drawPoint(svg, values, GEOM_MIRROR.CP2, 2.0, store, theme);
  },
};
```

**Recommendation**: Use Approach A (Transformed Steps) because:
- More explicit and easier to debug
- Each step is self-contained
- Better performance (no double transformation)
- Easier to verify correctness

### File 4: `SixFoldV0MirrorSvg.tsx`

React component mirroring the original:

```typescript
import { useEffect, useRef, useMemo, forwardRef } from "react";
import type { Ref } from "react";
import type { SvgConfig } from "../config/svgConfig";
import type { GeometryStore } from "../react-store";
import { clearGeometryFromSvg } from "../svgElements";
import { pick, setupSvg, buildStepMaps } from "../svg";
import { useThemeAwareSteps } from "../hooks/useThemeAwareSteps";
import { darkTheme } from "../themes";
import type { Theme } from "../themes";
import type { SixFoldV0MirrorStep } from "../geometry/sixFold/mirrorOperations";
import { SIX_FOLD_V0_MIRROR_STEPS, executeSteps } from "../geometry/sixFoldV0MirrorSteps";
import { computeSixFoldV0MirrorConfig } from "../geometry/sixFold/mirrorOperations";

export interface SixFoldV0MirrorSvgProps {
  store: GeometryStore;
  dotStrokeWidth?: number;
  svgConfig: SvgConfig;
  restartTrigger?: number;
  currentStep?: number;
  theme?: Theme;
}

export const SixFoldV0MirrorSvg = forwardRef(function SixFoldV0MirrorSvg(
  {
    store,
    dotStrokeWidth = 2.0,
    svgConfig,
    restartTrigger = 0,
    currentStep = 0,
    theme = darkTheme,
  }: SixFoldV0MirrorSvgProps,
  ref: Ref<SVGSVGElement | null>,
): React.JSX.Element {
  const svgRef = useRef<SVGSVGElement>(null);
  
  // Forward ref
  useEffect(() => {
    if (!ref) return;
    if (typeof ref === "function") {
      ref(svgRef.current);
    } else {
      ref.current = svgRef.current;
    }
  }, [ref]);

  const { shouldClear } = useThemeAwareSteps({
    currentStep,
    restartTrigger,
    theme,
  });

  const config = useMemo(() => {
    return computeSixFoldV0MirrorConfig(svgConfig.width, svgConfig.height);
  }, [svgConfig.width, svgConfig.height]);

  // Setup SVG and execute steps (same pattern as original)
  useEffect(() => {
    if (!svgRef.current) return;
    const svg = svgRef.current;
    
    setupSvg(svg, svgConfig);
    rect(svg, svgConfig.width, svgConfig.height, theme);
  }, [svgConfig.width, svgConfig.height, svgConfig.viewBox, theme]);

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = svgRef.current;

    if (shouldClear) {
      clearGeometryFromSvg(svg);
      store.clear();
    }

    if (currentStep <= 0) return;

    try {
      const allValues = executeSteps(
        SIX_FOLD_V0_MIRROR_STEPS,
        currentStep,
        { svg, store, theme },
        config
      );

      if (currentStep > 0) {
        const { stepDependencies, stepForOutput } = buildStepMaps(
          SIX_FOLD_V0_MIRROR_STEPS,
          currentStep
        );

        for (const id of allValues.keys()) {
          const deps = stepDependencies.get(id) ?? [];
          const step = stepForOutput.get(id) as SixFoldV0MirrorStep | undefined;
          const paramValues = step?.parameters ? pick(config, step.parameters) : {};
          const stepId = step?.id ?? "";

          store.update(id, {
            dependsOn: deps,
            stepId,
            parameterValues: paramValues,
          });
        }
      }
    } catch (error) {
      console.error("SixFoldV0MirrorSvg construction failed:", error);
    }
  }, [currentStep, restartTrigger, svgConfig, theme, config, dotStrokeWidth, shouldClear]);

  return <svg ref={svgRef} className={`${svgConfig.svgClass} block`} data-testid="sixfoldv0-mirror-svg" />;
});
```

## Analytical Computation of cp4

To compute the mirror line without running the full construction, we need to derive cp4's position from the configuration.

### Given Configuration:
```
border = height / 3
lineLength = width - 2 * border
radius = lineLength / 4  // From CUT_LINE_BY = 8, radius = (lineLength * 2) / 8

p1 = (border, height - border)
p2 = (width - border, height - border)
cp1 = (border + lineLength * 5/8, height - border)
cp2 = (border + lineLength * 3/8, height - border)  // cp1 - radius
```

### Step 8: pic12
```
// Intersection of c1 and c2 going UP
// Distance between cp1 and cp2 = radius
// Two circles with distance = radius intersect at 60°
// UP intersection (lower y in SVG coordinates)

pic12.x = (cp1.x + cp2.x) / 2 = border + lineLength * 4/8 = border + lineLength / 2
pic12.y = cp1.y - radius * √3 / 2 = (height - border) - (lineLength / 4) * √3 / 2
```

### Step 9: cPic12
```
// Circle at pic12 with same radius
cPic12 = (pic12.x, pic12.y, radius)
```

### Step 10: p3
```
// p3 = bisectCircleAndPoint(cPic12, cp2)
// This extends line from cPic12 center through cp2 to circle boundary

// Vector from cPic12 center to cp2:
dx = cp2.x - pic12.x = (border + 3/8*LL) - (border + 4/8*LL) = -LL/8
dy = cp2.y - pic12.y = 0 - (-radius*√3/2) = radius*√3/2 = (LL/4)*√3/2 = LL*√3/8

// Angle from cPic12 to cp2:
angle = atan2(dy, dx) = atan2(LL*√3/8, -LL/8) = atan2(√3, -1) = 2π/3 (120°)

// bisectCircleAndPoint doubles this angle:
doubleAngle = 2 * 120° = 240°

// Point on circle at 240° from center:
p3.x = cPic12.cx + radius * cos(240°) = pic12.x + radius * (-1/2)
p3.y = cPic12.cy + radius * sin(240°) = pic12.y + radius * (-√3/2)
```

### Step 13: L13
```
// Line from cp1 to p3
L13 = line(cp1.x, cp1.y, p3.x, p3.y)
```

### Step 14: cp4
```
// cp4 = interceptCircleLineSegHelper(c1, L13, 0)
// Intersection of circle c1 with line L13, at index 0

// Solve: circle centered at cp1 with radius r
// Line from cp1 to p3
// Since cp1 is the center of c1, and p3 is outside c1 (distance > radius),
// the line L13 passes through cp1 and extends to p3
// The intersection points are at distance radius from cp1 along L13

// cp4 is the first intersection point (index 0) on the segment from cp1 to p3
// This is the point at distance radius from cp1 toward p3

// Unit vector from cp1 to p3:
dx = p3.x - cp1.x
dy = p3.y - cp1.y
len = sqrt(dx² + dy²)

cp4.x = cp1.x + (dx / len) * radius
cp4.y = cp1.y + (dy / len) * radius
```

### Final Mirror Line:
```
mirrorLine.x1 = cp2.x = border + 3/8 * lineLength
mirrorLine.y1 = cp2.y = height - border
mirrorLine.x2 = cp4.x  // computed above
mirrorLine.y2 = cp4.y  // computed above
```

## Verification Strategy

1. **Unit Tests**: Create tests that verify:
   - `reflectPointAcrossLine` produces correct results for known inputs
   - Mirror steps execute without errors for all step indices
   - Output geometry IDs match expected mirror IDs

2. **Visual Verification**:
   - Render both SixFoldV0 and SixFoldV0Mirror
   - Overlay them with the mirror line drawn
   - Verify symmetry: for each point in original, its mirror should exist in the mirror construction

3. **Geometric Invariants**:
   - Distance between mirrored points should equal distance between original points
   - Lines in mirror should be mirror images of lines in original
   - Circle centers and radii should be preserved under mirroring

## Success Criteria

- [ ] Spec document approved by human
- [ ] All new files created and committed
- [ ] Code compiles without errors
- [ ] All steps (0-93) execute successfully
- [ ] Visual symmetry verified
- [ ] No changes to existing SixFoldV0 files
- [ ] PR created and submitted

## Open Questions

1. **Q: Should we reuse the same store for both constructions, or use separate stores?**
   - A: Use separate stores to avoid ID conflicts (GEOM IDs are prefixed with "mirror_")

2. **Q: How to handle the coordinate system in the mirror construction?**
   - A: The coordinate system should also be mirrored, but this might be visually confusing. Alternative: keep the coordinate system in the same orientation and only mirror the construction geometry.

3. **Q: What about the outline colors - should they match the original or be different?**
   - A: Use the same color scheme for consistency.

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Direction flipping breaks implicit choices | Use Approach A (explicit per-step direction inversion) |
| cp4 computation is incorrect | Verify analytically, test with known values |
| Performance issues with 94 mirrored steps | Optimize transformation functions, cache results |
| Geometry ID conflicts | Prefix all mirror IDs with "mirror_" |
| Mirror line computation error | Derive formulas carefully, add validation |

---

*Status: Ready for human review*
*Next Step: Human approval → Implementation*
