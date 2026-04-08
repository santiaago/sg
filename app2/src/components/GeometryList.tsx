import type { JSX } from 'react'

interface GeometryListProps {
  store: any
  stroke?: number
  strokeMid?: number
  strokeBig?: number
  strokeLine?: number
}

interface GeometryItem {
  name: string
  type: string
}

export function GeometryList({ store }: GeometryListProps): JSX.Element {
  return (
    <div className="geometry-list">
      <h3>Geometry Items</h3>
      <p>Store has {Object.keys(store.items || {}).length} items</p>
      <ul>
        {store.items && Object.entries(store.items).map(([key, item]) => (
          <li key={key}>
            {(item as GeometryItem).name} ({(item as GeometryItem).type})
          </li>
        ))}
      </ul>
    </div>
  )
}