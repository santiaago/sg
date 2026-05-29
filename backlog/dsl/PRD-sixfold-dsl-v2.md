# PRD: SixFold DSL v2 with Coordinate System Flip Support

## Problem Statement

The SG Geometry framework currently supports coordinate systems with **translation** and **rotation**, but lacks **flip/mirror** support. This prevents creating mirrored geometric constructions like the "rosa" sixfold pattern, which requires flipping coordinate systems on the x-axis and/or y-axis. The existing SixFold DSL v1 demonstrates multi-coordinate-system support but cannot produce mirrored variants without code duplication. Additionally, direction-based intersection selections (left/right, north/south/east/west) are hardcoded to the global coordinate system, making them unable to adapt when a construction uses a flipped or rotated coordinate system.

## Solution

Implement **SixFold DSL v2** as a mirrored variant of v1, introducing **coordinate system flip** support to the geometry framework. This involves:

1. **Framework extension**: Add `flipX` and `flipY` properties to the `CoordinateSystem` type, enabling horizontal and vertical mirroring of coordinate systems
2. **Direction relativity**: Add `relativeTo` option to intersection expressions, allowing direction selections to be interpreted in a specific coordinate system's local space
3. **v2 construction**: Create a new DSL construction where cs2 is positioned at v1's p2 location with `flipX=true`, effectively swapping p1 and p2 positions
4. **UI integration**: Display v2 before v1 in both the scroll order and navigation bar

This v2 construction serves as both a **demonstration of flip capability** and a **building block** for the eventual "rosa" sixfold pattern (composed of 4 mirrored v1 constructions).

---

## User Stories

### Core Framework Capabilities

1. As a geometry framework user, I want to flip a coordinate system on the x-axis, so that I can create mirrored geometric constructions
2. As a geometry framework user, I want to flip a coordinate system on the y-axis, so that I can create vertically mirrored constructions
3. As a geometry framework user, I want to combine flip and rotation on a coordinate system, so that I can create arbitrarily transformed constructions
4. As a geometry framework user, I want direction-based intersection selections to be relative to a specific coordinate system, so that my constructions work correctly even when the coordinate system is flipped or rotated
5. As a geometry framework user, I want the coordinate system flip to automatically propagate to all child geometries, so that I don't have to manually adjust each geometry's position

### SixFold v2 Construction

6. As a geometry pattern designer, I want a SixFold v2 construction that mirrors v1 on the x-axis, so that I can use it as a building block for the complete rosa pattern
7. As a geometry pattern designer, I want v2's cs2 to be positioned at v1's p2 location, so that the mirroring is correctly positioned relative to v1
8. As a geometry pattern designer, I want v2's p1 and p2 to be swapped from v1 (p1 at v1's p2, p2 at v1's p1), so that the construction is properly mirrored
9. As a geometry pattern designer, I want all direction-based selections in v2 to use cs2's local coordinate space, so that left/right/north/south are interpreted correctly in the flipped system

### UI/UX

10. As a pattern viewer, I want to see SixFold v2 displayed before v1 when scrolling through the app, so that I can see the more advanced variant first
11. As a pattern viewer, I want to see SixFold v2 appear before v1 in the navigation bar, so that I can quickly navigate to it
12. As a pattern viewer, I want each construction to have its own isolated section, so that I can view and interact with them independently

### Testing & Quality

13. As a developer, I want unit tests for coordinate system flip transformations, so that I can verify points transform correctly
14. As a developer, I want unit tests for relative direction selection, so that I can verify intersections are selected correctly in flipped coordinate systems
15. As a developer, I want integration tests that verify v2 produces the expected mirrored geometry, so that I can confirm the construction is correct
16. As a developer, I want the entire codebase to pass type-checking after each phase, so that I can catch type errors early
17. As a developer, I want the entire codebase to pass linting and formatting checks after each phase, so that code quality is maintained

### Future Extensibility

