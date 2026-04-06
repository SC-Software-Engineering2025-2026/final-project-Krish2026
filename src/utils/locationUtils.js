// ===== Location Utility Functions =====
// Helper functions for displaying location information on posts and profiles

/**
 * SHORTEN LOCATION NAME
 * Reduces location text for compact display on post cards
 * Takes first 2-3 meaningful parts of address
 * Example: "New York, New York, United States" → "New York, United States"
 * @param {string} locationName - Full location name/address
 * @returns {string} Shortened location string
 */
export const shortenLocation = (locationName) => {
  if (!locationName) return "";

  // Split by comma to separate address parts
  const parts = locationName.split(",").map((part) => part.trim());

  // Return as-is if already short
  if (parts.length <= 2) {
    return locationName;
  }

  // For longer addresses: take first part + last part (usually city/state + country)
  return `${parts[0]}, ${parts[parts.length - 2] || parts[parts.length - 1]}`;
};

/**
 * FORMAT LOCATION FOR DISPLAY
 * Shortens location and adds truncation if too long
 * @param {string} locationName - Full location name
 * @param {number} maxLength - Max characters before truncation (default: 30)
 * @returns {string} Formatted location string with ellipsis if truncated
 */
export const formatLocationDisplay = (locationName, maxLength = 30) => {
  if (!locationName) return "";

  const shortened = shortenLocation(locationName);

  // Truncate and add ellipsis if exceeds max length
  if (shortened.length > maxLength) {
    return shortened.substring(0, maxLength - 3) + "...";
  }

  return shortened;
};
