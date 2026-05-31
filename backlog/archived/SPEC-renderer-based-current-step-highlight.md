# Spec: Renderer-Based Current Step Green Highlight

## Objective

Implement visual highlighting of geometries created in the current step during geometric construction playback. When a user steps through a DSL-based construction, geometries created in the current step render in green (`#00ff00`) to provide clear visual feedback about which step's output is being displayed.

**Why:** Addresses backlog item from `12-05-26.md`: "geometry that is created in current step should be shown in a different color temporarily". Enables users to visually track step-by-step construction progress.

**User:** Geometry construction viewers using DSL-based components (SquareDslSvg, SixFoldDslSvg, SixFoldDslV1Svg).

**Status:** Implemented in commits a03ed2f-83e5be1. Feature complete with done-state handling (no highlight at step 0 or final step).

## Tech Stack

- **Language:** TypeScript (ESM)
- **Framework:** React 18+
- **Architecture:** Renderer pattern with dependency injection
- **Geometry:** Custom DSL (Declarative Geometry Framework)
- **Testing:** Vitest

## Commands

```bash
# Type-check app2 only
pnpm type-check:app2

# Run app2 tests
pnpm test

# Run dev server for manual verification
pnpm dev

# Build
pnpm build
```

## Project Structure

```
app2/src/
├── themes.ts                              # COLOR_CURRENT_STEP = "#00ff00"
├── geometry/
│   └── dsl/
│       ├── renderers/
│       │   ├── types.ts                  # GeometryRenderer with stepId param
│       │   └── DefaultRenderer.ts        # Stores currentStepId, applies highlight
│       ├── expressions/                  # All compile with stepId
│       │   ├── CircleExpression.ts
│       │   ├── CoordinateSystemExpression.ts
│       │   ├── LineExpression.ts
│       │   ├── PointExpression.ts
│       │   ├── PointInCoordinateSystemExpression.ts
│       │   ├── PolygonExpression.ts
│       │   └── operations/               # 10 operation expressions
│       ├── utils.ts                       # createStepId() helper
│       ├── squareDslSteps.ts
│       ├── sixfoldDslSteps.ts
│       └── sixfoldDslV1Steps.ts
├── components/
│   ├── SquareDslSvg.tsx
│   ├── SixFoldDslSvg.tsx
│   └── SixFoldDslV1Svg.tsx
└── svgElements.ts
```

## Code Style

Per `AGENTS.md`: TypeScript ESM, Oxlint/Oxfmt, strict typing, repo-root-relative imports.

**Key pattern:**

```typescript
// Expressions compile with stepId created from expression id
const stepId = createStepId(this.id);

// Step definition includes stepId in id field
return {
  id: stepId,
  // ...
  draw: (svg, values, store, theme) => {
    renderer.drawCircle(svg, values, this.id, store, theme, stepId);
  },
};

// Component sets currentStepId on renderer
const currentStepId =
  currentStep > 0 && currentStep <= allSteps.length ? allSteps[currentStep - 1]?.id : "";
renderer.setCurrentStepId(currentStepId);

// Renderer applies highlight when stepId matches
const fillColor = stepId && stepId === this.currentStepId ? theme.COLOR_CURRENT_STEP : undefined;
```

## Architecture

**Renderer-Based Approach:**

```
DSL Expression.compile()
    ↓ creates stepId = createStepId(expression.id)
Step Definition
    ↓ stores stepId as step.id
Component (SquareDslSvg, etc.)
    ↓ sets renderer.currentStepId = currentStep?.id or ""
Renderer.drawXXX()
    ↓ if stepId === currentStepId → apply COLOR_CURRENT_STEP
```

**Why this approach:**

- No React async state issues (vs. reading store.items)
- No DOM manipulation post-render (vs. querySelector hacks)
- Clean separation: Expressions define steps, renderer handles rendering, components manage state
- Reusable: All DSL geometries automatically get highlighting
- Done state: Natural extension - empty currentStepId = no highlighting

## Implementation Details

### Step ID Generation

- `createStepId(id: string): string` in `utils.ts` prefixes geometry IDs with `"step_"`
- Each expression's `compile()` method generates a unique stepId from its ID
- Step ID becomes the step's `id` field in the compiled Step object

