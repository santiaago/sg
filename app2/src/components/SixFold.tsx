import { useEffect, useRef } from 'react'
import type { JSX } from 'react'
import {
  bisect,
  cerclesIntersection,
  directions,
  inteceptCircleLineSeg,
  intersection,
  lineIntersect,
  intersect,
  distance
} from '@sg/geometry'

export function SixFold({ 
  store,
  stroke = 0.5,
  strokeMid = 0.5,
  strokeBig = 2,
  strokeLine = (1 + Math.sqrt(5)) / 2
}: {
  store: any
  stroke?: number
  strokeMid?: number
  strokeBig?: number
  strokeLine?: number
}): JSX.Element {
  const svgRef = useRef<SVGSVGElement>(null)

  // Helper function to draw a dot
  const dot = (svg: SVGSVGElement, x: number, y: number, strokeWidth: number = 1.5) => {
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
    circle.setAttribute('cx', x.toString())
    circle.setAttribute('cy', y.toString())
    circle.setAttribute('r', strokeWidth.toString())
    circle.setAttribute('fill', 'black')
    svg.appendChild(circle)
    return circle
  }

  // Helper function to draw a dot with tooltip
  const dotWithTooltip = (svg: SVGSVGElement, x: number, y: number, name: string, strokeWidth: number) => {
    const dotElement = dot(svg, x, y, strokeWidth)
    // In React version, we'll add basic tooltip functionality
    dotElement.setAttribute('data-tooltip', name)
    dotElement.style.cursor = 'pointer'
    
    // Create tooltip element
    const tooltip = document.createElementNS('http://www.w3.org/2000/svg', 'text')
    tooltip.setAttribute('x', (x + 10).toString())
    tooltip.setAttribute('y', (y - 5).toString())  // Adjusted y position for better visibility
    tooltip.setAttribute('fill', 'white')  // White text for contrast
    tooltip.setAttribute('font-size', '10')  // Smaller font to match app
    tooltip.setAttribute('opacity', '0')  // Hidden initially - show only on selection
    tooltip.setAttribute('data-tooltip-text', name)
    tooltip.setAttribute('text-anchor', 'middle')  // Center text horizontally
    tooltip.setAttribute('dominant-baseline', 'middle')  // Center text vertically
    tooltip.textContent = name
    
    // Create background rectangle for better visibility
    const tooltipBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
    const textWidth = name.length * 8  // Approximate width
    const bgX = x + 10 - textWidth/2  // Center background behind text
    tooltipBg.setAttribute('x', bgX.toString())
    tooltipBg.setAttribute('y', (y - 15).toString())
    tooltipBg.setAttribute('width', textWidth.toString())
    tooltipBg.setAttribute('height', '16')
    tooltipBg.setAttribute('fill', 'black')
    tooltipBg.setAttribute('opacity', '0')  // Hidden initially
    tooltipBg.setAttribute('rx', '2')  // Slight rounding
    svg.appendChild(tooltipBg)
    
    // Add both elements to SVG
    svg.appendChild(tooltip)
    
    // Store both tooltip and background
    dotElement.tooltip = tooltip
    dotElement.tooltipBg = tooltipBg
    
    // Store tooltip reference for later manipulation
    dotElement.tooltip = tooltip
    
    // Add click handler for selection
    dotElement.addEventListener('click', (e) => {
      e.stopPropagation();
      if (store) {
        const item = store.items[name];
        if (item) {
          store.update(name, { selected: !item.selected });
          // Apply visual feedback (handled by GeometryList now)
        }
      }
    });
    
    // Add store item if store is provided
    if (store) {
      store.add(name, dotElement, 'point')
    }
    
    return dotElement
  }

  // Helper function to draw a line
  const line = (svg: SVGSVGElement, x1: number, y1: number, x2: number, y2: number, strokeWidth: number = 5, color: string = '#506') => {
    const lineEl = document.createElementNS('http://www.w3.org/2000/svg', 'line')
    lineEl.setAttribute('stroke', color)
    lineEl.setAttribute('stroke-width', strokeWidth.toString())
    lineEl.setAttribute('x1', x1.toString())
    lineEl.setAttribute('y1', y1.toString())
    lineEl.setAttribute('x2', x2.toString())
    lineEl.setAttribute('y2', y2.toString())
    svg.appendChild(lineEl)
    return lineEl
  }

  // Helper function to draw a line with selection support
  const lineWithSelection = (svg: SVGSVGElement, x1: number, y1: number, x2: number, y2: number, name: string, strokeWidth: number = 5, color: string = '#506') => {
    const lineEl = line(svg, x1, y1, x2, y2, strokeWidth, color)
    lineEl.style.cursor = 'pointer'
    
    // Create tooltip element (positioned at midpoint)
    const midpointX = (x1 + x2) / 2
    const midpointY = (y1 + y2) / 2
    const tooltip = document.createElementNS('http://www.w3.org/2000/svg', 'text')
    tooltip.setAttribute('x', midpointX.toString())
    tooltip.setAttribute('y', (midpointY - 5).toString())  // Adjusted y position
    tooltip.setAttribute('fill', 'white')  // White text for contrast
    tooltip.setAttribute('font-size', '10')  // Smaller font to match app
    tooltip.setAttribute('opacity', '0')  // Hidden initially - show only on selection
    tooltip.setAttribute('data-tooltip-text', name)
    tooltip.setAttribute('text-anchor', 'middle')  // Center text
    tooltip.setAttribute('dominant-baseline', 'middle')  // Center text
    tooltip.textContent = name
    
    // Create background rectangle for better visibility
    const tooltipBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
    const textWidth = name.length * 8
    const bgX = midpointX - textWidth/2
    tooltipBg.setAttribute('x', bgX.toString())
    tooltipBg.setAttribute('y', (midpointY - 20).toString())
    tooltipBg.setAttribute('width', textWidth.toString())
    tooltipBg.setAttribute('height', '16')
    tooltipBg.setAttribute('fill', 'black')
    tooltipBg.setAttribute('opacity', '0')  // Hidden initially
    tooltipBg.setAttribute('rx', '2')  // Slight rounding
    svg.appendChild(tooltipBg)
    
    // Add both elements to SVG
    svg.appendChild(tooltip)
    
    // Store both tooltip and background
    lineEl.tooltip = tooltip
    lineEl.tooltipBg = tooltipBg
    
    // Add click handler for selection
    lineEl.addEventListener('click', (e) => {
      e.stopPropagation();
      if (store) {
        const item = store.items[name];
        if (item) {
          store.update(name, { selected: !item.selected });
          // Apply visual feedback (handled by GeometryList now)
        }
      }
    });
    
    // Add to store if provided
    if (store) {
      store.add(name, lineEl, 'line')
    }
    
    return lineEl
  }

  // Helper function to draw a circle with selection support
  const circleWithSelection = (svg: SVGSVGElement, cx: number, cy: number, r: number, name: string, strokeWidth: number = 1, color: string = '#f06') => {
    // Call the existing circle function to create the base circle
    const circleEl = circle(svg, cx, cy, r, strokeWidth)
    circleEl.setAttribute('stroke', color)
    circleEl.style.cursor = 'pointer'
    
    // Create tooltip element
    const tooltip = document.createElementNS('http://www.w3.org/2000/svg', 'text')
    tooltip.setAttribute('x', (cx + r + 5).toString())
    tooltip.setAttribute('y', (cy - 5).toString())  // Adjusted y position
    tooltip.setAttribute('fill', 'white')  // White text for contrast
    tooltip.setAttribute('font-size', '10')  // Smaller font to match app
    tooltip.setAttribute('opacity', '0')  // Hidden initially - show only on selection
    tooltip.setAttribute('data-tooltip-text', name)
    tooltip.setAttribute('text-anchor', 'middle')  // Center text
    tooltip.setAttribute('dominant-baseline', 'middle')  // Center text
    tooltip.textContent = name
    
    // Create background rectangle for better visibility
    const tooltipBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
    const textWidth = name.length * 8
    const bgX = cx + r + 5 - textWidth/2
    tooltipBg.setAttribute('x', bgX.toString())
    tooltipBg.setAttribute('y', (cy - 20).toString())
    tooltipBg.setAttribute('width', textWidth.toString())
    tooltipBg.setAttribute('height', '16')
    tooltipBg.setAttribute('fill', 'black')
    tooltipBg.setAttribute('opacity', '0')  // Hidden initially
    tooltipBg.setAttribute('rx', '2')  // Slight rounding
    svg.appendChild(tooltipBg)
    
    // Add both elements to SVG
    svg.appendChild(tooltip)
    
    // Store both tooltip and background
    circleEl.tooltip = tooltip
    circleEl.tooltipBg = tooltipBg
    
    // Add click handler for selection
    circleEl.addEventListener('click', (e) => {
      e.stopPropagation();
      if (store) {
        const item = store.items[name];
        if (item) {
          store.update(name, { selected: !item.selected });
          // Apply visual feedback (handled by GeometryList now)
        }
      }
    });
    
    // Add to store if provided
    if (store) {
      store.add(name, circleEl, 'circle')
    }
    
    return circleEl
  }

  // Helper function to draw a rectangle
  const rect = (svg: SVGSVGElement, width: number, height: number) => {
    const rectEl = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
    rectEl.setAttribute('width', width.toString())
    rectEl.setAttribute('height', height.toString())
    rectEl.setAttribute('fill', '#fff')
    svg.appendChild(rectEl)
    return rectEl
  }

  // Helper function to draw a circle
  const circle = (svg: SVGSVGElement, cx: number, cy: number, r: number, strokeWidth: number = 1) => {
    const circleEl = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
    circleEl.setAttribute('stroke', '#f06')
    circleEl.setAttribute('stroke-width', strokeWidth.toString())
    circleEl.setAttribute('fill', 'none')
    circleEl.setAttribute('cx', cx.toString())
    circleEl.setAttribute('cy', cy.toString())
    circleEl.setAttribute('r', r.toString())
    svg.appendChild(circleEl)
    return circleEl
  }

  // from a line
  // draw a square where the 2 points are a side of the square
  const drawSquareFromLine = (svg: SVGSVGElement, lx1: number, ly1: number, lx2: number, ly2: number, strokeWidth: number, drawDetails: boolean) => {
    // draw right side circle
    const cx1 = lx1 + ((lx2 - lx1) * 5) / 8
    const cy1 = ly2
    const r = ((lx2 - lx1) * 2) / 8

    // draw left side circle
    const cx2 = cx1 - r
    const cy2 = cy1

    // find intersection point between 2 circles
    let points = intersection(cx1, cy1, r, cx2, cy2, r)
    if (!points) {
      return
    }
    let px, py

    const px1 = points[0]
    const py1 = points[1]
    const px2 = points[2]
    const py2 = points[3]
    if (py1 < py2) {
      px = px1
      py = py1
    } else {
      px = px2
      py = py2
    }

    // draw circle at intersection point
    if (drawDetails) {
      circle(svg, px, py, r, strokeWidth)
      dot(svg, px, py, strokeWidth)
    }

    const x1 = cx2
    const y1 = cy2

    // looking for intersection of
    // line(center(c2), point(px,py)) AND
    // circle(center(px, py))
    const cx0 = px - r
    const cy0 = py
    let angle = Math.atan2(cy0 - y1, cx0 - x1)
    // translate it into the interval [0,2 π] multiply by 2
    let [px3, py3] = bisect(angle * 2, r, px, py)
    if (drawDetails) {
      line(svg, x1, y1, px3, py3, strokeWidth)
      dot(svg, px3, py3, strokeWidth)
    }

    // looking for intersection of
    // line(center(c1), point(px,py)) AND
    // circle(center(px, py))
    angle = Math.atan2(cy0 - cy1, cx0 - cx1)
    // translate it into the interval [0,2 π] multiply by 2
    let [px4, py4] = bisect(angle * 2, r, px, py)
    if (drawDetails) {
      dot(svg, px4, py4, strokeWidth)
      line(svg, cx1, cy1, px4, py4, strokeWidth)
    }

    // draw lines from cercle(c1) and cercle(c2) with new intersection points
    // p3 and p4
    if (drawDetails) {
      line(svg, cx1, cy1, px3, py3, strokeWidth)
      line(svg, cx2, cy2, px4, py4, strokeWidth)
    }

    // draw line between p3 and p4
    if (drawDetails) {
      line(svg, px3, py3, px4, py4, strokeWidth)
    }

    // draw intersection between center(c2) AND
    // p4
    let cx3, cy3
    let lp_left = inteceptCircleLineSeg(cx2, cy2, cx2, cy2, px4, py4, r)

    if (lp_left && lp_left.length > 0) {
      [cx3, cy3] = lp_left[0]
      if (drawDetails) {
        dot(svg, cx3, cy3, strokeWidth)
      }
    }

    // draw intersection between circle (c1) AND
    // p3
    let cx4, cy4
    let lp_right = inteceptCircleLineSeg(cx1, cy1, cx1, cy1, px3, py3, r)

    if (lp_right && lp_right.length > 0) {
      [cx4, cy4] = lp_right[0]
      if (drawDetails) {
        dot(svg, cx4, cy4, strokeWidth)
      }
    }

    return [
      [cx1, cy1, r],
      [cx2, cy2, r],
      [cx3, cy3, r],
      [cx4, cy4, r],
    ]
  }

  // from a set of 4 points
  // calculate the intersection 3 of these circles in space
  const drawIntersectionPoints = (svg: SVGSVGElement, circles: any[]) => {
    const [[cx1, cy1, r], [cx2, cy2], [], [cx4, cy4]] = circles

    const [pic12nx, pic12ny] = cerclesIntersection(
      cx1,
      cy1,
      r,
      cx2,
      cy2,
      r,
      directions.up
    )

    const [pic14x, pic14y] = cerclesIntersection(
      cx4,
      cy4,
      r,
      cx1,
      cy1,
      r,
      directions.left
    )

    return [
      [pic12nx, pic12ny],
      [pic14x, pic14y],
    ]
  }

  // from set of 4 points find the intersection point
  const drawLinesIntersectionPoint = (svg: SVGSVGElement, circles: any[]) => {
    const [[cx1, cy1, r], [cx2, cy2], [cx3, cy3], [cx4, cy4]] = circles

    const [pi2x, pi2y] = lineIntersect(cx1, cy1, cx3, cy3, cx4, cy4, cx2, cy2)

    return [pi2x, pi2y]
  }

  useEffect(() => {
    if (!svgRef.current) return
    
    const svg = svgRef.current
    // Clear any existing content
    while (svg.firstChild) {
      svg.removeChild(svg.firstChild)
    }
    
    // Set up SVG dimensions
    svg.setAttribute('viewBox', '0 0 800 1000')
    svg.setAttribute('width', '100%')
    svg.setAttribute('height', '100%')
    
    let width = 647
    let height = 400

    rect(svg, width, height)

    const border = height / 3

    const [lx1, ly1, lx2, ly2] = [
      border,
      height - border,
      width - border,
      height - border,
    ]

    // draw first line
    line(svg, lx1, ly1, lx2, ly2, stroke)

    const circles = drawSquareFromLine(svg, lx1, ly1, lx2, ly2, stroke, false)
    const [[cx1, cy1, r], [cx2, cy2], [cx3, cy3], [cx4, cy4]] = circles

    // Add circles to store
    circles.forEach(([cx, cy, r], i) => {
      const n = `c${i + 1}`
      if (store) {
        circleWithSelection(svg, cx, cy, r, `${n}_c`, stroke)
      }
      dotWithTooltip(svg, cx, cy, n, stroke)
    })

    // Draw main lines
    const mainLines = [
      lineWithSelection(svg, cx2, cy2, cx1, cy1, 'line_c2_c1', strokeLine),
      lineWithSelection(svg, cx2, cy2, cx3, cy3, 'line_c2_c3', strokeLine),
      lineWithSelection(svg, cx3, cy3, cx4, cy4, 'line_c3_c4', strokeLine),
      lineWithSelection(svg, cx1, cy1, cx4, cy4, 'line_c1_c4', strokeLine),
    ]
    

    const [[pic12nx, pic12ny], [pic14x, pic14y]] = drawIntersectionPoints(svg, circles)
    
    // Add intersection points
    const intersectionPoints = [
      [pic12nx, pic12ny, "12"],
      [pic14x, pic14y, "14"],
    ]
    
    intersectionPoints.forEach(([x, y, prefix]) => {
      const n = `pic${prefix}`
      dotWithTooltip(svg, x, y, n, stroke)
      lineWithSelection(svg, cx1, cy1, x, y, `${n}_l`, stroke)
    })

    // draw crossing lines of square
    const crossingLines = [
      [lineWithSelection(svg, cx1, cy1, cx3, cy3, "l13", stroke), "l13"],
      [lineWithSelection(svg, cx2, cy2, cx4, cy4, "l24", stroke), "l24"],
    ]
    

    const [pi2x, pi2y] = drawLinesIntersectionPoint(svg, circles)
    dotWithTooltip(svg, pi2x, pi2y, "pi2", stroke)
    
    // measure distance of intersection points
    const d1 = distance(pic14x, pic14y, pi2x, pi2y)

    circles.forEach(([cx, cy], i) => {
      circle(svg, cx, cy, d1, stroke)
    })

    const circlePoints = [
      [pic14x, pic14y, "pic14"],
      [pic12nx, pic12ny, "pic12"],
    ]
    
    circlePoints.forEach(([cx, cy, prefix]) => {
      circle(svg, cx, cy, d1, stroke)
    })

    // find intersection point
    const [pi3x, pi3y] = cerclesIntersection(
      pic14x,
      pic14y,
      d1,
      cx2,
      cy2,
      d1,
      directions.right
    )
    // find intersection point
    const [pi4x, pi4y] = cerclesIntersection(
      pic12nx,
      pic12ny,
      d1,
      cx4,
      cy4,
      d1,
      directions.right
    )

    const piPoints = [
      [pi3x, pi3y, "pi3"],
      [pi4x, pi4y, "pi4"],
    ]
    
    piPoints.forEach(([x, y, prefix]) => {
      dotWithTooltip(svg, x, y, prefix, stroke)
    })

    // draw lines
    const piLinePoints = [
      [pi3x, pi3y],
      [pi4x, pi4y],
    ]
    
    piLinePoints.forEach(([x, y]) => {
      line(svg, cx1, cy1, x, y, stroke)
    })

    // compute intersection between lines and cercles
    let prx5, pry5
    let pi5 = inteceptCircleLineSeg(
      pic14x,
      pic14y,
      cx1,
      cy1,
      pic14x,
      pic14y,
      d1
    )
    if (pi5 && pi5.length > 0) {
      [prx5, pry5] = pi5[0]
      dotWithTooltip(svg, prx5, pry5, "prx5", stroke)
    }
    let prx6, pry6
    let pi6 = inteceptCircleLineSeg(
      pic12nx,
      pic12ny,
      cx1,
      cy1,
      pic12nx,
      pic12ny,
      d1
    )
    if (pi6 && pi6.length > 0) {
      [prx6, pry6] = pi6[0]
      dotWithTooltip(svg, prx6, pry6, "prx6", stroke)
    }

    // looking for intersection of
    // line(center(c1), point(px,py)) AND
    // circle(center(px, py))
    let cx23, cy23
    {
      const cx0 = pic14x - d1
      const cy0 = pic14y
      const angle = Math.atan2(pry5 - cy0, prx5 - cx0)
      // translate it into the interval [0,2 π] multiply by 2
      let [x, y] = bisect(angle * 2, d1, pic14x, pic14y)
      dotWithTooltip(svg, x, y, "c23w", stroke)
      line(svg, pic14x, pic14y, x, y, stroke)

      const [px, py] = lineIntersect(cx2, cy2, cx3, cy3, pic14x, pic14y, x, y)

      let prx, pry
      const pi = inteceptCircleLineSeg(cx2, cy2, px, py, cx2, cy2, d1)
      if (pi && pi.length > 0) {
        [prx, pry] = pi[0]
        dotWithTooltip(svg, prx, pry, "c23s", stroke)
      }

      const d2 = distance(px, py, prx, pry)
      circle(svg, px, py, d2, stroke)
      cx23 = px
      cy23 = py
      dotWithTooltip(svg, cx23, cy23, "c23", stroke)
    }
    let cx34, cy34, d2
    {
      const cx0 = pic12nx - d1
      const cy0 = pic12ny
      const angle = Math.atan2(pry6 - cy0, prx6 - cx0)
      // translate it into the interval [0,2 π] multiply by 2
      let [x, y] = bisect(angle * 2, d1, pic12nx, pic12ny)
      dotWithTooltip(svg, x, y, "c34n", stroke)
      line(svg, pic12nx, pic12ny, x, y, stroke)

      const [px, py] = lineIntersect(
        cx3,
        cy3,
        cx4,
        cy4,
        pic12nx,
        pic12ny,
        x,
        y
      )

      let prx, pry
      const pi = inteceptCircleLineSeg(cx4, cy4, px, py, cx4, cy4, d1)
      if (pi && pi.length > 0) {
        [prx, pry] = pi[0]
        dotWithTooltip(svg, prx, pry, "c34e", stroke)
      }

      d2 = distance(px, py, prx, pry)
      circle(svg, px, py, d2, stroke)
      cx34 = px
      cy34 = py
      dotWithTooltip(svg, cx34, cy34, "c34", stroke)
    }
    
    // Additional construction steps - completing the pattern
    let pii1x, pii1y;
    let pii2x, pii2y;
    let d3_;
    {
      const pi = inteceptCircleLineSeg(cx1, cy1, cx1, cy1, pic14x, pic14y, d1);
      if (pi && pi.length > 0) {
        const [x, y] = pi[0];
        dot(svg, x, y);
        let x1, y1, x2, y2;
        let p = intersect(pi3x, pi3y, x, y, cx1, cy1, cx3, cy3);
        if (p && p.length > 0) {
          [x1, y1] = p;
          [pii1x, pii1y] = p;
          dotWithTooltip(svg, pii1x, pii1y, "pii1", stroke);
        }
        p = intersect(pi3x, pi3y, x, y, cx2, cy2, cx4, cy4);
        if (p && p.length > 0) {
          [x2, y2] = p;
          [pii2x, pii2y] = p;
          dotWithTooltip(svg, pii2x, pii2y, "pii2", stroke);
        }
        if (x1 && y1 && x2 && y2) {
          line(svg, x1, y1, x2, y2, stroke);
        }
        d3_ = distance(cx1, cy1, x1, y1);
        circles.forEach(([x, y], i) => {
          circle(svg, x, y, d3_, stroke);
        });
      }
    }
    
    // show or hide
    line(svg, cx2, cy2, pic14x, pic14y, stroke);
    line(svg, cx4, cy4, pic12nx, pic12ny, stroke);
    
    // find intersection between 2 segments
    // line (pii1x, pii1y) (pi4x, pi4y)
    // line (cx4, cy4) (px, py)
    let pic4x, pic4y;
    {
      let p = intersect(pii1x, pii1y, pi4x, pi4y, cx4, cy4, pic12nx, pic12ny);
      if (p && p.length > 0) {
        [pic4x, pic4y] = p;
        line(svg, pii1x, pii1y, pic4x, pic4y, strokeLine);
        dotWithTooltip(svg, pic4x, pic4y, "pic4", stroke);
      }
    }

    // find intersection between 2 segments
    // line (pii1x, pii1y), (pii2x, pii2y)
    // line(cx2, cy2) (pix, piy)
    let pic2x, pic2y;
    {
      let p = intersect(pii1x, pii1y, pii2x, pii2y, cx2, cy2, pic14x, pic14y);
      if (p && p.length > 0) {
        [pic2x, pic2y] = p;
        line(svg, pii1x, pii1y, pic2x, pic2y, strokeLine);
        dotWithTooltip(svg, pic2x, pic2y, "pic2", stroke);
      }
    }

    // points for crossing
    //  first point
    //    intersection between
    //    cercle (cx1, cy1, d3_?)
    //    line (cx1, cy1, pi3x, pi3y)
    //  second point
    //    line(cx4, cy4, cx3, cy3)
    //    cercle(cx34, cy34 d2)
    let pic1wx, pic1wy;
    {
      // first point
      let p = inteceptCircleLineSeg(cx1, cy1, cx1, cy1, pi3x, pi3y, d3_);
      if (p && p.length > 0) {
        [pic1wx, pic1wy] = p[0];
        dotWithTooltip(svg, pic1wx, pic1wy, "pic1w", stroke);
      }
      // second point
      let pic34x, pic34y;
      p = inteceptCircleLineSeg(cx34, cy34, cx4, cy4, cx3, cy3, d2);
      if (p && p.length > 0) {
        [pic34x, pic34y] = p[1];
        dotWithTooltip(svg, pic34x, pic34y, "pic34", stroke);
      }
      if (pic1wx && pic1wy && pic34x && pic34y) {
        line(svg, pic1wx, pic1wy, pic34x, pic34y, strokeLine);
      }
    }
    // lines between
    //  first point
    //    intersection between
    //    cercle (cx1, cy1, d3_?)
    //    line (cx1, cy1, pi4x, pi4y)
    //  second point
    //    line(cx2, cy2, cx3, cy3)
    //    cercle(cx23, cy23 d2)
    let pic1nx, pic1ny;
    {
      // first point
      let p = inteceptCircleLineSeg(cx1, cy1, cx1, cy1, pi4x, pi4y, d3_);
      if (p && p.length > 0) {
        [pic1nx, pic1ny] = p[0];
        dotWithTooltip(svg, pic1nx, pic1ny, "pic1n", stroke);
      }
      // second point
      let pic23x, pic23y;
      p = inteceptCircleLineSeg(cx23, cy23, cx2, cy2, cx3, cy3, d2);
      if (p && p.length > 0) {
        [pic23x, pic23y] = p[1];
        dotWithTooltip(svg, pic23x, pic23y, "pic23", stroke);
      }
      if (pic1nx && pic1ny && pic23x && pic23y) {
        line(svg, pic1nx, pic1ny, pic23x, pic23y, strokeLine);
      }
    }
    // lines between
    //  point 1:
    //    circle(cx1, cy1, d1)
    //    line(cx1, cy1, cx2, cy2)
    //  point 2:
    //    circle(cx23, cy23, d2)
    //    line(cx2, cy2, cx3, cy3)
    let pc1wx, pc1wy;
    let pc23sx, pc23sy;
    {
      // first point
      let p = inteceptCircleLineSeg(cx1, cy1, cx1, cy1, cx2, cy2, d1);
      if (p && p.length > 0) {
        [pc1wx, pc1wy] = p[0];
        dotWithTooltip(svg, pc1wx, pc1wy, "pc1w", stroke);
      }
      // second point
      p = inteceptCircleLineSeg(cx23, cy23, cx2, cy2, cx3, cy3, d2);
      if (p && p.length > 0) {
        [pc23sx, pc23sy] = p[0];
        dotWithTooltip(svg, pc23sx, pc23sy, "pc23s", stroke);
      }
      if (pc1wx && pc1wy && pc23sx && pc23sy) {
        line(svg, pc1wx, pc1wy, pc23sx, pc23sy, strokeLine);
      }
    }
    // lines between
    //  point 1:
    //    circle(cx1, cy1, d1)
    //    line(cx1, cy1, cx4, cy4)
    //  point 2:
    //    circle(cx34, cy34, d2)
    //    line(cx4, cy4, cx3, cy3)
    let pc1nx, pc1ny;
    let pc34ex, pc34ey;
    {
      // first point
      let p = inteceptCircleLineSeg(cx1, cy1, cx1, cy1, cx4, cy4, d1);
      if (p && p.length > 0) {
        [pc1nx, pc1ny] = p[0];
        dotWithTooltip(svg, pc1nx, pc1ny, "pc1n", stroke);
      }
      // second point
      p = inteceptCircleLineSeg(cx34, cy34, cx3, cy3, cx4, cy4, d2);
      if (p && p.length > 0) {
        [pc34ex, pc34ey] = p[1];
        dotWithTooltip(svg, pc34ex, pc34ey, "pc34e", stroke);
      }
      if (pc1nx && pc1ny && pc34ex && pc34ey) {
        line(svg, pc1nx, pc1ny, pc34ex, pc34ey, strokeLine);
      }
    }
    // line between
    //  point 1:
    //    point(pc1nx, pc1ny)
    //    point(pic1nx, pic1ny)
    //  point 2:
    //    point(pc1wx, pc1wy)
    //    point(pic1wx, pic1wy)
    {
      if (pc1nx && pc1ny && pic1nx && pic1ny) {
        line(svg, pc1nx, pc1ny, pic1nx, pic1ny, strokeLine);
      }
      if (pc1wx && pc1wy && pic1wx && pic1wy) {
        line(svg, pc1wx, pc1wy, pic1wx, pic1wy, strokeLine);
      }
    }
    // line between
    //  point 1:
    //    circle(cx3, cy3, d3_)
    //    line(cx3, cy, cx1, cy1)
    //  point 2:
    //    circle(c23x, c23y, d3_)
    //    line(c23x, c23y, cx0, cy0)
    let pc3swx, pc3swy;
    let pc23ex, pc23ey;
    {
      const p = inteceptCircleLineSeg(cx3, cy3, cx3, cy3, cx1, cy1, d3_);
      if (p && p.length > 0) {
        [pc3swx, pc3swy] = p[0];
        dotWithTooltip(svg, pc3swx, pc3swy, "pc3sw", stroke);
      }
      const p2 = inteceptCircleLineSeg(cx23, cy23, cx23, cy23, cx1, cy1, d2);
      if (p2 && p2.length > 0) {
        [pc23ex, pc23ey] = p2[0];
        dotWithTooltip(svg, pc23ex, pc23ey, "pc23e", stroke);
      }
      if (pc3swx && pc3swy && pc23ex && pc23ey) {
        line(svg, pc3swx, pc3swy, pc23ex, pc23ey, strokeLine);
      }
    }
    // lines between
    //  point 1:
    //    circle(c34x, c34y, d3_)
    //    line(c34x, c34y, c1x, c1y)
    //  point 2:
    //    point(pc3swx, pc3swy)
    let pc34sx, pc34sy;
    {
      const p = inteceptCircleLineSeg(cx34, cy34, cx34, cy34, cx1, cy1, d2);
      if (p && p.length > 0) {
        [pc34sx, pc34sy] = p[0];
        dotWithTooltip(svg, pc34sx, pc34sy, "pc34s", stroke);
      }
      if (pc3swx && pc3swy && pc34sx && pc34sy) {
        line(svg, pc34sx, pc34sy, pc3swx, pc3swy, strokeLine);
      }
    }
    // line between
    // point 1:
    //    point(pc34ex, pc34ey)
    // point 2:
    //    point(pc34sx, pc34sy)
    {
      if (pc34ex && pc34ey && pc34sx && pc34sy) {
        line(svg, pc34ex, pc34ey, pc34sx, pc34sy, strokeLine);
      }
    }
    // line between
    // point 1:
    //    point(pc23sx, pc23sy)
    // point 2:
    //    point(pc23ex, pc23ey)
    {
      if (pc23sx && pc23sy && pc23ex && pc23ey) {
        line(svg, pc23sx, pc23sy, pc23ex, pc23ey, strokeLine);
      }
    }
    // line between
    // point 1:
    //    point(pic4x, pic4y)
    //    point(cx4, cy4)
    {
      if (pic4x && pic4y && cx4 && cy4) {
        line(svg, cx4, cy4, pic4x, pic4y, strokeLine);
      }
    }
    // line between
    // point 1:
    //  point(pic2x, pic2y)
    // point 2:
    //  point(cx2, cy2)
    {
      if (pic2x && pic2y && cx4 && cy4) {
        line(svg, cx2, cy2, pic2x, pic2y, strokeLine);
      }
    }
    
  }, [stroke, strokeLine])

  return (
    <div className="square-container">
      <svg ref={svgRef} className="square-svg w-full h-auto" />
    </div>
  )
}