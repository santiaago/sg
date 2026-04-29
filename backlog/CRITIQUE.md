# Critique: geometry-framework.md Plan

## Overview

Comprehensive critique of the proposed higher-level geometry construction DSL framework. The plan is well-structured but has 18 identified issues requiring architectural refinement before implementation.

---

## 🔴 CRITICAL ISSUES (Must Address Before Implementation)

### 1. Circular Dependency Problem

**Severity**: CRITICAL | **Impact**: High | **Difficulty**: Medium

**Issue**: Plan places `Construction` in `@sg/geometry` but it depends on app2's `GeometryValue` types, creating a circular dependency.

```
@sg/geometry/construction.ts → import app2/src/types/geometry.ts
app2/src/components/SquaresV2.tsx → import @sg/geometry
→ Circular dependency
```

**Solution** (Recommended): Move `Construction` to `app2/src/geometry/construction.ts`. Keeps it with the step system, avoids circularity, can re-export from `@sg/geometry` if needed.

---

### 2. Dual Type System Confusion

**Severity**: CRITICAL | **Impact**: High | **Difficulty**: High

**Issue**: Plan proposes using BOTH `@sg/geometry` classes (`Point`, `Line`, `Circle` with methods) AND app2 interface types (`{type: "point", x: number, y: number}`).

**Problems**:

- `c1_c.get().r` assumes Circle has `.r` property, but app2 Circle is `{type: "circle", cx: number, cy: number, r: number}`
- No conversion path defined between the two systems
- Methods take `@sg/geometry` types as input but must output app2 `GeometryValue` types

**Existing types** (app2/src/types/geometry.ts):

```typescript
interface Point {
  type: "point";
  x: number;
  y: number;
}
interface Circle {
  type: "circle";
  cx: number;
  cy: number;
  r: number;
}
```

**@sg/geometry classes** (implied from package):

```typescript
class Point { constructor(public x: number, public y: number) {}
class Circle { constructor(public p: Point, public r: number) {}
```

**Recommendation**: Commit to ONE system. Use app2 `GeometryValue` types as the canonical types. Use `@sg/geometry` classes only internally for computation, with conversion functions.

---

### 3. GeomRef Design Flaws

**Severity**: CRITICAL | **Impact**: High | **Difficulty**: High

**Issue A**: GeomRef mixes identity and data

```typescript
class GeomRef<T> {
  readonly value: T; // Stores actual geometry
  readonly name: string;
  readonly stepIndex: number;
  get(): T {
    return this.value;
  } // Redundant
}
```

Makes it unclear whether GeomRef is a reference or a container.

**Issue B**: Dual API - same operation available in two places

```typescript
// Construction method
construction.line(p1, p2, "my_line");

// GeomRef method
p1.lineTo(p2, "my_line");
```

Users won't know which to use.

**Issue C**: Type-specific methods on base class (anti-pattern)

```typescript
class GeomRef<T> {
  // Point-only methods
  circle(radius: number, name?: string): GeomRef<Circle>;
  lineTo(other: GeomRef<Point>, name?: string): GeomRef<Line>;

  // Circle-only methods
  intersectionWith(other: GeomRef<Circle | Line>, ...): GeomRef<Point>;
  at(angle: number, name?: string): GeomRef<Point>;

  // Line-only methods
  extend(length: number, name?: string): GeomRef<Line>;
}
```

**Recommendation**:

- Make GeomRef a lightweight reference/ID only (no `value` property)
- Construction holds all values in a Map
- Methods on GeomRef delegate to Construction with the reference
- Use TypeScript branded types or nominal typing for GeomRef subtypes

---

### 4. "Other" Intersection Underspecified

**Severity**: CRITICAL | **Impact**: High | **Difficulty**: Medium

**Issue**: Plan uses `"other"` to mean "the intersection point that isn't the one we already know":

```typescript
const c2 = c1_c.intersectionWith(ml, "other", "c2");
```

