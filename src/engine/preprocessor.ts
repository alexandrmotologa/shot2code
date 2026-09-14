/**
 * Image preprocessing pipeline optimized for code snippet OCR.
 * Normalizes IDE themes (inverts dark themes to dark-on-white text),
 * enhances character contrast, and upscales small punctuation.
 */

export interface PreprocessOptions {
  invertDarkTheme?: boolean;
  contrastBoost?: number; // 0.0 to 1.0
  scaleFactor?: number;   // default 2.0
  binarize?: boolean;     // adaptive thresholding
}

export interface PreprocessResult {
  canvas: HTMLCanvasElement;
  dataUrl: string;
  isDarkTheme: boolean;
  originalWidth: number;
  originalHeight: number;
}

/**
 * Calculates average background luminance using edge sampling.
 * Returns a value between 0 (pitch black) and 1 (pure white).
 */
export function calculateBackgroundLuminance(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): number {
  const sampleCount = 60;
  let totalLuminance = 0;
  let samples = 0;

  // Sample top, bottom, left, and right borders where background is most prevalent
  const coords: [number, number][] = [];

  for (let i = 0; i < sampleCount; i++) {
    const x = Math.floor((width * i) / sampleCount);
    coords.push([x, Math.min(height - 1, 4)]);
    coords.push([x, Math.max(0, height - 5)]);
  }

  for (let j = 0; j < sampleCount; j++) {
    const y = Math.floor((height * j) / sampleCount);
    coords.push([Math.min(width - 1, 4), y]);
    coords.push([Math.max(0, width - 5), y]);
  }

  for (const [x, y] of coords) {
    const pixel = ctx.getImageData(x, y, 1, 1).data;
    // Standard relative luminance formula (sRGB)
    const lum = (0.299 * pixel[0] + 0.587 * pixel[1] + 0.114 * pixel[2]) / 255;
    totalLuminance += lum;
    samples++;
  }

  return samples > 0 ? totalLuminance / samples : 0.5;
}

/**
 * Preprocesses an image element or blob for code OCR.
 */
export async function preprocessCodeImage(
  imageSource: HTMLImageElement | ImageBitmap | Blob,
  options: PreprocessOptions = {}
): Promise<PreprocessResult> {
  const {
    invertDarkTheme = true,
    contrastBoost = 0.3,
    scaleFactor = 2.0,
    binarize = false
  } = options;

  let img: HTMLImageElement | ImageBitmap;
  if (imageSource instanceof Blob) {
    img = await createImageBitmap(imageSource);
  } else {
    img = imageSource;
  }

  const origWidth = img.width;
  const origHeight = img.height;

  // 1. Initial measurement canvas
  const measureCanvas = document.createElement('canvas');
  measureCanvas.width = origWidth;
  measureCanvas.height = origHeight;
  const measureCtx = measureCanvas.getContext('2d');
  if (!measureCtx) throw new Error('Could not create canvas context');

  measureCtx.drawImage(img, 0, 0);
  const avgLuminance = calculateBackgroundLuminance(measureCtx, origWidth, origHeight);
  const isDarkTheme = avgLuminance < 0.5;

  // 2. High-resolution processing canvas (upscaled)
  const targetWidth = Math.round(origWidth * scaleFactor);
  const targetHeight = Math.round(origHeight * scaleFactor);

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not create output canvas context');

  // Bicubic smoothing for text clarity
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

  const imgData = ctx.getImageData(0, 0, targetWidth, targetHeight);
  const data = imgData.data;

  // Invert if dark theme
  const shouldInvert = isDarkTheme && invertDarkTheme;

  // Contrast factor calculation
  const factor = (259 * (contrastBoost * 255 + 255)) / (255 * (259 - contrastBoost * 255));

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    // Grayscale
    let gray = 0.299 * r + 0.587 * g + 0.114 * b;

    if (shouldInvert) {
      gray = 255 - gray;
    }

    // Apply contrast
    gray = factor * (gray - 128) + 128;
    gray = Math.max(0, Math.min(255, gray));

    if (binarize) {
      gray = gray > 140 ? 255 : 0;
    }

    data[i] = gray;
    data[i + 1] = gray;
    data[i + 2] = gray;
    // alpha data[i+3] untouched
  }

  ctx.putImageData(imgData, 0, 0);

  return {
    canvas,
    dataUrl: canvas.toDataURL('image/png'),
    isDarkTheme,
    originalWidth: origWidth,
    originalHeight: origHeight,
  };
}
