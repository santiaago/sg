# D1 Distance Reuse Plan

## Problem Statement

The distance `d1 = distance(PIC14, PI2)` is currently calculated **6 times** across Steps 7-8:
- STEP_7A: C1_D1 (CP1, radius=d1)
- STEP_7B: C2_D1 (CP2, radius=d1)
- STEP_7C: C3_D1 (CP3, radius=d1)
- STEP_7D: C4_D1 (CP4, radius=d1)
- STEP_8A: C14_D1 (PIC14, radius=d1)
- STEP_8B: C12_D1 (PIC12, radius=d1)

This is inefficient and violates the DRY principle.

## Constraints Analysis

### Why d1 is NOT a Config Parameter
- **Definition**: d1 is derived from existing geometries (PIC14 and PI2)
- **Nature**: It's a computed value, not a user input
- **Current config parameters**: lx1, ly1, lx2, ly2, cp1OffsetRatio, radius
- **Conclusion**: Adding d1 to config would be semantically incorrect

### Why d1 is NOT a Geometry
- **Definition**: d1 is a scalar distance value
- **Geometry types**: Points, Lines, Circles, Arcs, Segments
- **Conclusion**: d1 doesn't fit the geometry type system

### Why d1 is NOT a Simple Input
- **Dependency**: d1 depends on PIC14 and PI2, which are outputs of STEP_4B and STEP_6C
- **Timing**: d1 can only be computed after PIC14 and PI2 exist
- **Conclusion**: d1 is a derived value, not a primary input

---

## Solution Options

### Option 1: Pre-compute d1 in a Dedicated Step (RECOMMENDED)

**Approach**: Create a new step that computes d1 once and stores it in a shared cache/state.

```typescript
// New STEP_6D (or STEP_7_0)
{
  id: "step6d",
  inputs: [GEOM.PIC14, GEOM.PI2],
  outputs: ["D1"],  // Special non-geometry output
  compute: (inputs) => {
    const pic14 = getGeometry(inputs, GEOM.PIC14, isPoint);
    const pi2 = getGeometry(inputs, GEOM.PI2, isPoint);
    return { D1: distance(pic14, pi2) };
  }
}
```

**Pros**:
- ✅ Single computation
- ✅ Explicit dependency tracking
- ✅ Fits existing step architecture
- ✅ Maintains step isolation
- ✅ Easy to understand

**Cons**:
- ❌ Requires extending output types beyond geometries
- ❌ Need to modify step execution to handle non-geometry outputs
- ❌ All D1 steps must depend on this new step

**Implementation Complexity**: Medium

---

### Option 2: Compute d1 Once and Pass via Closure

**Approach**: Compute d1 in the first step that needs it (STEP_7A) and pass it through.

```typescript
// In step definitions
const d1Step = {
  id: "step7a",
  inputs: [GEOM.CP1, GEOM.PIC14, GEOM.PI2],
  outputs: [GEOM.C1_D1],
  compute: (inputs, config, cache) => {
    const pic14 = getGeometry(inputs, GEOM.PIC14, isPoint);
    const pi2 = getGeometry(inputs, GEOM.PI2, isPoint);
    const d1 = cache.get('d1') || distance(pic14, pi2);
    cache.set('d1', d1);
    const cp1 = getGeometry(inputs, GEOM.CP1, isPoint);
    return { [GEOM.C1_D1]: circle(cp1.x, cp1.y, d1) };
  }
};
```

**Pros**:
- ✅ Minimal code changes
- ✅ Single computation (first call)
- ✅ Subsequent steps reuse cached value

**Cons**:
- ❌ Introduces mutable state (cache)
- ❌ Hidden dependency (cache must be passed around)
- ❌ Less explicit in dependency tracking
- ❌ Harder to reason about step purity

**Implementation Complexity**: Low

---

### Option 3: Lazy Computation with Memoization

**Approach**: Create a helper function that memoizes d1 computation.

```typescript
// In a shared utilities file
const d1Cache: { value: number | null } = { value: null };

export function getD1(inputs: Map<string, GeometryValue>): number {
  if (d1Cache.value !== null) return d1Cache.value;
  
  const pic14 = getGeometry(inputs, GEOM.PIC14, isPoint);
  const pi2 = getGeometry(inputs, GEOM.PI2, isPoint);
  d1Cache.value = distance(pic14, pi2);
  return d1Cache.value;
}

// In each D1 step
compute: (inputs) => {
  const d1 = getD1(inputs);
  // ... use d1
}
```

**Pros**:
- ✅ Single computation
- ✅ Simple to implement
- ✅ No architecture changes

**Cons**:
- ❌ Global mutable state
- ❌ Hidden dependencies
- ❌ Not thread-safe
- ❌ Hard to reset between different configurations
- ❌ Violates pure function principle

