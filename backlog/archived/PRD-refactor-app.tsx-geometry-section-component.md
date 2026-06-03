# PRD: Extract GeometrySection Component from App.tsx

## Problem Statement

As a developer maintaining the SG Geometry application, App.tsx contains three geometry construction sections (square-dsl, sixfold-dsl, sixfold-dsl-v1) with nearly identical structure and logic. After migrating square and sixfold to useSmartStepper (prerequisite PRD), all three sections will have consistent step management, but will still duplicate ~50 lines of section layout, prop passing, and handler coordination. This duplication makes the code harder to maintain, more prone to inconsistencies, and difficult to extend with new geometry sections. Extracting a reusable GeometrySection component will eliminate this duplication and make adding new geometry types trivial.

## Solution

Create a GeometrySection component that encapsulates the common structure and logic of all geometry construction sections. Each section in App.tsx will be replaced with a single GeometrySection component call, reducing each from ~50 lines to ~10 lines. The GeometrySection component will handle: section layout (header, description, grid), GeometryPlayer integration, GeometryDetails rendering, GeometryList rendering, and SVG component rendering. It will accept all necessary props to configure each section uniquely.

The solution uses a **configuration-over-customization** pattern: GeometrySection accepts props that describe the section's content and behavior, rather than allowing deep customization through children or render props. This ensures all sections maintain a consistent structure while allowing each to have its unique content (title, description, steps, SVG component).

## User Stories

### Developer Experience

1. As a developer, I want to add a new geometry section by adding a single component call, so that adding new constructions is quick and error-free
2. As a developer, I want all geometry sections to have the same layout structure, so that users have a consistent experience
3. As a developer, I want section-specific logic (SVG component, steps, store) to be passed as props, so that GeometrySection remains generic
4. As a developer, I want to modify section layout in one place, so that all sections update automatically
5. As a developer, I want the play/step navigation logic to be consistent across all sections, so that there are no surprises

### Code Quality

6. As a developer, I want to eliminate duplicate section rendering code, so that the codebase is smaller and more maintainable
7. As a developer, I want GeometrySection to be a deep module with a stable interface, so that it can be tested in isolation
8. As a developer, I want prop types to be clearly documented, so that using GeometrySection is straightforward
9. As a developer, I want error handling for invalid prop combinations, so that mistakes are caught early

### Consistency

10. As a user, I want all geometry sections to look and behave the same way, so that I can navigate them intuitively
11. As a user, I want the player controls to be in the same position for all sections, so that I don't have to re-learn the UI
12. As a user, I want the step details and geometry list to appear in the same layout, so that I can find information quickly

## Implementation Decisions

### Modules to Build

- **GeometrySection component**: New component in app2/src/components/ that renders a complete geometry construction section
- **app2/src/App.tsx**: Simplified to use GeometrySection for each geometry type

### Interface of GeometrySection

GeometrySection will accept props for:

- **Identity**: sectionId (for refs and hash navigation), title, date, description
- **Step management**: useSmartStepper result (or the stepper props directly)
- **SVG rendering**: SvgComponent (the component class), svgProps (props to pass to it), svgRef
- **Geometry details**: store, steps, strokeBig
- **Geometry list**: store, strokeMid, strokeBig, strokeLine, showInputHighlight, availableTypes
- **Player configuration**: showInputsToggle, showPlayButton, onToggleInputs
- **Theme**: theme

### Technical Clarifications

- **Deep module principle**: GeometrySection encapsulates all section rendering logic. It does not expose internal structure through children or render props. All customization is through props.
- **SVG component**: Each section passes its specific SVG component (SquareDslSvg, SixFoldDslSvg, SixFoldDslV1Svg) and its props. GeometrySection renders it inside GeometryPlayer.
- **Step management**: GeometrySection expects the caller to manage useSmartStepper and pass the result. This keeps stepper logic separate from rendering logic.
- **No conditional rendering**: GeometrySection always renders the same structure (header, description, grid with player/details/list). This enforces consistency.

### Specific Interactions

- GeometrySection uses a CSS grid with col-span-7, col-span-2, col-span-3 layout matching current sections
- GeometryPlayer is rendered in the left column (col-span-7) with the SVG component as its child
- GeometryDetails is rendered in the middle column (col-span-2)
- GeometryList is rendered in the right column (col-span-3)
- CopyUrlButton is included in the header alongside the title

## Testing Decisions

### What Makes a Good Test

- Test external behavior only: verify that GeometrySection renders correctly with various prop combinations
- Test that all three geometry sections produce identical output after refactor
- Do not test internal structure or implementation details of GeometrySection
- Test prop validation: invalid or missing props should fail gracefully or be handled appropriately

### Modules to Test

- **GeometrySection component**: Unit tests for rendering with different props
- **App.tsx integration**: Verify that all three sections work correctly after refactor
- **Prop combinations**: Test various configurations (with/without play button, with/without inputs toggle, etc.)

### Prior Art

- Existing tests for GeometryPlayer, GeometryDetails, GeometryList components
- Integration tests for App.tsx in the codebase
- Pattern of component extraction in the codebase (if any)

## Out of Scope

- Migrating square and sixfold to useSmartStepper (prerequisite PRD: prd-migrate-square-sixfold-to-smart-stepper.md)
- Modifying GeometryPlayer, GeometryDetails, GeometryList, or SVG components
- Changing the visual design or layout of sections
- Adding new geometry sections (though the refactor makes this easier)
- Theme system changes
- State management changes beyond what's needed for prop passing

## Further Notes

- **Dependency**: This PRD depends on prd-migrate-square-sixfold-to-smart-stepper.md being completed first. After that PR, all three sections use useSmartStepper with consistent patterns.
- **Follow-up opportunity**: After extracting GeometrySection, consider extracting a useGeometryNavigation hook that combines useSmartStepper with play/pause/restart logic. This would further reduce duplication but is not required for the initial refactor.
- **Future additions**: With GeometrySection in place, adding a new geometry type requires: 1) Create steps builder, 2) Create SVG component, 3) Add one GeometrySection call in App.tsx. Estimated: ~20 lines of code per new geometry type.
