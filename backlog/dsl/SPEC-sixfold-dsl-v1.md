# Spec: Sixfold DSL v1 with cs2 Coordinate System

## Objective

Create new Sixfold DSL v1 variant introducing `cs2` coordinate system. `cs2` created immediately after `cs` at (p1x, p1y) from config (absolute coordinates based on cs which is at origin). `p1` created in cs2 at (0,0). All direction choices (up, left, north, etc.) **computed relative to cs2's orientation** - not hardcoded. This ensures rotating cs2 automatically recomputes all geometry with zero extra changes. All subsequent geometries reference `cs2` as parent coordinate system. Transformations applied to `cs2` propagate to all geometries defined within it.

**User**: Geometry construction developers needing hierarchical coordinate system support.

**Success Criteria:**
- [ ] `cs2` coordinate system created after cs at (p1x, p1y) from config (based on cs)
- [ ] `p1` created in cs2 at (0, 0)
- [ ] All direction choices **computed relative to cs2's orientation** (not hardcoded strings)
- [ ] All geometries after cs2 use cs2 as parent coordinate system
- [ ] cs2 transformations (translation + rotation) affect all dependent geometries
- [ ] DSL produces valid Step array compatible with execution engine
- [ ] Existing sixfoldDslSteps.ts unchanged
- [ ] Rotating cs2 requires **zero** code changes to geometry definitions

## Tech Stack

- **Language**: TypeScript (ESM)
- **Framework**: Existing GeometryBuilder DSL (`app2/src/geometry/dsl/`)
- **Builder**: `GeometryBuilder<SixFoldV0Config>`
- **Renderer**: `DefaultGeometryRenderer`
- **Config**: `SixFoldV0Config` from `app2/src/geometry/sixFold/operations.ts`
- **Step Type**: `Step<SixFoldV0Config>`

## Commands

```bash
# Type check
pnpm type-check:app2

# Lint
pnpm lint

# Format check
pnpm format

# Format fix
pnpm format:fix

# Tests
pnpm test

# Build
pnpm build
```

## Project Structure

```
app2/src/geometry/
├── sixfoldDslSteps.ts            # Existing DSL v0 (unchanged)
├── sixfoldDslV1Steps.ts          # NEW: DSL v1 with cs2 coordinate system
└── __tests__/
    └── sixfoldDslV1Steps.test.ts  # NEW: Tests for v1 variant

backlog/dsl/
├── SPEC-sixfold-dsl.md          # Existing DSL v0 spec
└── SPEC-sixfold-dsl-v1.md       # This document
```

## Code Style

Match `sixfoldDslSteps.ts` patterns exactly.

### Naming Conventions

| Entity | Convention | Example |
|--------|------------|---------|
| Coordinate System IDs | lowercase with underscore | `cs`, `cs2` |
| Geometry IDs | lowercase with underscore | `p1`, `c1`, `line1` |
| Builder variable | `builder` | `const builder = new GeometryBuilder...` |
| Function name | `buildSixfoldDslV1Steps` | Exported function |
| Step count constant | UPPER_SNAKE_CASE | `DSL_SIXFOLD_V1_STEPS_LENGTH` |

### Example Structure

```typescript
// Step 0: Coordinate System (unchanged)
const cs = builder.coordinateSystem("cs", 0, 0, builder.param("coordinateSystemArrowLength"), 0);

// Step 1: Coordinate System cs2 - NEW
// cs2 at absolute position (p1x, p1y) from config
// This positions cs2 at the same absolute location where p1 would be in v0
const cs2 = builder.coordinateSystem("cs2", builder.param("p1x"), builder.param("p1y"), 0, 0);

// Step 2: Point P1 in cs2 at (0, 0)
// p1 at origin of cs2 - absolute position = (cs2.x + 0, cs2.y + 0) = (p1x, p1y)
const p1 = builder.pointInCs("p1", cs2, 0, 0);

// Step 3+: All geometries use cs2 as parent
// Points defined in cs2 coordinate system
const p2 = builder.pointInCs("p2", cs2, builder.param("p2x"), builder.param("p2y"));
const line1 = builder.line("line1", p1, p2);
// ... all subsequent geometries

// Direction choices MUST be computed relative to cs2's orientation
// Current DSL uses hardcoded strings like { select: "north" } which are global
// Need: direction computation relative to cs2 so rotation works automatically
// Example (TBD - requires framework support):
// const pic12 = builder.circleIntersection("pic12", c1, c2, { select: "north", relativeTo: cs2 });
```