18. As a framework maintainer, I want the flip capability to be extensible to future constructions, so that other patterns can use it
19. As a framework maintainer, I want the relativeTo direction feature to work with any coordinate system, so that it's generally useful
20. As a pattern designer, I want to be able to combine multiple flipped constructions in the same canvas, so that I can build the complete rosa pattern

---

## Implementation Decisions

### Framework Extensions

**Decision 1: Add flipX and flipY to CoordinateSystem type**

- The `CoordinateSystem` type will be extended with optional boolean properties `flipX?: boolean` and `flipY?: boolean`
- When `flipX=true`, the x-axis of the coordinate system is mirrored (local x increases to the left in global space)
- When `flipY=true`, the y-axis of the coordinate system is mirrored (local y increases upward in global space)
- Both default to `false` for backward compatibility
- Rationale: This is the minimal, explicit way to support coordinate system flipping. A `scaleX`/`scaleY` approach was considered but rejected as less intuitive for the mirroring use case.

**Decision 2: Transformation formula for flipped coordinate systems**

- For a coordinate system with position (x, y), rotation θ, flipX, and flipY, a local point (x_l, y_l) maps to global coordinates:
  - x*global = x + (x_l * (flipX ? -1 : 1) \_ cos(θ)) - (y_l \* sin(θ))
  - y*global = y + (x_l * (flipX ? -1 : 1) _ sin(θ)) + (y_l _ cos(θ)) \_ (flipY ? -1 : 1)
- Rationale: This formula correctly handles the composition of translation, rotation, and flip transformations in SVG coordinate space (where y increases downward).

**Decision 3: Add relativeTo option to intersection expressions**

- `IntersectionOptions` will be extended with `relativeTo?: string` (coordinate system ID)
- `CircleIntersectionOptions` will be extended with `relativeTo?: string` (coordinate system ID)
- When `relativeTo` is specified, direction-based selection ("left", "right", "north", "south", "east", "west") is interpreted in the specified coordinate system's local space
- Selection is performed by: (1) computing all intersection points, (2) transforming each to the relative CS's local space, (3) selecting based on local coordinates
- Rationale: This allows direction selections to work correctly when the coordinate system is flipped or rotated, without requiring manual adjustment of direction parameters.

**Decision 4: Create separate SixFoldV2Config type**

- A new `SixFoldV2Config` interface will be created that extends `SixFoldV0Config`
- Rationale: This provides type safety and clarity, even though v2 hardcodes its flip parameters, it may evolve to need additional configuration in the future.

### SixFold v2 Construction

**Decision 5: v2 cs2 positioning and flipping**

- cs2 is positioned at the global coordinates of v1's p2: (p2x, p2y)
- cs2 has `flipX: true`, `flipY: false`, `rotation: 0`
- Rationale: This places v2 in a position that will eventually form part of the rosa pattern, with the x-axis flip creating the mirrored effect.

**Decision 6: v2 p1 and p2 placement**

- p1 is at (0, 0) in cs2's local space → global position = (p2x, p2y) = v1's p2 position
- p2 is at (p2x - p1x, p1y - p2y) in cs2's local space → global position = (p1x, p1y) = v1's p1 position
- Rationale: This swaps the positions of p1 and p2, which is the expected result of mirroring v1 on the x-axis.

**Decision 7: Direction-based selections in v2**

- All intersection expressions in v2 that use direction-based selection will include `relativeTo: "cs2"`
- Affected steps: 7 (cp2), 9 (pic12), 23 (pic14), 35 (pi3), 36 (pi4), 70 (pic23), 76 (pc34e)
- Rationale: This ensures that direction selections work correctly in the flipped coordinate system.

### Architecture

**Decision 8: Modular implementation in phases**

- Implementation will proceed in 7 phases: Framework foundation (flip), Direction relativity, Config, v2 DSL file, UI integration, Tests, Exports
- Each phase will have its own commit with verification checks
- Rationale: This allows incremental delivery and easier debugging.

**Decision 9: File organization**