### Highlight Application

- `DefaultGeometryRenderer` stores `currentStepId` (string, default "")
- All `drawXXX()` methods accept optional `stepId?: string` parameter
- When `stepId === currentStepId`, applies `theme.COLOR_CURRENT_STEP` (#00ff00)
- Highlight applied as:
  - **Point:** fill color
  - **Line/Circle/Polygon:** stroke color
  - **Coordinate System:** stroke color on arrows + arrowhead marker fill

### Done State Handling

- Components clear `currentStepId` to "" at boundaries:
  - `currentStep === 0`: No step selected
  - `currentStep > totalSteps`: Construction complete
- Empty `currentStepId` → no highlighting applied
- Final construction shows only outline colors, no green

### Arrowhead Marker Handling

- Coordinate system arrowhead marker color updated via strokeColor pass-through
- No direct DOM query in renderer (removed fragile `querySelector` approach)
- `svgDrawCoordinateSystem` accepts and applies arrowhead fill color

## Success Criteria

### Core Implementation ✅

- [x] Theme: `COLOR_CURRENT_STEP: string` in Theme interface
- [x] Theme: `#00ff00` in lightTheme and darkTheme
- [x] Renderer interface: `stepId?: string` param on all draw methods
- [x] DefaultGeometryRenderer: `currentStepId` state + getter/setter
- [x] DefaultGeometryRenderer: Green fill/stroke when stepId matches currentStepId
- [x] All expression classes: compile() generates stepId via createStepId()
- [x] All expression classes: Pass stepId to renderer.drawXXX()
- [x] DSL step builders: Compile expressions with renderer
- [x] 3 DSL SVG components: Set currentStepId on renderer
- [x] Type-check: `pnpm type-check:app2` passes

### Done State ✅

- [x] currentStep=0 → No green highlight
- [x] currentStep=N (where N ≤ totalSteps) → Step N geometries highlighted
- [x] currentStep>totalSteps → NO green highlight, only outline colors
- [x] Final construction shows only outline colors, no green

### Testing ⚠️

- [x] Unit tests: `DefaultRenderer.test.ts` for highlighting logic (36 tests, all pass)
- [ ] **TODO:** Integration tests for DSL SVG components (SquareDslSvg, SixFoldDslSvg, SixFoldDslV1Svg) to verify done-state behavior
- [ ] Manual: Green highlight visible in browser for active step
- [ ] Manual: Verify all geometry types highlight correctly
- [ ] Manual: Verify done state (no highlight at start/end)
- [ ] Unit tests: Expression stepId generation

## Files Committed

| Commit  | Scope                                       | Description                                       |
| ------- | ------------------------------------------- | ------------------------------------------------- |
| a03ed2f | app2/themes                                 | Add COLOR_CURRENT_STEP                            |
| 21f0c31 | app2/geometry/dsl/renderers                 | Add stepId param + currentStepId highlighting     |
| 72075a4 | app2/geometry/dsl/expressions               | Pass stepId to renderer.drawXXX()                 |
| 7ed17d4 | app2/geometry                               | Update DSL step builders for renderer interface   |
| 910f61c | app2/components                             | Integrate highlighting in DSL SVG components      |
| 14307ee | app2                                        | Update imports and references                     |
| 4c3b20b | app2/svgElements                            | Arrowhead marker handling for CS                  |
| 84ae746 | app2/geometry/dsl/utils                     | DSL utilities (createStepId)                      |
| 9335cce | app2/svgElements,app2/utils                 | Restore CS lines/labels/arrowheads on deselect    |
| 83e5be1 | app2/components,app2/geometry/dsl/renderers | Remove redundant arrowhead update, add debug logs |

## Notes

### Debugging

- Debug logs added to `DefaultRenderer.drawCoordinateSystem` for troubleshooting
- Logs include: geomId, stepId, currentStepId, shouldHighlight, strokeColor

### Related

- Source: `backlog/12-05-26.md` (original requirement)
- Plan: `backlog/PLAN-poc-current-step-green.md` (implementation alternatives)
- Spec: `backlog/SPEC-poc-current-step-green.md` (initial POC spec)
- Fix Plan: `FIXPLAN-current-step-highlight.md` (identified arrowhead issues, naming inconsistencies)