**Note**: cs2 is positioned at absolute (p1x, p1y) from config, which is effectively "based on cs" since cs is at origin (0,0). p1 is then at cs2's origin (0,0) in cs2's local coordinate system, giving it absolute position (p1x, p1y).

**IMPORTANT**: Direction computation is critical for cs2 rotation support. Currently the DSL uses hardcoded direction strings ("north", "left", etc.) which are relative to the global coordinate system. For cs2 rotation to work with zero code changes, directions must be computed relative to cs2's current orientation. This may require framework extensions.

### Formatting Rules

- Oxfmt formatting (existing project config)
- 2-space indentation
- Single quotes for strings
- Semicolons at end of statements
- Type annotations for exported functions
- JSDoc comments for exported symbols

## Testing Strategy

**Framework**: Vitest (same as existing geometry tests)

**Test Location**: `app2/src/geometry/__tests__/sixfoldDslV1Steps.test.ts`

| Test Level | Concern | Coverage |
|------------|---------|----------|
| Unit | cs2 coordinate system creation | cs2 at same position as cs, p1 at (0,0) in cs2 |
| Integration | Geometry parentage | All geometries use cs2 as parent coordinate system |
| Integration | Direction semantics | Direction choices (up, left, etc.) relative to cs2 |
| Integration | Transformation propagation | cs2 transformations affect all geometries in cs2 hierarchy |
| Integration | Step equivalence | Steps produce valid geometry |

**Test Cases:**
1. Verify cs2 position equals config p1x, p1y
2. Verify p1 at (0, 0) in cs2, absolute position = (p1x, p1y)
3. Verify all geometries after cs2 use cs2 as parent (transitively through dependencies)
4. **Verify direction computation**: Rotate cs2 and verify all direction-based geometry recomputes correctly with zero code changes
5. Verify cs2 transformations (translation + rotation) propagate to geometries in cs2 hierarchy
6. Verify step count matches expected value (95)
7. Verify no breaking changes to existing DSL

**Note on Dependencies**: Not all geometries will have direct dependency on cs2. For example, a point created at the intersection of two lines depends on those lines, not directly on cs2. However, if those lines are defined using points in cs2, there is an indirect dependency through the dependency chain. Tests should verify transitive dependency, not direct dependency.

**Verification Commands:**
```bash
pnpm test
pnpm type-check:app2
pnpm lint
pnpm format
```

## Boundaries

### Always Do

- Maintain exact step order from sixfoldDslSteps.ts
- Preserve existing geometry IDs and logic
- Use existing GeometryBuilder API without modification
- Track all dependencies correctly via existing mechanism
- Write tests before marking implementation complete
- Keep code under 700 LOC

### Ask First

- Changes to GeometryBuilder API
- Modifications to coordinate system expression
- Adding new expression types
- Changes to existing type definitions

### Never Do

- Modify existing sixfoldDslSteps.ts
- Break existing type-check, lint, or test commands
- Commit without running `pnpm type-check:app2`
- Use `any` type or `@ts-nocheck`
- Remove or modify existing geometry step files

## Architecture Design

### High-Level Design

