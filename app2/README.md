# React Geometric Patterns

React version of the Svelte geometric pattern app with identical structure.

## Run

```bash
npm install
npm run dev        # port 5174
npm run build
npm run preview
```

## Structure

- Same HTML/CSS as original Svelte app
- Empty SVG components ready for D3.js implementation
- React Query for state management
- 12-column grid layout

## Components

- SixFold (v1-v4)
- Square
- GeometryList
- All with same props and structure as original

## Next

1. Add D3.js: `npm install d3 @svgdotjs/svg.js`
2. Implement SVG drawing in components
3. Copy math utilities from original app
