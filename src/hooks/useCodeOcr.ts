import { useState, useCallback } from 'react';
import { preprocessCodeImage, PreprocessOptions } from '../engine/preprocessor';
import { runCodeOcr } from '../engine/ocrWorker';
import { sanitizeCodeSnippet, HeuristicOptions } from '../engine/codeHeuristics';
import { detectLanguage, DetectedLanguage } from '../engine/languageDetector';

export interface OcrProcessingResult {
  id: string;
  timestamp: number;
  originalImage: string;
  preprocessedImage: string;
  rawText: string;
  cleanCode: string;
  language: DetectedLanguage;
  processingTimeMs: number;
  isDarkTheme: boolean;
}

export function useCodeOcr() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [currentResult, setCurrentResult] = useState<OcrProcessingResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const processImage = useCallback(
    async (
      imageDataUrl: string,
      preprocessOptions: PreprocessOptions = {},
      heuristicOptions: HeuristicOptions = {}
    ): Promise<OcrProcessingResult | null> => {
      setIsProcessing(true);
      setProgress(0.05);
      setStatusText('Preprocessing screenshot (normalizing contrast & IDE theme)...');
      setError(null);

      const startTime = performance.now();

      try {
        // 1. Preprocess image
        const img = new Image();
        img.src = imageDataUrl;
        await new Promise((resolve, reject) => {
          img.onload = () => resolve(true);
          img.onerror = () => reject(new Error('Failed to load image for preprocessing'));
        });

        const preprocessed = await preprocessCodeImage(img, preprocessOptions);
        setProgress(0.25);
        setStatusText('Loading OCR neural worker & language model...');

        // 2. Run OCR with progress feedback
        const rawOcrText = await runCodeOcr(preprocessed.canvas, (workerProgress, status) => {
          // Map worker 0..1 to overall progress 0.25..0.85
          const mapped = 0.25 + workerProgress * 0.6;
          setProgress(Number(mapped.toFixed(2)));
          setStatusText(
            status === 'recognizing text'
              ? `Extracting code characters (${Math.round(workerProgress * 100)}%)...`
              : `Initializing OCR engine (${status})...`
          );
        });

        setProgress(0.9);
        setStatusText('Applying syntax heuristics & reconstructing indentation...');

        // 3. Post-process code heuristics
        const cleanCode = sanitizeCodeSnippet(rawOcrText, heuristicOptions);

        // 4. Auto-detect language
        const detectedLang = detectLanguage(cleanCode);

        const endTime = performance.now();
        const duration = Math.round(endTime - startTime);

        const result: OcrProcessingResult = {
          id: `snip-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          timestamp: Date.now(),
          originalImage: imageDataUrl,
          preprocessedImage: preprocessed.dataUrl,
          rawText: rawOcrText,
          cleanCode,
          language: detectedLang,
          processingTimeMs: duration,
          isDarkTheme: preprocessed.isDarkTheme,
        };

        setCurrentResult(result);
        setProgress(1.0);
        setStatusText('Complete');
        return result;
      } catch (err: any) {
        const msg = err.message || 'An error occurred during OCR recognition.';
        setError(msg);
        setStatusText('Failed');
        return null;
      } finally {
        setIsProcessing(false);
      }
    },
    []
  );

  return {
    isProcessing,
    progress,
    statusText,
    currentResult,
    setCurrentResult,
    error,
    processImage,
  };
}
