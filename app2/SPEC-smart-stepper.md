# Spec: Smart Stepper for Non-Visual Geometry

## Objective

Eliminate ghost steps in DSL construction stepper. Currently, when user clicks "next", all steps execute including non-visual (VectorExpression, AddExpression, etc.) that produce no display, creating empty/ghost steps in UI. Step length constants (e.g., `DSL_SIXFOLD_V1_STEPS_LENGTH = 97`) are error-prone and don't account for non-visual steps.

**User pain point:** Confusing UX when stepping through construction — empty steps appear, total step count mismatches visible progress.

**Success looks like:**
- Stepper only lands on visual steps (steps with `isVisual !== false`)
- No ghost steps in UI
- Step length dynamically calculated from actual visual steps
- Non-visual steps still execute (for dependency calculations) but are invisible to user
- All existing visual geometry continues to render correctly

## Tech Stack

- TypeScript 5.x
- React 18.x
- Existing geometry DSL infrastructure in `app2/src/geometry/dsl/`
- Existing `isVisual: boolean` property on Step interface (from non-visual geometry fix)

## Commands

```bash
# Type check
cd app2 && npx tsc --noEmit

# Run all tests
cd app2 && pnpm test

# Run specific test file
cd app2 && pnpm test -- smartStepper

# Lint
pnpm lint

# Format check
pnpm format
```

## Project Structure

```
app2/
├── src/
│   ├── components/
│   │   ├── SixFoldDslV1Svg.tsx      # Primary: needs stepper update
│   │   ├── SixFoldDslSvg.tsx        # Needs stepper update
│   │   ├── SquareDslSvg.tsx          # Needs stepper update
│   │   └── StepperControls.tsx      # If exists, or stepper logic here
│   ├── geometry/
│   │   ├── sixfoldDslV1Steps.ts     # Has hardcoded DSL_SIXFOLD_V1_STEPS_LENGTH
│   │   ├── sixFoldDslSteps.ts       # Has hardcoded DSL_SIXFOLD_STEPS_LENGTH
│   │   └── squareDslSteps.ts         # Has hardcoded DSL_SQUARE_STEPS_LENGTH
│   └── types/
│       └── geometry.ts              # Step interface with isVisual
└── SPEC-smart-stepper.md            # This file
```

## Background: Current Architecture

### Step Execution Flow

```
User clicks "Next"
    ↓
Stepper increment currentStepIndex
    ↓
executeSteps(steps, currentStepIndex, ...)
    ↓
For each step 0..currentStepIndex:
    ├── compute() → produces GeometryValue
    └── draw() → calls renderer → creates SVG (if visual)
    ↓
store.update() for visual steps only (isVisual !== false)
    ↓
GeometryDetails renders store.items
```

### The Problems

1. **Ghost Steps:** Stepper uses raw step indices. When currentStepIndex lands on non-visual step, nothing displays but step counter increments.

2. **Hardcoded Length:** `DSL_SIXFOLD_V1_STEPS_LENGTH = 97` counts all steps, not accounting for non-visual additions. Adding new non-visual steps breaks this.

### Current isVisual Implementation

- `GeometryExpression` interface: `readonly isVisual: boolean` (default: true)
- Non-visual expressions: Vector, Add, Subtract, Multiply, Divide, Distance (isVisual = false)
- `Step` interface: `isVisual?: boolean` (populated from expression during compile)
- DSL SVG components: filter `store.update()` by `step.isVisual !== false`

## Requirements

### 1. Smart Stepper Navigation

Stepper must skip non-visual steps during navigation:

```ts
// Current (BAD):
const nextStep = currentStepIndex + 1

// Required (GOOD):
const nextStep = findNextVisualStep(steps, currentStepIndex)
function findNextVisualStep(steps: Step[], fromIndex: number): number {
  for (let i = fromIndex + 1; i < steps.length; i++) {
    if (steps[i].isVisual !== false) return i
  }
  return fromIndex
}
```

**Previous navigation** must work similarly, finding the previous visual step.

### 2. Dynamic Step Length

Replace hardcoded constants with dynamic calculation:

```ts
// Current (BAD):
export const DSL_SIXFOLD_V1_STEPS_LENGTH = 97

// Required (GOOD):
export const DSL_SIXFOLD_V1_STEPS_LENGTH = steps.filter(s => s.isVisual !== false).length

// Or computed at runtime:
const visualStepCount = steps.filter(s => s.isVisual !== false).length
```