```
┌─────────────────────────────────────────────────────────────────┐
│                    Sixfold DSL with cs2                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │                 buildSixfoldDslSteps_cs2()                       │  │
│  │           (app2/src/geometry/sixfoldDslV1Steps.ts)            │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                              │                                      │
│                              ▼                                      │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │              GeometryBuilder<SixFoldV0Config>                    │  │
│  │                    (from dsl/GeometryBuilder.ts)                 │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                              │                                      │
│         ┌────────────────────┼────────────────────┐              │
│         ▼                    ▼                    ▼              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐        │
│  │   cs         │    │   p1         │    │   cs2        │        │
│  │  (step 0)    │    │  (step 1)    │    │  (step 2)    │        │
│  │  origin:     │    │  in cs       │    │  origin:     │        │
│  │  (0, 0)     │    │  (p1x, p1y)  │    │  (p1.x,p1.y)│        │
│  └──────────────┘    └──────────────┘    └──────────────┘        │
│                              │                                      │
│         ┌────────────────────┴────────────────────┐              │
│                              ▼                                      │
│              ┌───────────────────────────────────────┐              │
│              │  All subsequent geometries (steps 3+)   │              │
│              │  Use cs2 as coordinate system parent     │              │
│              └───────────────────────────────────────┘              │
│                              │                                      │
│                              ▼                                      │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │              Step<SixFoldV0Config>[]                           │  │
│  │              (compatible with existing execution engine)      │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────┘
```

### Key Design Decisions

1. **File Separation**: New file `sixfoldDslV1Steps.ts` - preserves original v0, allows comparison
2. **Framework Extension Required**: Need to support **direction computations relative to cs2** - not just hardcoded direction strings
3. **Coordinate System Creation**: cs2 uses `builder.coordinateSystem("cs2", builder.param("p1x"), builder.param("p1y"), 0, 0)` - positioned at absolute (p1x, p1y) from config, which is "based on cs" since cs is at (0,0)
4. **p1 Position**: p1 at (0, 0) in cs2 via `builder.pointInCs("p1", cs2, 0, 0)` - giving it absolute position (p1x, p1y)
5. **Parentage**: All subsequent points defined using cs2 as coordinate system via `builder.pointInCs("id", cs2, ...)`
6. **Direction Computation**: Direction choices must be computed relative to cs2's current orientation, not hardcoded. When cs2 rotates, all direction-based geometry automatically recomputes.
7. **Transformation Propagation**: Existing dependency tracking handles propagation automatically

### Step Order

| Step | Geometry | Coordinate System | Description |
|------|----------|-------------------|-------------|
| 0 | cs | - | Root coordinate system at (0, 0) |
| 1 | cs2 | - | Secondary coordinate system at (p1x, p1y) from config |
| 2 | p1 | cs2 | Point p1 at (0, 0) in cs2, absolute position = (p1x, p1y) |
| 3 | p2 | cs2 | Point p2 in cs2 (was in cs in v0, now in cs2) |
| 4 | line1 | - | Line from p1 to p2 |
| ... | ... | cs2 | All subsequent points use cs2 |

**Note**: Step numbers shift by +1 compared to original v0 (cs2 inserted at step 1, original steps 1-93 become steps 2-94).

## Configuration

Uses existing `SixFoldV0Config` from `app2/src/geometry/sixFold/operations.ts`:

```typescript
interface SixFoldV0Config {
  width: number;
  height: number;
  border: number;
  radius: number;
  p1x: number;
  p1y: number;
  p2x: number;
  p2y: number;
  cp1OffsetRatio: number;
  coordinateSystemArrowLength: number;
}
```

## Dependencies

### File Dependencies

```
app2/src/geometry/sixfoldDslV1Steps.ts
├── app2/src/geometry/dsl/GeometryBuilder.ts
├── app2/src/geometry/dsl/renderers/DefaultRenderer.ts
├── app2/src/geometry/sixFold/operations.ts  (for SixFoldV0Config)
├── app2/src/types/geometry.ts  (for Step type)
└── app2/src/geometry/dsl/index.ts  (for expression exports)
```

### New Dependencies

None. Uses existing DSL framework.

