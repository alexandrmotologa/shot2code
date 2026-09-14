import { useState, useEffect, useCallback } from 'react';

export interface SnipImageSource {
  dataUrl: string;
  sourceType: 'screen_capture' | 'clipboard' | 'file_upload' | 'sample';
  label?: string;
}

export function useScreenSnip() {
  const [capturedImage, setCapturedImage] = useState<SnipImageSource | null>(null);
  const [isCapturingScreen, setIsCapturingScreen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  /**
   * Captures the entire screen or active window via getDisplayMedia,
   * rendering the current video frame into a high-res image.
   */
  const captureFromScreen = useCallback(async (): Promise<string | null> => {
    setIsCapturingScreen(true);
    setErrorMessage(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        throw new Error('Screen Capture API is not supported in this browser environment.');
      }

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: 'monitor',
        },
        audio: false,
      });

      const video = document.createElement('video');
      video.srcObject = stream;
      await video.play();

      // Wait a moment for the frame to render
      await new Promise((resolve) => setTimeout(resolve, 150));

      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas 2D context');

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Stop all tracks immediately
      stream.getTracks().forEach((track) => track.stop());

      const dataUrl = canvas.toDataURL('image/png');
      const result: SnipImageSource = {
        dataUrl,
        sourceType: 'screen_capture',
        label: 'Screen Snip',
      };
      setCapturedImage(result);
      return dataUrl;
    } catch (err: any) {
      if (err.name !== 'NotAllowedError') {
        setErrorMessage(err.message || 'Failed to capture screen.');
      }
      return null;
    } finally {
      setIsCapturingScreen(false);
    }
  }, []);

  /**
   * Loads an image from a file object.
   */
  const loadImageFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Selected file must be an image.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) {
        setCapturedImage({
          dataUrl,
          sourceType: 'file_upload',
          label: file.name,
        });
        setErrorMessage(null);
      }
    };
    reader.onerror = () => setErrorMessage('Error reading image file.');
    reader.readAsDataURL(file);
  }, []);

  /**
   * Loads a pre-bundled sample image.
   */
  const loadSample = useCallback(async (samplePath: string, label: string) => {
    try {
      const response = await fetch(samplePath);
      const blob = await response.blob();
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setCapturedImage({
          dataUrl,
          sourceType: 'sample',
          label,
        });
        setErrorMessage(null);
      };
      reader.readAsDataURL(blob);
    } catch (err: any) {
      setErrorMessage(`Failed to load sample image: ${err.message}`);
    }
  }, []);

  /**
   * Direct global clipboard paste listener (Ctrl+V / Cmd+V).
   */
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.indexOf('image') !== -1) {
          const file = item.getAsFile();
          if (file) {
            e.preventDefault();
            loadImageFile(file);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [loadImageFile]);

  return {
    capturedImage,
    setCapturedImage,
    isCapturingScreen,
    errorMessage,
    captureFromScreen,
    loadImageFile,
    loadSample,
  };
}
