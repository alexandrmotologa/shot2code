import { createWorker, Worker } from 'tesseract.js';

export interface OcrProgressCallback {
  (progress: number, status: string): void;
}

let activeWorker: Worker | null = null;
let initPromise: Promise<Worker> | null = null;

/**
 * Initializes and caches the singleton Tesseract WebAssembly worker.
 * Configures monospace code character whitelisting and page segmentation.
 */
export async function getInitializedWorker(onProgress?: OcrProgressCallback): Promise<Worker> {
  if (activeWorker) {
    return activeWorker;
  }

  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    try {
      const worker = await createWorker('eng', 1, {
        logger: (m) => {
          if (onProgress && typeof m.progress === 'number') {
            onProgress(m.progress, m.status || 'processing');
          }
        },
      });

      // PSM 6: Assume a single uniform block of text (ideal for code blocks)
      await worker.setParameters({
        tessedit_pageseg_mode: '6' as any,
        tessedit_char_whitelist:
          'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789{}()[]<>:;.,=+-*/%&|^!~?\'" `\t\n_#$@\\',
      });

      activeWorker = worker;
      return worker;
    } catch (err) {
      initPromise = null;
      throw err;
    }
  })();

  return initPromise;
}

/**
 * Performs OCR recognition on an image source (canvas, data URL, blob, or image element).
 */
export async function runCodeOcr(
  imageSource: string | HTMLCanvasElement | Blob,
  onProgress?: OcrProgressCallback
): Promise<string> {
  const worker = await getInitializedWorker(onProgress);
  const result = await worker.recognize(imageSource);
  return result.data.text || '';
}

/**
 * Terminates the OCR worker to free WebAssembly memory when needed.
 */
export async function terminateOcrWorker(): Promise<void> {
  if (activeWorker) {
    await activeWorker.terminate();
    activeWorker = null;
    initPromise = null;
  }
}
