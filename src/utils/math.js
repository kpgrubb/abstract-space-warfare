/**
 * math.js - Vector math and geometry utilities
 */

/**
 * Calculate distance between two points
 */
export function distance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate angle between two points (in radians)
 */
export function angleBetween(x1, y1, x2, y2) {
    return Math.atan2(y2 - y1, x2 - x1);
}

/**
 * Normalize a vector
 */
export function normalize(x, y) {
    const len = Math.sqrt(x * x + y * y);
    if (len === 0) return { x: 0, y: 0 };
    return { x: x / len, y: y / len };
}

/**
 * Calculate vector length/magnitude
 */
export function magnitude(x, y) {
    return Math.sqrt(x * x + y * y);
}

/**
 * Lerp (linear interpolation) between two values
 */
export function lerp(start, end, t) {
    return start + (end - start) * t;
}

/**
 * Clamp a value between min and max
 */
export function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

/**
 * Map a value from one range to another
 */
export function map(value, inMin, inMax, outMin, outMax) {
    return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}

/**
 * Convert degrees to radians
 */
export function degToRad(degrees) {
    return degrees * (Math.PI / 180);
}

/**
 * Convert radians to degrees
 */
export function radToDeg(radians) {
    return radians * (180 / Math.PI);
}

/**
 * Check if point is within circle
 */
export function pointInCircle(px, py, cx, cy, radius) {
    return distance(px, py, cx, cy) <= radius;
}

/**
 * Get random float between min and max
 */
export function randomFloat(min, max) {
    return Math.random() * (max - min) + min;
}

/**
 * Get random integer between min and max (inclusive)
 */
export function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Get random element from array
 */
export function randomChoice(array) {
    return array[Math.floor(Math.random() * array.length)];
}
