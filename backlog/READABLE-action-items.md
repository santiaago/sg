# Square Component - Action Items - UPDATED

> **Companion to READABLE.md** - Specific, actionable improvements with file locations and code snippets.
> **Last Updated**: April 2025 - Reflects current codebase state after SixFoldV0 creation and graph.md analysis.

---

## 🎯 PRIORITY 0: CRITICAL CLEANUP (Do Now)

These items are blocking progress and should be addressed **immediately** before any new development.

---

### Action 0.1: Delete Old SixFold Versions

**Problem**: Multiple versions of SixFold component causing confusion.

**Current State**:

- `SixFold.tsx` - 883-line monolithic anti-pattern
- `SixFoldV0.tsx` - 134-line step-pattern implementation (GOLD STANDARD)
- `SixFoldv2.tsx` - 911-line wrapper
- `SixFoldv3.tsx` - 911-line wrapper
- `SixFoldv4.tsx` - 911-line wrapper

**Solution**: Delete all old versions, keep only SixFoldV0 as SixFold.

```bash
# Delete these files:
rm app2/src/components/SixFold.tsx
rm app2/src/components/SixFoldv2.tsx
rm app2/src/components/SixFoldv3.tsx
rm app2/src/components/SixFoldv4.tsx

# Rename SixFoldV0 to SixFold:
mv app2/src/components/SixFoldV0.tsx app2/src/components/SixFold.tsx
```

**Files to update**:

- Any imports of old SixFold versions
- App.tsx or parent components
- GeometryList.tsx (if it references SixFold)

**Effort**: 1 hour
**Impact**: Eliminates confusion, removes technical debt
**Status**: ⚠️ NOT DONE

---

### Action 0.2: Consolidate SixFoldV0 Store

**Problem**: Yet another store implementation was added (`useGeometryStoreSixFoldV0`) in react-store.ts, making the fragmentation worse.

**Current State**: react-store.ts now has:

- `GeometryStore` interface
- `GeometryStorev2v3v4` interface
- `GeometryValueStore` interface (unused)
- `GeometryStoreEnhanced` interface (unused)
- `useGeometryStore()` hook
- `useGeometryStoreSquare()` hook - IDENTICAL to useGeometryStore()
- `useGeometryStorev2()` hook
- `useGeometryStorev3()` hook - alias to v2
- `useGeometryStorev4()` hook - alias to v2
- `useGeometryStoreSixFoldV0()` hook - IDENTICAL to useGeometryStore()

**Solution**: Delete all duplicate implementations, keep only one unified version.

**File**: `app2/src/react-store.ts`

**Implementation**: See Priority 1 (Store Consolidation) below - this is part of the larger consolidation effort.

**Effort**: 30 minutes (just delete the duplicates)
**Impact**: Reduces confusion
**Status**: ⚠️ NOT DONE

---

## 🔴 PRIORITY 1: STORE CONSOLIDATION (HIGH - URGENT)

> **This was Priority 1 in the original report and is STILL NOT DONE. In fact, it's gotten worse with more variants added.**

### Current Issues

**File**: `app2/src/react-store.ts`

1. **8+ different store implementations** exist (lines 6-292):
   - Multiple interfaces: GeometryStore, GeometryStorev2v3v4, GeometryValueStore, GeometryStoreEnhanced
   - Multiple hooks: useGeometryStore, useGeometryStoreSquare, useGeometryStorev2, useGeometryStorev3, useGeometryStorev4, useGeometryStoreSixFoldV0
   - Duplicate code between versions

2. **Identical implementations**:
   - `useGeometryStore()` and `useGeometryStoreSquare()` are **100% IDENTICAL** (lines 172-208 vs 208-244)
   - `useGeometryStorev3()` and `useGeometryStorev4()` are aliases to v2
   - `useGeometryStoreSixFoldV0()` is identical to useGeometryStore()

3. **Type safety issues**:
   ```typescript
   // Line 9-11 (GeometryItem interface):
   element: any;      // Should be SVGElement | null
   type: string;      // Should be GeometryType
   context?: any;     // Should be typed or removed
   ```

---

### Action: Consolidate to Single Store

**Replace entire file with**:

