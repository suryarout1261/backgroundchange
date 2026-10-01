import type { Adjustments, BackgroundConfig, CropState, SubjectShadow, SubjectTransform } from './types';

export const DEFAULT_ADJUSTMENTS: Adjustments = {
  brightness: 0,
  exposure: 0,
  contrast: 0,
  saturation: 0,
  vibrance: 0,
  temperature: 0,
  tint: 0,
  sharpness: 0,
  highlights: 0,
  shadows: 0,
  whites: 0,
  blacks: 0,
  hue: 0,
  blur: 0,
  clarity: 0,
};

export const DEFAULT_SUBJECT_TRANSFORM: SubjectTransform = {
  x: 0,
  y: 0,
  scale: 1,
  rotation: 0,
};

export const DEFAULT_SUBJECT_SHADOW: SubjectShadow = {
  enabled: false,
  color: '#000000',
  opacity: 35,
  blur: 15,
  offsetX: 0,
  offsetY: 8,
};

export interface RenderPipelineOptions {
  canvas: HTMLCanvasElement;
  sourceImage: HTMLImageElement; // isolated foreground subject
  originalFullImage?: HTMLImageElement | null; // for unsegmented fallback or before/after
  background: BackgroundConfig;
  adjustments: Adjustments;
  subjectTransform: SubjectTransform;
  subjectShadow: SubjectShadow;
  crop: CropState;
  showOriginalOnly?: boolean;
}

/**
 * Executes high-performance non-destructive 2D canvas composite rendering.
 */
export function renderCompositedImage(options: RenderPipelineOptions) {
  const {
    canvas,
    sourceImage,
    originalFullImage,
    background,
    adjustments,
    subjectTransform,
    subjectShadow,
    crop,
    showOriginalOnly = false,
  } = options;

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return;

  const targetWidth = crop.width || sourceImage.width;
  const targetHeight = crop.height || sourceImage.height;

  if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
    canvas.width = targetWidth;
    canvas.height = targetHeight;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // If showing original untouched image (for before comparison)
  if (showOriginalOnly && originalFullImage) {
    ctx.drawImage(originalFullImage, 0, 0, canvas.width, canvas.height);
    return;
  }

  // 1. Draw Background Layer
  if (background.type === 'color') {
    ctx.fillStyle = background.color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  } else if (background.type === 'image' && background.imageUrl) {
    // Render custom user background image
    drawBackgroundImage(ctx, canvas.width, canvas.height, background.imageUrl, background.imageFit || 'cover', background.imageBlur || 0);
  }
  // If 'transparent', canvas remains clear/transparent

  // 2. Setup transforms for crop & rotation
  ctx.save();

  // Apply flip and crop offsets
  // Translate to center for global rotation / flip
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  ctx.translate(centerX, centerY);

  if (crop.flipH) ctx.scale(-1, 1);
  if (crop.flipV) ctx.scale(1, -1);
  if (crop.rotation !== 0) {
    ctx.rotate((crop.rotation * Math.PI) / 180);
  }

  ctx.translate(-centerX, -centerY);

  // Shift for crop window
  ctx.translate(-crop.x, -crop.y);

  // 3. Draw Subject Layer with Transform & Shadow
  ctx.save();

  // Subject Center coordinates
  const subjCenterX = sourceImage.width / 2 + subjectTransform.x;
  const subjCenterY = sourceImage.height / 2 + subjectTransform.y;

  ctx.translate(subjCenterX, subjCenterY);
  if (subjectTransform.rotation !== 0) {
    ctx.rotate((subjectTransform.rotation * Math.PI) / 180);
  }
  if (subjectTransform.scale !== 1) {
    ctx.scale(subjectTransform.scale, subjectTransform.scale);
  }
  ctx.translate(-sourceImage.width / 2, -sourceImage.height / 2);

  // Apply Subject Shadow if enabled
  if (subjectShadow.enabled) {
    ctx.shadowColor = `rgba(0, 0, 0, ${subjectShadow.opacity / 100})`;
    ctx.shadowBlur = subjectShadow.blur;
    ctx.shadowOffsetX = subjectShadow.offsetX;
    ctx.shadowOffsetY = subjectShadow.offsetY;
  }

  // Draw subject
  ctx.drawImage(sourceImage, 0, 0);

  ctx.restore(); // restore subject transform
  ctx.restore(); // restore crop/flip transform

  // 4. Apply non-destructive color adjustments directly onto composite if any non-zero
  applyCanvasAdjustments(ctx, canvas, adjustments);
}

