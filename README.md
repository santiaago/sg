# SG Monorepo

Geometry visualization applications with shared utilities.

## Structure

- `app/` - Svelte application
- `app2/` - React application  
- `packages/geometry/` - Shared geometry utilities

## Packages

### @sg/geometry

Shared geometry library with:
- Points, Lines, Circles
- Intersection algorithms
- Geometry hashing

**Status**: ✅ Built and tested

## Development

```bash
# Build geometry package
cd packages/geometry
npm run build

# Run tests
npm test
```

## Next Steps

1. Integrate @sg/geometry into app/
2. Integrate @sg/geometry into app2/
3. Add more shared packages as needed