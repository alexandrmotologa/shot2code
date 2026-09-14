import React, { useState } from 'react';
import {
  Copy,
  Check,
  Download,
  FileCode,
  RefreshCw,
  Space,
  Wand2,
  Share2,
  ChevronDown,
  Sparkles,
  Scissors,
} from 'lucide-react';
import { DetectedLanguage } from '../engine/languageDetector';
import { CasingStyle } from '../engine/codeFormatter';

interface ActionToolbarProps {
  code: string;
  language: DetectedLanguage;
  onReconstructIndent: (indentSize: 2 | 4) => void;
  onFormatCode: () => void;
  onChangeCasing: (targetCase: CasingStyle) => void;
  onStripComments: () => void;
  onAiPolish?: () => void;
  isAiEnabled?: boolean;
  isAiLoading?: boolean;
  onOpenExport: () => void;
  onRerunOcr: () => void;
  isProcessing: boolean;
}

export const ActionToolbar: React.FC<ActionToolbarProps> = ({
  code,
  language,
  onReconstructIndent,
  onFormatCode,
  onChangeCasing,
  onStripComments,
  onAiPolish,
  isAiEnabled = false,
  isAiLoading = false,
  onOpenExport,
  onRerunOcr,
  isProcessing,
}) => {
  const [copiedRaw, setCopiedRaw] = useState(false);
  const [copiedMarkdown, setCopiedMarkdown] = useState(false);
  const [currentIndent, setCurrentIndent] = useState<2 | 4>(2);
  const [isCasingOpen, setIsCasingOpen] = useState(false);

  const handleCopyRaw = async () => {
    if (!code) return;
    await navigator.clipboard.writeText(code);
    setCopiedRaw(true);
    setTimeout(() => setCopiedRaw(false), 2000);
  };

  const handleCopyMarkdown = async () => {
    if (!code) return;
    const langId = language.id === 'plaintext' ? '' : language.id;
    const markdown = `\`\`\`${langId}\n${code}\n\`\`\``;
    await navigator.clipboard.writeText(markdown);
    setCopiedMarkdown(true);
    setTimeout(() => setCopiedMarkdown(false), 2000);
  };

  const handleDownload = () => {
    if (!code) return;
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `snippet_${Date.now()}.${language.fileExtension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const toggleIndent = () => {
    const nextSize = currentIndent === 2 ? 4 : 2;
    setCurrentIndent(nextSize);
    onReconstructIndent(nextSize);
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
      {/* 1-Tap Copy Raw */}
      <button
        type="button"
        onClick={handleCopyRaw}
        disabled={!code || isProcessing}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-500 hover:bg-brand-400 active:scale-95 disabled:opacity-50 text-slate-950 rounded-lg text-xs font-semibold shadow-glow-brand transition-all"
        title="Copy clean code to clipboard"
      >
        {copiedRaw ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
        <span>{copiedRaw ? 'Copied!' : 'Copy Code'}</span>
      </button>

      {/* Copy Markdown Codeblock */}
      <button
        type="button"
        onClick={handleCopyMarkdown}
        disabled={!code || isProcessing}
        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 active:scale-95 disabled:opacity-50 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition-all"
        title="Copy as formatted Markdown codeblock"
      >
        {copiedMarkdown ? <Check className="w-3.5 h-3.5 text-brand-400" /> : <FileCode className="w-3.5 h-3.5" />}
        <span className="hidden sm:inline">{copiedMarkdown ? 'Copied!' : 'Markdown'}</span>
      </button>

      {/* Format Code */}
      <button
        type="button"
        onClick={onFormatCode}
        disabled={!code || isProcessing}
        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition-all"
        title="Auto-format code syntax and operator spacing"
      >
        <Wand2 className="w-3.5 h-3.5 text-accent-400" />
        <span className="hidden sm:inline">Format</span>
      </button>

      {/* Case Converter Dropdown */}
      <div className="relative inline-block">
        <button
          type="button"
          onClick={() => setIsCasingOpen(!isCasingOpen)}
          disabled={!code || isProcessing}
          className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium border border-slate-700 transition-all"
          title="Convert variable identifier casing"
        >
          <span>Case</span>
          <ChevronDown className="w-3 h-3 text-slate-400" />
        </button>

        {isCasingOpen && (
          <div className="absolute left-0 mt-1.5 w-36 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl z-40 py-1 text-xs animate-fade-in">
            <button
              type="button"
              onClick={() => {
                onChangeCasing('camel');
                setIsCasingOpen(false);
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-slate-300 font-mono text-[11px]"
            >
              camelCase
            </button>
            <button
              type="button"
              onClick={() => {
                onChangeCasing('snake');
                setIsCasingOpen(false);
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-slate-300 font-mono text-[11px]"
            >
              snake_case
            </button>
            <button
              type="button"
              onClick={() => {
                onChangeCasing('pascal');
                setIsCasingOpen(false);
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-slate-300 font-mono text-[11px]"
            >
              PascalCase
            </button>
            <button
              type="button"
              onClick={() => {
                onChangeCasing('constant');
                setIsCasingOpen(false);
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-slate-300 font-mono text-[11px]"
            >
              CONSTANT_CASE
            </button>
          </div>
        )}
      </div>

      {/* Strip Comments */}
      <button
        type="button"
        onClick={onStripComments}
        disabled={!code || isProcessing}
        className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs border border-slate-700 transition-all"
        title="Remove comments from snippet"
      >
        <Scissors className="w-3.5 h-3.5 text-slate-400" />
        <span className="hidden md:inline">No Comments</span>
      </button>

      {/* AI Polish Button (if enabled) */}
      {isAiEnabled && onAiPolish && (
        <button
          type="button"
          onClick={onAiPolish}
          disabled={!code || isProcessing || isAiLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-accent-500/20 hover:bg-accent-500/30 text-accent-300 rounded-lg text-xs font-semibold border border-accent-500/40 transition-all shadow"
          title="Polish with AI syntax repair"
        >
          <Sparkles className={`w-3.5 h-3.5 ${isAiLoading ? 'animate-spin' : ''}`} />
          <span>{isAiLoading ? 'Polishing...' : 'AI Polish'}</span>
        </button>
      )}

      {/* Indentation Toggle */}
      <button
        type="button"
        onClick={toggleIndent}
        disabled={!code || isProcessing}
        className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg text-xs font-mono border border-slate-700/80 transition-all"
        title="Toggle indentation between 2 and 4 spaces"
      >
        <Space className="w-3.5 h-3.5 text-slate-400" />
        <span>{currentIndent}sp</span>
      </button>

      {/* Share / Export Modal Trigger */}
      <button
        type="button"
        onClick={onOpenExport}
        disabled={!code || isProcessing}
        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition-all"
        title="Export to GitHub Gist, Ray.so, or download"
      >
        <Share2 className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Export</span>
      </button>

      {/* Download File */}
      <button
        type="button"
        onClick={handleDownload}
        disabled={!code || isProcessing}
        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition-all"
        title={`Download .${language.fileExtension}`}
      >
        <Download className="w-3.5 h-3.5" />
      </button>

      {/* Re-run OCR */}
      <button
        type="button"
        onClick={onRerunOcr}
        disabled={isProcessing}
        className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg border border-slate-700/80 transition-all"
        title="Reprocess OCR"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
      </button>
    </div>
  );
};