```typescript
/**
 * Unified geometry store for managing SVG elements, their state, and dependency tracking.
 *
 * This single store replaces all previous versions:
 * - useGeometryStore (original)
 * - useGeometryStoreSquare
 * - useGeometryStorev2, v3, v4
 * - useGeometryStoreSixFoldV0
 * - GeometryStoreEnhanced
 *
 * All components should use this single hook.
 */

import { useState, useCallback, useMemo } from "react";
import type { GeometryValue } from "../types/geometry";
import type { DependencyGraph, GeometryNode, DependencyEdge } from "../types/geometry";

// Define GeometryType from GeometryValue
export type GeometryType = GeometryValue["type"]; // "point" | "line" | "circle" | "rectangle" | "polygon"

/**
 * A single geometry item stored in the store.
 * Represents an SVG element with its geometry data and dependency tracking.
 */
export interface GeometryItem {
  name: string;
  element: SVGElement | null;
  selected: boolean;
  type: GeometryType;
  initialState?: Record<string, string>;
  dependsOn: string[];
  stepId: string;
  parameterValues: Record<string, unknown>;
  context?: Record<string, unknown>;
}

/**
 * The unified geometry store interface.
 * Provides all functionality from previous versions in a single, cohesive API.
 */
export interface GeometryStore {
  /** All geometry items stored in the store (Map for efficient lookup) */
  items: Map<string, GeometryItem>;

  /**
   * Add or update a geometry item.
   * @param name - Unique identifier for this geometry
   * @param element - The SVG element
   * @param type - The geometry type (point, line, circle, etc.)
   * @param options - Additional metadata
   */
  set: (
    name: string,
    element: SVGElement,
    type: GeometryType,
    options?: {
      dependsOn?: string[];
      stepId?: string;
      parameterValues?: Record<string, unknown>;
      context?: Record<string, unknown>;
    },
  ) => void;

  /** Get a geometry item by name */
  get: (name: string) => GeometryItem | undefined;

  /** Remove a geometry item by name */
  remove: (name: string) => void;

  /** Clear all geometry items */
  clear: () => void;

  /** Get all items as an array */
  getAll: () => GeometryItem[];

  /** Get all geometries of a specific type */
  getByType: (type: GeometryType) => GeometryItem[];

  /** Get all geometries created by a specific step */
  getByStep: (stepId: string) => GeometryItem[];

  /** Get the complete dependency graph for visualization */
  getDependencyGraph: () => DependencyGraph;
}

// Attributes to preserve for each geometry type
const ATTRIBUTES_TO_PRESERVE: Record<GeometryType, string[]> = {
  point: ["fill", "r", "cx", "cy"],
  line: ["stroke", "stroke-width", "x1", "y1", "x2", "y2"],
  circle: ["stroke", "stroke-width", "cx", "cy", "r"],
  polygon: ["stroke", "stroke-width", "fill", "points"],
  rectangle: ["stroke", "stroke-width", "fill", "x", "y", "width", "height"],
} as const;

// Capture the initial state of an SVG element by preserving relevant attributes.
// This allows restoring the element's appearance after interactions.
function captureInitialState(element: SVGElement, type: GeometryType): Record<string, string> {
  const initialState: Record<string, string> = {};
  const attributes = ATTRIBUTES_TO_PRESERVE[type] ?? [];

  attributes.forEach((attr) => {
    try {
      const value = element?.getAttribute?.(attr);
      if (value) {
        initialState[attr] = value;
      }
    } catch {
      // Silently skip attributes that don't exist
    }
  });

  return initialState;
}

/**
 * The unified geometry store hook.
 * Replaces: useGeometryStore, useGeometryStoreSquare, useGeometryStorev2-4,
 *          useGeometryValueStore, useGeometryStoreEnhanced, useGeometryStoreSixFoldV0
 */
export function useGeometryStore(): GeometryStore {
  const [items, setItems] = useState<Map<string, GeometryItem>>(new Map());

  const set = useCallback(
    (
      name: string,
      element: SVGElement,
      type: GeometryType,
      options: {
        dependsOn?: string[];
        stepId?: string;
        parameterValues?: Record<string, unknown>;
        context?: Record<string, unknown>;
      } = {},
    ) => {
      setItems((prev) => {
        const newItems = new Map(prev);
        const initialState = captureInitialState(element, type);
        const existingItem = prev.get(name);

        newItems.set(name, {
          name,
          element,
          selected: existingItem?.selected ?? false,
          type,
          initialState:
            Object.keys(initialState).length > 0 ? initialState : existingItem?.initialState,
          dependsOn: existingItem?.dependsOn ?? options.dependsOn ?? [],
          stepId: options.stepId ?? "",
          parameterValues: options.parameterValues ?? {},
          context: options.context,
        });

        return newItems;
      });
    },
    [],
  );

  const get = useCallback(
    (name: string): GeometryItem | undefined => {
      return items.get(name);
    },
    [items],
  );

  const remove = useCallback((name: string) => {
    setItems((prev) => {
      const newItems = new Map(prev);
      newItems.delete(name);
      return newItems;
    });
  }, []);

  const clear = useCallback(() => {
    setItems(new Map());
  }, []);

  const getAll = useCallback((): GeometryItem[] => {
    return Array.from(items.values());
  }, [items]);

  const getByType = useCallback(
    (type: GeometryType): GeometryItem[] => {
      return Array.from(items.values()).filter((item) => item.type === type);
    },
    [items],
  );

  const getByStep = useCallback(
    (stepId: string): GeometryItem[] => {
      return Array.from(items.values()).filter((item) => item.stepId === stepId);
    },
    [items],
  );

  const getDependencyGraph = useCallback((): DependencyGraph => {
    const nodes: GeometryNode[] = Array.from(items.values()).map((item) => ({
      id: item.name,
      type: item.type,
      value: undefined, // We don't store GeometryValue in this store
      dependsOn: item.dependsOn,
    }));

    const edges: DependencyEdge[] = [];
    for (const [name, item] of items) {
      for (const depId of item.dependsOn) {
        edges.push({
          source: depId,
          target: name,
        });
      }
    }

    return { nodes, edges };
  }, [items]);

  // Return memoized store object
  return useMemo(
    () => ({
      items,
      set,
      get,
      remove,
      clear,
      getAll,
      getByType,
      getByStep,
      getDependencyGraph,
    }),
    [items, set, get, remove, clear, getAll, getByType, getByStep, getDependencyGraph],
  );
}

// Export the unified hook as default for convenience
export default useGeometryStore;

// Deprecation notice (can be removed after migration):
// TODO: Remove these after all components are migrated to useGeometryStore
// - useGeometryStoreSquare (identical to useGeometryStore)
// - useGeometryStorev2, useGeometryStorev3, useGeometryStorev4
// - useGeometryStoreSixFoldV0 (identical to useGeometryStore)
// - GeometryStorev2v3v4, GeometryValueStore, GeometryStoreEnhanced interfaces
```

### Files to Update After Consolidation

All components currently using specific store versions need to import from the unified store:

1. **Square.tsx** (line 3):

   ```typescript
   // FROM:
   import type { GeometryStore } from "../react-store";

   // TO: (no change needed - import is the same)
   import type { GeometryStore } from "../react-store";
   ```

2. **SixFold.tsx** (formerly SixFoldV0.tsx):

   ```typescript
   // FROM:
   import type { GeometryStore } from "../react-store";

   // TO: (no change needed)
   import type { GeometryStore } from "../react-store";
   ```

