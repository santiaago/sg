// Type augmentations for SVG elements with custom tooltip properties.
// These extensions are used throughout the geometry rendering code.

export {};

declare global {
  interface SVGCircleElement {
    tooltip?: SVGTextElement;
    tooltipBg?: SVGRectElement;
  }

  interface SVGLineElement {
    tooltip?: SVGTextElement;
    tooltipBg?: SVGRectElement;
  }

  interface SVGGElement {
    tooltip?: SVGTextElement;
    tooltipBg?: SVGRectElement;
  }

  interface SVGPolygonElement {
    tooltip?: SVGTextElement;
    tooltipBg?: SVGRectElement;
  }
}