## Success Criteria

Implementation complete when:

1. **Code Quality**
   - [ ] `pnpm type-check:app2` passes with no errors
   - [ ] `pnpm lint` passes with no errors
   - [ ] `pnpm format` passes (code properly formatted)
   - [ ] No `any` types used
   - [ ] All symbols have JSDoc comments

2. **Functionality**
   - [ ] `buildSixfoldDslV1Steps()` function exists and returns `Step<SixFoldV0Config>[]`
   - [ ] DSL code compiles without errors
   - [ ] All 94 steps from original represented with cs2 modification + 1 new step = 95 total
   - [ ] `DSL_SIXFOLD_V1_STEPS_LENGTH` constant exported with value 95

3. **Correctness**
   - [ ] cs2 at same position as cs (same origin)
   - [ ] p1 at (0, 0) in cs2
   - [ ] All points after cs2 use cs2 as coordinate system
   - [ ] Direction choices (up, left, north, etc.) relative to cs2 position
   - [ ] cs2 transformations propagate to all geometries in cs2 hierarchy (transitively)
   - [ ] Geometry values correct within floating point tolerance (1e-9)

4. **Integration**
   - [ ] Existing `pnpm test` passes
   - [ ] Existing `pnpm build` passes
   - [ ] No breaking changes to existing code

## Test-Driven Development

Test file structure:

```typescript
// app2/src/geometry/__tests__/sixfoldDslV1Steps.test.ts
import { buildSixfoldDslV1Steps, DSL_SIXFOLD_V1_STEPS_LENGTH } from "../sixfoldDslV1Steps";
import { executeSteps } from "../stepExecution";
import { approx } from "@sg/geometry";

describe("Sixfold DSL v1 with cs2", () => {
  const config = { /* default SixFoldV0Config */ };

  it("cs2 at (p1x, p1y) from config", () => {
    const steps = buildSixfoldDslV1Steps();
    const results = executeSteps(steps, config);
    const cs2 = results.get("cs2");
    
    // cs2 should be at absolute position (config.p1x, config.p1y)
    expect(approx(cs2.x, config.p1x)).toBeTrue();
    expect(approx(cs2.y, config.p1y)).toBeTrue();
  });

  it("p1 at (0, 0) in cs2, absolute (p1x, p1y)", () => {
    const steps = buildSixfoldDslV1Steps();
    const results = executeSteps(steps, config);
    const p1 = results.get("p1");
    const cs2 = results.get("cs2");
    
    // p1's global position should equal cs2's position (p1 at origin of cs2)
    expect(approx(p1.x, cs2.x)).toBeTrue();
    expect(approx(p1.y, cs2.y)).toBeTrue();
    // Which equals config.p1x, config.p1y
    expect(approx(p1.x, config.p1x)).toBeTrue();
    expect(approx(p1.y, config.p1y)).toBeTrue();
  });

  it("all points use cs2 as parent coordinate system", () => {
    const steps = buildSixfoldDslV1Steps();
    // Verify that all pointInCs expressions after step 1 use cs2
    // Note: Not all geometries have direct cs2 dependency
    // but all points should be defined in cs2
  });

  it("direction computation relative to cs2 orientation", () => {
    // Verify that direction-based operations compute directions relative to cs2
    // Rotate cs2 and verify geometry recomputes correctly
    // This test ensures zero code changes needed when cs2 rotates
    
    // Create config with cs2 rotation
    const configWithRotation = { ...config, cs2Rotation: Math.PI / 2 }; // 90 degrees
    
    // Execute steps with rotated cs2
    const steps = buildSixfoldDslV1Steps();
    const results = executeSteps(steps, configWithRotation);
    
    // Verify that direction-based geometries have recomputed positions
    // relative to cs2's new orientation
    // (Specific assertions depend on direction computation implementation)
  });

  it("cs2 transformations propagate transitively", () => {
    // Verify that transforming cs2 affects geometries defined in cs2
    // even if they don't have direct dependency on cs2
    // (e.g., intersection of two lines defined by points in cs2)
  });

  it("step count is 95", () => {
    const steps = buildSixfoldDslV1Steps();
    expect(steps.length).toBe(DSL_SIXFOLD_V1_STEPS_LENGTH);
    expect(DSL_SIXFOLD_V1_STEPS_LENGTH).toBe(95);
  });
});
```