**Implementation Complexity**: Low

---

### Option 4: Accept Duplication (Current State)

**Approach**: Keep computing d1 in each step.

**Pros**:
- ✅ Each step is independent
- ✅ Pure functions
- ✅ No shared state
- ✅ Easy to reason about
- ✅ No architecture changes needed

**Cons**:
- ❌ Computational duplication (6x distance calculations)
- ❌ Violates DRY principle
- ❌ If d1 definition changes, must update all 6 steps

**Performance Impact**: 
- distance() is O(1) operation
- 6 extra distance calculations is negligible for this use case
- Only becomes problematic if d1 is used in many more steps

---

## Recommendation

### **RECOMMENDED: Option 1 - Dedicated Step**

**Rationale**:
1. **Architectural Consistency**: Fits the existing step-based pattern
2. **Explicit Dependencies**: Clear that d1 depends on PIC14 and PI2
3. **Maintainability**: Single source of truth for d1
4. **Extensibility**: Can be applied to other derived values (d2, d3, etc.)
5. **Testability**: Easy to test d1 computation in isolation

**Implementation Plan**:

#### Phase 1: Extend Type System
```typescript
// In types.ts
export type StepOutputValue = GeometryValue | number | string;
// Or more specifically
export type DerivedValue = { type: 'distance'; value: number };
export type StepOutputValue = GeometryValue | DerivedValue;
```

#### Phase 2: Create d1 Step
```typescript
// STEP_6D: Compute d1
{
  id: "step6d",
  inputs: [GEOM.PIC14, GEOM.PI2],
  outputs: ["D1"],  // Special identifier for derived value
  compute: (inputs) => {
    const pic14 = getGeometry(inputs, GEOM.PIC14, isPoint, "Point");
    const pi2 = getGeometry(inputs, GEOM.PI2, isPoint, "Point");
    return { D1: distance(pic14, pi2) };
  },
  draw: () => {}  // No drawing for derived values
}
```

#### Phase 3: Update D1 Steps
```typescript
// STEP_7A (updated)
{
  id: "step7a",
  inputs: [GEOM.CP1, "D1"],  // Now depends on D1 instead of PIC14, PI2
  outputs: [GEOM.C1_D1],
  compute: (inputs) => {
    const cp1 = getGeometry(inputs, GEOM.CP1, isPoint, "Point");
    const d1 = inputs.get("D1");  // Get pre-computed d1
    if (typeof d1 !== 'number') throw new Error("D1 not computed");
    return { [GEOM.C1_D1]: circle(cp1.x, cp1.y, d1) };
  }
}
```

#### Phase 4: Update All Dependencies
- STEP_7B, 7C, 7D: Change inputs from `[GEOM.CPX, GEOM.PIC14, GEOM.PI2]` to `[GEOM.CPX, "D1"]`
- STEP_8A: Change inputs from `[GEOM.PIC14, GEOM.PI2]` to `[GEOM.PIC14, "D1"]`
- STEP_8B: Change inputs from `[GEOM.PIC12, GEOM.PIC14, GEOM.PI2]` to `[GEOM.PIC12, "D1"]`

#### Phase 5: Update Step Execution Order
Ensure STEP_6D executes before any D1-dependent steps:
```
// In step ordering
STEP_6C (PI2) → STEP_6D (D1) → STEP_7A-7D, STEP_8A-8B
```

---

## Alternative Recommendation: Option 4 (Accept Duplication)

**If architectural changes are too disruptive**, consider accepting the duplication:

**Rationale**:
1. **Performance**: 6 distance calculations is negligible
2. **Simplicity**: No architecture changes needed
3. **Purity**: Each step remains a pure function
4. **Isolation**: Steps remain independent

**Mitigation**:
- Document the duplication clearly in code comments
- Create a helper function to centralize the d1 calculation logic:
  ```typescript
  function computeD1(inputs: Map<string, GeometryValue>): number {
    const pic14 = getGeometry(inputs, GEOM.PIC14, isPoint, "Point");
    const pi2 = getGeometry(inputs, GEOM.PI2, isPoint, "Point");
    return distance(pic14, pi2);
  }
  ```
- If d1 definition changes, only need to update the helper function

---

## Decision Matrix

| Criteria | Option 1 (Dedicated Step) | Option 2 (Closure) | Option 3 (Memoization) | Option 4 (Accept) |
|----------|--------------------------|-------------------|----------------------|------------------|
| **Architectural Fit** | ✅✅✅ | ✅✅ | ✅ | ✅✅✅ |
| **Explicit Dependencies** | ✅✅✅ | ✅ | ❌ | ✅✅ |
| **Code Complexity** | ✅✅ | ✅✅✅ | ✅✅✅ | ✅✅✅ |
| **Maintainability** | ✅✅✅ | ✅✅ | ✅✅ | ✅ |
| **Performance** | ✅✅✅ | ✅✅✅ | ✅✅✅ | ✅ |
| **Purity** | ✅✅✅ | ❌ | ❌ | ✅✅✅ |
| **Implementation Effort** | ✅ | ✅✅✅ | ✅✅✅ | ✅✅✅ |
| **Risk** | ✅✅ | ✅✅✅ | ✅ | ✅✅✅ |

