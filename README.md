# SG Monorepo

Geometry apps with shared TypeScript utilities.

## 🚀 Quick Start

```bash
npm install
npm run build
npm run dev
```

## 📦 Packages

- `@sg/geometry` - TypeScript geometry library (Points, Lines, Circles, Intersections)
- `app/` - Svelte application
- `app2/` - React application

## 🔧 Scripts

```bash
# Build
npm run build          # Build all
npm run build:packages # Build packages only
npm run build:apps     # Build apps only

# Test
npm test               # Run all tests
npm run test:watch     # Watch mode
npm run test:coverage   # Coverage report

# Dev
npm run dev            # Start Svelte app
npm run dev:app2       # Start React app

# Clean
npm run clean          # Remove node_modules, dist, coverage
```

## 📈 Status

✅ Geometry package extracted and tested
✅ TypeScript conversion complete
✅ Vitest test suite (15 tests, 95% coverage)
✅ Production-ready shared package

## 🎯 Next

- Migrate app2 to use shared geometry
- Add CI/CD pipeline
- Expand shared package ecosystem