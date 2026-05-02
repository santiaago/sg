# Geometry List Filter - Task Tracking

## Status: NOT STARTED

## Priority: High

## Task ID: GEOM-FILTER-001

---

## Description

Add name-based text filter and type-based tag/button filters to the GeometryList component on the right side pane.

## Owner: (To be assigned)

## Due Date: (TBD)

---

## Tasks

- [ ] **PLAN** - Create implementation plan ✅ DONE (see GEOMETRY_LIST_FILTER_PLAN.md)
- [ ] Review and approve plan with stakeholders
- [ ] Implement filter state management in GeometryList.tsx
  - [ ] Add `nameFilter` state (string)
  - [ ] Add `typeFilters` state (Set<string>)
  - [ ] Create filter helper functions
  - [ ] Add `filteredItems` memoized computation
- [ ] Implement filter UI in GeometryList.tsx
  - [ ] Add text input for name filtering
  - [ ] Add toggle buttons for each geometry type (point, line, circle, polygon)
  - [ ] Add clear filters button
  - [ ] Update item count display to show filtered vs total
- [ ] Update existing tests in GeometryList.component.test.tsx
  - [ ] Add tests for name filtering
  - [ ] Add tests for type filtering
  - [ ] Add tests for combined filtering
  - [ ] Add tests for clear filters
  - [ ] Add tests for filter count display
- [ ] Run existing test suite to ensure no regressions
- [ ] Manual testing in development environment
- [ ] Code review
- [ ] Address review feedback
- [ ] Final verification

---

## Dependencies

- None (self-contained feature in GeometryList.tsx)

## Blockers

- None identified

## Related Files

- `app2/src/components/GeometryList.tsx` (primary)
- `app2/test/GeometryList.component.test.tsx` (tests)
- `app2/src/types/geometry.ts` (optional type addition)
- `app2/src/App.tsx` (uses GeometryList - no changes needed)
- `app2/src/components/Square.tsx` (uses store - no changes needed)
- `app2/src/components/SixFoldV0.tsx` (uses store - no changes needed)

---

## Acceptance Criteria

1. ✅ Text input at top of GeometryList for filtering by name
2. ✅ Tag/button selection for filtering by geometry type
3. ✅ Both filters work together (AND logic)
4. ✅ Clear filters button resets all filters
5. ✅ Item count shows "Showing X of Y items" where X = filtered, Y = total
6. ✅ Case-insensitive name matching
7. ✅ Partial name matching (substring search)
8. ✅ Multiple type filters can be selected (OR within type selection)
9. ✅ Existing functionality preserved (selection, highlighting, etc.)
10. ✅ All existing tests pass
11. ✅ New tests cover all filter scenarios
12. ✅ Styling consistent with existing dark theme

---

## Notes

- All new props on GeometryList should be optional with sensible defaults
- No changes required to Square.tsx or SixFoldV0.tsx
- Consider adding 'arc' type if present in codebase
- Performance: No debouncing needed initially; can be added later if performance issues arise with many items

---

## Resources

- Implementation Plan: `backlog/GEOMETRY_LIST_FILTER_PLAN.md`
- Current GeometryList: `app2/src/components/GeometryList.tsx`
- Current Tests: `app2/test/GeometryList.component.test.tsx`