**Problems**:

- How does it know which point to exclude?
- What if there are 0, 1, or >2 intersections?
- How is "already known" determined? By creation order? By check at call time?
- What if the assumed known point isn't actually on both geometries?

**Existing code** (squareSteps.ts) does it explicitly:

```typescript
const c2 = point(line_c2_pi.x1, line_c2_pi.y1);
const p3 = pointFromCircleAndLine(ci, line_c2_pi, {
  exclude: c2, // Explicit exclusion
  tolerance: params.tolerance,
});
```

**Recommendation**: Make exclusion explicit:

```typescript
// Option A: Named parameter with exclude
c1_c.intersectionWith(ml, { exclude: c1, direction: "left" });

// Option B: Separate methods
c1_c.intersectionWith(ml, "left"); // Directional
c1_c.intersectionOtherThan(ml, c1); // Explicit exclusion
```

---

### 5. Step Generation Defeats Lazy Evaluation

**Severity**: CRITICAL | **Impact**: High | **Difficulty**: High

**Issue**: The `construction-to-steps.ts` adapter generates steps that pre-compute values:

```typescript
compute: (inputs, params) => new Map([[step.name, step.value]]),
//                                        ^^^^^^^^^^ pre-computed value
```

**Problems**:

- Ignores `inputs` parameter entirely
- Values are computed during Construction, not when step is executed
- Loses lazy evaluation benefit of existing step system
- Defeats the purpose of the step architecture

**Recommendation**:

- Make Construction build a DAG of operations (thunks), not computed values
- Adapter generates steps with proper `compute` functions that use inputs
- Values computed on-demand when step is executed

Example:

```typescript
compute: (inputs, params) => {
  const line = inputs.get("line_1");
  const circle = inputs.get("circle_1");
  const intersection = computeIntersection(line, circle);
  return new Map([["point_1", intersection]]);
};
```

---

## 🟡 MAJOR IMPROVEMENTS NEEDED

### 6. API Ergonomics

**.get() breaks method chaining**

```typescript
const c2_c = c2.circle(c1_c.get().r, "c2_circle");
//                      ^^^ breaks chain
```

**Fix**: Access properties directly on GeomRef:

```typescript
const c2_c = c2.circle(c1_c.radius, "c2_circle");
// or with thunk for lazy eval
const c2_c = c2.circle(() => c1_c.radius, "c2_circle");
```

**Verbose naming parameter**

```typescript
const ml = construction.line(lx1, ly1, lx2, ly2, "main_line");
const c1 = ml.pointAt(C1_POSITION_RATIO, "c1");
```

**Fix**: Auto-generate names or use builder pattern:

```typescript
construction.line(lx1, ly1, lx2, ly2).as("main_line");
```

---

### 7. Immutability vs Mutability Confusion

**Issue**: Plan states immutable geometry is acceptable, but proposed Construction accumulates state mutably.

**Recommendation**: Make Construction immutable:

```typescript
const step1 = construction.line(lx1, ly1, lx2, ly2, "main_line");
// step1 is a NEW Construction, original unchanged

// Time-travel debugging
construction.atStep(5).render();
```

Benefits: Undo/redo, testing, reproducibility.

---

### 8. Incomplete Error Handling

**Issue**: Only one error class defined, but many error types needed.

**Missing error types**:

- `NoIntersectionError` - geometries don't intersect
- `TooManyIntersectionsError` - ambiguous selection
- `InvalidDirectionError` - unknown direction
- `CircularDependencyError` - self-reference
- `MissingInputError` - referenced geometry doesn't exist
- `TypeMismatchError` - wrong geometry type

**Recommendation**: Create error hierarchy:

```typescript
class ConstructionError extends Error {
  constructor(
    readonly stepIndex: number,
    readonly stepName: string,
    readonly message: string,
    readonly cause?: Error,
  ) {}
}

class NoIntersectionError extends ConstructionError {
  constructor(stepIndex: number, stepName: string, g1: string, g2: string) {
    super(stepIndex, stepName, `No intersection between ${g1} and ${g2}`);
  }
}
```

