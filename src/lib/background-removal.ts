/**
 * Client-Side Background Removal Module
 * Lazy-loads AI models only upon image processing to keep initial bundle tiny.
 * Includes resilient smart-matting fallback for zero failure tolerance.
 */

export interface SegmentationProgress {
  stage: string;
  progress: number; // 0 to 100
}

/**
 * Removes background from an image completely in the browser.
 */
export async function removeImageBackground(
  imageSource: File | Blob | string,
  onProgress?: (progress: SegmentationProgress) => void
): Promise<{ blob: Blob; image: HTMLImageElement; usedFallback: boolean }> {
  onProgress?.({ stage: 'Initializing AI model...', progress: 10 });

  try {
    // Dynamic import to ensure zero model code in initial bundle
    const imgly = await import('@imgly/background-removal');

    onProgress?.({ stage: 'Analyzing image subject...', progress: 30 });

    const blob = await imgly.removeBackground(imageSource, {
      progress: (key: string, current: number, total: number) => {
        const percent = total > 0 ? Math.min(95, Math.round(30 + (current / total) * 60)) : 50;
        const stageLabel = key.includes('fetch') 
          ? 'Loading AI segmentation neural net...' 
          : 'Isolating portrait subject...';
        onProgress?.({ stage: stageLabel, progress: percent });
      },
      debug: false,
    });

    onProgress?.({ stage: 'Finalizing transparency mask...', progress: 98 });

    const img = await blobToImage(blob);
    onProgress?.({ stage: 'Complete', progress: 100 });
    return { blob, image: img, usedFallback: false };
  } catch (err) {
    console.warn('AI model background removal encountered an issue, falling back to smart edge-matting:', err);
    onProgress?.({ stage: 'Applying high-contrast edge matting...', progress: 60 });

    // Fallback client-side edge matting
    const fallbackBlob = await clientSideFallbackMatting(imageSource);
    const img = await blobToImage(fallbackBlob);
    onProgress?.({ stage: 'Complete', progress: 100 });
    return { blob: fallbackBlob, image: img, usedFallback: true };
  }
}

/**
 * Converts a Blob to an HTMLImageElement
 */
export function blobToImage(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}

/**
 * Fallback client-side segmentation algorithm using edge contrast, corner sampling,
 * and adaptive color-distance matting on HTML5 Canvas.
 */
async function clientSideFallbackMatting(imageSource: File | Blob | string): Promise<Blob> {
  let img: HTMLImageElement;
  if (typeof imageSource === 'string') {
    img = await new Promise((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = rej;
      i.src = imageSource;
    });
  } else {
    img = await blobToImage(imageSource);
  }

  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  ctx.drawImage(img, 0, 0);
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;
  const width = canvas.width;
  const height = canvas.height;

  // Sample corner colors (top-left, top-right, bottom corners)
  const samplePoints = [
    [0, 0],
    [width - 1, 0],
    [0, Math.min(10, height - 1)],
    [width - 1, Math.min(10, height - 1)],
  ];

  let avgR = 0, avgG = 0, avgB = 0;
  for (const [x, y] of samplePoints) {
    const idx = (y * width + x) * 4;
    avgR += data[idx];
    avgG += data[idx + 1];
    avgB += data[idx + 2];
  }
  avgR /= samplePoints.length;
  avgG /= samplePoints.length;
  avgB /= samplePoints.length;

  const threshold = 45;
  const feather = 20;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const dist = Math.sqrt(
      Math.pow(r - avgR, 2) +
      Math.pow(g - avgG, 2) +
      Math.pow(b - avgB, 2)
    );

    if (dist < threshold) {
      data[i + 3] = 0; // transparent
    } else if (dist < threshold + feather) {
      const factor = (dist - threshold) / feather;
      data[i + 3] = Math.round(data[i + 3] * factor);
    }
  }

  ctx.putImageData(imgData, 0, 0);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Failed to generate fallback blob'));
    }, 'image/png');
  });
}
