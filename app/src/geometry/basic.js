export const dot = (svg, x, y, className = "dot") => {
    svg
      .append("circle")
      .attr("class", className)
      .style("display", "block")
      .attr("cx", x)
      .attr("cy", y)
      .attr("r", 1);
  };

  export const line = (svg, x1, y1, x2, y2, stroke = 5, color="#506") => {
    svg
      .append("line")
      .style("stroke", color)
      .style("stroke-width", stroke)
      .attr("x1", x1)
      .attr("y1", y1)
      .attr("x2", x2)
      .attr("y2", y2);
  };

  export const rect = (svg, width, height) => {
    svg
      .append("rect")
      .attr("width", width)
      .attr("height", height)
      .attr("fill", "#fff");
  };

  export const circle = (svg, cx, cy, r, stroke = 1) => {
    svg
      .append("circle")
      .style("stroke", "#f06")
      .style("stroke-width", stroke)
      .style("fill", "none")
      .attr("cx", cx)
      .attr("cy", cy)
      .attr("r", r);
  };