3. **Any other components** using specific store versions need to update their imports.

### Migration Strategy

1. Create the new unified implementation (above)
2. Update all imports in components to use the unified store
3. Remove all old implementations
4. Run tests to catch any issues

**Effort**: 2-4 hours (mostly updating imports and testing)
**Impact**: ~400 lines removed, eliminates confusion, improves type safety
**Status**: ⚠️ NOT DONE (CRITICAL)

---

## 🟡 PRIORITY 2: NAMING IMPROVEMENTS (HIGH)

### Action 2.1: Improve Geometry Naming in operations.ts

**Problem**: GEOM constants use cryptic abbreviations that are hard to understand.

**File**: `app2/src/geometry/operations.ts` (lines 167-195)

**Current code**:

```typescript
export const GEOM = {
  MAIN_LINE: "line_main",
  C1: "c1",
  C2: "c2",
  C1_CIRCLE: "c1_c",
  C2_CIRCLE: "c2_c",
  INTERSECTION_POINT: "pi",
  INTERSECTION_CIRCLE: "ci",
  P3: "p3",
  P4: "p4",
  PL: "pl",
  PR: "pr",
  LINE_C2_PI: "line_c2_pi",
  LINE_C1_PI: "line_c1_pi",
  LINE_C2_P4: "line_c2_p4",
  LINE_C1_P3: "line_c1_p3",
  SQUARE: "square",
} as const;
```

**Recommended changes**:

```typescript
export const GEOM = {
  // Base reference line
  MAIN_LINE: "main_line",

  // Circle centers (points on the main line)
  CIRCLE_CENTER_RIGHT: "circle_center_right", // Was C1
  CIRCLE_CENTER_LEFT: "circle_center_left", // Was C2

  // Circle outlines
  CIRCLE_RIGHT: "circle_right", // Was C1_CIRCLE
  CIRCLE_LEFT: "circle_left", // Was C2_CIRCLE

  // Intersection of the two circles
  INTERSECTION_POINT: "intersection_point", // Was PI
  INTERSECTION_CIRCLE: "intersection_circle", // Was CI

  // Points at the top of the construction (from angle bisectors)
  TOP_LEFT_POINT: "top_left_point", // Was P4
  TOP_RIGHT_POINT: "top_right_point", // Was P3

  // Tangent points where lines from circle centers intersect the circles
  TANGENT_LEFT: "tangent_left", // Was PL
  TANGENT_RIGHT: "tangent_right", // Was PR

  // Lines from circle centers to intersection point
  LINE_RIGHT_CENTER_TO_INTERSECTION: "line_right_center_to_intersection", // Was LINE_C1_PI
  LINE_LEFT_CENTER_TO_INTERSECTION: "line_left_center_to_intersection", // Was LINE_C2_PI

  // Lines from circle centers to top points
  LINE_RIGHT_CENTER_TO_TOP_LEFT: "line_right_center_to_top_left", // Was LINE_C1_P3
  LINE_LEFT_CENTER_TO_TOP_RIGHT: "line_left_center_to_top_right", // Was LINE_C2_P4

  // Final result
  SQUARE: "square",
} as const;
```

**Required**: Update ALL references to these constants across the codebase:

- `app2/src/geometry/squareSteps.ts` - All step definitions use these constants
- `app2/src/components/Square.tsx` - May reference some directly
- Any tests that reference GEOM constants
- Any documentation

**Search pattern**: Search for `GEOM.C1`, `GEOM.PI`, `GEOM.P3`, `GEOM.P4`, `GEOM.PL`, `GEOM.PR`, etc.

**Effort**: 1-2 hours
**Impact**: Significantly improves code readability and maintainability
**Status**: ⚠️ NOT DONE

---

## 🟡 PRIORITY 3: TYPE SAFETY IMPROVEMENTS (HIGH)

### Action 3.1: Fix Type Safety in react-store.ts

**Problem**: GeometryItem interface uses loose types.

**File**: `app2/src/react-store.ts` (lines 9-17)

**Current code**:

```typescript
export interface GeometryItem {
  name: string;
  element: any; // ❌ Should be SVGElement | null
  selected: boolean;
  type: string; // ❌ Should be GeometryType
  context?: any; // ❌ Should be typed or removed
  initialState?: Record<string, string>;
  dependsOn: string[];
  stepId: string;
  parameterValues: Record<string, unknown>;
}
```

**Recommended changes** (part of the consolidation in Priority 1):

```typescript
import type { GeometryValue } from "../types/geometry";

export type GeometryType = GeometryValue["type"];

export interface GeometryItem {
  name: string;
  element: SVGElement | null; // ✅ Typed
  selected: boolean;
  type: GeometryType; // ✅ Typed
  context?: Record<string, unknown>; // ✅ Typed
  initialState?: Record<string, string>;
  dependsOn: string[];
  stepId: string;
  parameterValues: Record<string, unknown>;
}
```

**Effort**: 1-2 hours (as part of consolidation)
**Impact**: Better type safety, catches errors at compile time
**Status**: ⚠️ NOT DONE

---

### Action 3.2: Fix Tooltip Type Extensions

**Problem**: Global type extensions only cover SVGCircleElement and SVGLineElement, but SVGPolygonElement also needs tooltips.

**File**: `app2/src/svgElements.ts` (lines 30-37)

**Current code**:

```typescript
declare global {
  interface SVGCircleElement {
    tooltip?: SVGTextElement;
    tooltipBg?: SVGRectElement;
  }
  interface SVGLineElement {
    tooltip?: SVGTextElement;
    tooltipBg?: SVGRectElement;
  }
}
```

**Options**:

**Option A**: Add SVGPolygonElement to global type extensions

