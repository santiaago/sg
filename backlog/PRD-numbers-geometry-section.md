# PRD: Numbers Geometry Section

## Problem Statement

The DSL framework lacks dedicated showcase examples demonstrating its capabilities for creating diverse geometric constructions. While square-dsl and sixfold-dsl sections exist, there is no section that showcases simple, recognizable geometries that serve as intuitive entry points for understanding the DSL. A "numbers" section where each number (1-12) is represented by a distinct geometric construction would provide an accessible and comprehensive demonstration of the DSL's features including coordinate systems, intersections, feature references, and dependency tracking.

## Solution

Add a new "numbers" section to app2 that allows users to select and view geometric constructions representing numbers 1 through 12. The section follows the existing pattern of square-dsl and sixfold-dsl, featuring a player with SVG canvas, geometry details, and geometry items. A grid picker with thumbnails enables users to preview and select which number's construction to explore step-by-step.

Start with numbers 1-4 as a minimal viable implementation, with the infrastructure to support all 12 numbers.

## User Stories

### Section & Navigation

1. As a user, I want a "numbers" entry in the navigation, so that I can access the numbers geometry section
2. As a user, I want the numbers section to follow the same layout pattern as square-dsl and sixfold-dsl, so that the interface is consistent and familiar
3. As a user, I want the numbers section to be scrollable like other sections, so that I can navigate to it via URL hash

### Picker & Selection

4. As a user, I want a grid of thumbnails showing all available numbers, so that I can visually browse and select a number to explore
5. As a user, I want thumbnails to display the final rendered geometry after all construction steps, so that I can preview what each number looks like
6. As a user, I want thumbnails to be 150x150 pixels, so that they are large enough to recognize but fit well in a grid
7. As a user, I want to click a thumbnail to select that number, so that I can view its step-by-step construction in the player

### Number 1 (Dot)

8. As a developer, I want number 1 to start with the shared base construction (cs, cs2, p1, p2, line1), so that all numbers follow a consistent foundation
9. As a developer, I want number 1 to place a dot (circle) at the midpoint of line1, so that the simplest number is represented by the simplest addition to the base
10. As a user, I want to see the dot construction progress from base through to the final circle, so that I can understand how a single geometric element is added

### Number 2 (Yin Yang)

11. As a developer, I want number 2 to start with the shared base construction, so that consistency is maintained across all numbers
12. As a developer, I want number 2 to construct a yin yang symbol using circles and dividing curves, so that circle operations and intersections are demonstrated
13. As a user, I want to see the yin yang constructed step-by-step, so that I can understand how complex symbols are built from primitive geometries

### Number 3 (Three Circles Triangle)

14. As a developer, I want number 3 to start with the shared base construction, so that all numbers share the same foundation
15. As a developer, I want number 3 to arrange three circles at the vertices of an isosceles triangle, so that multi-geometry positioning is demonstrated
16. As a user, I want to see three circles positioned to form a triangle, so that I can understand how multiple independent geometries are composed

### Number 4 (Four Circles Flower)

17. As a developer, I want number 4 to start with the shared base construction, so that consistency is maintained
18. As a developer, I want number 4 to arrange four circles in a symmetrical flower pattern, so that radial symmetry and pattern construction are demonstrated
19. As a user, I want to see four circles arranged aesthetically, so that I can understand how symmetrical patterns are created

### Player & Construction

20. As a user, I want to step through each number's construction step-by-step, so that I can see how the geometry is built incrementally
21. As a user, I want to play/pause/step through the construction, so that I can control the viewing experience
22. As a user, I want to see geometry details and dependency information, so that I can understand the construction's internal structure
23. As a user, I want to see the geometry items list, so that I can track all elements in the construction

### Technical

24. As a developer, I want NumberConfig to be computed from SVG dimensions, so that geometries scale properly with the canvas
25. As a developer, I want each number to have its own DSL definition file, so that code is organized and maintainable
26. As a developer, I want NumberSvg component to be reusable for both main player and thumbnails, so that rendering is consistent
27. As a developer, I want thumbnails to be cached after first render, so that performance is good when switching between numbers
28. As a developer, I want the implementation to follow existing patterns from square-dsl and sixfold-dsl, so that code is consistent with the rest of app2

### Future Extensibility

29. As a developer, I want the infrastructure to support numbers 5-12, so that the section can be extended later without refactoring
30. As a developer, I want each number's construction to be independent, so that adding new numbers doesn't affect existing ones

## Implementation Decisions

### Configuration

**NumberConfig Interface:**
A shared configuration interface for all number geometries containing:

- `width: number` - SVG canvas width
- `height: number` - SVG canvas height
- `border: number` - Margin/border spacing
- `p1x: number` - First endpoint x-coordinate for line1
- `p1y: number` - First endpoint y-coordinate for line1
- `p2x: number` - Second endpoint x-coordinate for line1
- `p2y: number` - Second endpoint y-coordinate for line1
- `coordinateSystemArrowLength: number` - Length of coordinate system axis arrows

**computeNumberConfig(width, height):**
A pure function that computes NumberConfig from SVG dimensions, following the same pattern as computeSixFoldV0Config and computeSquareConfig. Line1 is positioned horizontally near the bottom (same as sixfold-dsl-v1): p1 at (border, height - border), p2 at (width - border, height - border), with border = height / 3.

### Shared Base Construction

All numbers start with the same foundational construction, matching sixfold-dsl-v1:

1. **cs** - Main coordinate system at (0, 0)
2. **cs2** - Nested coordinate system at (p1x, p1y)
3. **p1** - Point in cs2 at (0, 0) (absolute: p1x, p1y)
4. **p2** - Point in cs2 at (p2x - p1x, p2y - p1y) (absolute: p2x, p2y)
5. **line1** - Line from p1 to p2

This shared base ensures consistency across all numbers and enables future transformations of entire number constructions as single units.

### Number DSL Definitions

Each number has its own TypeScript file in `app2/src/geometry/numbers/` exporting a `buildNumberXSteps()` function that returns `Step<NumberConfig>[]`:

- **numbers/1.ts** - Number 1 (Dot):
  - Steps 0-4: Shared base construction
  - Step 5: Point at midpoint of line1 (using pointAt with ratio 0.5)
  - Step 6: Circle at midpoint point (the dot)
  - Total: 7 steps

- **numbers/2.ts** - Number 2 (Yin Yang):
  - Steps 0-4: Shared base construction
  - Subsequent steps: Construct yin yang symbol using circle operations
  - Uses circle intersections and lines to create the symbolic representation
  - Total: TBD steps

- **numbers/3.ts** - Number 3 (Three Circles Triangle):
  - Steps 0-4: Shared base construction
  - Subsequent steps: Create three circles positioned at isosceles triangle vertices
  - Uses geometric positioning based on line1 endpoints and midpoint
  - Total: TBD steps

- **numbers/4.ts** - Number 4 (Four Circles Flower):
  - Steps 0-4: Shared base construction
  - Subsequent steps: Create four circles in symmetrical flower arrangement
  - Uses radial positioning around a center point
  - Total: TBD steps

Each file follows the pattern established in squareDslSteps.ts and sixfoldDslV1Steps.ts.

### Modules to Create

- **`app2/src/geometry/numbers/config.ts`** - NumberConfig interface and computeNumberConfig function
- **`app2/src/geometry/numbers/1.ts`** - Number 1 DSL definition
- **`app2/src/geometry/numbers/2.ts`** - Number 2 DSL definition
- **`app2/src/geometry/numbers/3.ts`** - Number 3 DSL definition
- **`app2/src/geometry/numbers/4.ts`** - Number 4 DSL definition
- **`app2/src/geometry/numbers/index.ts`** - Barrel export for number modules
- **`app2/src/components/NumberSvg.tsx`** - SVG component for rendering a number's geometry (parameterized by number and step)
- **`app2/src/components/NumberThumbnail.tsx`** - Thumbnail component (150x150) showing final geometry
- **`app2/src/components/NumberPicker.tsx`** - Grid picker component with thumbnails for numbers 1-4

### Modules to Modify

- **`app2/src/App.tsx`:**
  - Add "numbers" to SectionId type
  - Add navigation entry for numbers
  - Add state for numbers section (store, currentStep, isPlaying, etc.)
  - Add numbers section div with NumberPicker and NumberSvg
  - Add section ref and scroll handling
  - Import and integrate NumberPicker and NumberSvg components

- **`app2/src/components/Navigation.tsx`:**
  - Add "numbers" button to navigation menu

### Component Architecture

**NumberSvg:**

- Props: store, svgConfig, restartTrigger, currentStep, theme, number
- Similar to SquareDslSvg but parameterized by number
- Builds steps using the appropriate buildNumberXSteps function
- Handles SVG setup, clearing, and step execution
- Uses useThemeAwareSteps hook for theme/clear management

**NumberThumbnail:**

- Props: number, onClick
- Renders NumberSvg at 150x150 with currentStep = total steps (shows final state)
- Caches rendered SVG to avoid recomputation
- Triggers onClick callback when clicked

