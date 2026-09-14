import React, { useState, useRef, useMemo } from 'react';
import Prism from 'prismjs';
// Import essential languages for Prism
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-json';
import { ZoomIn, ZoomOut, Maximize, Eye, Image as ImageIcon, Code2 } from 'lucide-react';
import { DetectedLanguage } from '../engine/languageDetector';
import { detectAmbiguities, AmbiguityAlert } from '../engine/ambiguityDetector';
import { AmbiguityLens } from './AmbiguityLens';

interface DiffCorrectionViewProps {
  originalImage: string;
  preprocessedImage?: string;
  code: string;
  language: DetectedLanguage;
  onCodeChange: (newCode: string) => void;
  isDarkTheme?: boolean;
}

export const DiffCorrectionView: React.FC<DiffCorrectionViewProps> = ({
  originalImage,
  preprocessedImage,
  code,
  language,
  onCodeChange,
  isDarkTheme = true,
}) => {
  const [zoom, setZoom] = useState(1);
  const [showPreprocessed, setShowPreprocessed] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const codeEditorRef = useRef<HTMLTextAreaElement>(null);
  const highlightedRef = useRef<HTMLElement>(null);

  // Map language ID to Prism language grammar
  const getPrismLang = (id: string) => {
    switch (id) {
      case 'python':
        return Prism.languages.python;
      case 'typescript':
        return Prism.languages.typescript || Prism.languages.javascript;
      case 'javascript':
        return Prism.languages.javascript;
      case 'rust':
        return Prism.languages.rust;
      case 'go':
        return Prism.languages.go;
      case 'sql':
        return Prism.languages.sql;
      case 'bash':
        return Prism.languages.bash;
      case 'json':
        return Prism.languages.json;
      default:
        return Prism.languages.javascript;
    }
  };

  // Live syntax highlight
  const highlightedHtml = React.useMemo(() => {
    const grammar = getPrismLang(language.id);
    if (!grammar) return code;
    try {
      return Prism.highlight(code, grammar, language.id);
    } catch {
      return code;
    }
  }, [code, language.id]);

  const lines = code.split('\n');

  // Detect ambiguity alerts
  const alerts = useMemo(() => detectAmbiguities(code), [code]);

  const handleApplyFix = (alert: AmbiguityAlert) => {
    if (!alert.suggestedFix) return;
    const splitLines = code.split('\n');
    const lineIdx = alert.lineNumber - 1;
    if (lineIdx >= 0 && lineIdx < splitLines.length) {
      const line = splitLines[lineIdx];
      const before = line.slice(0, alert.columnStart);
      const after = line.slice(alert.columnEnd);
      splitLines[lineIdx] = before + alert.suggestedFix + after;
      onCodeChange(splitLines.join('\n'));
    }
  };

  const handleApplyAllFixes = () => {
    const sortedAlerts = [...alerts]
      .filter((a) => a.suggestedFix)
      .sort((a, b) => {
        if (b.lineNumber !== a.lineNumber) return b.lineNumber - a.lineNumber;
        return b.columnStart - a.columnStart;
      });

    const splitLines = code.split('\n');
    for (const alert of sortedAlerts) {
      const lineIdx = alert.lineNumber - 1;
      if (lineIdx >= 0 && lineIdx < splitLines.length && alert.suggestedFix) {
        const line = splitLines[lineIdx];
        const before = line.slice(0, alert.columnStart);
        const after = line.slice(alert.columnEnd);
        splitLines[lineIdx] = before + alert.suggestedFix + after;
      }
    }
    onCodeChange(splitLines.join('\n'));
  };

  const handleZoomIn = () => setZoom((prev) => Math.min(3, prev + 0.25));
  const handleZoomOut = () => setZoom((prev) => Math.max(0.75, prev - 0.25));
  const handleZoomReset = () => setZoom(1);

  return (
    <div className="space-y-4">
      {/* Ambiguity Alert Lens */}
      {alerts.length > 0 && (
        <AmbiguityLens
          alerts={alerts}
          onApplyFix={handleApplyFix}
          onApplyAllFixes={handleApplyAllFixes}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full min-h-[520px]">
        {/* LEFT: Cropped Screenshot Inspector */}
        <div className="flex flex-col rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-xl">
          {/* Panel Header */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-slate-950/70 border-b border-slate-800 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-brand-400" />
              <span className="font-semibold text-slate-200">Source Capture</span>
            {isDarkTheme && (
              <span className="px-1.5 py-0.5 text-[10px] bg-slate-800 text-slate-400 rounded">
                Dark IDE
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {preprocessedImage && (
              <button
                type="button"
                onClick={() => setShowPreprocessed(!showPreprocessed)}
                className={`px-2 py-1 rounded text-[11px] font-medium transition-colors border ${
                  showPreprocessed
                    ? 'bg-brand-500/20 text-brand-300 border-brand-500/40'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                }`}
                title="Toggle binarized OCR contrast view"
              >
                <Eye className="w-3 h-3 inline mr-1" />
                {showPreprocessed ? 'OCR View' : 'Original'}
              </button>
            )}

            <div className="h-3 w-[1px] bg-slate-800 mx-1" />

            <button
              type="button"
              onClick={handleZoomOut}
              className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
              title="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono text-slate-400 w-10 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={handleZoomIn}
              className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
              title="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleZoomReset}
              className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
              title="Reset zoom"
            >
              <Maximize className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Zoomable Image Canvas Container */}
        <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-950/40 relative select-none">
          <div
            className="transition-transform duration-100 ease-out origin-center inline-block max-w-full"
            style={{ transform: `scale(${zoom})` }}
          >
            <img
              src={showPreprocessed && preprocessedImage ? preprocessedImage : originalImage}
              alt="Source snippet crop"
              className="max-h-[460px] max-w-full rounded-lg border border-slate-800 shadow-2xl object-contain pointer-events-none"
            />
          </div>
        </div>

        {/* Bottom Inspector Hint */}
        <div className="px-4 py-2 bg-slate-950/60 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
          <span>Compare original characters against recognized text on the right</span>
          <span className="font-mono text-slate-400">{zoom > 1 ? 'Zoom active' : '100%'}</span>
        </div>
      </div>

      {/* RIGHT: Syntax-Highlighted & Editable Code Editor */}
      <div className="flex flex-col rounded-2xl bg-[#161b22] border border-slate-800 overflow-hidden shadow-xl">
        {/* Editor Top Bar */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#0d1117] border-b border-slate-800 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-accent-400" />
            <span className="font-semibold text-slate-200">Reconstructed Code</span>
            <span className="px-1.5 py-0.5 text-[10px] font-mono bg-slate-800 text-slate-400 rounded">
              {lines.length} lines
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors border ${
                isEditing
                  ? 'bg-accent-500/20 text-accent-300 border-accent-500/40'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
              }`}
            >
              {isEditing ? 'Editing Mode' : 'View Highlighting'}
            </button>
          </div>
        </div>

        {/* Code Content Area with Line Numbers Gutter */}
        <div className="flex-1 relative flex overflow-auto bg-[#0d1117] font-mono text-xs sm:text-sm">
          {/* Line Numbers Gutter */}
          <div className="select-none py-4 px-3 bg-[#090d13] text-slate-600 text-right border-r border-slate-800/80 min-w-[42px]">
            {lines.map((_, i) => (
              <div key={i} className="leading-6 font-mono text-[12px]">
                {i + 1}
              </div>
            ))}
          </div>

          {/* Code Text Area or Syntax Highlighting */}
          <div className="flex-1 relative p-4 overflow-x-auto">
            {isEditing ? (
              <textarea
                ref={codeEditorRef}
                value={code}
                onChange={(e) => onCodeChange(e.target.value)}
                spellCheck={false}
                className="w-full h-full min-h-[420px] bg-transparent text-slate-100 font-mono leading-6 resize-none focus:outline-none"
              />
            ) : (
              <pre className="m-0 p-0 bg-transparent overflow-visible">
                <code
                  ref={highlightedRef}
                  dangerouslySetInnerHTML={{ __html: highlightedHtml }}
                  className={`language-${language.id} leading-6 font-mono block`}
                />
              </pre>
            )}
          </div>
        </div>

        {/* Bottom Code Meta */}
        <div className="px-4 py-2 bg-[#090d13] border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-300">{language.name}</span>
            <span>•</span>
            <span>{code.length} characters</span>
          </div>
          <span className="text-[11px] text-slate-400">Click &quot;Editing Mode&quot; to make direct manual corrections</span>
        </div>
      </div>
    </div>
  </div>
  );
};