### 3. Execute All Steps, Display Only Visual

Non-visual steps must still execute for dependency calculations:

```ts
// When stepping to visual step N:
// 1. Execute ALL steps 0..N (including non-visual)
// 2. Display only visual steps in UI
// 3. Stepper position = index among visual steps only
```

### 4. Mapping Between Indices

Need to handle two index spaces:
- **Actual step index:** Position in full steps array (0..totalSteps-1)
- **Visual step index:** Position among visual steps only (0..visualCount-1)

```ts
// Example: steps = [V, V, NV, V, NV, V]
// Actual indices:  0, 1, 2, 3, 4, 5
// Visual indices:  0, 1,   2,   3

// User sees: Step 2/4 (visual index 2 of 4)
// Internally: actual index 3
```

## Code Style

Match existing patterns in codebase:

```ts
// BAD - hardcoded length
export const DSL_SIXFOLD_V1_STEPS_LENGTH = 97

// GOOD - dynamic, computed from source of truth
const visualSteps = steps.filter(s => s.isVisual !== false)
export const DSL_SIXFOLD_V1_VISUAL_STEPS_LENGTH = visualSteps.length

// BAD - stepper lands on any step
setCurrentStep(current + 1)

// GOOD - stepper lands only on visual steps
const nextVisual = findNextVisualStep(steps, currentStep)
if (nextVisual !== currentStep) setCurrentStep(nextVisual)

// Helper functions for navigation
function findNextVisualStep(steps: Step[], fromIndex: number): number
function findPrevVisualStep(steps: Step[], fromIndex: number): number
function getVisualStepIndex(steps: Step[], actualIndex: number): number
```

**Naming:**
- `findNextVisualStep`, `findPrevVisualStep` for navigation
- `getVisualStepIndex`, `getActualStepIndex` for mapping
- `VISUAL_STEPS_LENGTH` or `VISUAL_STEP_COUNT` for constants

## Testing Strategy

### Test Levels

| Concern | Test Level | Location |
|---------|-----------|----------|
| Stepper skips non-visual steps | Unit | `tests/components/stepper.test.ts` (NEW) |
| Dynamic step length calculation | Unit | `tests/geometry/stepLength.test.ts` (NEW) |
| Index mapping correctness | Unit | `tests/geometry/stepMapping.test.ts` (NEW) |
| All DSL components navigate correctly | Integration | Manual + existing tests |
| Visual geometry still renders at each step | Integration | Manual verification |

### Coverage Expectations

- 100% branch coverage for navigation helpers (`findNextVisualStep`, `findPrevVisualStep`)
- Edge cases: first step, last step, all non-visual, all visual, single step
- Verify hardcoded constants are removed or updated

### Sample Tests

```ts
// tests/components/stepper.test.ts
describe("Smart stepper navigation", () => {
  const steps: Step[] = [
    { id: "s1", isVisual: true },
    { id: "s2", isVisual: true },
    { id: "s3", isVisual: false },
    { id: "s4", isVisual: true },
    { id: "s5", isVisual: false },
    { id: "s6", isVisual: true },
  ]

  it("finds next visual step", () => {
    expect(findNextVisualStep(steps, 0)).toBe(1)
    expect(findNextVisualStep(steps, 1)).toBe(3)
    expect(findNextVisualStep(steps, 3)).toBe(5)
    expect(findNextVisualStep(steps, 5)).toBe(5) // at end
  })

  it("finds previous visual step", () => {
    expect(findPrevVisualStep(steps, 5)).toBe(3)
    expect(findPrevVisualStep(steps, 3)).toBe(1)
    expect(findPrevVisualStep(steps, 1)).toBe(0)
    expect(findPrevVisualStep(steps, 0)).toBe(0) // at start
  })
})

// tests/geometry/stepLength.test.ts
describe("Dynamic step length", () => {
  it("counts only visual steps", () => {
    const steps: Step[] = [
      { id: "s1", isVisual: true },
      { id: "s2", isVisual: false },
      { id: "s3", isVisual: true },
    ]
    expect(getVisualStepCount(steps)).toBe(2)
  })
})
```

## Boundaries

