import type { AspectRatio } from './types';

export function getAspectRatioValue(ratio: AspectRatio, customWidth?: number, customHeight?: number): number | null {
  switch (ratio) {
    case '1:1':
      return 1;
    case '3:4':
      return 3 / 4;
    case '4:3':
      return 4 / 3;
    case '4:5':
      return 4 / 5;
    case '2:3':
      return 2 / 3;
    case '16:9':
      return 16 / 9;
    case 'custom':
      if (customWidth && customHeight && customHeight > 0) {
        return customWidth / customHeight;
      }
      return null;
    case 'free':
    default:
      return null;
  }
}

/**
 * Calculates a crop rect centered in (imgWidth, imgHeight) conforming to the target aspect ratio.
 */
export function calculateInitialCrop(
  imgWidth: number,
  imgHeight: number,
  aspectRatio: AspectRatio,
  customWidth?: number,
  customHeight?: number
): { x: number; y: number; width: number; height: number } {
  const targetRatio = getAspectRatioValue(aspectRatio, customWidth, customHeight);

  if (!targetRatio) {
    // Free crop - default to full image with 5% padding
    return {
      x: 0,
      y: 0,
      width: imgWidth,
      height: imgHeight,
    };
  }

  const imgRatio = imgWidth / imgHeight;
  let cropWidth = imgWidth;
  let cropHeight = imgHeight;

  if (imgRatio > targetRatio) {
    // Image is wider than desired ratio -> constrain by height
    cropHeight = imgHeight;
    cropWidth = Math.round(cropHeight * targetRatio);
  } else {
    // Image is taller than desired ratio -> constrain by width
    cropWidth = imgWidth;
    cropHeight = Math.round(cropWidth / targetRatio);
  }

  const x = Math.max(0, Math.round((imgWidth - cropWidth) / 2));
  const y = Math.max(0, Math.round((imgHeight - cropHeight) / 2));

  return {
    x,
    y,
    width: Math.min(cropWidth, imgWidth),
    height: Math.min(cropHeight, imgHeight),
  };
}

/**
 * Constrains a crop box inside bounds [0, 0, maxWidth, maxHeight] while enforcing aspect ratio if specified.
 */
export function constrainCropBox(
  box: { x: number; y: number; width: number; height: number },
  maxWidth: number,
  maxHeight: number,
  aspectRatio: AspectRatio,
  handle?: string // 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center'
): { x: number; y: number; width: number; height: number } {
  const ratio = getAspectRatioValue(aspectRatio);
  let { x, y, width, height } = box;

  // Enforce minimum size of 40x40
  const MIN_SIZE = 40;
  width = Math.max(MIN_SIZE, Math.min(width, maxWidth));
  height = Math.max(MIN_SIZE, Math.min(height, maxHeight));

  if (ratio) {
    if (width / height > ratio) {
      width = Math.round(height * ratio);
    } else {
      height = Math.round(width / ratio);
    }
  }

  // Ensure within bounds
  if (x < 0) x = 0;
  if (y < 0) y = 0;
  if (x + width > maxWidth) x = maxWidth - width;
  if (y + height > maxHeight) y = maxHeight - height;

  return {
    x: Math.round(Math.max(0, x)),
    y: Math.round(Math.max(0, y)),
    width: Math.round(width),
    height: Math.round(height),
  };
}