/**
 * Pixel-level color grading for Brightness, Exposure, Contrast, Saturation,
 * Vibrance, Temperature, Tint, and Sharpness.
 */
function applyCanvasAdjustments(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  adj: Adjustments
) {
  // Check if adjustments are all default
  const isDefault =
    adj.brightness === 0 &&
    adj.exposure === 0 &&
    adj.contrast === 0 &&
    adj.saturation === 0 &&
    adj.vibrance === 0 &&
    adj.temperature === 0 &&
    adj.tint === 0 &&
    adj.sharpness === 0 &&
    adj.highlights === 0 &&
    adj.shadows === 0 &&
    adj.whites === 0 &&
    adj.blacks === 0 &&
    adj.hue === 0 &&
    adj.blur === 0 &&
    adj.clarity === 0;

  if (isDefault) return;

  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;

  // Precomputed adjustment factors
  const brightnessOffset = adj.brightness * 1.5; // -150 to 150
  const exposureMult = Math.pow(2, adj.exposure / 50); // exposure in stops
  const contrastFactor = (259 * (adj.contrast + 255)) / (255 * (259 - adj.contrast));
  const satFactor = (adj.saturation + 100) / 100;
  const tempFactor = adj.temperature; // warm (more red, less blue) or cool
  const tintFactor = adj.tint; // magenta vs green
  const hueRad = (adj.hue * Math.PI) / 180;
  const cosHue = Math.cos(hueRad);
  const sinHue = Math.sin(hueRad);

  for (let i = 0; i < data.length; i += 4) {
    // Skip fully transparent pixels
    if (data[i + 3] === 0) continue;

    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    // Exposure
    if (adj.exposure !== 0) {
      r *= exposureMult;
      g *= exposureMult;
      b *= exposureMult;
    }

    // Brightness
    if (adj.brightness !== 0) {
      r += brightnessOffset;
      g += brightnessOffset;
      b += brightnessOffset;
    }

    // Contrast
    if (adj.contrast !== 0) {
      r = contrastFactor * (r - 128) + 128;
      g = contrastFactor * (g - 128) + 128;
      b = contrastFactor * (b - 128) + 128;
    }

    // Temperature & Tint
    if (tempFactor !== 0) {
      r += tempFactor * 0.6;
      b -= tempFactor * 0.6;
    }
    if (tintFactor !== 0) {
      g -= tintFactor * 0.4;
      r += tintFactor * 0.2;
      b += tintFactor * 0.2;
    }

    // Saturation
    if (satFactor !== 1) {
      const gray = 0.2989 * r + 0.587 * g + 0.114 * b;
      r = gray + satFactor * (r - gray);
      g = gray + satFactor * (g - gray);
      b = gray + satFactor * (b - gray);
    }

    // Vibrance (increases saturation of less-saturated colors more)
    if (adj.vibrance !== 0) {
      const max = Math.max(r, g, b);
      const avg = (r + g + b) / 3;
      const amt = ((Math.abs(max - avg) * 2) / 255) * (adj.vibrance / 100);
      r += (r - avg) * amt;
      g += (g - avg) * amt;
      b += (b - avg) * amt;
    }

    // Hue rotation
    if (adj.hue !== 0) {
      const newR = r * (0.299 + 0.701 * cosHue + 0.168 * sinHue) +
                   g * (0.587 - 0.587 * cosHue + 0.330 * sinHue) +
                   b * (0.114 - 0.114 * cosHue - 0.497 * sinHue);
      const newG = r * (0.299 - 0.299 * cosHue - 0.328 * sinHue) +
                   g * (0.587 + 0.413 * cosHue + 0.035 * sinHue) +
                   b * (0.114 - 0.114 * cosHue + 0.292 * sinHue);
      const newB = r * (0.299 - 0.300 * cosHue + 1.250 * sinHue) +
                   g * (0.587 - 0.588 * cosHue - 1.050 * sinHue) +
                   b * (0.114 + 0.886 * cosHue - 0.203 * sinHue);
      r = newR;
      g = newG;
      b = newB;
    }

    // Highlights & Shadows
    if (adj.highlights !== 0 || adj.shadows !== 0) {
      const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
      if (adj.highlights !== 0 && lum > 0.5) {
        const factor = ((lum - 0.5) * 2) * (adj.highlights / 100);
        r += r * factor * 0.5;
        g += g * factor * 0.5;
        b += b * factor * 0.5;
      }
      if (adj.shadows !== 0 && lum < 0.5) {
        const factor = ((0.5 - lum) * 2) * (adj.shadows / 100);
        r += (255 - r) * factor * 0.3;
        g += (255 - g) * factor * 0.3;
        b += (255 - b) * factor * 0.3;
      }
    }

    // Clamp
    data[i] = Math.max(0, Math.min(255, r));
    data[i + 1] = Math.max(0, Math.min(255, g));
    data[i + 2] = Math.max(0, Math.min(255, b));
  }

  // Sharpness convolution filter
  if (adj.sharpness > 0) {
    applySharpness(imgData, adj.sharpness / 100);
  }

  ctx.putImageData(imgData, 0, 0);
}

