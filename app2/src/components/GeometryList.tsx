import { useState, useEffect, useMemo } from "react";
import type { JSX } from "react";
import type { GeometryItem } from "../react-store";
import type { GeometryType } from "../types/geometry";
import {
  applyInputVisualFeedback,
  restoreInitialState,
  applyVisualFeedback,
} from "../utils/geometryHighlighting";

interface GeometryListProps {
  store: any;
  stroke?: number;
  strokeMid?: number;
  strokeBig?: number;
  strokeLine?: number;
  showInputHighlight: boolean;
  showNameFilter: boolean;
  showTypeFilters: boolean;
  availableTypes: ReadonlyArray<GeometryType>;
}

const DEFAULT_TYPES: ReadonlyArray<GeometryType> = ["point", "line", "circle", "polygon"] as const;

export function GeometryList({
  store,
  stroke = 0.5,
  strokeBig = 2,
  showInputHighlight = false,
  showNameFilter = true,
  showTypeFilters = true,
  availableTypes = DEFAULT_TYPES,
}: GeometryListProps): JSX.Element {
  const [highlightedInputs, setHighlightedInputs] = useState<Set<string>>(new Set());
  const [nameFilter, setNameFilter] = useState("");
  const [typeFilters, setTypeFilters] = useState<Set<string>>(new Set());

  const toggleTypeFilter = (type: string) => {
    setTypeFilters((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(type)) {
        newSet.delete(type);
      } else {
        newSet.add(type);
      }
      return newSet;
    });
  };

  const clearFilters = () => {
    setNameFilter("");
    setTypeFilters(new Set());
  };

  const filteredItems = useMemo(() => {
    const items = store.items || {};
    return Object.entries(items).filter(([_, item]) => {
      const geometryItem = item as GeometryItem;
      const matchesName =
        nameFilter === "" || geometryItem.name.toLowerCase().includes(nameFilter.toLowerCase());
      const matchesType = typeFilters.size === 0 || typeFilters.has(geometryItem.type);
      return matchesName && matchesType;
    });
  }, [store.items, nameFilter, typeFilters]);

  const totalCount = Object.keys(store.items || {}).length;
  const filteredCount = filteredItems.length;

  // Clear highlighted inputs when toggle is turned OFF
  useEffect(() => {
    if (!showInputHighlight) {
      setHighlightedInputs(new Set());
    }
  }, [showInputHighlight]);

  // Apply orange styles to SVG elements for highlighted inputs
  useEffect(() => {
    if (!showInputHighlight) return;

    const items = store.items || {};
    Object.values(items).forEach((item: unknown) => {
      const geometryItem = item as GeometryItem;
      if (!geometryItem.element) return;

      if (highlightedInputs.has(geometryItem.name)) {
        applyInputVisualFeedback(geometryItem.element, geometryItem, strokeBig);
      } else if (!geometryItem.selected) {
        restoreInitialState(geometryItem.element, geometryItem);
      }
    });
  }, [highlightedInputs, showInputHighlight, store.items, strokeBig]);

  const handleClick = (name: string) => {
    const item = store.items[name] as GeometryItem | undefined;
    if (!item) return;

    const isCurrentlySelected = item.selected;

    // If clicking the already selected item, unselect it
    if (isCurrentlySelected) {
      store.update(name, { selected: false });
      applyVisualFeedback(item.element, { ...item, selected: false }, stroke, strokeBig);

      // Clear highlighted inputs when unselecting
      if (showInputHighlight) {
        setHighlightedInputs(new Set());
      }
      return;
    }

    // Deselect all first for single selection mode
    Object.keys(store.items).forEach((key) => {
      const existingItem = store.items[key] as GeometryItem | undefined;
      if (existingItem) {
        store.update(key, { selected: false });
        // Restore visual state for deselected items
        applyVisualFeedback(
          existingItem.element,
          { ...existingItem, selected: false },
          stroke,
          strokeBig,
        );
      }
    });

    // Select the clicked one
    store.update(name, { selected: true });

    // Update highlighted inputs based on selection
    if (showInputHighlight) {
      // Highlight this item's dependencies
      setHighlightedInputs(new Set(item.dependsOn || []));
    }

    // Apply visual feedback to the clicked SVG element
    applyVisualFeedback(item.element, { ...item, selected: true }, stroke, strokeBig);
  };

  const getItemColor = (name: string) => {
    const item = store.items[name] as GeometryItem | undefined;
    if (!item) return "text-white";

    if (item.selected) {
      return item.context ? "text-red-400" : "text-yellow-400";
    }

    // Highlight inputs in orange when feature is enabled
    if (showInputHighlight && highlightedInputs.has(name)) {
      return "text-orange-400";
    }

    return "text-white";
  };

  return (
    <div className="geometry-list">
      <h3>Geometry Items</h3>

      {showNameFilter && (
        <div className="mb-2">
          <input
            type="text"
            placeholder="Filter by name..."
            value={nameFilter}
            onChange={(e) => setNameFilter(e.target.value)}
            className="w-full p-1 text-black rounded text-sm dark:bg-gray-700 dark:text-white"
          />
        </div>
      )}

      {showTypeFilters && (
        <div className="flex flex-wrap gap-1 mb-2">
          {availableTypes.map((type) => (
            <button
              key={type}
              onClick={() => toggleTypeFilter(type)}
              className={`px-2 py-1 rounded text-xs ${
                typeFilters.has(type)
                  ? "bg-blue-500 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      )}

      {(nameFilter !== "" || typeFilters.size > 0) && (
        <button onClick={clearFilters} className="text-xs text-gray-400 hover:text-white mb-2">
          Clear filters
        </button>
      )}

      <p>
        Showing {filteredCount} of {totalCount} items
      </p>
      <ul>
        {filteredItems.map(([key, item]) => (
          <li
            key={key}
            onClick={() => handleClick(key)}
            className={`cursor-pointer hover:underline ${getItemColor(key)}`}
          >
            {(item as GeometryItem).name} | {(item as GeometryItem).type}
          </li>
        ))}
      </ul>
    </div>
  );
}


