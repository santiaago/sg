# Geometry List Filter Feature - Implementation Plan

## Overview

Add filtering capabilities to the GeometryList component to allow users to filter geometry items by name (text search) and by geometry type (tags/buttons).

## Current State

- `GeometryList.tsx` displays all geometry items in an unfiltered list
- Items have `name` and `type` properties (types: point, line, circle, polygon, arc)
- Used in: App.tsx (6 instances), Square.tsx, SixFoldV0.tsx
- Store interface: `GeometryStore` with `items: Record<string, GeometryItem>`
- `GeometryItem` has: name, element, selected, type, context, initialState, dependsOn, stepId, parameterValues

## Requirements

1. Text input filter at top of GeometryList - filters by item name (case-insensitive, partial match)
2. Type filter buttons/tags - filter by geometry type (point, line, circle, polygon)
3. Both filters should work together (AND logic)
4. Clear/reset filters option
5. Maintain existing functionality (selection, highlighting, etc.)
6. Add comprehensive tests

## Implementation Plan

### Phase 1: GeometryList Component Changes

**File: `app2/src/components/GeometryList.tsx`**

Add filter state and UI:

- Add `useState` for `nameFilter` (string, initially empty)
- Add `useState` for `typeFilters` (Set<string> or array, initially empty = show all)
- Add filter input element (text input with placeholder "Filter by name...")
- Add type filter buttons for each geometry type
- Add clear filters button

Add filter logic:

- Create `filteredItems` memo using `useMemo` that:
  - Filters items where name includes `nameFilter` (case-insensitive)
  - If `typeFilters` is non-empty, also filters by type being in the set
  - Returns all items if both filters are empty

Update render:

- Display filter controls at top of component
- Render `filteredItems` instead of `store.items`
- Show count of filtered items vs total items

### Phase 2: Type Definitions

**File: `app2/src/types/geometry.ts`** (optional)

Consider adding a type for geometry types if not already present:

```typescript
export type GeometryType = "point" | "line" | "circle" | "polygon" | "arc";
```

### Phase 3: Tests

**File: `app2/test/GeometryList.component.test.tsx`** (extend existing)

Add test cases for:

1. Name filter - filters items by name (case-insensitive)
2. Type filter - filters items by single type
3. Multiple type filters - filters by multiple types (OR within types)
4. Combined filters - name AND type filters work together
5. Clear filters - resets to show all items
6. Empty results - shows appropriate message when no items match
7. Filter count display - shows correct filtered count

**New file: `app2/src/components/GeometryList.test.tsx`** (unit tests for helper functions)

- Test filter logic functions independently
- Test edge cases (null/undefined, empty strings)

### Phase 4: Styling

- Use consistent styling with existing app (Tailwind CSS classes)
- Filter input: dark theme compatible
- Type buttons: toggleable, show active state
- Clear button: accessible, clear visual indicator

## Component API Changes

### GeometryList Props (Additions)

```typescript
interface GeometryListProps {
  store: any;
  stroke?: number;
  strokeMid?: number;
  strokeBig?: number;
  strokeLine?: number;
  showInputHighlight?: boolean;
  // New optional props with defaults
  showNameFilter?: boolean; // default: true
  showTypeFilters?: boolean; // default: true
  availableTypes?: string[]; // default: ['point', 'line', 'circle', 'polygon']
}
```

## Implementation Details

### Filter Logic (pseudocode)

```typescript
const allTypes = ["point", "line", "circle", "polygon"];

const filteredItems = useMemo(() => {
  const items = store.items || {};

  return Object.entries(items).filter(([key, item]) => {
    // Name filter
    const matchesName =
      nameFilter === "" || item.name.toLowerCase().includes(nameFilter.toLowerCase());

    // Type filter (if any types selected, item type must be in selection)
    const matchesType = typeFilters.size === 0 || typeFilters.has(item.type);

    return matchesName && matchesType;
  });
}, [store.items, nameFilter, typeFilters]);
```

### UI Layout

```jsx
<div className="geometry-list">
  <h3>Geometry Items</h3>

  {/* Name filter */}
  <div className="mb-2">
    <input
      type="text"
      placeholder="Filter by name..."
      value={nameFilter}
      onChange={(e) => setNameFilter(e.target.value)}
      className="w-full p-1 text-black rounded text-sm"
    />
  </div>

  {/* Type filters */}
  <div className="flex flex-wrap gap-1 mb-2">
    {['point', 'line', 'circle', 'polygon'].map(type => (
      <button
        key={type}
        onClick={() => toggleTypeFilter(type)}
        className={`px-2 py-1 rounded text-xs ${
          typeFilters.has(type)
            ? 'bg-blue-500 text-white'
            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
        }`}
      >
        {type}
      </button>
    ))}
  </div>

  {/* Clear filters button */}
  {nameFilter !== '' || typeFilters.size > 0 && (
    <button
      onClick={clearFilters}
      className="text-xs text-gray-400 hover:text-white mb-2"
    >
      Clear filters
    </button>
  )}

  <p>Showing {filteredItems.length} of {Object.keys(store.items || {}).length} items</p>

  <ul>
    {filteredItems.map(([key, item]) => (
      <li key={key} onClick={() => handleClick(key)} ...>
        {item.name} | {item.type}
      </li>
    ))}
  </ul>
</div>
```

## Testing Strategy

### Test File: GeometryList.component.test.tsx additions

