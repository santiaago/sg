# PRD: Numbers Geometry Section

## Problem Statement

The DSL framework lacks dedicated showcase examples demonstrating its capabilities for creating diverse geometric constructions. While square-dsl and sixfold-dsl sections exist, there is no section that showcases simple, recognizable geometries that serve as intuitive entry points for understanding the DSL. A "numbers" section where each number (1-12) is represented by a distinct geometric construction would provide an accessible and comprehensive demonstration of the DSL's features including coordinate systems, intersections, feature references, and dependency tracking.

## Solution

Add a new "numbers" **page** to app2 that allows users to select and view geometric constructions representing numbers 1 through 12. The page features a player with SVG canvas, geometry details, and geometry items list. A grid picker with thumbnails enables users to preview and select which number's construction to explore step-by-step.

The numbers page is accessible via URL paths like `/numbers/1`, `/numbers/2`, etc., making each number linkable and shareable.

Start with numbers 1-4 as a minimal viable implementation, with the infrastructure to support all 12 numbers.

## User Stories

### Page & Navigation

1. As a user, I want a "numbers" entry in the navigation, so that I can access the numbers page
2. As a user, I want the numbers page to be on a separate URL path (`/numbers`), so that I can bookmark and share links
3. As a user, I want the numbers page to use the GeometrySection layout pattern, so that I can see the player, geometry items, and geometry details
4. As a user, I want the URL to update when I select a number, so that I can share links to specific numbers
5. As a user, I want to navigate directly to a number via URL (e.g., `/numbers/1`), so that links are shareable

### Picker & Selection

6. As a user, I want a grid of thumbnails showing all available numbers, so that I can visually browse and select a number to explore
7. As a user, I want thumbnails to display **only the output geometries** of each number's construction (not the base construction inputs like cs, cs2, p1, p2, line1), so that I can see the final recognizable pattern
8. As a user, I want thumbnails to be 150x150 pixels, so that they are large enough to recognize but fit well in a grid
9. As a user, I want to click a thumbnail to select that number, so that I can view its step-by-step construction in the player

### Number 1 (Dot)

10. As a developer, I want number 1 to start with the shared base construction (cs, cs2, p1, p2, line1), so that all numbers follow a consistent foundation
11. As a developer, I want number 1 to place a dot (circle) at the midpoint of line1, so that the simplest number is represented by the simplest addition to the base
12. As a user, I want to see the dot construction progress from base through to the final circle, so that I can understand how a single geometric element is added

### Number 2 (Two Circles)

13. As a developer, I want number 2 to start with the shared base construction, so that consistency is maintained across all numbers
14. As a developer, I want number 2 to display two circles at the endpoints of line1, so that multi-circle constructions are demonstrated
15. As a user, I want to see two circles constructed step-by-step, so that I can understand the pattern

### Number 3 (Three Circles)

16. As a developer, I want number 3 to start with the shared base construction, so that all numbers share the same foundation
17. As a developer, I want number 3 to arrange three circles at the vertices of a triangle (p1, p2, midpoint), so that multi-geometry positioning is demonstrated
18. As a user, I want to see three circles positioned to form a triangle, so that I can understand how multiple independent geometries are composed

### Number 4 (Four Circles)

19. As a developer, I want number 4 to start with the shared base construction, so that consistency is maintained
20. As a developer, I want number 4 to arrange four circles in a symmetrical pattern, so that radial symmetry and pattern construction are demonstrated
21. As a user, I want to see four circles arranged aesthetically, so that I can understand how symmetrical patterns are created

### Player & Construction

22. As a user, I want to step through each number's construction step-by-step, so that I can see how the geometry is built incrementally
23. As a user, I want to play/pause/step through the construction, so that I can control the viewing experience
24. As a user, I want to see geometry details and dependency information, so that I can understand the construction's internal structure
25. As a user, I want to see the geometry items list, so that I can track all elements in the construction

### Technical

26. As a developer, I want NumberConfig to be computed from SVG dimensions, so that geometries scale properly with the canvas
27. As a developer, I want each number to have its own DSL definition file, so that code is organized and maintainable
28. As a developer, I want the NumberSvg component to be reusable for both main player and thumbnails, so that rendering is consistent
29. As a developer, I want thumbnails to only display output geometries (filtering out base construction inputs), so that thumbnails show clean final patterns
30. As a developer, I want URL routing for each number, so that links are shareable
31. As a developer, I want the implementation to follow existing patterns from square-dsl and sixfold-dsl, so that code is consistent with the rest of app2