```typescript
declare global {
  interface SVGCircleElement {
    tooltip?: SVGTextElement;
    tooltipBg?: SVGRectElement;
  }
  interface SVGLineElement {
    tooltip?: SVGTextElement;
    tooltipBg?: SVGRectElement;
  }
  interface SVGPolygonElement {
    tooltip?: SVGTextElement;
    tooltipBg?: SVGRectElement;
  }
}
```

**Option B**: Use WeakMap approach (RECOMMENDED - cleaner, more maintainable)

```typescript
// In svgElements.ts - REPLACE the global type extensions

const tooltipMap = new WeakMap<
  SVGElement,
  { tooltip: SVGTextElement; tooltipBg: SVGRectElement }
>();

/**
 * Get tooltip elements for an SVG element.
 */
export function getTooltip(
  element: SVGElement,
): { tooltip: SVGTextElement; tooltipBg: SVGRectElement } | undefined {
  return tooltipMap.get(element);
}

/**
 * Set tooltip elements for an SVG element.
 */
export function setTooltip(
  element: SVGElement,
  tooltip: SVGTextElement,
  tooltipBg: SVGRectElement,
): void {
  tooltipMap.set(element, { tooltip, tooltipBg });
}

// Then update draw functions to use these helpers:

// In drawPoint, drawLine, drawCircle, circleWithTooltip, etc.
// BEFORE:
dotElement.tooltip = tooltip;
dotElement.tooltipBg = tooltipBg;

// AFTER:
setTooltip(dotElement, tooltip, tooltipBg);

// In geometry/squareSteps.ts line 500-501:
// BEFORE:
(svgPolygon as any).tooltip = tooltip;
(svgPolygon as any).tooltipBg = tooltipBg;

// AFTER:
import { setTooltip } from "../svgElements";
// ...
setTooltip(svgPolygon, tooltip, tooltipBg);
```

**Effort**: 1 hour
**Impact**: Type safety, cleaner code, supports all SVG element types
**Status**: ⚠️ NOT DONE
**Recommendation**: Option B (WeakMap)

---

## 🟡 PRIORITY 4: SIXFOLDV0STEPS OPTIMIZATION (MEDIUM)

### Action 4.1: Remove Pass-through Step

**Problem**: Step 7 in sixFoldV0Steps.ts is a pass-through that serves no computational purpose.

**File**: `app2/src/geometry/sixFoldV0Steps.ts` (STEP_7)

**Current code**:

```typescript
const STEP_7: SixFoldV0Step = {
  id: "step7",
  inputs: [GEOM.PI2],
  outputs: [GEOM.PI2], // Same as input!
  parameters: [],
  compute: computeSingle(GEOM.PI2, (inputs) => {
    const pi2 = getGeometry(inputs, GEOM.PI2, isPoint, "Point");
    return pi2; // Just returns the input value
  }),
  draw: (svg, values, store, theme) => {
    // Empty draw function
  },
};
```

**Solution**: Delete STEP_7 entirely and remove it from the SIX_FOLD_V0_STEPS array.

**Impact**: PI2 from step6 is already available for any steps that need it.

**Effort**: 5 minutes
**Status**: ⚠️ NOT DONE

---

### Action 4.2: Remove Unused Geometries

**Problem**: 23 geometries are produced but never consumed as inputs (identified in graph.md).

**File**: `app2/src/geometry/sixFoldV0Steps.ts`

**Geometries to remove from outputs**:

1. **Step 1**: Remove `LINE1`, `P1`, `P2` from outputs (these are just the line coordinates, available via config params)
2. **Step 2**: Remove `CIRCLE_AT_INTERSECTION`, `P3`, `P4` (intermediate computation values)
3. **Step 13**: Remove `C23W`, `L14P`
4. **Step 14**: Remove `CPI12`, `C34N`, `LPIC12C34N`, `C34E`
5. **Step 15**: Remove `PP`, `L1`
6. **Step 16**: Remove `LPII1PII2`
7. **Step 17**: Remove `C2_D3`, `C3_D3`, `C4_D3`
8. **Step 21**: Remove `PIC34`
9. **Step 22**: Remove `PIC23`
10. **Base**: `PC23`, `PC34` (if not used)

**Note**: These geometries are still DRAWN (they have draw calls), but they don't need to be OUTPUTS if they're not used as inputs to later steps.

**Decision needed**: Should geometries that are only drawn (not used computationally) be:

- A) Removed from outputs (cleaner, matches squareSteps philosophy)
- B) Kept as outputs (more explicit, allows for debugging)

**Recommendation**: Option A - Remove them to match squareSteps' clean design.

**Effort**: 2-4 hours
**Impact**: Cleaner code, better performance, easier maintenance
**Status**: ⚠️ NOT DONE

---

### Action 4.3: Fix Redundant Re-computation

**Problem**: L13 and L24 are computed in both step2 and step6.

**File**: `app2/src/geometry/sixFoldV0Steps.ts`

**Current state**:

- Step 2: Computes L13 and L24 as intermediate values
- Step 6: Recomputes L13 and L24 as outputs

**Solution**: Remove L13 and L24 from step2's outputs (keep them as intermediate computation), and keep them only in step6 where they're needed as outputs.

**Effort**: 30 minutes
**Impact**: Improved efficiency
**Status**: ⚠️ NOT DONE

---

## 🟡 PRIORITY 5: DOCUMENTATION STANDARDIZATION (MEDIUM)

**Goal**: Every file should have file-level JSDoc. Every exported function/type should have JSDoc.

**Gold Standard**: `app2/src/svg.ts` - Follow this pattern.

### Files Needing JSDoc

#### react-store.ts (After Consolidation)

Add file-level JSDoc and improve existing documentation:

```typescript
/**
 * Unified React hook for managing geometry SVG elements and their dependency tracking.
 *
 * This module provides a single store implementation that replaces all previous
 * fragmented versions (v1, v2, v3, v4, Square, SixFoldV0).
 *
 * Features:
 * - Efficient Map-based storage for geometry items
 * - Dependency tracking for geometry relationships
 * - Support for all geometry types (point, line, circle, polygon, rectangle)
 * - Attribute preservation for SVG elements
 * - Step-based dependency graph generation
 */

// ... existing code ...
```

Add JSDoc to all interface members and functions.

**Effort**: 30 minutes
**Status**: ⚠️ NOT DONE

---

#### svgElements.ts

**Current state**: Some functions have JSDoc, some don't.

**Missing JSDoc**:

- `createTooltip` (line 32)
- `dot` (line 81)
- `line` (line 95)
- `circle` (line 111)

** Already have JSDoc**:

- `rect` ✅
- `clearGeometryFromSvg` ✅
- `drawPoint` ✅
- `drawLine` ✅
- `drawCircle` ✅
- `dotWithTooltip` ✅
- `lineWithTooltip` ✅
- `circleWithTooltip` ✅

**Effort**: 1 hour
**Status**: ⚠️ PARTIAL

---

#### operations.ts

**Current state**: Has file-level JSDoc, but some functions need improvement.

**Missing/Incomplete JSDoc**:

- `computeCircleIntersection` - Add detailed JSDoc
- `computeBisectedPoints` - Add detailed JSDoc
- `computeTangentPoints` - Add detailed JSDoc
- `computeAllPoints` - Add detailed JSDoc
- `createInitialGeometries` - Add detailed JSDoc
- `GEOM` constant - Needs better documentation

**Effort**: 1-2 hours
**Status**: 🟡 PARTIAL (file-level added, function-level needs improvement)

---

#### squareSteps.ts

**Current state**: Each step has good header comments, but utilities need JSDoc.

**Missing JSDoc**:

- Step execution context needs documentation
- `executeStep` function
- `executeSteps` function

**Effort**: 1 hour
**Status**: ⚠️ NOT DONE

---

#### sixFoldV0Steps.ts

**Current state**: Each step has header comments, but needs:

- File-level JSDoc
- Step utilities JSDoc
- Type definitions JSDoc

**Effort**: 1 hour
**Status**: ⚠️ NOT DONE

---

## 🟡 PRIORITY 6: ERROR HANDLING IMPROVEMENTS (MEDIUM)

### Action 6.1: Create Custom Error Classes

**File**: `app2/src/errors.ts` (NEW FILE)

```typescript
/**
 * Geometry-related error classes for consistent error handling.
 *
 * All geometry operations should throw appropriate error types from this module.
 */

/**
 * Base error class for geometry-related errors.
 * Provides consistent structure for error information.
 */
export class GeometryError extends Error {
  public readonly stepId?: string;
  public readonly geometryId?: string;
  public readonly cause?: Error;

  constructor(message: string, options?: { stepId?: string; geometryId?: string; cause?: Error }) {
    super(message);
    this.name = this.constructor.name;
    this.stepId = options?.stepId;
    this.geometryId = options?.geometryId;
    this.cause = options?.cause;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Thrown when a required geometry is missing from the input values.
 * This typically indicates a step dependency issue.
 */
export class MissingGeometryError extends GeometryError {
  constructor(geometryId: string, stepId: string) {
    super(`Missing geometry: "${geometryId}" (required by step: "${stepId}")`, {
      geometryId,
      stepId,
    });
    this.name = this.constructor.name;
  }
}

/**
 * Thrown when a geometry value has an unexpected type.
 * This indicates a type mismatch between what a step expects and what it receives.
 */
export class TypeMismatchError extends GeometryError {
  public readonly expectedType: string;
  public readonly actualType: string;

  constructor(expectedType: string, actualType: string, geometryId: string, stepId?: string) {
    super(`Type mismatch for "${geometryId}": expected ${expectedType}, got ${actualType}`, {
      geometryId,
      stepId,
    });
    this.name = this.constructor.name;
    this.expectedType = expectedType;
    this.actualType = actualType;
  }
}

/**
 * Thrown when two geometries do not intersect as expected.
 * Used for circle-circle, circle-line, and line-line intersections.
 */
export class IntersectionNotFoundError extends GeometryError {
  public readonly geometry1: string;
  public readonly geometry2: string;

  constructor(geometry1: string, geometry2: string, stepId?: string) {
    super(`No intersection found between "${geometry1}" and "${geometry2}"`, { stepId });
    this.name = this.constructor.name;
    this.geometry1 = geometry1;
    this.geometry2 = geometry2;
  }
}

/**
 * Thrown when a geometric computation fails.
 * Wrapper for unexpected errors during geometry calculations.
 */
export class ComputationError extends GeometryError {
  public readonly operation: string;

  constructor(operation: string, message: string, stepId?: string, cause?: Error) {
    super(`Computation failed [${operation}]: ${message}`, {
      stepId,
      cause,
    });
    this.name = this.constructor.name;
    this.operation = operation;
  }
}

// Type guards for error checking
export function isGeometryError(error: unknown): error is GeometryError {
  return error instanceof GeometryError;
}

export function isMissingGeometryError(error: unknown): error is MissingGeometryError {
  return error instanceof MissingGeometryError;
}

export function isTypeMismatchError(error: unknown): error is TypeMismatchError {
  return error instanceof TypeMismatchError;
}

export function isIntersectionNotFoundError(error: unknown): error is IntersectionNotFoundError {
  return error instanceof IntersectionNotFoundError;
}

export function isComputationError(error: unknown): error is ComputationError {
  return error instanceof ComputationError;
}
```

### Action 6.2: Update getGeometry to Use Custom Errors

**File**: `app2/src/geometry/operations.ts` (lines 84-93)

**Current code**:

```typescript
export function getGeometry<T extends GeometryValue>(
  values: Map<string, GeometryValue>,
  id: string,
  typeGuard: (v: GeometryValue) => v is T,
  typeName: string,
): T {
  const value = values.get(id);
  if (!value) {
    throw new Error(`Missing geometry: ${id}`);
  }
  if (!typeGuard(value)) {
    throw new Error(`Expected ${typeName} for ${id}, got ${value.type}`);
  }
  return value;
}
```

**Updated code**:

```typescript
import { MissingGeometryError, TypeMismatchError } from "../errors";

export function getGeometry<T extends GeometryValue>(
  values: Map<string, GeometryValue>,
  id: string,
  typeGuard: (v: GeometryValue) => v is T,
  typeName: string,
  stepId?: string,
): T {
  const value = values.get(id);
  if (!value) {
    throw new MissingGeometryError(id, stepId ?? "");
  }
  if (!typeGuard(value)) {
    throw new TypeMismatchError(typeName, value.type, id, stepId);
  }
  return value;
}
```

**Files to update**:

- All calls to `getGeometry` in squareSteps.ts to pass stepId
- All calls to `getGeometry` in sixFoldV0Steps.ts to pass stepId

**Effort**: 1 hour
**Impact**: Better error messages, easier debugging
**Status**: ⚠️ NOT DONE

---

## 🟡 PRIORITY 7: ADD TESTS (MEDIUM)

**Goal**: Add comprehensive test coverage for the geometry construction system.

### Test Files Needed

#### 1. Square.test.tsx (NEW FILE)

```typescript
// app2/src/components/Square.test.tsx

import { render, screen } from "@testing-library/react";
import { Square } from "./Square";
import { useGeometryStore } from "../react-store";
import { standardSvgConfig } from "../config/svgConfig";
import { darkTheme } from "../themes";

// Test setup would need SVG mocking
// This is a simplified example

describe("Square Component", () => {
  it("renders SVG container with correct classes", () => {
    const store = useGeometryStore();
    render(
      <Square
        store={store}
        svgConfig={standardSvgConfig}
        theme={darkTheme}
      />
    );
    const svg = screen.getByTestId("square-svg");
    expect(svg).toBeInTheDocument();
  });

  it("warns when currentStep is negative", () => {
    const consoleWarn = jest.spyOn(console, "warn").mockImplementation();
    const store = useGeometryStore();
    render(
      <Square
        store={store}
        svgConfig={standardSvgConfig}
        currentStep={-1}
        theme={darkTheme}
      />
    );
    expect(consoleWarn).toHaveBeenCalledWith(
      "Square: currentStep should not be negative, received:",
      -1
    );
    consoleWarn.mockRestore();
  });
});
```

**Effort**: 1-2 hours
**Status**: ⚠️ NOT DONE

---

#### 2. react-store.test.ts (NEW FILE)

```typescript
// app2/src/react-store.test.ts

import { renderHook, act } from "@testing-library/react";
import { useGeometryStore, type GeometryStore, type GeometryType } from "./react-store";

describe("useGeometryStore", () => {
  it("initializes with empty items", () => {
    const { result } = renderHook(() => useGeometryStore());
    expect(result.current.items.size).toBe(0);
  });

  it("adds items with set", () => {
    const { result } = renderHook(() => useGeometryStore());
    const mockElement = document.createElementNS("http://www.w3.org/2000/svg", "circle");

    act(() => {
      result.current.set("test_point", mockElement, "point" as GeometryType);
    });

    expect(result.current.items.size).toBe(1);
    expect(result.current.get("test_point")).toBeDefined();
  });

  it("get returns undefined for non-existent items", () => {
    const { result } = renderHook(() => useGeometryStore());
    expect(result.current.get("nonexistent")).toBeUndefined();
  });

  it("clears all items", () => {
    const { result } = renderHook(() => useGeometryStore());
    const mockElement = document.createElementNS("http://www.w3.org/2000/svg", "circle");

    act(() => {
      result.current.set("point1", mockElement, "point" as GeometryType);
      result.current.set("point2", mockElement, "point" as GeometryType);
    });

    expect(result.current.items.size).toBe(2);

    act(() => {
      result.current.clear();
    });

    expect(result.current.items.size).toBe(0);
  });

  it("removes specific items", () => {
    const { result } = renderHook(() => useGeometryStore());
    const mockElement = document.createElementNS("http://www.w3.org/2000/svg", "circle");

    act(() => {
      result.current.set("point1", mockElement, "point" as GeometryType);
      result.current.set("point2", mockElement, "point" as GeometryType);
    });

    expect(result.current.items.size).toBe(2);

    act(() => {
      result.current.remove("point1");
    });

    expect(result.current.items.size).toBe(1);
    expect(result.current.get("point1")).toBeUndefined();
    expect(result.current.get("point2")).toBeDefined();
  });

  it("getByType filters correctly", () => {
    const { result } = renderHook(() => useGeometryStore());
    const mockElement = document.createElementNS("http://www.w3.org/2000/svg", "circle");

    act(() => {
      result.current.set("point1", mockElement, "point" as GeometryType);
      result.current.set("line1", mockElement, "line" as GeometryType);
      result.current.set("point2", mockElement, "point" as GeometryType);
    });

    expect(result.current.getByType("point" as GeometryType)).toHaveLength(2);
    expect(result.current.getByType("line" as GeometryType)).toHaveLength(1);
  });

  it("getByStep filters correctly", () => {
    const { result } = renderHook(() => useGeometryStore());
    const mockElement = document.createElementNS("http://www.w3.org/2000/svg", "circle");

    act(() => {
      result.current.set("point1", mockElement, "point" as GeometryType, { stepId: "step1" });
      result.current.set("line1", mockElement, "line" as GeometryType, { stepId: "step2" });
      result.current.set("point2", mockElement, "point" as GeometryType, { stepId: "step1" });
    });

    expect(result.current.getByStep("step1")).toHaveLength(2);
    expect(result.current.getByStep("step2")).toHaveLength(1);
  });

  it("getDependencyGraph returns correct structure", () => {
    const { result } = renderHook(() => useGeometryStore());
    const mockElement = document.createElementNS("http://www.w3.org/2000/svg", "circle");

    act(() => {
      result.current.set("a", mockElement, "point" as GeometryType, { dependsOn: [] });
      result.current.set("b", mockElement, "point" as GeometryType, { dependsOn: ["a"] });
      result.current.set("c", mockElement, "point" as GeometryType, { dependsOn: ["a", "b"] });
    });

    const graph = result.current.getDependencyGraph();
    expect(graph.nodes).toHaveLength(3);
    expect(graph.edges).toHaveLength(3); // a->b, a->c, b->c
  });
});
```