- New files: `transformations.ts` (DSL utilities), `sixfoldDslV2Steps.ts` (v2 construction), `SixFoldDslV2Svg.tsx` (v2 component), `sixfoldDslV2Steps.test.ts` (v2 tests)
- Modified files: Core geometry types, DSL expressions, builders, UI components
- Rationale: New files for new functionality, modifications to existing files for framework extensions.

**Decision 10: UI ordering**

- v2 section will appear before v1 section in `App.tsx` scroll order
- v2 nav item will appear before v1 nav item in the navigation bar
- Rationale: User requirement to showcase the more advanced variant first.

---

## Testing Decisions

### Testing Philosophy

- Tests focus on **external behavior** (what the module does), not **implementation details** (how it does it)
- Each deep module will have unit tests that verify its contract
- Integration tests verify that modules work together correctly

### Modules to Test

1. **CoordinateSystem flip transformation** - Verify that points defined in a flipped coordinate system have correct global positions
2. **PointInCoordinateSystemExpression with flip** - Verify transformation formula correctness
3. **IntersectionExpression with relativeTo** - Verify direction selection works in relative coordinate systems
4. **CircleIntersectionExpression with relativeTo** - Verify circle intersection selection works in relative coordinate systems
5. **transformPointToLocalSpace helper** - Verify point-to-local-space transformation
6. **SixFold v2 construction** - Verify v2 produces expected mirrored geometry

### Prior Art

- Existing tests in `app2/test/` use Vitest
- `squareDslSteps.test.ts` tests DSL step construction
- `sixfoldDslV1Steps.test.ts` tests v1 construction
- Pattern: Test file per construction, plus unit tests for framework utilities

### Test Approach

- For transformation tests: Provide known inputs (local point, CS with flip), verify global output
- For relativeTo tests: Provide known geometry and CS, verify correct intersection point is selected
- For v2 construction: Verify key geometry positions match expected mirrored values

---

## Out of Scope

1. **Rotation support for v2**: v2 specifically uses rotation=0. Full rotation support with flip is enabled by the framework changes but not demonstrated in v2.
2. **Combining multiple v1/v2 constructions**: While v2 is a building block for the rosa pattern, the actual combination of 4 constructions into one canvas is a future feature.
3. **Dynamic flip configuration**: v2 hardcodes flipX=true, flipY=false. Making these configurable via UI controls is a future enhancement.
4. **Additional flip combinations**: Testing all combinations of flipX/flipY/rotation is out of scope for this PRD. Only flipX=true is demonstrated in v2.
5. **Performance optimization**: No performance optimizations are required for this feature.
6. **Documentation updates**: While helpful, updating README or other documentation is out of scope for this implementation.

---

## Further Notes

### Domain Terminology

This PRD uses the established domain language from `CONTEXT.md`:

- **Geometric Construction**: Composite structure with inputs and outputs
- **Coordinate System**: Reference frame with origin, orientation, and scale
- **Step**: Single operation creating one Geometric Construction
- **Feature**: Numeric property of a Geometric Construction
- **Intersection**: Point(s) where geometric entities meet

### Relationship to Existing Work

- v2 builds on v1 (`sixfoldDslV1Steps.ts`), which introduced multi-coordinate-system support
- v2 builds on the DSL framework (`GeometryBuilder`, `GeometryExpression`)
- v2 is a prerequisite for the eventual rosa sixfold pattern

### Future Work

After v2 is complete, the next steps will be:

1. Create the remaining 3 mirrored constructions for the rosa pattern
2. Combine all 4 constructions in a single canvas
3. Add UI controls for dynamic flip/rotation configuration

### Success Criteria

- All type checks pass (`pnpm type-check:app2`)
- All lint checks pass (`pnpm lint`)
- All format checks pass (`pnpm format`)
- All existing tests continue to pass
- New tests for v2 pass
- v2 section appears before v1 in UI
- v2 construction renders correctly with flipped geometry