### Future Extensibility

32. As a developer, I want the infrastructure to support numbers 5-12, so that the section can be extended later without refactoring
33. As a developer, I want each number's construction to be independent, so that adding new numbers doesn't affect existing ones

## Implementation Decisions

### Page Structure

The numbers functionality is implemented as a **separate page** at `/numbers` with individual number routes like `/numbers/1`, `/numbers/2`, etc. This differs from the original section-based approach to enable direct linking to specific numbers.

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

**Note for thumbnails:** Only the output geometries (those created after the base construction) should be displayed in thumbnails, not the base construction elements (cs, cs2, p1, p2, line1).

### Number DSL Definitions

Each number has its own TypeScript file in `app2/src/geometry/numbers/` exporting a `buildNumberXSteps()` function that returns `Step<NumberConfig>[]`:

- **numbers/1.ts** - Number 1 (Dot):
  - Steps 0-4: Shared base construction
  - Step 5: Point at midpoint of line1 (using pointAt with ratio 0.5)
  - Step 6: Circle at midpoint point (the dot)
  - Total: 7 steps

- **numbers/2.ts** - Number 2 (Two Circles):
  - Steps 0-4: Shared base construction
  - Step 5: Midpoint of line1
  - Step 6-7: Two circles at endpoints
  - Total: 8 steps

- **numbers/3.ts** - Number 3 (Three Circles):
  - Steps 0-4: Shared base construction
  - Step 5: Midpoint of line1
  - Step 6-8: Three circles at p1, p2, and midpoint
  - Total: 9 steps

- **numbers/4.ts** - Number 4 (Four Circles):
  - Steps 0-4: Shared base construction
  - Step 5: Midpoint of line1
  - Step 6-9: Four circles at p1, p2, midpoint, and above
  - Total: 10 steps

Each file follows the pattern established in squareDslSteps.ts and sixfoldDslV1Steps.ts.

### Modules to Create

- **`app2/src/geometry/numbers/config.ts`** - NumberConfig interface and computeNumberConfig function
- **`app2/src/geometry/numbers/1.ts`** - Number 1 DSL definition
- **`app2/src/geometry/numbers/2.ts`** - Number 2 DSL definition
- **`app2/src/geometry/numbers/3.ts`** - Number 3 DSL definition
- **`app2/src/geometry/numbers/4.ts`** - Number 4 DSL definition
- **`app2/src/geometry/numbers/index.ts`** - Barrel export for number modules
- **`app2/src/components/NumberSvg.tsx`** - SVG component for rendering a number's geometry (parameterized by number and step)
- **`app2/src/components/NumberThumbnail.tsx`** - Thumbnail component (150x150) showing **only output geometries**
- **`app2/src/components/NumberPicker.tsx`** - Grid picker component with thumbnails for numbers 1-4
- **`app2/src/pages/NumbersPage.tsx`** - Separate page component with GeometrySection and NumberPicker

### Modules to Modify

- **`app2/src/App.tsx`:**
  - Add route for `/numbers` and `/numbers/:id`
  - Add "numbers" to navigation menu

- **`app2/src/components/Navigation.tsx`:**
  - Add "numbers" button to navigation menu that links to `/numbers`

### Component Architecture

**NumbersPage:**
- Separate page component that uses GeometrySection
- Accepts number ID from URL params
- Manages store, stepper, and playback state for the current number
- Renders NumberPicker for selection and GeometrySection for the player

**NumberSvg:**
- Props: store, svgConfig, restartTrigger, currentStep, theme, steps
- Similar to SquareDslSvg but parameterized by the steps array
- Handles SVG setup, clearing, and step execution
- Uses useThemeAwareSteps hook for theme/clear management

**NumberThumbnail:**
- Props: number, onClick
- Renders NumberSvg at 150x150 with currentStep = total steps (shows final state)
- **Filters out base construction geometries** (cs, cs2, p1, p2, line1) to only show number-specific outputs
- Caches rendered SVG to avoid recomputation
- Triggers onClick callback when clicked

**NumberPicker:**
- Props: onSelectNumber, selectedNumber
- Renders grid of NumberThumbnail components for numbers 1-4
- Manages thumbnail cache
- Calls onSelectNumber when a thumbnail is clicked

### Routing

