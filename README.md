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

## Status

✅ **Phase 1 Complete**: Geometry package extraction and app integration

### Completed

1. ✅ Created `@sg/geometry` package with all math utilities
2. ✅ Extracted geometry code from app/src/math/
3. ✅ Updated app/ to use conditional import system
4. ✅ Both local and shared implementations working
5. ✅ Comprehensive test suite included

### Current State

- **app/**: Fully migrated with switchable geometry implementations
- **app2/**: Ready for migration (similar pattern can be applied)
- **packages/geometry/**: Production-ready shared package

### How to Use

**Switch between implementations in app/:**
```javascript
// app/src/geometry-config.js
export const USE_SHARED_GEOMETRY = true; // or false
```

Then rebuild: `npm run build`

## Next Steps

1. Apply similar pattern to app2/ (React components)
2. Create additional shared packages as needed
3. Set up CI/CD for shared packages
4. Document API for shared packages