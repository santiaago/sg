import { useState, useCallback, useMemo } from "react";

/**
 * Represents a geometry item stored in the React store.
 * Contains the SVG element, its metadata, and dependency tracking information.
 */
export interface GeometryItem {
  name: string;
  element: any;
  selected: boolean;
  type: string;
  context?: any;
  // Store original attributes
  initialState?: Record<string, string>;
  // IDs of geometries this item depends on
  dependsOn: string[];
  // Which step created this geometry
  stepId: string;
  // Parameter values used in creation
  parameterValues: Record<string, unknown>;
}

/**
 * Interface for the geometry store that manages SVG geometry elements.
 * Provides methods for adding, updating, and clearing geometry items.
 */
export interface GeometryStore {
  items: Record<string, GeometryItem>;
  add: (name: string, element: any, type: string, dependsOn: string[]) => void;
  update: (key: string, object: Partial<GeometryItem>) => void;
  clear: () => void;
}

// Attributes to preserve for each geometry type
const ATTRIBUTES_TO_PRESERVE: Record<string, string[]> = {
  point: ["fill", "r", "cx", "cy"],
  line: ["stroke", "stroke-width", "x1", "y1", "x2", "y2"],
  circle: ["stroke", "stroke-width", "cx", "cy", "r"],
  polygon: ["stroke", "stroke-width", "fill", "points"],
};

// Capture the initial state of an SVG element by preserving relevant attributes
// element - The SVG element
// type - The geometry type
// name - The element name (for error reporting)
// returns Record of attribute names and their original values
function captureInitialState(element: any, type: string, name: string): Record<string, string> {
  const initialState: Record<string, string> = {};
  const attributes = ATTRIBUTES_TO_PRESERVE[type] || [];

  attributes.forEach((attr) => {
    try {
      const value = element?.getAttribute?.(attr);
      if (value) {
        initialState[attr] = value;
      }
    } catch (error) {
      console.warn(`Could not get attribute ${attr} for element ${name}:`, error);
    }
  });

  return initialState;
}

/**
 * Internal implementation of geometry store.
 * Used by both useGeometryStoreSquare and useGeometryStoreSixFoldV0.
 */
function useGeometryStoreImpl(): GeometryStore {
  const [items, setItems] = useState<Record<string, GeometryItem>>({});

  const add = useCallback((name: string, element: any, type: string, dependsOn: string[]) => {
    setItems((old) => {
      const newItems = { ...old };
      const initialState = captureInitialState(element, type, name);
      const existingItem = old[name];

      newItems[name] = {
        name,
        element,
        // Preserve existing selected state if this item already exists
        selected: existingItem?.selected ?? false,
        type,
        initialState:
          Object.keys(initialState).length > 0 ? initialState : existingItem?.initialState,
        dependsOn: existingItem?.dependsOn ?? dependsOn,
        stepId: "",
        parameterValues: {},
      };
      return newItems;
    });
  }, []);

  const update = useCallback((k: string, o: Partial<GeometryItem>) => {
    setItems((old) => {
      const newItems = { ...old };
      newItems[k] = {
        ...old[k],
        ...o,
      };
      return newItems;
    });
  }, []);

  const clear = useCallback(() => {
    setItems({});
  }, []);

  return useMemo(() => ({ items, add, update, clear }), [items, add, update, clear]);
}

/**
 * React hook for Square component geometry store.
 * Similar to useGeometryStore but tailored for Square component usage.
 */
export function useGeometryStoreSquare(): GeometryStore {
  return useGeometryStoreImpl();
}

/**
 * React hook for SixFoldV0 geometry store.
 * Uses the same implementation as Square for consistency.
 */
export function useGeometryStoreSixFoldV0(): GeometryStore {
  return useGeometryStoreImpl();
}

/**
 * React hook for generic geometry store.
 * Main store hook used throughout the application.
 */
export function useGeometryStore(): GeometryStore {
  return useGeometryStoreImpl();
}

// Dependency Graph Types for useGeometryValueStore
export interface DependencyNode {
  id: string;
  type: string;
  value?: any;
  dependsOn: string[];
}

export interface GeometryValueStore {
  geometryValues: Map<string, any>;
  addGeometry: (id: string, value: any, type: string, dependsOn: string[]) => void;
  getGeometry: (id: string) => any | undefined;
  getNode: (id: string) => DependencyNode | undefined;
  getAllNodes: () => DependencyNode[];
  getDependencyGraph: () => Map<string, DependencyNode>;
  clear: () => void;
}

/**
 * React hook for managing geometry values with dependency tracking.
 * Provides a more sophisticated API for geometry value management.
 */
export function useGeometryValueStore(): GeometryValueStore {
  const [geometryValues, setGeometryValues] = useState<Map<string, any>>(new Map());
  const [nodes, setNodes] = useState<Map<string, DependencyNode>>(new Map());

  const addGeometry = useCallback((id: string, value: any, type: string, dependsOn: string[]) => {
    setGeometryValues((prev) => {
      const newMap = new Map(prev);
      newMap.set(id, value);
      return newMap;
    });
    setNodes((prev) => {
      const newNodes = new Map(prev);
      newNodes.set(id, {
        id,
        type,
        value,
        dependsOn,
      });
      return newNodes;
    });
  }, []);

  const getGeometry = useCallback(
    (id: string) => {
      return geometryValues.get(id);
    },
    [geometryValues],
  );

  const getNode = useCallback(
    (id: string) => {
      return nodes.get(id);
    },
    [nodes],
  );

  const getAllNodes = useCallback(() => {
    return Array.from(nodes.values());
  }, [nodes]);

  const getDependencyGraph = useCallback(() => {
    return nodes;
  }, [nodes]);

  const clear = useCallback(() => {
    setGeometryValues(new Map());
    setNodes(new Map());
  }, []);

  return useMemo(
    () => ({
      geometryValues,
      addGeometry,
      getGeometry,
      getNode,
      getAllNodes,
      getDependencyGraph,
      clear,
    }),
    [geometryValues, addGeometry, getGeometry, getNode, getAllNodes, getDependencyGraph, clear],
  );
}

// Enhanced store types
export interface EnhancedGeometryStore {
  geometryValues: Map<string, any>;
  add: (name: string, element: any, type: string, dependsOn: string[]) => void;
  update: (key: string, object: Partial<GeometryItem>) => void;
  clear: () => void;
}

/**
 * Enhanced geometry store with direct access to geometry values.
 */
export function useGeometryStoreEnhanced(): EnhancedGeometryStore {
  const [geometryValues, setGeometryValues] = useState<Map<string, any>>(new Map());

  const add = useCallback((name: string, element: any, _type: string, _dependsOn: string[]) => {
    // Store in geometryValues Map
    setGeometryValues((prev) => {
      const newMap = new Map(prev);
      newMap.set(name, element);
      return newMap;
    });
  }, []);

  const update = useCallback((_k: string, _o: Partial<GeometryItem>) => {
    // Update not needed for geometryValues-only store
  }, []);

  const clear = useCallback(() => {
    setGeometryValues(new Map());
  }, []);

  return useMemo(
    () => ({ geometryValues, add, update, clear }),
    [geometryValues, add, update, clear],
  );
}