- **Always do:**
  - Maintain `isVisual` property on all expressions and steps
  - Execute all steps (visual + non-visual) up to current position for dependencies
  - Run `pnpm test`, `pnpm type-check`, `pnpm lint` before considering complete
  - Preserve existing visual geometry rendering
  - Match existing code style and patterns

- **Ask first:**
  - Changing the Step interface or GeometryExpression interface
  - Modifying executeSteps() function behavior
  - Adding new dependencies for stepper logic
  - Changing how GeometryDetails displays step information

- **Never do:**
  - Hardcode step counts or visual step counts
  - Break existing DSL rendering
  - Remove or modify `isVisual` property
  - Skip non-visual step execution (dependencies would break)
  - Add `@ts-nocheck` or type suppressions

## Success Criteria

- [ ] `pnpm test` passes (all tests including new stepper tests)
- [ ] `pnpm type-check` passes
- [ ] `pnpm lint` passes
- [ ] `pnpm format` passes
- [ ] Stepper never lands on non-visual step in any DSL construction
- [ ] No ghost steps appear when stepping through SixFold DSL v1
- [ ] No ghost steps appear when stepping through SixFold DSL v0
- [ ] No ghost steps appear when stepping through Square DSL
- [ ] All hardcoded step length constants replaced with dynamic calculations
- [ ] Step counter shows "Step N/M" where M = count of visual steps
- [ ] All existing visual geometry continues to render correctly at each step
- [ ] Non-visual steps still execute (dependency calculations work)
- [ ] Manual verification: stepping through each DSL construction shows smooth progression with no empty steps

## Implementation Notes

### Files to Modify

**Stepper Logic (NEW or UPDATE):**
- `app2/src/components/StepperControls.tsx` (if exists) or create new stepper hook
- `app2/src/hooks/useSmartStepper.ts` (NEW - recommended)

**DSL SVG Components:**
- `app2/src/components/SixFoldDslV1Svg.tsx` - update stepper, remove hardcoded length
- `app2/src/components/SixFoldDslSvg.tsx` - update stepper, remove hardcoded length
- `app2/src/components/SquareDslSvg.tsx` - update stepper, remove hardcoded length

**Step Definitions:**
- `app2/src/geometry/sixfoldDslV1Steps.ts` - remove `DSL_SIXFOLD_V1_STEPS_LENGTH` constant
- `app2/src/geometry/sixFoldDslSteps.ts` - remove `DSL_SIXFOLD_STEPS_LENGTH` constant
- `app2/src/geometry/squareDslSteps.ts` - remove `DSL_SQUARE_STEPS_LENGTH` constant

### Recommended Architecture

Create a reusable hook for smart stepping:

```ts
// app2/src/hooks/useSmartStepper.ts
interface UseSmartStepperProps {
  steps: Step[]
  initialStep?: number
}

interface UseSmartStepperResult {
  currentVisualIndex: number
  visualStepCount: number
  stepsUpToIndex: number
  goToNext: () => void
  goToPrev: () => void
  goToStep: (visualIndex: number) => void
  canGoNext: boolean
  canGoPrev: boolean
}

export function useSmartStepper({
  steps,
  initialStep = 0,
}: UseSmartStepperProps): UseSmartStepperResult {
  // Implementation
}
```

This hook handles:
- Navigation between visual steps
- Index mapping (visual ↔ actual)
- Step count calculation
- Boundary checks (can't go beyond first/last visual step)

### Backward Compatibility

If other code depends on hardcoded constants or raw step indices, update those references to use the new dynamic approach.

## Open Questions

1. **Index display:** Should UI show visual index ("Step 2/45") or actual index ("Step 5/97")?
   - Recommendation: Show visual index for user clarity, with actual index available for debugging

2. **Grouping option:** Should there be a debug mode to show all steps including non-visual?
   - Recommendation: No for v1, but architecture should allow easy addition later

3. **Step label display:** Should non-visual steps be visible in a "recent steps" list but marked differently?
   - Recommendation: Out of scope for this spec, but non-visual steps should not appear in primary stepper

## Next Steps

1. Human reviews and approves this spec
2. Create PLAN for implementation
3. Create failing tests
4. Implement useSmartStepper hook
5. Update DSL SVG components to use hook
6. Remove hardcoded step length constants
7. Verify all success criteria
