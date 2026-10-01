import type { ExportFormat, ExportQuality } from './types';

export function getMimeType(format: ExportFormat): string {
  switch (format) {
    case 'jpeg':
      return 'image/jpeg';
    case 'webp':
      return 'image/webp';
    case 'png':
    default:
      return 'image/png';
  }
}

export function getQualityFactor(quality: ExportQuality): number {
  switch (quality) {
    case 'standard':
      return 0.75;
    case 'high':
      return 0.90;
    case 'maximum':
      return 1.0;
  }
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Creates the final exported image canvas rescaled cleanly to target export dimensions
 */
export async function createExportBlob(
  sourceCanvas: HTMLCanvasElement,
  targetWidth: number,
  targetHeight: number,
  format: ExportFormat,
  quality: ExportQuality
): Promise<{ blob: Blob; url: string; size: number }> {
  // If target dimensions differ from current canvas, resample onto an export canvas
  let finalCanvas = sourceCanvas;

  if (targetWidth !== sourceCanvas.width || targetHeight !== sourceCanvas.height) {
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = targetWidth;
    exportCanvas.height = targetHeight;
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) throw new Error('Could not create export canvas context');

    // High quality scaling
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // If exporting to JPEG and background is transparent, fill with white (since JPEG has no alpha)
    if (format === 'jpeg') {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, targetWidth, targetHeight);
    }

    ctx.drawImage(sourceCanvas, 0, 0, targetWidth, targetHeight);
    finalCanvas = exportCanvas;
  } else if (format === 'jpeg') {
    // Check if background needs white fill for JPEG
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = targetWidth;
    exportCanvas.height = targetHeight;
    const ctx = exportCanvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, targetWidth, targetHeight);
      ctx.drawImage(sourceCanvas, 0, 0);
      finalCanvas = exportCanvas;
    }
  }

  const mimeType = getMimeType(format);
  const qualityFactor = getQualityFactor(quality);

  return new Promise((resolve, reject) => {
    finalCanvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Export failed to produce image data'));
          return;
        }
        const url = URL.createObjectURL(blob);
        resolve({
          blob,
          url,
          size: blob.size,
        });
      },
      mimeType,
      qualityFactor
    );
  });
}

/**
 * Triggers instant direct browser download without server hops
 */
export function triggerDownload(url: string, filename: string) {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
