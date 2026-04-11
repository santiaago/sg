import { useEffect, useRef } from 'react'
import type { JSX } from 'react'
import { bisect, inteceptCircleLineSeg, intersection } from '@sg/geometry'

interface SquareProps {
  store?: any
  stroke?: number
  strokeMid?: number
  strokeBig?: number
  strokeLine?: number
}

export function Square({ 
  store,
  stroke = 0.5,
  strokeMid = 0.5,
  strokeBig = 2,
  strokeLine = (1 + Math.sqrt(5)) / 2
}: SquareProps): JSX.Element {
  const svgRef = useRef<SVGSVGElement>(null)

  // Helper function to draw a dot
  const dot = (svg: SVGSVGElement, x: number, y: number, strokeWidth: number = 1.5) => {
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
    circle.setAttribute('class', 'dot')
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
    dotElement.setAttribute('data-tooltip', name)
    dotElement.style.cursor = 'pointer'
    
    // Create tooltip element
    const tooltip = document.createElementNS('http://www.w3.org/2000/svg', 'text')
    tooltip.setAttribute('x', (x + 10).toString())
    tooltip.setAttribute('y', (y - 5).toString())  // Adjusted y position for better visibility
    tooltip.setAttribute('fill', 'white')  // White text for contrast
    tooltip.setAttribute('font-size', '12')
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
    tooltipBg.setAttribute('y', (y - 20).toString())
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
    
    if (store) {
      store.add(name, dotElement, 'point')
    }
    
    return dotElement
  }

  // Helper function to draw a line
  const line = (svg: SVGSVGElement, x1: number, y1: number, x2: number, y2: number, strokeWidth: number = 5) => {
    const lineEl = document.createElementNS('http://www.w3.org/2000/svg', 'line')
    lineEl.setAttribute('stroke', '#506')
    lineEl.setAttribute('stroke-width', strokeWidth.toString())
    lineEl.setAttribute('x1', x1.toString())
    lineEl.setAttribute('y1', y1.toString())
    lineEl.setAttribute('x2', x2.toString())
    lineEl.setAttribute('y2', y2.toString())
    svg.appendChild(lineEl)
    return lineEl
  }

  // Helper function to draw a rectangle
  const rect = (svg: SVGSVGElement, width: number, height: number) => {
    const rectEl = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
    rectEl.setAttribute('width', width.toString())
    rectEl.setAttribute('height', height.toString())
    rectEl.setAttribute('fill', '#fff')
    svg.appendChild(rectEl)
  }

  // Helper function to draw a circle
  const circle = (svg: SVGSVGElement, cx: number, cy: number, r: number, stroke: number = 1) => {
    const circleEl = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
    circleEl.setAttribute('stroke', '#f06')
    circleEl.setAttribute('stroke-width', stroke.toString())
    circleEl.setAttribute('fill', 'none')
    circleEl.setAttribute('cx', cx.toString())
    circleEl.setAttribute('cy', cy.toString())
    circleEl.setAttribute('r', r.toString())
    svg.appendChild(circleEl)
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
    const stroke = 0.5

    const [lx1, ly1, lx2, ly2] = [
      border,
      height - border,
      width - border,
      height - border,
    ]

    // draw first line
    const mainLine = line(svg, lx1, ly1, lx2, ly2, stroke)
    if (store) {
      store.add('line_main', mainLine, 'line')
    }

    // draw right side circle
    const cx1 = lx1 + ((lx2 - lx1) * 5) / 8
    const cy1 = ly2
    const r = ((lx2 - lx1) * 2) / 8
    const circle1 = circle(svg, cx1, cy1, r, stroke)
    dotWithTooltip(svg, cx1, cy1, 'c1', stroke)
    if (store) {
      store.add('c1_c', circle1, 'circle')
    }

    // draw left side circle
    const cx2 = cx1 - r
    const cy2 = cy1
    const circle2 = circle(svg, cx2, cy2, r, stroke)
    dotWithTooltip(svg, cx2, cy2, 'c2', stroke)
    if (store) {
      store.add('c2_c', circle2, 'circle')
    }

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
    const intersectionCircle = circle(svg, px, py, r, stroke)
    const intersectionDot = dot(svg, px, py)
    if (store) {
      store.add('ci', intersectionCircle, 'circle')
      store.add('pi', intersectionDot, 'point')
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
    const line_c2_p3 = line(svg, x1, y1, px3, py3, stroke)
    const dot_p3 = dot(svg, px3, py3)
    if (store) {
      store.add('line_c2_p3', line_c2_p3, 'line')
      store.add('p3', dot_p3, 'point')
    }

    // looking for intersection of
    // line(center(c1), point(px,py)) AND
    // circle(center(px, py))
    angle = Math.atan2(cy0 - cy1, cx0 - cx1)
    // translate it into the interval [0,2 π] multiply by 2
    let [px4, py4] = bisect(angle * 2, r, px, py)
    const dot_p4 = dot(svg, px4, py4)
    const line_c1_p4 = line(svg, cx1, cy1, px4, py4, stroke)
    if (store) {
      store.add('p4', dot_p4, 'point')
      store.add('line_c1_p4', line_c1_p4, 'line')
    }

    // draw lines from cercle(c1) and cercle(c2) with new intersection points
    // p3 and p4
    const line_c1_p3 = line(svg, cx1, cy1, px3, py3, stroke)
    const line_c2_p4 = line(svg, cx2, cy2, px4, py4, stroke)
    if (store) {
      store.add('line_c1_p3', line_c1_p3, 'line')
      store.add('line_c2_p4', line_c2_p4, 'line')
    }

    // draw line between p3 and p4
    const line_p3_p4 = line(svg, px3, py3, px4, py4, stroke)
    if (store) {
      store.add('line_p3_p4', line_p3_p4, 'line')
    }

    // draw intersection between center(c2) AND
    // p4
    let plx, ply
    let lp_left = inteceptCircleLineSeg(cx2, cy2, cx2, cy2, px4, py4, r)

    if (lp_left && lp_left.length > 0) {
      [plx, ply] = lp_left[0]
      const dot_left_intersection = dot(svg, plx, ply)
      if (store) {
        store.add('pl', dot_left_intersection, 'point')
      }
    }

    // draw intersection between center (c1) AND
    // p3
    let prx, pry
    let lp_right = inteceptCircleLineSeg(cx1, cy1, cx1, cy1, px3, py3, r)

    if (lp_right && lp_right.length > 0) {
      [prx, pry] = lp_right[0]
      const dot_right_intersection = dot(svg, prx, pry)
      if (store) {
        store.add('pr', dot_right_intersection, 'point')
      }
    }

    // draw final square
    if (plx && ply && prx && pry) {
      const s = (1 + Math.sqrt(5)) / 2
      const square_line1 = line(svg, plx, ply, prx, pry, s)
      const square_line2 = line(svg, cx2, cy2, plx, ply, s)
      const square_line3 = line(svg, cx2, cy2, cx1, cy1, s)
      const square_line4 = line(svg, cx1, cy1, prx, pry, s)
      if (store) {
        store.add('ls1', square_line1, 'line')
        store.add('ls2', square_line2, 'line')
        store.add('ls3', square_line3, 'line')
        store.add('ls4', square_line4, 'line')
      }
    }
    
  }, [])

  return (
    <div className="square-container">
      <svg ref={svgRef} className="square-svg w-full h-auto" />
    </div>
  )
}