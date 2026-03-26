// ===== Image Cropping Utility =====
// Provides canvas-based image cropping functionality for profile/community images

/**
 * Load image from URL into an Image element
 * Handles CORS for external images and blob/data URLs
 * @param {string} url - Image URL or data URL
 * @returns {Promise<Image>} Loaded image element
 */
const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    // Only set crossOrigin for external URLs (not blob or data URLs)
    if (
      url.startsWith("http") &&
      !url.startsWith("blob:") &&
      !url.startsWith("data:")
    ) {
      image.setAttribute("crossOrigin", "anonymous");
    }
    image.src = url;
  });

/**
 * Convert degree rotation to radians for calculations
 * @param {number} degreeValue - Rotation in degrees
 * @returns {number} Rotation in radians
 */
const getRadianAngle = (degreeValue) => {
  return (degreeValue * Math.PI) / 180;
};

/**
 * Calculate new bounding box dimensions after image rotation
 * Used to resize canvas to fit rotated image
 * @param {number} width - Original width
 * @param {number} height - Original height
 * @param {number} rotation - Rotation in degrees
 * @returns {Object} { width, height } of new bounding box
 */
const rotateSize = (width, height, rotation) => {
  const rotRad = getRadianAngle(rotation);

  return {
    width:
      Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height:
      Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  };
};

/**
 * CROP IMAGE - Main function
 * Crops image using canvas and returns cropped image as blob
 * Supports rotation during crop operation
 * @param {string} imageSrc - Image URL or data URL
 * @param {Object} pixelCrop - Crop area { x, y, width, height }
 * @param {number} rotation - Rotation in degrees (default: 0)
 * @returns {Promise<Blob|null>} Cropped image blob or null on error
 */
export const getCroppedImg = async (imageSrc, pixelCrop, rotation = 0) => {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    return null;
  }

  const rotRad = getRadianAngle(rotation);

  // Calculate bounding box of the rotated image
  const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
    image.width,
    image.height,
    rotation,
  );

  // Set canvas size to match the bounding box
  canvas.width = bBoxWidth;
  canvas.height = bBoxHeight;

  // Translate canvas context to a central location to allow rotating and flipping around the center
  ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
  ctx.rotate(rotRad);
  ctx.translate(-image.width / 2, -image.height / 2);

  // Draw rotated image
  ctx.drawImage(image, 0, 0);

  // Create a new canvas with the cropped dimensions
  const croppedCanvas = document.createElement("canvas");
  const croppedCtx = croppedCanvas.getContext("2d");

  if (!croppedCtx) {
    return null;
  }

  // Set the size of the cropped canvas
  croppedCanvas.width = pixelCrop.width;
  croppedCanvas.height = pixelCrop.height;

  // Draw the cropped image onto the new canvas
  croppedCtx.drawImage(
    canvas,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height,
  );

  // Return as blob
  return new Promise((resolve, reject) => {
    croppedCanvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Canvas is empty"));
          return;
        }
        resolve(blob);
      },
      "image/jpeg",
      0.95, // Quality parameter (0-1)
    );
  });
};
