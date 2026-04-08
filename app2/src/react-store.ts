import { useState, useCallback } from 'react'

interface GeometryItem {
  name: string
  element: any
  selected: boolean
  type: string
  context?: any
}

interface GeometryStore {
  items: Record<string, GeometryItem>
  add: (name: string, element: any, type: string) => void
  update: (key: string, object: Partial<GeometryItem>) => void
}

interface GeometryStorev2v3v4 {
  items: Record<string, GeometryItem>
  add: (shape: { name: string, type: string, context?: any }, element: any) => void
  update: (key: string, object: Partial<GeometryItem>) => void
}

export function useGeometryStore(): GeometryStore {
  const [items, setItems] = useState<Record<string, GeometryItem>>({})

  const add = useCallback((name: string, element: any, type: string) => {
    setItems(old => {
      const newItems = { ...old }
      newItems[name] = {
        name,
        element,
        selected: false,
        type,
      }
      return newItems
    })
  }, [])

  const update = useCallback((k: string, o: Partial<GeometryItem>) => {
    setItems(old => {
      const newItems = { ...old }
      newItems[k] = {
        ...old[k],
        ...o,
      }
      return newItems
    })
  }, [])

  return { items, add, update }
}

export function useGeometryStorev2(): GeometryStorev2v3v4 {
  const [items, setItems] = useState<Record<string, GeometryItem>>({})

  const add = useCallback((shape: { name: string, type: string }, element: any) => {
    setItems(old => {
      const newItems = { ...old }
      newItems[shape.name] = {
        name: shape.name,
        element,
        selected: false,
        type: shape.type,
      }
      return newItems
    })
  }, [])

  const update = useCallback((k: string, o: Partial<GeometryItem>) => {
    setItems(old => {
      const newItems = { ...old }
      newItems[k] = {
        ...old[k],
        ...o,
      }
      return newItems
    })
  }, [])

  return { items, add, update }
}

export function useGeometryStorev3(): GeometryStorev2v3v4 {
  const [items, setItems] = useState<Record<string, GeometryItem>>({})

  const add = useCallback((shape: { name: string, type: string }, element: any) => {
    setItems(old => {
      const newItems = { ...old }
      newItems[shape.name] = {
        name: shape.name,
        element,
        selected: false,
        type: shape.type,
      }
      return newItems
    })
  }, [])

  const update = useCallback((k: string, o: Partial<GeometryItem>) => {
    setItems(old => {
      const newItems = { ...old }
      newItems[k] = {
        ...old[k],
        ...o,
      }
      return newItems
    })
  }, [])

  return { items, add, update }
}

export function useGeometryStorev4(): GeometryStorev2v3v4 {
  const [items, setItems] = useState<Record<string, GeometryItem>>({})

  const add = useCallback((shape: { name: string, type: string, context?: any }, element: any) => {
    setItems(old => {
      const newItems = { ...old }
      newItems[shape.name] = {
        name: shape.name,
        element,
        selected: false,
        type: shape.type,
        context: shape.context,
      }
      return newItems
    })
  }, [])

  const update = useCallback((k: string, o: Partial<GeometryItem>) => {
    setItems(old => {
      const newItems = { ...old }
      newItems[k] = {
        ...old[k],
        ...o,
      }
      return newItems
    })
  }, [])

  return { items, add, update }
}