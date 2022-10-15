

/**
 * Finds intersection point between two lines
 * source: https://observablehq.com/@bumbeishvili/two-unlimited-lines-intersection-in-javascript
 *  @param {number} x1 - point x coordinate
 *  @param {number} y1 - point y coordinate
 *  @param {number} x2 - point x coordinate
 *  @param {number} y2 - point y coordinate
 *  @param {number} x3 - point x coordinate
 *  @param {number} y3 - point y coordinate
 *  @param {number} x4 - point x coordinate
 *  @param {number} y4 - point y coordinate
 * @returns [x:Number,y:Number] X and Y coordinates of intersection point.
 */
export function intersect(x1, y1, x2, y2, x3, y3, x4, y4) {

    // Check if none of the lines are of length 0
    if ((x1 === x2 && y1 === y2) || (x3 === x4 && y3 === y4)) {
        return []
    }

    const denominator = ((y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1))

    // Lines are parallel
    if (denominator === 0) {
        return []
    }

    let ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denominator
    let ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denominator

    // Return a object with the x and y coordinates of the intersection
    let x = x1 + ua * (x2 - x1)
    let y = y1 + ua * (y2 - y1)

    return [x, y ]
}