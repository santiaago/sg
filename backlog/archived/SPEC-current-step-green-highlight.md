# Spec: Current Step Geometry Green Highlight

## Assumptions (Resolved)

1. **"Current step" definition**: When `currentStep=N`, geometries created by step N-1 (0-indexed) are highlighted. Step 0 outputs green when `currentStep=1`.
2. **Step tracking**: Use existing `GeometryItem.stepId` field (react-store.ts:29). No schema changes needed.
3. **Color**: Add `COLOR_CURRENT_STEP` to Theme interface with value `#00ff00` for both themes.
4. **Geometry types**: All types supported - point, line, circle, polygon, coordinate_system.
5. **Approach**: Post-draw highlighting. Apply green after step execution via store iteration. Cleaner than modifying draw function signatures.

## Objective

Provide visual feedback during step-by-step geometry construction. Geometry created in the current step renders in green. Green highlight persists until user navigates to next/previous step. All geometry types supported: point, line, circle, polygon, coordinate_system.

User benefit: Clear indication of which geometries were just created, improving understanding of construction progression.

## Tech Stack

- React 18 + TypeScript 5
- SVG DOM API for rendering
- Existing: `GeometryStore` (react-store.ts), `Step` interface (types/geometry.ts), `Theme` system (themes.ts)

## Commands

```bash
# Build and verify
pnpm type-check:app2
pnpm test
pnpm format:fix
```

## Project Structure

```
app2/
├── src/
│   ├── types/geometry.ts      # GeometryValue, Step, GeometryType
│   ├── react-store.ts         # GeometryStore, GeometryItem (has stepId)
│   ├── themes.ts              # Theme interface - ADD COLOR_CURRENT_STEP
│   ├── svgElements.ts         # drawPoint, drawLine, drawCircle, drawPolygon, drawCoordinateSystem
│   ├── components/
│   │   ├── SquareSvg.tsx      # Pass currentStep to draw fns
│   │   ├── SixFoldV0Svg.tsx   # Pass currentStep to draw fns
│   │   ├── RotatedSquareSvg.tsx
│   │   ├── SquareDslSvg.tsx
│   │   ├── SixFoldDslSvg.tsx
│   │   └── SixFoldDslV1Svg.tsx
│   ├── geometry/
│   │   ├── squareSteps.ts     # Step definitions
│   │   ├── sixFoldV0Steps.ts
│   │   └── ...
│   └── svg.ts                 # buildStepMaps, executeSteps
```

## Code Style

Match existing patterns:

- Short, descriptive function names
- Type-safe with no `any`
- JSDoc comments for public APIs
- Oxlint/Oxfmt compliant

Example modification pattern:

```typescript
// Before
drawPoint(svg, values, geomId, radius, store, theme);

// After - pass currentStep for highlighting
drawPoint(svg, values, geomId, radius, store, theme, { currentStep });
```

## Testing Strategy

Framework: Vitest

Test levels:

- Unit: `svgElements.ts` draw functions apply correct color based on step match
- Integration: Step navigation triggers color update for all geometry types
- Snapshot: SVG output matches expected structure with color attributes

Test locations:

- `app2/src/components/*.test.tsx` - component integration tests
- `app2/src/svgElements.test.ts` - new unit tests for draw functions

Coverage: All geometry types (point, line, circle, polygon, coordinate_system) must have tests verifying green highlight behavior.

## Boundaries

- **Always**: type-check passes, tests pass, format clean, match existing style
- **Ask first**: add new theme color constant, modify Theme interface, change Step interface
- **Never**: break existing geometry rendering, modify step execution logic, change dependency tracking

## Success Criteria

Specific, testable conditions:

1. **Theme Extension**: `Theme` interface includes `COLOR_CURRENT_STEP: string` with green value (#00ff00 or similar)
2. **Step Tracking**: Each `GeometryItem` in store has accurate `stepId` matching its creating step
3. **Color Application**: Geometry with `stepId` matching current step renders with `COLOR_CURRENT_STEP`
4. **Color Reversion**: Geometry from other steps renders with theme default colors (COLOR_PRIMARY, COLOR_SECONDARY, COLOR_DOT)
5. **Instant Update**: Color changes immediately when next/prev step clicked (no animation delay)
6. **All Types**: Works for point, line, circle, polygon, coordinate_system
7. **No Regressions**: All existing tests pass, existing visual output unchanged except for color
8. **Type Safety**: No `any` types, TypeScript compilation succeeds

## Implementation Notes

### Current Architecture

1. `currentStep` (number): Tracked in App.tsx state, passed to SVG components (0 = no steps, 1 = step 0 executed, N = steps 0 to N-1 executed)
2. `GeometryItem.stepId` (string): Set during step execution via `store.update()` in each SVG component
3. Step IDs: Each step has unique `id` field (e.g., "step_p1", "step_main_line")
4. Step execution: `executeSteps()` runs steps 0 to `currentStep-1`, updates store with outputs
5. **Key finding**: SVG elements are recreated on every step change via `store.add()` which removes old elements

### Step-to-Geometry Mapping

Pattern in all SVG components (`SquareSvg.tsx`, `SixFoldV0Svg.tsx`, etc.):

```typescript
// After executeSteps(), update store with step metadata
for (const [id, _] of allValues) {
  const step = stepForOutput.get(id); // Step that produces this geometry
  const stepId = step?.id ?? "";
  store.update(id, { dependsOn: deps, stepId, parameterValues: paramValues });
}
```

Each geometry's `stepId` = its creating step's `id`.

### Required Changes

**1. Theme Extension** (`themes.ts`):

```typescript
export interface Theme {
  // Existing...
  COLOR_INPUT_HIGHLIGHT: string;
  COLOR_SELECTED: string;
  // NEW:
  COLOR_CURRENT_STEP: string;  // Green for current step geometries
}

// Both themes:
COLOR_CURRENT_STEP: "#00ff00",  // Pure green
```

**2. Highlight Helper** (`geometryHighlighting.ts`):
Add new function:

```typescript
export function applyCurrentStepHighlight(
  svg: SVGSVGElement,
  store: GeometryStore,
  currentStepId: string,
  theme: Theme,
): void {
  Object.values(store.items).forEach((item) => {
    if (item.element && item.stepId === currentStepId) {
      if (item.type === "point") {
        item.element.setAttribute("fill", theme.COLOR_CURRENT_STEP);
      } else if (item.type === "circle" || item.type === "line" || item.type === "polygon") {
        item.element.setAttribute("stroke", theme.COLOR_CURRENT_STEP);
      } else if (item.type === "coordinate_system") {
        applyToCsArrows(item.element, (el) => {
          el.setAttribute("stroke", theme.COLOR_CURRENT_STEP);
        });
        updateArrowheadMarkerColor(svg, theme.COLOR_CURRENT_STEP);
      }
    }
  });
}
```

**3. SVG Components** (all 6 components):
In each `*Svg.tsx`, after step execution and store update:

```typescript
// Compute current step ID
const currentStepId = currentStep > 0 ? STEPS[currentStep - 1].id : "";

// Apply green highlight to current step geometries
if (currentStepId && svgRef.current) {
  applyCurrentStepHighlight(svgRef.current, store, currentStepId, theme);
}
```

**4. Files to Modify**:

- `app2/src/themes.ts` - add COLOR_CURRENT_STEP
- `app2/src/utils/geometryHighlighting.ts` - add applyCurrentStepHighlight
- `app2/src/components/SquareSvg.tsx`
- `app2/src/components/SixFoldV0Svg.tsx`
- `app2/src/components/RotatedSquareSvg.tsx`
- `app2/src/components/SquareDslSvg.tsx`
- `app2/src/components/SixFoldDslSvg.tsx`
- `app2/src/components/SixFoldDslV1Svg.tsx`

### Why Post-Draw Approach Works

1. SVG elements recreated on every step change (via `store.add()` → `removeElementAndTooltips()`)
2. `stepId` set in store AFTER `executeSteps()` completes
3. Post-draw iteration applies green to matching geometries
4. No changes to Step interface or step definitions needed
5. Clean separation: drawing creates elements, highlighting modifies them

## Decisions

1. **Color value**: Add `COLOR_CURRENT_STEP: string` to `Theme` interface in `themes.ts`. Use semantic name for maintainability. Value: `#00ff00` (pure green) for both light and dark themes.

2. **Step identification**: Use existing `GeometryItem.stepId` field. No new property needed. Compute `currentStepId = STEPS[currentStep - 1].id` in each SVG component.

3. **Coordinate system**: Yes - step 0 outputs should be green when `currentStep=1`. Consistent behavior: geometry created in step N-1 is green when `currentStep=N`.

4. **Multiple SVG components**: Each SVG component (SquareSvg, SixFoldV0Svg, RotatedSquareSvg, SquareDslSvg, SixFoldDslSvg, SixFoldDslV1Svg) must be updated. Use shared helper function `applyCurrentStepHighlight` from `geometryHighlighting.ts` to avoid duplication.

5. **Step index vs step ID**: Use numeric `currentStep` (0 to N) from component props. Convert to step ID via `steps[currentStep - 1]?.id`. When `currentStep=0`, no step is current (no geometries to highlight).

## Decision Log

| Date       | Decision                                    | Rationale                                                                                                                                 |
| ---------- | ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| 2025-XX-XX | Use existing `stepId` on GeometryItem       | Already available in react-store.ts:29. No schema changes needed.                                                                         |
| 2025-XX-XX | Add `COLOR_CURRENT_STEP` to Theme interface | Semantic naming, consistent with existing COLOR_INPUT_HIGHLIGHT, COLOR_SELECTED.                                                          |
| 2025-XX-XX | Post-draw highlight application             | SVG elements recreated on every step change. Apply green after draw via store iteration. Cleaner than modifying draw function signatures. |
| 2025-XX-XX | Include coordinate_system                   | Step 0 outputs should be highlighted when currentStep=1. All geometry types supported.                                                    |
