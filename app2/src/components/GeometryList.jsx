import React from 'react'

export function GeometryList({ store, stroke = 0.5, strokeMid = 0.5, strokeBig = 2, strokeLine = 1.4 }) {
  return (
    <div className="geometry-list">
      <h3>Geometry Items</h3>
      <p>Store has {Object.keys(store.items || {}).length} items</p>
      <ul>
        {store.items && Object.entries(store.items).map(([key, item]) => (
          <li key={key}>
            {item.name} ({item.type})
          </li>
        ))}
      </ul>
    </div>
  )
}