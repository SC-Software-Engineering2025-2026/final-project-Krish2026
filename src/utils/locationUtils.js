/**
 * Shortens a location name to display on post cards
 * Takes the first 2-3 meaningful parts of the location
 * @param {string} locationName - Full location name
 * @returns {string} Shortened location name
 */
export const shortenLocation = (locationName) => {
  if (!locationName) return "";

  // Split by comma to separate parts
  const parts = locationName.split(",").map((part) => part.trim());

  // Return the first 2 parts for a concise display
  if (parts.length <= 2) {
    return locationName;
  }

  // For longer addresses, take first significant part and last (usually city/state or country)
  return `${parts[0]}, ${parts[parts.length - 2] || parts[parts.length - 1]}`;
};

/**
 * Formats location for display with icon
 * @param {string} locationName - Full location name
 * @param {number} maxLength - Maximum length before truncation
 * @returns {string} Formatted location string
 */
export const formatLocationDisplay = (locationName, maxLength = 30) => {
  if (!locationName) return "";

  const shortened = shortenLocation(locationName);

  if (shortened.length > maxLength) {
    return shortened.substring(0, maxLength - 3) + "...";
  }

  return shortened;
};
