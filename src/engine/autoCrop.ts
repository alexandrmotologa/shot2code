/**
 * Smart Auto-Crop Engine for Code Screenshots.
 * Detects rectangular dark code editor / IDE bounding boxes
 * in full desktop captures, eliminating desktop taskbars and browser bezels.
 */

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function detectCodeEditorBounds(canvas: HTMLCanvasElement): BoundingBox {
  const width = canvas.width;
  const height = canvas.height;
  const ctx = canvas.getContext('2d');

  if (!ctx || width < 50 || height < 50) {
    return { x: 0, y: 0, width, height };
  }

  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  // Helper to get pixel luminance
  const getLum = (x: number, y: number) => {
    const idx = (y * width + x) * 4;
    return (0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2]) / 255;
  };

  // 1. Calculate row and column dark pixel density
  // Dark pixel is defined as luminance < 0.28 (common in dark IDE themes)
  const rowDarkRatio: number[] = new Array(height).fill(0);
  const colDarkRatio: number[] = new Array(width).fill(0);

  const stepX = Math.max(1, Math.floor(width / 120));
  const stepY = Math.max(1, Math.floor(height / 120));

  for (let y = 0; y < height; y += stepY) {
    let darkCount = 0;
    let samples = 0;
    for (let x = 0; x < width; x += stepX) {
      if (getLum(x, y) < 0.28) darkCount++;
      samples++;
    }
    rowDarkRatio[y] = samples > 0 ? darkCount / samples : 0;
  }

  for (let x = 0; x < width; x += stepX) {
    let darkCount = 0;
    let samples = 0;
    for (let y = 0; y < height; y += stepY) {
      if (getLum(x, y) < 0.28) darkCount++;
      samples++;
    }
    colDarkRatio[x] = samples > 0 ? darkCount / samples : 0;
  }

  // 2. Find continuous dark region (editor viewport)
  let minY = 0;
  let maxY = height;
  let minX = 0;
  let maxX = width;

  // Scan top-down for row with > 40% dark pixels
  for (let y = 0; y < height; y += stepY) {
    if (rowDarkRatio[y] > 0.4) {
      minY = Math.max(0, y - stepY);
      break;
    }
  }

  // Scan bottom-up
  for (let y = height - stepY; y >= 0; y -= stepY) {
    if (rowDarkRatio[y] > 0.4) {
      maxY = Math.min(height, y + stepY);
      break;
    }
  }

  // Scan left-to-right
  for (let x = 0; x < width; x += stepX) {
    if (colDarkRatio[x] > 0.4) {
      minX = Math.max(0, x - stepX);
      break;
    }
  }

  // Scan right-to-left
  for (let x = width - stepX; x >= 0; x -= stepX) {
    if (colDarkRatio[x] > 0.4) {
      maxX = Math.min(width, x + stepX);
      break;
    }
  }

  const detectedW = maxX - minX;
  const detectedH = maxY - minY;

  // If detected box occupies at least 25% of the total screen, consider it valid
  if (detectedW > width * 0.3 && detectedH > height * 0.25) {
    return {
      x: minX,
      y: minY,
      width: detectedW,
      height: detectedH,
    };
  }

  return { x: 0, y: 0, width, height };
}