---

### 9. Performance: No Caching/Lazy Evaluation

**Issue**: Current design computes values immediately with no caching.

**Recommendation**:

- `Construction` builds DAG of operations (not values)
- Values computed on first access and cached
- Cache invalidated when dependencies change
- Support dirty tracking for 'goTo(step)' navigation

---

### 10. Testing Strategy Gaps

**Missing test categories**:

- Property-based tests (geometry invariants)
- Round-trip tests (Construction → Steps → Construction)
- Error case tests (edge cases: parallel lines, concentric circles)
- Performance tests (100+ step constructions)
- Serialization tests (save/load JSON)

---

## 🟢 MINOR IMPROVEMENTS

### 11. Type Safety: Direction Type Too Broad

```typescript
type Direction = "north" | "south" | "east" | "west" | "left" | "right" | "up" | "down";
```

**Issues**:

- "left"/"right" ambiguous for circles
- "up"/"down" ambiguous for lines at any angle

**Recommendation**:

```typescript
type CardinalDirection = "north" | "south" | "east" | "west";
type RelativeDirection = "left" | "right";
type LineDirection = "start" | "end" | "away" | "toward";
type IntersectionSelector = CardinalDirection | "other" | { exclude: GeomRef<Point> };
```

---

### 12. Inconsistent Naming

| Method on Construction | Method on GeomRef  | Suggested Standard |
| ---------------------- | ------------------ | ------------------ |
| `pointAt`              | `at`               | `pointAt`          |
| `line`                 | `lineTo`           | `lineTo`           |
| `intersection`         | `intersectionWith` | `intersectionWith` |
| `extendLine`           | `extend`           | `extend`           |
| `midpoint`             | N/A                | `midpoint`         |

**Recommendation**: Use `verbNoun` pattern consistently. Prefer explicit names (`intersectionWith` over `intersection`).

---

### 13. Missing Geometry Operations

**Operations used in square construction but not in DSL**:

- `lineTowards(from: Point, towards: Point, length: number): Line` - extended line in specific direction
- No polygon manipulation (inset, offset)
- No angle/bearing operations
- No distance/between geometry measurements

**Recommendation**: Audit squareSteps.ts and ensure all needed operations are in Phase 1.

---

### 14. Missing Documentation

- No JSDoc for public APIs
- No error handling examples
- No migration guide for existing step code
- No performance characteristics documentation

---

## 🪶 NITPICKS

### 15. Renderer Organization

Current: `app2/src/geometry/renderers/svgRenderer.ts`

**Issue**: Hard to add Canvas/WebGL renderers later.

**Recommendation**:

```
app2/src/geometry/renderers/
  ├── base/
  │   └── Renderer.ts        # Abstract base
  ├── svg/
  │   └── SvgRenderer.ts
  └── canvas/
      └── CanvasRenderer.ts
```

### 16. Adapter Location Ambiguity

If `Construction` is in app2, `construction-to-steps.ts` should also be in app2.

### 17. Parameter Order Inconsistency

```typescript
// Sometimes: geometry, direction, name
ci.intersectionWith(line_c2_pi, "other", "p3");

// Sometimes: geometry, name, direction?
// Not clear
```

**Recommendation**: Use named parameters:

```typescript
ci.intersectionWith(line_c2_pi, { direction: "other", name: "p3" });
```

### 18. Export Strategy Unclear

Plan says "export Construction, GeomRef, types" but doesn't specify WHICH types from WHERE.

---

## 📊 PRIORITY MATRIX

