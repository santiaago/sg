# PRD: Remove SixFold DSL v0 Section

## Problem Statement

The SG Geometry application currently has three SixFold DSL sections: v0 (`sixfold-dsl`), v1 (`sixfold-dsl-v1`), and v2 (`sixfold-dsl-v2`). The v0 section represents the original DSL translation of the manual construction, but it has been superseded by v1 which adds coordinate system cs2 support, and v2 which adds flipX support. The v0 section creates maintenance burden and redundancy. Additionally, v1 produces geometrically identical results to v0 (same absolute positions, just different internal coordinate system hierarchy), making v0 redundant.

**Note:** The GeometrySection component has been extracted (PR #51), so all sections now use a consistent, reusable component pattern. This simplifies v0 removal.

## Solution

Remove the complete SixFold DSL v0 section from the codebase, including its step definitions, SVG component, UI section declaration, navigation entries, and all test references. This consolidates the codebase to only v1 and v2, which represent the meaningful evolution of the DSL with cs2 and flip support respectively. The v2 section will remain the default landing section.

## User Stories

### Code Simplification

1. As a developer, I want to remove the redundant v0 DSL section, so that I can reduce code duplication and maintenance burden
2. As a developer, I want to delete `sixfoldDslSteps.ts`, so that there is one less file to maintain
3. As a developer, I want to delete `SixFoldDslSvg.tsx`, so that component count is reduced
4. As a developer, I want to remove the v0 GeometrySection declaration from App.tsx, so that the main file is cleaner
5. As a developer, I want to remove v0 from Navigation.tsx, so that the navigation menu is simpler

### Test Suite Cleanup

6. As a developer, I want to remove v0 references from `allDslComponents.test.ts`, so that tests only cover active DSL versions
7. As a developer, I want to delete v0-specific tests from `navigation.spec.ts`, so that only valid navigation paths are tested
8. As a developer, I want to remove v0 expectations from `initial-load.spec.ts`, so that tests reflect the actual UI state
9. As a developer, I want to remove v0 constants from `fixtures.ts`, so that test fixtures only reference existing sections
10. As a developer, I want to remove v0 references from `utils/navigation.ts`, so that helper functions only handle valid sections
11. As a developer, I want to update any E2E tests that use v0 to use v1 instead, so that clipboard and other tests remain valid

### Documentation Accuracy

12. As a developer, I want to update `00-GLOBAL-VIEW.md` architecture docs, so that documentation accurately reflects the current codebase
13. As a maintainer, I want historical PLAN files archived, so that backlog accurately represents implementation status

### User Experience

14. As a user, I want the navigation bar to only show v1 and v2 sections, so that I can focus on the more advanced constructions
15. As a user, I want the default section to remain v2, so that I see the most advanced construction first
16. As a user, I want deep links to `/#sixfold-dsl` to fail gracefully, so that I understand the section no longer exists

## Implementation Decisions

### Modules to Delete

- **Step definitions**: The `sixfoldDslSteps` module containing the v0 DSL construction steps
- **SVG component**: The `SixFoldDslSvg` React component that renders the v0 construction

### Modules to Modify

- **App.tsx**: Remove v0 GeometrySection declaration (the section using `sectionId="sixfold-dsl"`, `SvgComponent={SixFoldDslSvg}`, etc.); remove `"sixfold-dsl"` from SectionId type; remove from sectionRefs object; remove v0 stepper, playback, store, and steps state
- **Navigation.tsx**: Remove `"sixfold-dsl"` from SectionId type; remove the v0 navigation button
- **allDslComponents.test.ts**: Remove `buildSixfoldDslSteps` import; remove the v0 test case for non-visual geometry filtering
- **initial-load.spec.ts**: Remove the expectation that `nav-sixfold-dsl` is visible
- **navigation.spec.ts**: Delete the test "Loading /#sixfold-dsl scrolls to SixFold DSL section"
- **fixtures.ts**: Delete the `SECTION_SIXFOLD_DSL` constant
- **utils/navigation.ts**: Remove all entries for `"#sixfold-dsl"` hash and `"nav-sixfold-dsl"` test ID from helper functions (`getSectionIdFromTestId`, `getSectionSelectorFromHash`, `getNavButtonSelectorFromHash`, etc.)
- **00-GLOBAL-VIEW.md**: Remove `sixfoldDslSteps.ts` from geometry file list; remove `SixFoldDslSvg.tsx` from components file list; update references to use `sixfoldDslV1Steps.ts` as a primary example

### Technical Clarifications

- v0 and v1 produce **geometrically identical constructions** - the difference is purely in the internal coordinate system structure (v1 uses cs2 at p1's position, enabling rotation/translation as a unit)
- v2 is already the default section (activeSection initializes to "sixfold-dsl-v2") and will remain so
- v1 will retain its "-v1" suffix - no renaming to fill the v0 slot
- URL hashes like `/#sixfold-dsl` will no longer have a corresponding section and will not scroll to any element
- The GeometrySection component refactor (PR #51) is already complete - all sections use this reusable component
- The `useGeometrySectionPlayback` hook is already in use for all sections

### Architectural Decisions

- **No backward compatibility**: Old `/#sixfold-dsl` URLs will not redirect; they will simply not match any section
- **Clean removal**: All v0 code, tests, and references are removed rather than deprecated
- **Documentation preservation**: Historical PLAN files are archived rather than deleted, preserving the development history

### Files to Archive

- **backlog/dsl/PLAN-sixfold-dsl.md**: Historical plan for original v0 DSL creation (already archived)
- **backlog/dsl/PLAN-sixfold-dsl-v1.md**: Plan for v1 that references v0 as baseline (already archived)

## Testing Decisions

### What Makes a Good Test

- Test external behavior only: verify that navigation works, sections render, and geometry displays correctly
- Do not test implementation details like internal state or specific step counts
- Test the integration: verify that removing v0 doesn't break v1 or v2 functionality

### Modules to Test

- **App.tsx**: Verify all remaining sections (v1, v2, square) are navigable and functional after v0 removal
- **Navigation.tsx**: Verify navigation menu only shows v1 and v2 SixFold sections
- **E2E tests**: Verify updated navigation, clipboard, and initial load tests pass
- **GeometrySection component**: Verify it continues to work correctly with v1 and v2

### Prior Art

- Existing E2E tests for v1 already cover navigation (`navigation.spec.ts`)
- `allDslComponents.test.ts` already tests v1 separately
- The v0-specific test deletion won't reduce coverage since v1 produces identical geometry
- `GeometrySection.component.test.tsx` already tests the reusable component with various configurations

## Out of Scope

- Creating new geometry sections or constructions
- Modifying v1 or v2 implementations
- Changing the default section from v2
- Renaming v1 to "v0" or any other designation
- Adding redirect logic for old v0 URLs
- Modifying the DSL framework itself (GeometryBuilder, expressions, etc.)
- Modifying the GeometrySection component or useGeometrySectionPlayback hook
- Updating non-E2E unit tests beyond the `allDslComponents.test.ts` file
- Changing the SixFoldV0Config type or sixFold/operations.ts

## Further Notes

### Verification Checklist

Before considering implementation complete:
- [ ] All TypeScript checks pass (`pnpm type-check`)
- [ ] All lint checks pass (`pnpm lint`)
- [ ] All format checks pass (`pnpm format`)
- [ ] All unit tests pass
- [ ] All E2E tests pass
- [ ] No console errors in development build
- [ ] Navigation between v1 and v2 works correctly
- [ ] v2 remains the default active section
- [ ] GeometrySection component renders v1 and v2 correctly

### Dependencies

This PRD has no dependencies - v0 is self-contained and its removal doesn't block or require any other changes. The GeometrySection refactor (PR #51) is already merged.

### Success Criteria

- The `sixfold-dsl` section no longer exists in the UI
- Navigation menu only shows v1 and v2 SixFold sections
- v2 remains the default landing section
- All tests pass
- No references to v0 remain in active code (only in archived backlog files)
- GeometrySection component continues to work with remaining sections
