import { useState, useCallback } from 'react'

export function useGeometryStore() {
  const [items, setItems] = useState({})

  const add = useCallback((name, element, type) => {
    setItems(old => ({
      ...old,
      [name]: {
        name,
        element,
        selected: false,
        type,
      }
    }))
  }, [])

  const update = useCallback((k, o) => {
    setItems(old => ({
      ...old,
      [k]: {
        ...o,
      }
    }))
  }, [])

  return { items, add, update }
}

export function useGeometryStorev2() {
  const [items, setItems] = useState({})

  const add = useCallback((shape, element) => {
    setItems(old => ({
      ...old,
      [shape.name]: {
        name: shape.name,
        element,
        selected: false,
        type: shape.type,
      }
    }))
  }, [])

  const update = useCallback((k, o) => {
    setItems(old => ({
      ...old,
      [k]: {
        ...o,
      }
    }))
  }, [])

  return { items, add, update }
}

export function useGeometryStorev3() {
  const [items, setItems] = useState({})

  const add = useCallback((shape, element) => {
    setItems(old => ({
      ...old,
      [shape.name]: {
        name: shape.name,
        element,
        selected: false,
        type: shape.type,
      }
    }))
  }, [])

  const update = useCallback((k, o) => {
    setItems(old => ({
      ...old,
      [k]: {
        ...o,
      }
    }))
  }, [])

  return { items, add, update }
}

export function useGeometryStorev4() {
  const [items, setItems] = useState({})

  const add = useCallback((shape, element) => {
    setItems(old => ({
      ...old,
      [shape.name]: {
        name: shape.name,
        element,
        selected: false,
        type: shape.type,
        context: shape.context,
      }
    }))
  }, [])

  const update = useCallback((k, o) => {
    setItems(old => ({
      ...old,
      [k]: {
        ...o,
      }
    }))
  }, [])

  return { items, add, update }
}