| #   | Issue                | Severity    | Difficulty | Impact |
| --- | -------------------- | ----------- | ---------- | ------ |
| 1   | Circular dependency  | 🔴 CRITICAL | Medium     | High   |
| 2   | Dual type system     | 🔴 CRITICAL | High       | High   |
| 3   | GeomRef design       | 🔴 CRITICAL | High       | High   |
| 4   | "Other" intersection | 🔴 CRITICAL | Medium     | High   |
| 5   | Lazy evaluation lost | 🔴 CRITICAL | High       | High   |
| 6   | API ergonomics       | 🟡 MAJOR    | Medium     | Medium |
| 7   | Immutability         | 🟡 MAJOR    | High       | Medium |
| 8   | Error handling       | 🟡 MAJOR    | Medium     | Medium |
| 9   | Performance          | 🟡 MAJOR    | High       | Medium |
| 10  | Testing gaps         | 🟡 MAJOR    | Medium     | Medium |
| 11  | Direction types      | 🟢 MINOR    | Low        | Low    |
| 12  | Naming               | 🟢 MINOR    | Low        | Low    |
| 13  | Missing ops          | 🟢 MINOR    | Medium     | Medium |
| 14  | Documentation        | 🟢 MINOR    | Low        | Low    |
| 15  | Renderer org         | 🪶 LOW      | Low        | Low    |
| 16  | Adapter location     | 🪶 LOW      | Low        | Low    |
| 17  | Param order          | 🪶 LOW      | Low        | Low    |
| 18  | Export strategy      | 🪶 LOW      | Low        | Low    |

---

## ✅ WHAT THE PLAN GETS RIGHT

1. ✅ **Clear architecture** - Well-articulated separation of concerns
2. ✅ **Non-invasive** - New component only, existing code untouched
3. ✅ **Type safety** - Strong Typing throughout the design
4. ✅ **Phased approach** - Logical implementation order
5. ✅ **Concrete examples** - Code examples for every concept
6. ✅ **Error strategy** - Sensible validate() + getErrors() + throw approach
7. ✅ **Comprehensive** - Covers all aspects from types to rendering
8. ✅ **Well-documented** - Plan itself is thorough and readable

---

## 🎯 RECOMMENDED IMPLEMENTATION ORDER

### Phase 0: Architectural Decisions (1-2 days)

- [ ] Resolve circular dependency (Construction in app2, not @sg/geometry)
- [ ] Commit to single type system (app2 GeometryValue types)
- [ ] Redesign GeomRef as lightweight reference, not value container
- [ ] Design lazy evaluation strategy (DAG of operations)
- [ ] Design error hierarchy

### Phase 1: Core Types

- [ ] Define ConstructionStep interface
- [ ] Define Direction types hierarchy
- [ ] Define error classes
- [ ] Define GeometryValue conversion utilities (if using @sg/geometry internally)

### Phase 2: Construction DSL

- [ ] Implement Construction with lazy evaluation
- [ ] Implement GeomRef as reference type
- [ ] Implement all geometry operations with proper caching
- [ ] Implement dependency tracking
- [ ] Unit tests for all operations

### Phase 3: Rendering

- [ ] Implement SvgRenderer
- [ ] Implement drawing methods for all geometry types
- [ ] Integrate with GeometryStore for tooltips

### Phase 4: Integration

- [ ] Implement construction-to-steps adapter (if still needed)
- [ ] Or: Direct SquaresV2 integration without steps

### Phase 5: Proof of Concept

- [ ] Create SquaresV2.tsx
- [ ] Verify all 16 steps render correctly
- [ ] Test step-by-step navigation

---

## Final Verdict

**Status**: ⚠️ Needs Architectural Refactoring Before Implementation

**The plan is ambitious, well-structured, and conceptually sound, but the 5 critical issues will cause major problems if not addressed first.**

**Risk Assessment**:

- Implementing as-is: **HIGH RISK** - Will hit blockers requiring significant rework
- With Phase 0 fixes: **MEDIUM RISK** - Should proceed smoothly

**Estimated Pre-Implementation Effort**: 1-2 days of design refinement

**Confidence in Success**: High (after addressing critical issues)