**Effort**: 2-3 hours
**Status**: ⚠️ NOT DONE

---

#### 3. svg.test.ts (NEW FILE)

```typescript
// app2/src/svg.test.ts

import { pick, buildStepMaps, setupSvg } from "./svg";
import type { SvgConfig } from "./config/svgConfig";

describe("pick", () => {
  it("extracts specified properties from object", () => {
    const obj = { a: 1, b: 2, c: 3 };
    const result = pick(obj, ["a", "c"]);
    expect(result).toEqual({ a: 1, c: 3 });
  });

  it("returns empty object for no matching keys", () => {
    const obj = { a: 1, b: 2 };
    const result = pick(obj, ["c", "d"] as const);
    expect(result).toEqual({});
  });
});

describe("buildStepMaps", () => {
  const mockSteps = [
    { id: "step1", inputs: [], outputs: ["a", "b"] },
    { id: "step2", inputs: ["a"], outputs: ["c"] },
    { id: "step3", inputs: ["b", "c"], outputs: ["d"] },
  ] as const;

  it("builds correct dependency maps", () => {
    const { stepDependencies, stepForOutput } = buildStepMaps(mockSteps, 3);

    expect(stepDependencies.get("a")).toEqual([]);
    expect(stepDependencies.get("b")).toEqual([]);
    expect(stepDependencies.get("c")).toEqual(["a"]);
    expect(stepDependencies.get("d")).toEqual(["b", "c"]);

    expect(stepForOutput.get("a")?.id).toBe("step1");
    expect(stepForOutput.get("b")?.id).toBe("step1");
    expect(stepForOutput.get("c")?.id).toBe("step2");
    expect(stepForOutput.get("d")?.id).toBe("step3");
  });
});

describe("setupSvg", () => {
  it("clears all children and sets attributes", () => {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const child = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    svg.appendChild(child);

    const config: SvgConfig = {
      viewBox: "0 0 800 600",
      width: 800,
      height: 600,
      containerClass: "container",
      svgClass: "svg",
    };

    setupSvg(svg, config);

    expect(svg.firstChild).toBeNull();
    expect(svg.getAttribute("viewBox")).toBe("0 0 800 600");
    expect(svg.getAttribute("width")).toBe("800");
    expect(svg.getAttribute("height")).toBe("600");
  });
});
```

**Effort**: 1-2 hours
**Status**: ⚠️ NOT DONE

---

## 🟢 PRIORITY 8: STEP HELPERS (LOW)

**Action**: Create helper functions to reduce boilerplate in step definitions.

**File**: `app2/src/geometry/stepHelpers.ts` (NEW FILE)

```typescript
/**
 * Helper functions for creating step definitions.
 * Reduces boilerplate in step.compute and step.draw functions.
 */

import type { Step, GeometryValue, Point, Line, Circle, Polygon } from "../types/geometry";
import type { GeometryStore } from "../react-store";
import type { Theme } from "../themes";
import { drawPoint, drawLine, drawCircle } from "../svgElements";
import { computeSingle } from "./operations";

/**
 * Creates a step that produces and draws a point geometry.
 *
 * @param id - Unique step identifier
 * @param outputId - Geometry ID for the output point
 * @param inputs - Array of input geometry IDs
 * @param computeFn - Function that takes inputs and config, returns the Point
 * @param parameters - Array of parameter names from config
 * @param drawRadius - Radius for the dot when drawing (default: 2.0)
 */
export function createPointStep<TConfig>(
  id: string,
  outputId: string,
  inputs: string[],
  computeFn: (inputs: Map<string, GeometryValue>, config: TConfig) => Point,
  parameters?: (keyof TConfig)[],
  drawRadius = 2.0,
): Step {
  return {
    id,
    inputs,
    outputs: [outputId],
    parameters,
    compute: computeSingle(outputId, computeFn),
    draw: (svg, values, store, theme) => {
      drawPoint(svg, values, outputId, drawRadius, store, theme);
    },
  };
}

/**
 * Creates a step that produces and draws a line geometry.
 */
export function createLineStep<TConfig>(
  id: string,
  outputId: string,
  inputs: string[],
  computeFn: (inputs: Map<string, GeometryValue>, config: TConfig) => Line,
  parameters?: (keyof TConfig)[],
  strokeWidth = 0.5,
): Step {
  return {
    id,
    inputs,
    outputs: [outputId],
    parameters,
    compute: computeSingle(outputId, computeFn),
    draw: (svg, values, store, theme) => {
      drawLine(svg, values, outputId, strokeWidth, store, theme);
    },
  };
}

/**
 * Creates a step that produces and draws a circle geometry.
 */
export function createCircleStep<TConfig>(
  id: string,
  outputId: string,
  inputs: string[],
  computeFn: (inputs: Map<string, GeometryValue>, config: TConfig) => Circle,
  parameters?: (keyof TConfig)[],
  strokeWidth = 0.5,
): Step {
  return {
    id,
    inputs,
    outputs: [outputId],
    parameters,
    compute: computeSingle(outputId, computeFn),
    draw: (svg, values, store, theme) => {
      drawCircle(svg, values, outputId, strokeWidth, store, theme);
    },
  };
}

/**
 * Creates a step with a custom draw function.
 * Use this when the draw logic is more complex than just drawing a single geometry.
 */
export function createCustomStep<TConfig>(
  id: string,
  inputs: string[],
  outputs: string[],
  computeFn: (inputs: Map<string, GeometryValue>, config: TConfig) => Map<string, GeometryValue>,
  drawFn: (
    svg: SVGSVGElement,
    values: Map<string, GeometryValue>,
    store: GeometryStore,
    theme: Theme,
  ) => void,
  parameters?: (keyof TConfig)[],
): Step {
  return {
    id,
    inputs,
    outputs,
    parameters,
    compute: computeFn,
    draw: drawFn,
  };
}
```

