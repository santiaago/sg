


/**
 * Finds distance between two points
 *  @param {number} x1 - point x coordinate
 *  @param {number} y1 - point y coordinate
 *  @param {number} x2 - point x coordinate
 *  @param {number} y2 - point y coordinate
 * @returns d:Number
 */
 export function distance(x1, y1, x2, y2) {

    return Math.hypot(x1 - x2, y1 - y2);
}