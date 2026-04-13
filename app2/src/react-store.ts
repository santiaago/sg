import { useState, useCallback } from "react";

interface GeometryItem {
  name: string;
  element: any;
  selected: boolean;
  type: string;
  context?: any;
  initialState?: Record<string, string>; // Store original attributes
}

interface GeometryStore {
  items: Record<string, GeometryItem>;
  add: (name: string, element: any, type: string) => void;
  update: (key: string, object: Partial<GeometryItem>) => void;
  clear: () => void;
}

interface GeometryStorev2v3v4 {
  items: Record<string, GeometryItem>;
  add: (shape: { name: string; type: string; context?: any }, element: any) => void;
  update: (key: string, object: Partial<GeometryItem>) => void;
  clear: () => void;
}

// Attributes to preserve for each geometry type
const ATTRIBUTES_TO_PRESERVE: Record<string, string[]> = {
  point: ["fill", "r", "cx", "cy"],
  line: ["stroke", "stroke-width", "x1", "y1", "x2", "y2"],
  circle: ["stroke", "stroke-width", "cx", "cy", "r"],
};

/**
 * Capture the initial state of an SVG element by preserving relevant attributes
 * @param element - The SVG element
 * @param type - The geometry type
 * @param name - The element name (for error reporting)
 * @returns Record of attribute names and their original values
 */
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

export function useGeometryStore(): GeometryStore {
  const [items, setItems] = useState<Record<string, GeometryItem>>({});

  const add = useCallback((name: string, element: any, type: string) => {
    setItems((old) => {
      const newItems = { ...old };
      const initialState = captureInitialState(element, type, name);

      newItems[name] = {
        name,
        element,
        selected: false,
        type,
        initialState: Object.keys(initialState).length > 0 ? initialState : undefined,
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

  return { items, add, update, clear };
}

export function useGeometryStoreSquare(): GeometryStore {
  const [items, setItems] = useState<Record<string, GeometryItem>>({});

  const add = useCallback((name: string, element: any, type: string) => {
    setItems((old) => {
      const newItems = { ...old };
      const initialState = captureInitialState(element, type, name);

      newItems[name] = {
        name,
        element,
        selected: false,
        type,
        initialState: Object.keys(initialState).length > 0 ? initialState : undefined,
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

  return { items, add, update, clear };
}

export function useGeometryStorev2(): GeometryStorev2v3v4 {
  const [items, setItems] = useState<Record<string, GeometryItem>>({});

  const add = useCallback((shape: { name: string; type: string; context?: any }, element: any) => {
    setItems((old) => {
      const newItems = { ...old };
      const initialState = captureInitialState(element, shape.type, shape.name);

      newItems[shape.name] = {
        name: shape.name,
        element,
        selected: false,
        type: shape.type,
        context: shape.context,
        initialState: Object.keys(initialState).length > 0 ? initialState : undefined,
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

  return { items, add, update, clear };
}

export function useGeometryStorev3(): GeometryStorev2v3v4 {
  return useGeometryStorev2();
}

export function useGeometryStorev4(): GeometryStorev2v3v4 {
  return useGeometryStorev2();
}
