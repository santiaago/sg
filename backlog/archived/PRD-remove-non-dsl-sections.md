# PRD: Remove Non-DSL Sections from app2

## Problem Statement

app2 currently maintains duplicate geometry visualization sections: non-DSL imperative step-based implementations (sixfold-v0, square, rotated-square) alongside DSL declarative implementations (square-dsl, sixfold-dsl, sixfold-dsl-v1). This duplication creates maintenance burden, increases codebase size, and fragments testing efforts. The DSL represents an improved, more maintainable approach that requires significantly less code from developers while providing equivalent functionality.

## Solution

Remove all non-DSL sections and their associated code, tests, and documentation. Consolidate app2 to use only DSL-based geometry constructions, which provide a cleaner, more declarative API and reduce code complexity.

## User Stories

1. As a developer, I want non-DSL sections removed from app2, so that the codebase is simpler and easier to maintain
2. As a developer, I want to keep DSL sections (square-dsl, sixfold-dsl, sixfold-dsl-v1), so that users can still explore geometry constructions
3. As a developer, I want shared utility files preserved, so that DSL sections continue to function correctly
4. As a developer, I want dead code (stepBuilders.ts) removed, so that the codebase doesn't contain unused exports
5. As a developer, I want component files removed (SixFoldV0Svg, SquareSvg, RotatedSquareSvg), so that non-DSL UI is gone
6. As a developer, I want step definition files removed (sixFoldV0Steps, squareSteps, rotatedSquareSteps), so that non-DSL logic is gone
7. As a developer, I want App.tsx updated to remove non-DSL sections, so that the app only shows DSL content
8. As a developer, I want Navigation.tsx updated to remove non-DSL nav items, so that users can only navigate to DSL sections
9. As a developer, I want react-store.ts cleaned up, so that unused backward-compatibility exports are removed
10. As a developer, I want geometry/index.ts cleaned up, so that non-DSL exports are removed
11. As a developer, I want unit tests for non-DSL components removed, so that tests only cover existing code
12. As a developer, I want equivalence tests removed, so that we don't test comparisons between DSL and non-DSL
13. As a developer, I want e2e tests updated to use DSL sections, so that E2E tests continue to validate app functionality
14. As a developer, I want e2e fixtures updated to reference DSL section IDs, so that test utilities work with remaining sections
15. As a developer, I want e2e navigation utilities updated, so that they work with DSL sections
16. As a developer, I want e2e test files (copy-url, theme, accessibility, slider) updated, so that they test DSL sections instead of non-DSL
17. As a developer, I want GeometryDetails.test updated to use DSL steps, so that component tests work with remaining code
18. As a developer, I want squareSteps.dependencies.test updated to use DSL steps, so that dependency tests work with remaining code
19. As a developer, I want documentation updated (00-GLOBAL-VIEW.md), so that architecture docs reflect current state
20. As a developer, I want UI.md updated, so that it references DSL SVG components
21. As a developer, I want e2e/README.md updated, so that it references DSL components
22. As a developer, I want app2/README.md updated, so that it reflects DSL-based structure

## Implementation Decisions

### Modules to Remove

- **Geometry Components**: SixFoldV0Svg, SquareSvg, RotatedSquareSvg components that render non-DSL step-based constructions
- **Step Definitions**: sixFoldV0Steps.ts, squareSteps.ts, rotatedSquareSteps.ts containing imperative step definitions
- **Builder Utilities**: stepBuilders.ts which provides factory functions unused by DSL
- **Test Files**: SixFoldV0.test.tsx, Square.test.tsx, RotatedSquare.test.tsx (component tests for removed components)
- **Equivalence Tests**: sixfold-construction-equivalence.test.ts, square-construction-equivalence.test.ts (compare DSL vs non-DSL)

### Modules to Modify

