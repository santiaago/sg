# SG Monorepo

Geometry apps with shared TypeScript utilities.

## 🚀 Quick Start

```bash
pnpm install
pnpm build
pnpm dev
```

## 📦 Packages

- `@sg/geometry` - TypeScript geometry library (Points, Lines, Circles, Intersections)
- `app/` - Svelte application
- `app2/` - React application

## 🔧 Scripts

```bash
# Build
pnpm build          # Build all
pnpm build:packages # Build packages only
pnpm build:apps     # Build apps only

# Test
pnpm test               # Run all tests
pnpm test:watch         # Watch mode
pnpm test:coverage      # Coverage report

# Dev
pnpm dev            # Start Svelte app
pnpm dev:app2       # Start React app

# Clean
pnpm clean          # Remove node_modules, dist, coverage
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
