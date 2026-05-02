import { renderHook, act } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import {
  useGeometryStoreSquare,
  useGeometryStore,
  useGeometryValueStore,
  useGeometryStoreEnhanced,
} from "../src/react-store";

/**
 * Tests to prevent infinite render loops caused by unstable store references.
 *
 * The issue: If a store returns a new object on every render, components that
 * depend on it in useEffect will re-trigger, potentially causing infinite loops.
 *
 * The fix: All store hooks must memoize their return objects with useMemo.
 */

describe("Geometry Store Hooks - Reference Stability", () => {
  it("useGeometryStoreSquare should return stable reference across renders", () => {
    const { result, rerender } = renderHook(() => useGeometryStoreSquare());

    const firstStore = result.current;
    rerender();

    expect(result.current).toBe(firstStore);
    expect(result.current.add).toBe(firstStore.add);
    expect(result.current.update).toBe(firstStore.update);
    expect(result.current.clear).toBe(firstStore.clear);
  });

  it("useGeometryValueStore should return stable reference across renders", () => {
    const { result, rerender } = renderHook(() => useGeometryValueStore());

    const firstStore = result.current;
    rerender();

    expect(result.current).toBe(firstStore);
    expect(result.current.addGeometry).toBe(firstStore.addGeometry);
    expect(result.current.getGeometry).toBe(firstStore.getGeometry);
    expect(result.current.getNode).toBe(firstStore.getNode);
    expect(result.current.getAllNodes).toBe(firstStore.getAllNodes);
    expect(result.current.getDependencyGraph).toBe(firstStore.getDependencyGraph);
    expect(result.current.clear).toBe(firstStore.clear);
  });

  it("useGeometryStoreEnhanced should return stable reference across renders", () => {
    const { result, rerender } = renderHook(() => useGeometryStoreEnhanced());

    const firstStore = result.current;
    rerender();

    expect(result.current).toBe(firstStore);
    // Check that geometryValues is also stable
    expect(result.current.geometryValues).toBe(firstStore.geometryValues);
  });

  /**
   * Test that store updates actually trigger reference changes when state changes.
   * This is important because we want the store to be stable when nothing changes,
   * but to change when items are added/updated.
   */
  describe("Store reference changes on state updates", () => {
    it("useGeometryStore reference should change when items are added", async () => {
      const { result, rerender } = renderHook(() => useGeometryStore());

      const firstStore = result.current;

      await act(async () => {
        // Add an item through the store's add method
        // This will trigger a state update internally
        // The store object should now be different
        firstStore.add("test-item", {} as any, "point", []);
      });

      // Force a re-render to get the new store reference
      rerender();

      // Store reference should have changed because items changed
      expect(result.current).not.toBe(firstStore);

      // But methods should still be the same (they're memoized)
      expect(result.current.add).toBe(firstStore.add);
      expect(result.current.update).toBe(firstStore.update);
    });

    it("useGeometryValueStore reference should change when geometries are added", async () => {
      const { result, rerender } = renderHook(() => useGeometryValueStore());

      const firstStore = result.current;

      await act(async () => {
        // Add a geometry
        firstStore.addGeometry("test-geom", { type: "point", x: 0, y: 0 } as any, "point", []);
      });

      rerender();

      // Store reference should have changed
      expect(result.current).not.toBe(firstStore);

      // But methods should still be the same
      expect(result.current.addGeometry).toBe(firstStore.addGeometry);
    });
  });
});