/**
 * 3x3 unsharp mask kernel for sharpness enhancement
 */
function applySharpness(imgData: ImageData, strength: number) {
  const w = imgData.width;
  const h = imgData.height;
  const src = new Uint8ClampedArray(imgData.data);
  const dst = imgData.data;

  const centerWeight = 1 + 4 * strength;
  const edgeWeight = -strength;

  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = (y * w + x) * 4;
      if (dst[idx + 3] === 0) continue; // transparent

      for (let c = 0; c < 3; c++) {
        const top = src[((y - 1) * w + x) * 4 + c];
        const bottom = src[((y + 1) * w + x) * 4 + c];
        const left = src[(y * w + (x - 1)) * 4 + c];
        const right = src[(y * w + (x + 1)) * 4 + c];
        const center = src[idx + c];

        const val = center * centerWeight + (top + bottom + left + right) * edgeWeight;
        dst[idx + c] = Math.max(0, Math.min(255, val));
      }
    }
  }
}

// In-memory cache for loaded background HTMLImageElements
const bgImageCache = new Map<string, HTMLImageElement>();

/**
 * Renders a user-uploaded background image fitted and optionally blurred onto canvas.
 */
function drawBackgroundImage(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  imageUrl: string,
  fit: 'cover' | 'contain' | 'fill' = 'cover',
  blur: number = 0
) {
  let img = bgImageCache.get(imageUrl);

  if (!img) {
    img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;
    bgImageCache.set(imageUrl, img);
  }

  // If image hasn't loaded yet, register onload to trigger redraw if possible
  if (!img.complete || img.naturalWidth === 0) {
    img.onload = () => {
      // Trigger canvas redraw once image loads
      ctx.save();
      if (blur > 0) ctx.filter = `blur(${blur}px)`;
      drawFittedImage(ctx, img!, canvasWidth, canvasHeight, fit);
      ctx.restore();
    };
    return;
  }

  ctx.save();
  if (blur > 0) {
    ctx.filter = `blur(${blur}px)`;
  }

  drawFittedImage(ctx, img, canvasWidth, canvasHeight, fit);
  ctx.restore();
}

/**
 * Draws an HTMLImageElement with specified fit mode (cover, contain, fill).
 */
function drawFittedImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  cw: number,
  ch: number,
  fit: 'cover' | 'contain' | 'fill'
) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;

  if (fit === 'fill') {
    ctx.drawImage(img, 0, 0, cw, ch);
    return;
  }

  const imgRatio = iw / ih;
  const canvasRatio = cw / ch;

  let dw = cw;
  let dh = ch;
  let dx = 0;
  let dy = 0;

  if (fit === 'cover') {
    if (imgRatio > canvasRatio) {
      dh = ch;
      dw = ch * imgRatio;
      dx = (cw - dw) / 2;
    } else {
      dw = cw;
      dh = cw / imgRatio;
      dy = (ch - dh) / 2;
    }
  } else if (fit === 'contain') {
    if (imgRatio > canvasRatio) {
      dw = cw;
      dh = cw / imgRatio;
      dy = (ch - dh) / 2;
    } else {
      dh = ch;
      dw = ch * imgRatio;
      dx = (cw - dw) / 2;
    }
  }

  ctx.drawImage(img, dx, dy, dw, dh);
}