## Open Questions

1. **cs2 parameters**: Should cs2 inherit arrowLength from cs, or have its own?
2. **Direction computation**: How to implement direction choices computed relative to cs2's orientation? Need framework support or workarounds.
3. **"ONLY" clarification**: User does not understand this question - needs rephrasing or removal.

## Decisions

| # | Decision | Options | Recommendation | Status |
|---|----------|---------|----------------|--------|
| 1 | File naming | Use v1 version naming | `sixfoldDslV1Steps.ts` | **RESOLVED** |
| 2 | cs2 position | Before p1 / After p1 | **Before p1** (cs2 created at step 1, p1 at step 2 in cs2) | **RESOLVED** |
| 3 | p1 position in cs2 | Arbitrary / (0,0) | **(0,0)** - p1 at origin of cs2 | **RESOLVED** |
| 4 | cs2 based on cs | At (p1x, p1y) from config | Absolute position based on cs origin | **RESOLVED** |
| 5 | Direction choices | Hardcoded / Computed relative to cs2 | **Computed relative to cs2** - ensures rotation works with zero changes | **RESOLVED** |
| 6 | Step numbering shift | Acceptable? | **Yes - shift ok** | **RESOLVED** |
| 7 | cs2 inherit from cs | Should cs2 inherit? | **Yes - inherit** | **RESOLVED** |
| 8 | Direction reference | Absolute / Relative to cs2 | **Relative to cs2 position** | **RESOLVED** |

## Appendix A: Reference - Step Order Comparison

Original `sixfoldDslSteps.ts` (v0):
- Step 0: cs (coordinate system at origin)
- Step 1: p1 (point in cs at config p1x, p1y)
- Step 2: p2 (point in cs at config p2x, p2y)
- Step 3: line1 (line from p1 to p2)
- ...

New `sixfoldDslV1Steps.ts`:
- Step 0: cs (coordinate system at origin) - UNCHANGED
- Step 1: cs2 (coordinate system at config p1x, p1y) - NEW
- Step 2: p1 (point in cs2 at (0, 0)) - MODIFIED (was in cs at config coords, now in cs2 at origin; absolute position still (p1x, p1y))
- Step 3: p2 (point in cs2 at config p2x, p2y) - MODIFIED (was in cs, now in cs2)
- Step 4: line1 (line from p1 to p2) - UNCHANGED
- ... (all subsequent pointInCs calls use cs2 instead of cs)

**Note**: Step numbers shift by +1. Original v0 had 94 steps (0-93). v1 has 95 steps (0-94): original steps 0-93 become v1 steps 0, 2-94 (with cs2 inserted at step 1).

## Appendix B: Transformation Propagation Example

```typescript
// Scenario: cs2 is translated by (10, 20)
// cs2 is at same position as cs (origin)
// p1 is at (0, 0) in cs2, so p1.global = cs2.global = (0, 0) initially
// p2 is at (p2x, p2y) in cs2, so p2.global = (cs2.x + p2x, cs2.y + p2y)

// After cs2 translation by (10, 20):
//   cs2.x = 10, cs2.y = 20
//   p1.global = (10, 20)  // p1 at origin of cs2, follows cs2
//   p2.global = (10 + p2x, 20 + p2y)  // Automatically updated via dependency chain
// All other geometries defined in cs2 also shift by (10, 20)
```

This propagation is handled automatically by the existing step execution engine's dependency tracking. Points defined in cs2 have cs2 in their dependency chain (transitively through the points they reference).