- **App.tsx**: Remove non-DSL section imports, state management, handler functions, and section divs. Change default active section to sixfold-dsl-v1. Preserve DSL sections and shared infrastructure.
- **Navigation.tsx**: Remove sixfold-v0, square, rotated-square from SectionId type and navigation UI buttons.
- **react-store.ts**: Remove useGeometryStoreSquare and useGeometryStoreSixFoldV0 backward-compatibility exports.
- **geometry/index.ts**: Remove re-exports of squareSteps, sixFoldV0Steps, stepBuilders.
- **e2e/fixtures.ts**: Replace SECTION_SQUARE and SECTION_SIXFOLD_V0 with SECTION_SQUARE_DSL and SECTION_SIXFOLD_DSL_V1. Update NAV_BUTTONS and SQUARE_GEOMETRY references.
- **e2e/utils/navigation.ts**: Update navigation helpers to use DSL section IDs.
- **e2e/navigation.spec.ts**: Update hash-based navigation tests to use DSL section IDs.
- **e2e/copy-url.spec.ts**: Update URL assertions to expect DSL section hashes (square-dsl, sixfold-dsl-v1).
- **e2e/theme.spec.ts**: Update section references to DSL sections.
- **e2e/slider.spec.ts**: Update section references and selectors to DSL sections.
- **e2e/accessibility.spec.ts**: Update section references to DSL sections.
- **e2e/README.md**: Update to reference square-dsl and sixfold-dsl-v1 instead of Square and SixFoldV0.
- **GeometryDetails.test.tsx**: Update imports and test data to use DSL steps (squareDslSteps or sixfoldDslSteps) instead of SQUARE_STEPS.
- **squareSteps.dependencies.test.ts**: Update to test dependency structure of DSL steps instead of squareSteps.

### Modules to Preserve (Shared)

- **svg.ts**: Contains utility functions (pick, buildStepMaps, setupSvg) used by both DSL and non-DSL components
- **svgElements.ts**: SVG element creation utilities used across all components
- **types/geometry.ts**: Core geometry type definitions (Point, Line, Circle, Polygon, CoordinateSystem, Step, GeometryValue)
- **constructors.ts**: Geometry construction helpers used by both DSL and shared operations
- **operations.ts**: Core geometry operations used by both DSL and non-DSL
- **sixFold/operations.ts**: Shared sixfold configuration and utilities used by both DSL and non-DSL sixfold implementations
- **config files**: svgConfig.ts and geometryConfig.ts contain shared configuration constants
- **themes.ts**: Theme definitions used by all components
- **GeometryPlayer.tsx**: Generic wrapper component for any SVG geometry component
- **GeometryList.tsx**: Generic list component for displaying geometry items
- **GeometryDetails.tsx**: Generic details panel component
- **CopySvgButton.tsx, CopyUrlButton.tsx, Navigation.tsx (updated)**: Shared UI components

### Architectural Decisions

- DSL is the canonical geometry construction approach going forward
- DSL provides a declarative, compositional API that reduces boilerplate significantly compared to imperative step definitions
- The removal of non-DSL sections reduces codebase size and maintenance surface without losing functionality
- Shared utility files are preserved as they serve both DSL sections and may be useful for future development
- Documentation is updated to reflect DSL as the primary/only approach

## Testing Decisions

- Test external behavior, not implementation details. Component tests verify rendering and interaction, not internal step logic.
- Modules to test: All remaining components (DSL SVG components, GeometryPlayer, GeometryList, GeometryDetails) and utility functions
- Prior art: Existing component tests follow pattern of rendering with mock stores and verifying DOM output
- E2E tests cover user journeys through the app: navigation, theme switching, slider interaction, URL copying
- Unit tests cover individual components and geometry utilities in isolation

## Out of Scope

- Adding new geometry constructions or DSL features
- Refactoring DSL implementation itself
- Updating the shared @sg/geometry package
- Modifying the original Svelte app (app/)
- Performance optimization of DSL sections
- Adding new test coverage beyond what currently exists for DSL sections

## Further Notes

- The DSL implementation represents an improved version that requires significantly less code from developers while providing the same geometric construction capabilities
- Removing non-DSL sections eliminates ~3 major sections, ~6 component/step files, ~5 test files, and associated configuration
- The default section changes from sixfold-v0 to sixfold-dsl-v1 to maintain a working out-of-the-box experience
- All URL hash-based navigation will automatically work with the new section IDs once the frontend changes are deployed