```typescript
describe("GeometryList - Filtering", () => {
  let store: any;
  let mockItems: Record<string, GeometryItem>;

  beforeEach(() => {
    mockItems = createMockStoreItems();
    store = createMockStore({ ...mockItems });
    vi.clearAllMocks();
  });

  describe("Name Filter", () => {
    it("filters items by name", () => {
      render(<GeometryList store={store} />);

      const filterInput = screen.getByPlaceholderText(/filter by name/i);
      fireEvent.change(filterInput, { target: { value: "c1" } });

      expect(screen.getByText("c1 | point")).toBeInTheDocument();
      expect(screen.getByText("c1_c | circle")).toBeInTheDocument();
      expect(screen.queryByText("line_main | line")).not.toBeInTheDocument();
    });

    it("filters case-insensitively", () => {
      render(<GeometryList store={store} />);

      const filterInput = screen.getByPlaceholderText(/filter by name/i);
      fireEvent.change(filterInput, { target: { value: "LINE" } });

      expect(screen.getByText("line_main | line")).toBeInTheDocument();
      expect(screen.queryByText("c1 | point")).not.toBeInTheDocument();
    });

    it("shows all items when filter is empty", () => {
      render(<GeometryList store={store} />);

      expect(screen.getByText("line_main | line")).toBeInTheDocument();
      expect(screen.getByText("c1 | point")).toBeInTheDocument();
      expect(screen.getByText("c1_c | circle")).toBeInTheDocument();
    });
  });

  describe("Type Filter", () => {
    it("filters by type when button clicked", () => {
      render(<GeometryList store={store} />);

      const pointButton = screen.getByText(/^point$/i);
      fireEvent.click(pointButton);

      expect(screen.getByText("c1 | point")).toBeInTheDocument();
      expect(screen.queryByText("line_main | line")).not.toBeInTheDocument();
      expect(screen.queryByText("c1_c | circle")).not.toBeInTheDocument();
    });

    it("shows multiple types when multiple selected", () => {
      render(<GeometryList store={store} />);

      const pointButton = screen.getByText(/^point$/i);
      const circleButton = screen.getByText(/^circle$/i);
      fireEvent.click(pointButton);
      fireEvent.click(circleButton);

      expect(screen.getByText("c1 | point")).toBeInTheDocument();
      expect(screen.getByText("c1_c | circle")).toBeInTheDocument();
      expect(screen.queryByText("line_main | line")).not.toBeInTheDocument();
    });
  });

  describe("Combined Filters", () => {
    it("applies name AND type filters together", () => {
      // Add more items for this test
      const extraItems = {
        point_a: createMockGeometryItem({ name: "point_a", type: "point" }),
        point_b: createMockGeometryItem({ name: "point_b", type: "point" }),
        line_a: createMockGeometryItem({ name: "line_a", type: "line" }),
      };
      const combinedItems = { ...createMockStoreItems(), ...extraItems };
      const combinedStore = createMockStore(combinedItems);

      render(<GeometryList store={combinedStore} />);

      // Filter by name "a" and type "point"
      const filterInput = screen.getByPlaceholderText(/filter by name/i);
      fireEvent.change(filterInput, { target: { value: "a" } });

      const pointButton = screen.getByText(/^point$/i);
      fireEvent.click(pointButton);

      expect(screen.getByText("point_a | point")).toBeInTheDocument();
      expect(screen.queryByText("point_b | point")).not.toBeInTheDocument();
      expect(screen.queryByText("line_a | line")).not.toBeInTheDocument();
    });
  });

  describe("Clear Filters", () => {
    it("clears name filter", () => {
      render(<GeometryList store={store} />);

      const filterInput = screen.getByPlaceholderText(/filter by name/i);
      fireEvent.change(filterInput, { target: { value: "c1" } });

      const clearButton = screen.getByText(/clear filters/i);
      fireEvent.click(clearButton);

      expect(filterInput).toHaveValue("");
      expect(screen.getByText("line_main | line")).toBeInTheDocument();
    });

    it("clears type filters", () => {
      render(<GeometryList store={store} />);

      const pointButton = screen.getByText(/^point$/i);
      fireEvent.click(pointButton);

      const clearButton = screen.getByText(/clear filters/i);
      fireEvent.click(clearButton);

      expect(screen.getByText("line_main | line")).toBeInTheDocument();
    });
  });

  describe("Filter Count", () => {
    it("displays filtered count", () => {
      render(<GeometryList store={store} />);

      const filterInput = screen.getByPlaceholderText(/filter by name/i);
      fireEvent.change(filterInput, { target: { value: "c1" } });

      expect(screen.getByText(/showing 2 of 3/i)).toBeInTheDocument();
    });
  });
});
```

## Files to Modify

1. **app2/src/components/GeometryList.tsx** - Add filter functionality
2. **app2/test/GeometryList.component.test.tsx** - Add filter tests
3. **app2/src/types/geometry.ts** - Optional: add GeometryType type

## Files to Create

None - all changes are modifications to existing files

## Backward Compatibility

- All new props are optional with sensible defaults
- Existing usage in Square.tsx and SixFoldV0.tsx will work without changes
- Existing behavior is preserved when filters are not used

## Estimated Effort

- GeometryList component: 2-3 hours
- Tests: 2-3 hours
- Total: 4-6 hours

## Checklist

- [ ] Add filter state to GeometryList component
- [ ] Add name filter input and logic
- [ ] Add type filter buttons and logic
- [ ] Add clear filters button
- [ ] Update item count display
- [ ] Add comprehensive tests for all filter scenarios
- [ ] Verify existing tests still pass
- [ ] Verify app builds and runs correctly
- [ ] Check Tailwind styling is consistent

## Notes

- The user mentioned Square.tsx and SixFoldV0.tsx but these components don't directly render GeometryList - they use it via the store. The GeometryList is actually rendered in App.tsx. So changes only need to be in GeometryList.tsx itself.
- Consider adding an "arc" type if it exists in the codebase
- Filter input should be debounced if performance becomes an issue with many items
