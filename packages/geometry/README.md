# @sg/geometry

Shared geometry utilities for SG applications.

## Features

- Points with distance calculations
- Lines with intersection detection
- Circles and advanced geometry
- Geometry hashing utilities

## Usage

```javascript
import { Point, Line, distance, intersect } from "@sg/geometry";

const p1 = new Point(0, 0);
const p2 = new Point(3, 4);
const dist = distance(p1.x, p1.y, p2.x, p2.y); // 5
```

## Development

```bash
npm run build  # Build package
npm test       # Run tests
```

## Status

✅ Built and tested
✅ All tests passing
