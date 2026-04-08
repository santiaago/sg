import { useEffect, useRef } from 'react'
import type { JSX } from 'react'

export function Square(): JSX.Element {
  const svgRef = useRef<SVGSVGElement>(null)

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
    
    // Create background rectangle
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
    rect.setAttribute('width', '647')
    rect.setAttribute('height', '400')
    rect.setAttribute('fill', '#fff')
    svg.appendChild(rect)
    
  }, [])

  return (
    <div className="square-container">
      <svg ref={svgRef} className="square-svg w-full h-auto" />
    </div>
  )
}