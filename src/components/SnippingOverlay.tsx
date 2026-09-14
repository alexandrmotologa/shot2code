import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Check, X, Crop, Move, Maximize2, Wand2 } from 'lucide-react';
import { detectCodeEditorBounds } from '../engine/autoCrop';

interface SelectionBox {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

interface SnippingOverlayProps {
  imageDataUrl: string;
  onConfirmCrop: (croppedDataUrl: string) => void;
  onCancel: () => void;
}

export const SnippingOverlay: React.FC<SnippingOverlayProps> = ({
  imageDataUrl,
  onConfirmCrop,
  onCancel,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selection, setSelection] = useState<SelectionBox | null>(null);
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  // Load natural dimensions
  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
  };

  const getRelativeCoords = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageRef.current) return { x: 0, y: 0 };
    const rect = imageRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));
    return { x, y };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return; // Only primary mouse button
    const { x, y } = getRelativeCoords(e);
    setIsDragging(true);
    setSelection({
      startX: x,
      startY: y,
      endX: x,
      endY: y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !selection) return;
    const { x, y } = getRelativeCoords(e);
    setSelection((prev) => (prev ? { ...prev, endX: x, endY: y } : null));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Keyboard controls (Esc to cancel, Enter to crop)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      } else if (e.key === 'Enter') {
        confirmSelection();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const getNormalizedBox = useCallback(() => {
    if (!selection) return null;
    const x = Math.min(selection.startX, selection.endX);
    const y = Math.min(selection.startY, selection.endY);
    const width = Math.abs(selection.endX - selection.startX);
    const height = Math.abs(selection.endY - selection.startY);
    return { x, y, width, height };
  }, [selection]);

  const confirmSelection = () => {
    if (!imageRef.current) return;
    const box = getNormalizedBox();

    // If selection is too small or nonexistent, use entire image
    if (!box || box.width < 10 || box.height < 10) {
      onConfirmCrop(imageDataUrl);
      return;
    }

    const rect = imageRef.current.getBoundingClientRect();
    const scaleX = naturalSize.width / rect.width;
    const scaleY = naturalSize.height / rect.height;

    const sourceX = Math.round(box.x * scaleX);
    const sourceY = Math.round(box.y * scaleY);
    const sourceWidth = Math.round(box.width * scaleX);
    const sourceHeight = Math.round(box.height * scaleY);

    const canvas = document.createElement('canvas');
    canvas.width = sourceWidth;
    canvas.height = sourceHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(
      imageRef.current,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      sourceWidth,
      sourceHeight
    );

    const cropped = canvas.toDataURL('image/png');
    onConfirmCrop(cropped);
  };

  const handleAutoDetectEditor = () => {
    if (!imageRef.current || naturalSize.width === 0) return;
    const canvas = document.createElement('canvas');
    canvas.width = naturalSize.width;
    canvas.height = naturalSize.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(imageRef.current, 0, 0);
    const bounds = detectCodeEditorBounds(canvas);

    const rect = imageRef.current.getBoundingClientRect();
    const scaleX = rect.width / naturalSize.width;
    const scaleY = rect.height / naturalSize.height;

    setSelection({
      startX: bounds.x * scaleX,
      startY: bounds.y * scaleY,
      endX: (bounds.x + bounds.width) * scaleX,
      endY: (bounds.y + bounds.height) * scaleY,
    });
  };

  const selectEntireImage = () => {
    onConfirmCrop(imageDataUrl);
  };

  const box = getNormalizedBox();

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-between p-4 select-none animate-fade-in"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Top Banner & Instructions */}
      <div className="w-full max-w-4xl flex items-center justify-between px-4 py-2 bg-slate-900/90 border border-slate-700/80 rounded-xl shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-brand-500/10 text-brand-400 rounded-lg">
            <Crop className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-slate-100">Select Code Area</h3>
            <p className="text-xs text-slate-400">Click and drag around the code or use smart auto-detect.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleAutoDetectEditor}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-brand-300 hover:text-brand-200 bg-brand-500/10 hover:bg-brand-500/20 rounded-lg transition-colors border border-brand-500/30"
          >
            <Wand2 className="w-3.5 h-3.5 text-brand-400" />
            Auto-Detect Editor
          </button>
          <button
            type="button"
            onClick={selectEntireImage}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            Full Image
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700"
          >
            <X className="w-3.5 h-3.5" />
            Cancel (Esc)
          </button>
          <button
            type="button"
            onClick={confirmSelection}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-slate-950 bg-brand-500 hover:bg-brand-400 rounded-lg shadow-glow-brand transition-all"
          >
            <Check className="w-3.5 h-3.5" />
            Parse Selection (Enter)
          </button>
        </div>
      </div>

      {/* Main Snipping Viewport */}
      <div className="relative flex-1 flex items-center justify-center w-full max-w-5xl my-4 overflow-hidden rounded-xl border border-slate-800 bg-slate-900/50">
        <div
          className="relative cursor-crosshair inline-block shadow-2xl"
          onMouseDown={handleMouseDown}
        >
          <img
            ref={imageRef}
            src={imageDataUrl}
            alt="Snip capture"
            onLoad={onImageLoad}
            className="max-h-[75vh] max-w-full block object-contain pointer-events-none rounded-lg"
          />

          {/* Semi-transparent dark overlay */}
          <div className="absolute inset-0 bg-slate-950/40 pointer-events-none" />

          {/* Selection Box */}
          {box && box.width > 2 && box.height > 2 && (
            <div
              className="absolute border-2 border-brand-400 bg-brand-500/10 shadow-lg pointer-events-none"
              style={{
                left: `${box.x}px`,
                top: `${box.y}px`,
                width: `${box.width}px`,
                height: `${box.height}px`,
              }}
            >
              {/* Corner crosshairs */}
              <span className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-brand-400 rounded-full border border-slate-950" />
              <span className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-brand-400 rounded-full border border-slate-950" />
              <span className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-brand-400 rounded-full border border-slate-950" />
              <span className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-brand-400 rounded-full border border-slate-950" />

              {/* Dimension pill */}
              <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-slate-950/90 text-brand-400 text-[11px] font-mono rounded border border-brand-500/40 shadow">
                {Math.round(box.width * (naturalSize.width / (imageRef.current?.clientWidth || 1)))} ×{' '}
                {Math.round(box.height * (naturalSize.height / (imageRef.current?.clientHeight || 1)))} px
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Hint */}
      <p className="text-xs text-slate-500 flex items-center gap-1.5">
        <Move className="w-3.5 h-3.5 text-slate-400" />
        Drag a box around the code text. Small brackets and colons are enhanced automatically.
      </p>
    </div>
  );
};
