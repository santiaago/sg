import { useEffect, useRef } from 'react'
import type { JSX } from 'react'
import { bisect, inteceptCircleLineSeg, intersection } from '@sg/geometry'

export function Square(): JSX.Element {
  const svgRef = useRef<SVGSVGElement>(null)

  // Helper function to draw a dot
  const dot = (svg: SVGSVGElement, x: number, y: number) => {
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
    circle.setAttribute('class', 'dot')
    circle.setAttribute('cx', x.toString())
    circle.setAttribute('cy', y.toString())
    circle.setAttribute('r', '2')
    circle.setAttribute('fill', 'red')
    svg.appendChild(circle)
  }

  // Helper function to draw a line
  const line = (svg: SVGSVGElement, x1: number, y1: number, x2: number, y2: number, stroke: number = 5) => {
    const lineEl = document.createElementNS('http://www.w3.org/2000/svg', 'line')
    lineEl.setAttribute('stroke', '#506')
    lineEl.setAttribute('stroke-width', stroke.toString())
    lineEl.setAttribute('x1', x1.toString())
    lineEl.setAttribute('y1', y1.toString())
    lineEl.setAttribute('x2', x2.toString())
    lineEl.setAttribute('y2', y2.toString())
    svg.appendChild(lineEl)
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
    line(svg, lx1, ly1, lx2, ly2, stroke)

    // draw right side circle
    const cx1 = lx1 + ((lx2 - lx1) * 5) / 8
    const cy1 = ly2
    const r = ((lx2 - lx1) * 2) / 8
    circle(svg, cx1, cy1, r, stroke)
    dot(svg, cx1, cy1)

    // draw left side circle
    const cx2 = cx1 - r
    const cy2 = cy1
    circle(svg, cx2, cy2, r, stroke)
    dot(svg, cx2, cy2)

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
    circle(svg, px, py, r, stroke)
    dot(svg, px, py)

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
    line(svg, x1, y1, px3, py3, stroke)
    dot(svg, px3, py3)

    // looking for intersection of
    // line(center(c1), point(px,py)) AND
    // circle(center(px, py))
    angle = Math.atan2(cy0 - cy1, cx0 - cx1)
    // translate it into the interval [0,2 π] multiply by 2
    let [px4, py4] = bisect(angle * 2, r, px, py)
    dot(svg, px4, py4)
    line(svg, cx1, cy1, px4, py4, stroke)

    // draw lines from cercle(c1) and cercle(c2) with new intersection points
    // p3 and p4
    line(svg, cx1, cy1, px3, py3, stroke)
    line(svg, cx2, cy2, px4, py4, stroke)

    // draw line between p3 and p4
    line(svg, px3, py3, px4, py4, stroke)

    // draw intersection between center(c2) AND
    // p4
    let plx, ply
    let lp_left = inteceptCircleLineSeg(cx2, cy2, cx2, cy2, px4, py4, r)

    if (lp_left && lp_left.length > 0) {
      [plx, ply] = lp_left[0]
      dot(svg, plx, ply)
    }

    // draw intersection between center (c1) AND
    // p3
    let prx, pry
    let lp_right = inteceptCircleLineSeg(cx1, cy1, cx1, cy1, px3, py3, r)

    if (lp_right && lp_right.length > 0) {
      [prx, pry] = lp_right[0]
      dot(svg, prx, pry)
    }

    // draw final square
    if (plx && ply && prx && pry) {
      const s = (1 + Math.sqrt(5)) / 2
      line(svg, plx, ply, prx, pry, s)
      line(svg, cx2, cy2, plx, ply, s)
      line(svg, cx2, cy2, cx1, cy1, s)
      line(svg, cx1, cy1, prx, pry, s)
    }
    
  }, [])

  return (
    <div className="square-container">
      <svg ref={svgRef} className="square-svg w-full h-auto" />
    </div>
  )
}