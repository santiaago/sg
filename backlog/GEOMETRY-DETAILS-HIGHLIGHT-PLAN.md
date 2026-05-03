# Geometry Details Highlight Improvements Plan

## Context

The GeometryDetails component currently has hover/click highlighting that conflicts with the selection state managed by GeometryList. This plan addresses improvements to make the highlighting behavior more consistent and distinguishable.

## Current Issues

1. **Hover conflicts with selection**: Hovering over items in GeometryDetails undoes the selection visual feedback applied by GeometryList
2. **Indistinguishable colors**: GeometryDetails hover uses the same color as GeometryList input highlighting, making it hard to distinguish between the two states
3. **Inconsistent click behavior**: Clicking items in GeometryDetails doesn't have the same effect as clicking in GeometryList (selecting a geometry)
4. **Tooltip labels flicker**: When hovering over inputs in GeometryDetails, the labels/tooltips are shown and hidden, hiding the original labels on inputs
5. **No visual distinction for hovered labels**: Need to change the background/appearance of labels when hovering in GeometryDetails

## Proposed Improvements

### 1. Separate Hover State from Selection

- GeometryDetails hover should NOT clear or override the selection state
- Selection state (red, from GeometryList) should persist even when hovering over items in GeometryDetails
- Hover highlighting in GeometryDetails should be additive, not replacement
- **New**: Input-highlighted labels should also persist when hovering in GeometryDetails

### 2. Distinct Color for GeometryDetails Hover

- Use a different color (e.g., light blue / cyan) for GeometryDetails hover to distinguish from:
  - GeometryList input highlighting (orange)
  - GeometryList selection (red)
- This provides clear visual feedback about which component is causing the highlight
- **New**: Tooltip text color changes to cyan when hovering in GeometryDetails for better visibility

### 3. Unified Click Behavior

- Clicking any geometry item (in GeometryList OR GeometryDetails) should:
  - Select that geometry (same behavior)
  - Apply consistent visual feedback (red)
  - Deselect previously selected geometry
- Both components should use the same selection mechanism

### 4. Persistent Tooltip Labels

- **New**: Tooltip labels from input highlighting should NOT be hidden when hovering in GeometryDetails
- `isInputHighlighted` property added to GeometryItem to track input highlighting state
- `removeHoverHighlight` now checks for `isInputHighlighted` and re-applies input highlighting if present

### 5. Hover Tooltip Styling

- **New**: Tooltip background color changes to light cyan (`#00ffff`) when hovering in GeometryDetails
- Original tooltip background color is stored in `data-original-fill` attribute on tooltipBg for restoration
- Tooltip background color is restored when hover ends or when selection/input highlighting is re-applied

## Implementation Plan

### Phase 1: Color Scheme Updates

1. Define new color constants:
   - `COLOR_HOVER_DETAILS` (cyan) - for GeometryDetails hover
   - `COLOR_INPUT_HIGHLIGHT` (orange) - for GeometryList input highlighting
   - `COLOR_SELECTED` (red) - for selection
   - `COLOR_TOOLTIP_HOVER_TEXT` (cyan) - for GeometryDetails hover tooltip text

2. Update `applyHoverHighlight` in `geometryHighlighting.ts`:
   - Add optional `color` parameter
   - Default to orange for backward compatibility
   - Use cyan when explicitly passed for GeometryDetails
   - Change tooltip text color to cyan when using COLOR_HOVER_DETAILS

3. Update `removeHoverHighlight`:
   - Restore to original state OR to selection state if item is selected
   - Check for `isInputHighlighted` and re-apply input highlighting if present
   - Restore tooltip text color to original when hover ends
   - Never clear selection just because hover ended

### Phase 2: Input Highlighting State Tracking

1. Add `isInputHighlighted` property to `GeometryItem` interface in `react-store.ts`

2. Update GeometryList:
   - Set `isInputHighlighted` property on items when input highlighting changes
   - Track which items have input highlighting

3. Update `svgElements.ts`:
   - Store original tooltip fill color in `data-original-fill` attribute

### Phase 3: Selection State Persistence

1. Modify `handleHoverEnd` in GeometryDetails:
   - Pass `strokeBig` parameter to `removeHoverHighlight`
   - Selection and input highlighting states are now handled within `removeHoverHighlight`

2. Modify `handleHoverStart` in GeometryDetails:
   - Apply hover with cyan color using `COLOR_HOVER_DETAILS`
   - Do NOT clear existing selection

### Phase 4: Unified Click Handler

1. Extract selection logic to shared utility:
   - `selectGeometry(store, name, strokeBig)` function
   - Handles deselecting all, selecting one, applying visual feedback

2. Update both components to use shared utility:
   - GeometryList: use `selectGeometry` in `handleClick`
   - GeometryDetails: use `selectGeometry` in `handleClick`

## Files to Modify

| File                                      | Changes                                                                                                                     |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `app2/src/react-store.ts`                 | Add `isInputHighlighted` property to GeometryItem                                                                           |
| `app2/src/svgElements.ts`                 | Store original tooltip fill color in data attribute                                                                         |
| `app2/src/themes.ts`                      | Add COLOR_INPUT_HIGHLIGHT, COLOR_HOVER_DETAILS, COLOR_SELECTED                                                              |
| `app2/src/utils/geometryHighlighting.ts`  | Add color param to applyHoverHighlight, update removeHoverHighlight, add selectGeometry utility, add tooltip color handling |
| `app2/src/components/GeometryDetails.tsx` | Update hover colors, fix selection persistence, update click handler                                                        |
| `app2/src/components/GeometryList.tsx`    | Track isInputHighlighted state, use selectGeometry utility                                                                  |

## Files with Tests Added/Modified

| File                                        | Changes                                             |
| ------------------------------------------- | --------------------------------------------------- |
| `app2/test/geometryHighlighting.test.ts`    | New file with 24 tests for highlighting utilities   |
| `app2/test/GeometryDetails.test.tsx`        | Added 3 tests for hover behavior                    |
| `app2/test/GeometryList.component.test.tsx` | Updated 2 tests to match new unified click behavior |

## Testing Considerations

- Verify hover in GeometryDetails uses cyan color
- Verify selection (red) persists when hovering over GeometryDetails items
- Verify input-highlighted labels persist when hovering over GeometryDetails items
- Verify click in GeometryDetails selects geometry same as GeometryList
- Verify GeometryList input highlighting (orange) still works
- Verify GeometryList selection (red) still works
- Verify tooltip background color changes to cyan when hovering in GeometryDetails
- Verify tooltip background color is restored after hover ends

## Success Criteria

- [x] GeometryDetails hover uses distinct color (cyan)
- [x] Selection state (red) persists during GeometryDetails hover
- [x] Click in GeometryDetails selects geometry (same as GeometryList)
- [x] Input-highlighted labels persist when hovering in GeometryDetails
- [x] Tooltip background color changes to cyan for GeometryDetails hover
- [ ] All existing tests pass (1 pre-existing failure in GeometryDetails outputs test - not related to these changes)
- [x] No regression in GeometryList highlighting behavior

## Implementation Status

### Completed

- Color constants added to themes.ts
- applyHoverHighlight with optional color parameter
- removeHoverHighlight preserves selection and input highlighting states
- selectGeometry utility function
- GeometryDetails hover uses cyan color
- GeometryDetails selection persistence
- Unified click handler using selectGeometry
- Input highlighting state tracking (isInputHighlighted)
- Tooltip color changes for GeometryDetails hover
- Tooltip color restoration on hover end
- Tests for all new functionality

### Remaining

- Fix pre-existing GeometryDetails outputs test (not related to these changes)
