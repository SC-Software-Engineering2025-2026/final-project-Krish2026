/**
 * ARIA Utilities
 * Helper functions for managing ARIA attributes
 */

/**
 * Create ARIA label for button
 */
export const createButtonLabel = (text, description = "") => {
  return description ? `${text}. ${description}` : text;
};

/**
 * Create ARIA live region attributes
 */
export const getAriaLiveAttributes = (priority = "polite") => ({
  role: "status",
  "aria-live": priority,
  "aria-atomic": "true",
});

/**
 * Create ARIA described by mapping
 */
export const createAriaDescription = (elementId, descriptionId) => ({
  id: elementId,
  "aria-describedby": descriptionId,
});

/**
 * Create ARIA label and description
 */
export const createAriaLabel = (
  label,
  description = "",
  labelId = "",
  descriptionId = "",
) => {
  const attributes = {};
  if (label) {
    attributes["aria-label"] = label;
    if (labelId) attributes.id = labelId;
  }
  if (description && descriptionId) {
    attributes["aria-describedby"] = descriptionId;
  }
  return attributes;
};

/**
 * Create ARIA attributes for loading state
 */
export const getAriaLoadingAttributes = (isLoading) => ({
  "aria-busy": isLoading,
  "aria-live": "polite",
  "aria-label": isLoading ? "Loading content" : undefined,
});

/**
 * Create ARIA attributes for button with aria-pressed
 */
export const getAriaPressedAttributes = (isPressed) => ({
  "aria-pressed": isPressed,
  role: "button",
});

/**
 * Create ARIA attributes for expandable section
 */
export const getAriaExpandedAttributes = (elementId, isExpanded) => ({
  "aria-expanded": isExpanded,
  "aria-controls": elementId,
});

/**
 * Create ARIA attributes for dialog/modal
 */
export const getAriaModalAttributes = (labelId = "") => ({
  role: "dialog",
  "aria-modal": "true",
  ...(labelId && { "aria-labelledby": labelId }),
});

/**
 * Create ARIA attributes for images/icons
 */
export const getAriaImageAttributes = (alt = "") => ({
  role: "img",
  "aria-label": alt || "image",
});

/**
 * Create ARIA attributes for form fields
 */
export const getAriaFormFieldAttributes = (
  labelId,
  errorId = "",
  isRequired = false,
) => ({
  "aria-labelledby": labelId,
  ...(errorId && { "aria-describedby": errorId }),
  "aria-required": isRequired,
});

/**
 * Create skip link for main content
 */
export const getSkipLinkAttributes = () => ({
  className: "sr-only focus:not-sr-only absolute top-0 left-0 z-50",
  href: "#main-content",
  "aria-label": "Skip to main content",
});

/**
 * Helper to mark visually hidden content
 */
export const visuallyHiddenClasses = "sr-only";