**Effort**: 1 hour
**Status**: ⚠️ NOT DONE
**Impact**: Reduces boilerplate, improves consistency

---

## 🟢 PRIORITY 9: CODE ORGANIZATION (LOW)

**Action**: Reorganize code structure into logical folders.

**Current structure**:

```
app2/src/
├── components/
├── config/
├── geometry/
├── themes/
├── types/
├── svg.ts
├── svgElements.ts
├── react-store.ts
└── ...
```

**Recommended structure**:

```
app2/src/
├── components/
│   ├── Square/
│   │   ├── Square.tsx
│   │   ├── Square.test.tsx
│   │   └── index.ts
│   ├── SixFold/
│   │   ├── SixFold.tsx
│   │   ├── SixFold.test.tsx
│   │   └── index.ts
│   ├── CopySvgButton.tsx
│   ├── CopyUrlButton.tsx
│   ├── GeometryDetails.tsx
│   ├── GeometryList/
│   │   ├── GeometryList.tsx
│   │   ├── GeometryList.test.tsx
│   │   └── index.ts
│   ├── Navigation.tsx
│   └── index.ts
├── geometry/
│   ├── constructors.ts
│   ├── operations.ts
│   ├── stepHelpers.ts (NEW)
│   ├── square/
│   │   ├── squareSteps.ts
│   │   └── index.ts
│   ├── sixFold/
│   │   ├── operations.ts
│   │   ├── sixFoldSteps.ts (renamed from sixFoldV0Steps)
│   │   └── index.ts
│   ├── errors.ts (NEW)
│   └── index.ts
├── hooks/
│   ├── useGeometryStore.ts (after consolidation)
│   └── index.ts
├── utils/
│   ├── svg.ts
│   ├── svgElements.ts
│   └── index.ts
├── types/
│   ├── geometry.ts
│   └── index.ts
├── config/
│   ├── svgConfig.ts
│   └── index.ts
├── themes/
│   ├── index.ts
│   └── themes.ts
└── App.tsx
```

**Effort**: 1-2 hours
**Status**: ⚠️ NOT DONE
**Impact**: Better organization, easier to find files

---

## Summary Matrix

| Priority | Task                        | File                       | Effort | Impact | Status |
| -------- | --------------------------- | -------------------------- | ------ | ------ | ------ |
| 0        | Delete old SixFold versions | components/                | 1h     | Major  | ⚠️     |
| 0        | Consolidate SixFoldV0 store | react-store.ts             | 30m    | Minor  | ⚠️     |
| 1        | **Store consolidation**     | react-store.ts             | 2-4h   | Major  | ⚠️     |
| 2        | **Improve geometry naming** | geometry/operations.ts     | 1-2h   | Medium | ⚠️     |
| 2        | Fix type safety             | react-store.ts             | 1-2h   | Medium | ⚠️     |
| 3        | Tooltip system              | svgElements.ts             | 1h     | Medium | ⚠️     |
| 4        | Optimize sixFoldV0Steps     | geometry/sixFoldV0Steps.ts | 2-4h   | Medium | ⚠️     |
| 4        | Documentation               | Multiple                   | 2-3h   | Medium | ⚠️     |
| 5        | Error handling              | errors.ts, operations.ts   | 1h     | Medium | ⚠️     |
| 5        | Add tests                   | Multiple                   | 3-5h   | Medium | ⚠️     |
| 8        | Step helpers                | geometry/stepHelpers.ts    | 1h     | Low    | ⚠️     |
| 9        | Code organization           | Multiple                   | 1-2h   | Low    | ⚠️     |

**Total estimated effort**: ~18-25 hours

---

## Recommended Implementation Order

### Week 1: Critical Cleanup

1. ✅ Delete old SixFold versions (1h)
2. ✅ Consolidate store to single implementation (2-4h)
3. ✅ Fix type safety in react-store.ts (1-2h)
4. ✅ Fix tooltip system (1h)

### Week 2: Quality Improvements

1. 🔄 Improve geometry naming (1-2h)
2. 🔄 Optimize sixFoldV0Steps (2-4h)
3. 🔄 Add JSDoc to remaining files (2-3h)
4. 🔄 Add error classes (1h)

### Week 3: Testing & Extras

1. 🔄 Add tests for Square, store, utilities (3-5h)
2. 🔄 Create step helpers (1h)
3. 🔄 Reorganize code structure (1-2h)

---

## Final Notes

**The most critical issues** are:

1. **Store fragmentation** - This causes maintenance nightmares and should be fixed FIRST
2. **Multiple SixFold versions** - Confusing for developers, should be cleaned up
3. **Type safety gaps** - Causes runtime errors that could be caught at compile time

**After these are fixed**, the codebase will be in excellent shape for:

- Adding new geometric construction components
- Scaling to complex constructions (proven by SixFoldV0)
- Maintaining and refactoring existing code

**The SixFoldV0 component** proves that the Square pattern works for complex constructions. This should be the template for all future components.

---

_Action Items: Square.tsx and imported components - UPDATED April 2025_