**NumberPicker:**

- Props: onSelectNumber
- Renders grid of NumberThumbnail components for numbers 1-4
- Manages thumbnail cache
- Calls onSelectNumber when a thumbnail is clicked

### Thumbnail Caching Strategy

Thumbnails are generated on-demand the first time a number is needed, then cached in a React ref. The cache maps number to rendered SVG string. This approach:

- Avoids pre-computing all thumbnails at app start
- Generates only thumbnails that are visible/needed
- Persists thumbnails across navigation within the app
- Simple implementation with no external dependencies

### Number Index and Metadata

Create a number registry that maps number to its module and metadata:

```typescript
const NUMBERS = {
  1: { label: "1 - Dot", module: () => import("./numbers/1"), steps: 7 },
  2: { label: "2 - Yin Yang", module: () => import("./numbers/2"), steps: TBD },
  3: { label: "3 - Triangle", module: () => import("./numbers/3"), steps: TBD },
  4: { label: "4 - Flower", module: () => import("./numbers/4"), steps: TBD },
} as const;
```

This enables dynamic loading and provides step counts for UI elements.

## Testing Decisions

### Test Philosophy

Only test external behavior, not implementation details. Focus on:

- Config computation produces correct values
- Each number's DSL definition produces expected geometry IDs
- Components render without errors
- Thumbnail caching works correctly
- Picker selection updates state correctly
- Integration with App.tsx navigation works

### Modules to Test

- **config.ts:** Test computeNumberConfig with various width/height combinations
- **numbers/1.ts:** Test that buildNumber1Steps produces expected number of steps and geometry IDs
- **numbers/2.ts:** Test that buildNumber2Steps produces expected output
- **numbers/3.ts:** Test that buildNumber3Steps produces expected output
- **numbers/4.ts:** Test that buildNumber4Steps produces expected output
- **NumberThumbnail.tsx:** Snapshot test rendered thumbnails for each number
- **NumberPicker.tsx:** Test that clicking thumbnails triggers correct callbacks
- **NumberSvg.tsx:** Test that component renders and executes steps correctly
- **App.tsx integration:** Test that numbers section is navigable and functional

### Prior Art

Follow patterns from existing tests:

- `app2/src/geometry/squareDslSteps.test.ts` - Tests for DSL step generation
- `app2/src/components/SquareDslSvg.test.tsx` - Tests for SVG component rendering
- `app2/src/components/GeometryPlayer.test.tsx` - Tests for player functionality
- `app2/src/App.test.tsx` - Tests for app integration

### Test Types

- Unit tests for pure functions (computeNumberConfig, buildNumberXSteps)
- Snapshot tests for thumbnails
- Component tests for NumberThumbnail, NumberPicker, NumberSvg
- Integration test for numbers section in App.tsx

## Out of Scope

- Numbers 5-12 (planned for future iteration)
- Advanced yin yang with precise S-curve (simplified representation acceptable for MVP)
- Complex animations or transitions between numbers
- Custom styling per number
- User ability to add custom numbers
- Persistence of thumbnail cache across sessions
- Responsive grid layout for thumbnails (fixed grid acceptable for MVP)
- Touch gestures for thumbnail selection
- Accessibility enhancements beyond existing patterns

## Further Notes

### Naming Convention

Follow existing patterns:

- File names: kebab-case (number-svg.tsx, number-picker.tsx)
- Component names: PascalCase (NumberSvg, NumberPicker, NumberThumbnail)
- Function names: camelCase (buildNumber1Steps, computeNumberConfig)
- Geometry IDs: lowercase with underscores (cs, cs2, p1, p2, line1, dot_1, etc.)

### Code Organization

Numbers-related code is co-located:

- Config: `app2/src/geometry/numbers/config.ts`
- DSL definitions: `app2/src/geometry/numbers/X.ts`
- Components: `app2/src/components/Number*.tsx`

This keeps all numbers-related code together and separate from other sections.

### Future Work

After MVP (numbers 1-4):

1. Add numbers 5-12 with unique geometric representations
2. Consider adding a "random number" button for exploration
3. Consider adding number descriptions/tooltips
4. Consider adding difficulty ratings to numbers
5. Consider adding a progress indicator for the section

### Dependencies

This PRD depends on:

- Existing DSL framework (GeometryBuilder, GeometryExpressions)
- Existing app2 component patterns (SquareDslSvg, GeometryPlayer, etc.)
- Existing geometry types and store

No new external dependencies required.
