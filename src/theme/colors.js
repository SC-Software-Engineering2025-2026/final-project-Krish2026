/**
 * Global Theme Colors
 *
 * This file contains all theme colors used throughout the application.
 * Import and use these colors to maintain consistency across components.
 *
 * Usage:
 * import { COLORS, getColor } from '@/theme/colors';
 *
 * // Using the object
 * style={{ backgroundColor: COLORS.Dark_Gray }}
 *
 * // Using the function
 * style={{ backgroundColor: getColor('Dark_Gray') }}
 */

export const COLORS = {
  Dark_Gray: "#54524D",
  Beige: "#EDE8DD",
  Slight_Black: "#171717",
};

/**
 * Get a color by name
 * @param {string} colorName - The name of the color (e.g., 'Dark_Gray', 'Beige')
 * @returns {string} The hex color code
 */
export const getColor = (colorName) => {
  return COLORS[colorName] || "#000000"; // Returns black as fallback
};

/**
 * Get all available color names
 * @returns {string[]} Array of color names
 */
export const getColorNames = () => {
  return Object.keys(COLORS);
};

/**
 * Check if a color name exists
 * @param {string} colorName - The name of the color to check
 * @returns {boolean} True if the color exists
 */
export const hasColor = (colorName) => {
  return colorName in COLORS;
};

// Export default for convenience
export default COLORS;