**Legend**: ✅✅✅ = Excellent, ✅✅ = Good, ✅ = Adequate, ❌ = Poor

---

## Final Recommendation

**Choose Option 1 (Dedicated Step) if**:
- You plan to add more derived values (d2, d3, angles, etc.)
- You want to maintain architectural consistency
- You're willing to invest in extending the type system

**Choose Option 4 (Accept Duplication) if**:
- You want minimal changes
- Performance is not a concern
- You prefer simplicity over DRY purity

---

## Implementation Timeline (Option 1)

### Week 1: Design & Type System
- [ ] Extend StepOutputValue type to support derived values
- [ ] Define naming convention for derived values (D1, D2, D3, etc.)
- [ ] Update step execution engine to handle non-geometry outputs

### Week 2: Implement d1 Step
- [ ] Create STEP_6D for d1 computation
- [ ] Update STEP_7A-7D to use D1 input
- [ ] Update STEP_8A-8B to use D1 input
- [ ] Update step ordering

### Week 3: Testing & Validation
- [ ] Test d1 computation in isolation
- [ ] Test all D1-dependent steps
- [ ] Verify no regression in existing functionality
- [ ] Update documentation

### Week 4: Apply to Other Derived Values
- [ ] Identify other duplicated computations (d2, d3, etc.)
- [ ] Apply same pattern to d2 = distance(PC23, C23S)
- [ ] Apply same pattern to d3 (if applicable)

---

## Code Examples

### Current State (Duplication)
```typescript
// STEP_7A
compute: (inputs) => {
  const cp1 = getGeometry(inputs, GEOM.CP1, isPoint);
  const pic14 = getGeometry(inputs, GEOM.PIC14, isPoint);
  const pi2 = getGeometry(inputs, GEOM.PI2, isPoint);
  const d1 = distance(pic14, pi2);  // Duplicated
  return { [GEOM.C1_D1]: circle(cp1.x, cp1.y, d1) };
}

// STEP_7B
compute: (inputs) => {
  const cp2 = getGeometry(inputs, GEOM.CP2, isPoint);
  const pic14 = getGeometry(inputs, GEOM.PIC14, isPoint);
  const pi2 = getGeometry(inputs, GEOM.PI2, isPoint);
  const d1 = distance(pic14, pi2);  // Duplicated
  return { [GEOM.C2_D1]: circle(cp2.x, cp2.y, d1) };
}
```

### Proposed State (Dedicated Step)
```typescript
// STEP_6D
{
  id: "step6d",
  inputs: [GEOM.PIC14, GEOM.PI2],
  outputs: ["D1"],
  compute: (inputs) => {
    const pic14 = getGeometry(inputs, GEOM.PIC14, isPoint);
    const pi2 = getGeometry(inputs, GEOM.PI2, isPoint);
    return { D1: distance(pic14, pi2) };
  },
  draw: () => {}
}

// STEP_7A (updated)
{
  id: "step7a",
  inputs: [GEOM.CP1, "D1"],
  outputs: [GEOM.C1_D1],
  compute: (inputs) => {
    const cp1 = getGeometry(inputs, GEOM.CP1, isPoint);
    const d1 = inputs.get("D1");
    if (typeof d1 !== 'number') throw new Error("D1 not available");
    return { [GEOM.C1_D1]: circle(cp1.x, cp1.y, d1) };
  }
}

// STEP_7B (updated)
{
  id: "step7b",
  inputs: [GEOM.CP2, "D1"],
  outputs: [GEOM.C2_D1],
  compute: (inputs) => {
    const cp2 = getGeometry(inputs, GEOM.CP2, isPoint);
    const d1 = inputs.get("D1");
    if (typeof d1 !== 'number') throw new Error("D1 not available");
    return { [GEOM.C2_D1]: circle(cp2.x, cp2.y, d1) };
  }
}
```

---

## Conclusion

**Recommendation**: Implement **Option 1 (Dedicated Step)** as it provides the best long-term architectural benefits and can be extended to other derived values like d2 and d3.

However, if immediate simplicity is preferred, **Option 4 (Accept Duplication)** is also reasonable given the negligible performance impact and the current small scale of duplication.

**Next Steps**:
1. Review this plan with the team
2. Decide between Option 1 and Option 4
3. If Option 1: Proceed with implementation timeline
4. If Option 4: Document the duplication and create helper functions