- `/numbers` - Numbers page, defaults to showing number 1
- `/numbers/1` - Numbers page showing number 1 construction
- `/numbers/2` - Numbers page showing number 2 construction
- `/numbers/3` - Numbers page showing number 3 construction
- `/numbers/4` - Numbers page showing number 4 construction

URL changes when user clicks a thumbnail. Direct navigation to these URLs should update the displayed number.

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
  1: { label: "1 - Dot", steps: 7, outputGeometries: ["dot_1"] },
  2: { label: "2 - Two Circles", steps: 8, outputGeometries: ["circle1", "circle2"] },
  3: { label: "3 - Three Circles", steps: 9, outputGeometries: ["circle1", "circle2", "circle3"] },
  4: { label: "4 - Four Circles", steps: 10, outputGeometries: ["circle1", "circle2", "circle3", "circle4"] },
} as const;
```

The `outputGeometries` array specifies which geometry IDs should be displayed in thumbnails (excluding base construction geometries).

## Testing Decisions

### Test Philosophy

Only test external behavior, not implementation details. Focus on:

- Config computation produces correct values
- Each number's DSL definition produces expected geometry IDs
- Components render without errors
- Thumbnail caching works correctly
- Thumbnail filtering shows only output geometries
- Picker selection updates state and URL correctly
- URL navigation works for direct links
- Integration with routing works

### Modules to Test

- **config.ts:** Test computeNumberConfig with various width/height combinations
- **numbers/1-4.ts:** Test that each buildNumberXSteps produces expected number of steps and geometry IDs
- **NumberThumbnail.tsx:** Test that thumbnails only show output geometries
- **NumberPicker.tsx:** Test that clicking thumbnails triggers correct callbacks and URL updates
- **NumbersPage.tsx:** Test page rendering and routing
- **App.tsx routing:** Test that numbers routes work correctly

### Prior Art

Follow patterns from existing tests:

- `app2/src/geometry/squareDslSteps.test.ts` - Tests for DSL step generation
- `app2/src/components/SquareDslSvg.test.tsx` - Tests for SVG component rendering
- `app2/src/components/GeometryPlayer.test.tsx` - Tests for player functionality
- `app2/src/App.test.tsx` - Tests for app integration

### Test Types

- Unit tests for pure functions (computeNumberConfig, buildNumberXSteps)
- Snapshot tests for thumbnails
- Component tests for NumberThumbnail, NumberPicker, NumberSvg, NumbersPage
- Integration test for numbers routing

## Implementation Status

### ✅ Completed
- [x] NumberConfig interface and computeNumberConfig function
- [x] DSL definitions for numbers 1-4 (buildNumber1Steps through buildNumber4Steps)
- [x] NumberSvg component (parameterized by number and steps)
- [x] NumberThumbnail component (150x150, basic implementation)
- [x] NumberPicker component (grid layout)
- [x] Navigation entry for numbers
- [x] Numbers page with GeometrySection, player, geometry items, and geometry details
- [x] Separate page at `/numbers` with hash routing (`#numbers/1`, `#numbers/2`, etc.)
- [x] URL updates when clicking thumbnails

### ⏳ Not Yet Implemented
- [ ] **Thumbnail filtering**: Thumbnails currently show ALL geometries including base construction (cs, cs2, p1, p2, line1). Need to filter to show ONLY output geometries (dot_1, circle1-4, etc.)
- [ ] **Direct URL navigation**: While `#numbers/1` updates the hash, direct page load with hash may not properly initialize the numbers page
- [ ] Numbers 5-12 with unique geometric representations

## Out of Scope

- Numbers 5-12 (planned for future iteration)
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
- Component names: PascalCase (NumberSvg, NumberPicker, NumberThumbnail, NumbersPage)
- Function names: camelCase (buildNumber1Steps, computeNumberConfig)
- Geometry IDs: lowercase with underscores (cs, cs2, p1, p2, line1, dot_1, circle1, etc.)

### Code Organization

Numbers-related code is co-located:

- Config: `app2/src/geometry/numbers/config.ts`
- DSL definitions: `app2/src/geometry/numbers/X.ts`
- Components: `app2/src/components/Number*.tsx`
- Page: `app2/src/pages/NumbersPage.tsx`

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
- Existing app2 component patterns (SquareDslSvg, GeometryPlayer, GeometrySection, etc.)
- Existing geometry types and store
- React Router for page routing

No new external dependencies required.
