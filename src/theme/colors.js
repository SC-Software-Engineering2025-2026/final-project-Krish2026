// ===== Global Theme Colors =====
// Centralized color palette for consistent theming across entire application
// These are used for branding and should be referenced in all styled components

/**
 * COLORS object - Primary color palette
 * Use these hex values for text, backgrounds, borders, etc.
 * Maintain consistency by always importing from here rather than hardcoding colors
 */
export const COLORS = {
  Dark_Gray: "#54524D", // Primary text/dark elements
  Beige: "#EDE8DD", // Light backgrounds/accents
  Slight_Black: "#171717", // Darkest elements/very dark text
};

/**
 * GET COLOR
 * Retrieve color by name with fallback to black
 * @param {string} colorName - Color key (e.g., 'Dark_Gray', 'Beige')
 * @returns {string} Hex color code or black fallback
 */
export const getColor = (colorName) => {
  return COLORS[colorName] || "#000000"; // Returns black as fallback
};

/**
 * GET ALL COLOR NAMES
 * Retrieve list of all available color names
 * Useful for color selection dropdowns
 * @returns {string[]} Array of available color names
 */
export const getColorNames = () => {
  return Object.keys(COLORS);
};

/**
 * CHECK IF COLOR EXISTS
 * Verify a color name is available in the palette
 * @param {string} colorName - Color name to check
 * @returns {boolean} True if color exists in palette
 */
export const hasColor = (colorName) => {
  return colorName in COLORS;
};

// Export default for convenience
export default COLORS;
