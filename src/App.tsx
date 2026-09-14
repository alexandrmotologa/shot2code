import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Camera,
  Upload,
  History as HistoryIcon,
  Github,
  Crop,
  Sparkles,
  Zap,
  ShieldCheck,
  Code2,
  AlertTriangle,
  ClipboardPaste,
  Sliders,
  Check,
} from 'lucide-react';
import { useScreenSnip } from './hooks/useScreenSnip';
import { useCodeOcr, OcrProcessingResult } from './hooks/useCodeOcr';
import { SnippingOverlay } from './components/SnippingOverlay';
import { DiffCorrectionView } from './components/DiffCorrectionView';
import { ActionToolbar } from './components/ActionToolbar';
import { LanguageBadgeSelector } from './components/LanguageBadgeSelector';
import { HistorySidebar } from './components/HistorySidebar';
import { SampleGallery, SampleItem } from './components/SampleGallery';
import { TabBar, SnippetTab } from './components/TabBar';
import { SettingsModal, AppSettings, DEFAULT_SETTINGS } from './components/SettingsModal';
import { ExportModal } from './components/ExportModal';
import { sanitizeCodeSnippet } from './engine/codeHeuristics';
import { formatCode, transformSnippetCasing, stripComments, CasingStyle } from './engine/codeFormatter';
import { polishCodeWithAi } from './engine/aiPolish';
import { DetectedLanguage } from './engine/languageDetector';

export const App: React.FC = () => {
  const {
    capturedImage,
    setCapturedImage,
    isCapturingScreen,
    errorMessage: snipError,
    captureFromScreen,
    loadImageFile,
    loadSample,
  } = useScreenSnip();

  const {
    isProcessing,
    progress,
    statusText,
    currentResult,
    setCurrentResult,
    error: ocrError,
    processImage,
  } = useCodeOcr();

  // App Settings with LocalStorage persistence
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('shot2code_settings');
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const [history, setHistory] = useState<OcrProcessingResult[]>(() => {
    try {
      const saved = localStorage.getItem('shot2code_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Multi-Snippet Tabs state
  const [tabs, setTabs] = useState<SnippetTab[]>([
    { id: 'tab-1', title: 'Snippet 1', result: null },
  ]);
  const [activeTabId, setActiveTabId] = useState<string>('tab-1');

  // Modals state
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [showCropModal, setShowCropModal] = useState(false);
  const [rawCaptureDataUrl, setRawCaptureDataUrl] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [autoCopyNotice, setAutoCopyNotice] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Play subtle synthesis chime upon successful completion
  const playSuccessChime = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch {
      // Audio context may be restricted by browser policy before user interaction
    }
  }, []);

  // Save history to localStorage
  const saveToHistory = useCallback((newResult: OcrProcessingResult) => {
    setHistory((prev) => {
      const updated = [newResult, ...prev.filter((p) => p.id !== newResult.id)].slice(0, 50);
      try {
        localStorage.setItem('shot2code_history', JSON.stringify(updated));
      } catch (err) {
        console.warn('LocalStorage quota reached for history', err);
      }
      return updated;
    });
  }, []);

  // Save settings
  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    localStorage.setItem('shot2code_settings', JSON.stringify(newSettings));
  };

  // Sync currentResult with activeTab
  useEffect(() => {
    if (currentResult) {
      setTabs((prev) =>
        prev.map((t) => (t.id === activeTabId ? { ...t, result: currentResult } : t))
      );
    }
  }, [currentResult, activeTabId]);

  // Trigger processing when an image is ready
  const handleStartProcessing = useCallback(
    async (imageDataUrl: string) => {
      const result = await processImage(imageDataUrl, {}, { targetIndentSize: settings.defaultIndent });
      if (result) {
        saveToHistory(result);
        playSuccessChime();

        // Check if Auto-Copy is active
        if (settings.autoCopyOnParse) {
          navigator.clipboard.writeText(result.cleanCode).then(() => {
            setAutoCopyNotice(true);
            setTimeout(() => setAutoCopyNotice(false), 2500);
          });
        }
      }
    },
    [processImage, saveToHistory, playSuccessChime, settings.defaultIndent, settings.autoCopyOnParse]
  );

  // When an image is captured from screen, open crop tool first
  const handleScreenCapture = async () => {
    const dataUrl = await captureFromScreen();
    if (dataUrl) {
      setRawCaptureDataUrl(dataUrl);
      setShowCropModal(true);
    }
  };

  // Crop modal confirmed
  const handleConfirmCrop = (croppedDataUrl: string) => {
    setShowCropModal(false);
    setRawCaptureDataUrl(null);
    handleStartProcessing(croppedDataUrl);
  };

  // Drag and drop handlers
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      loadImageFile(file);
    }
  };

  // When capturedImage is updated from file or sample
  useEffect(() => {
    if (capturedImage && capturedImage.sourceType !== 'screen_capture') {
      handleStartProcessing(capturedImage.dataUrl);
    }
  }, [capturedImage, handleStartProcessing]);

  // Sample selected from gallery
  const handleSelectSample = (sample: SampleItem) => {
    loadSample(sample.path, sample.title);
  };

  // Update code content directly from editor
  const handleCodeChange = (newCode: string) => {
    if (!currentResult) return;
    const updated = { ...currentResult, cleanCode: newCode };
    setCurrentResult(updated);
  };

  // Override language
  const handleLanguageChange = (newLang: DetectedLanguage) => {
    if (!currentResult) return;
    const updated = { ...currentResult, language: newLang };
    setCurrentResult(updated);
  };

  // In-browser Formatter
  const handleFormatCode = () => {
    if (!currentResult) return;
    const formatted = formatCode(currentResult.cleanCode, currentResult.language.id, settings.defaultIndent);
    handleCodeChange(formatted);
  };

  // Casing Transformer
  const handleChangeCasing = (targetCase: CasingStyle) => {
    if (!currentResult) return;
    const transformed = transformSnippetCasing(currentResult.cleanCode, targetCase);
    handleCodeChange(transformed);
  };

  // Strip Comments
  const handleStripComments = () => {
    if (!currentResult) return;
    const stripped = stripComments(currentResult.cleanCode, currentResult.language.id);
    handleCodeChange(stripped);
  };

  // AI Polish
  const handleAiPolish = async () => {
    if (!currentResult || !settings.aiPolish.enabled) return;
    setIsAiLoading(true);
    try {
      const polished = await polishCodeWithAi(
        currentResult.cleanCode,
        currentResult.language.id,
        settings.aiPolish
      );
      handleCodeChange(polished);
    } catch (err: any) {
      alert(`AI Polish error: ${err.message}`);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Re-run heuristics with new indent size
  const handleReconstructIndent = (indentSize: 2 | 4) => {
    if (!currentResult) return;
    const reindented = sanitizeCodeSnippet(currentResult.rawText, {
      targetIndentSize: indentSize,
    });
    handleCodeChange(reindented);
  };

  // Re-run OCR
  const handleRerunOcr = () => {
    if (currentResult) {
      handleStartProcessing(currentResult.originalImage);
    }
  };

  // Tabs management
  const handleSelectTab = (tabId: string) => {
    setActiveTabId(tabId);
    const target = tabs.find((t) => t.id === tabId);
    setCurrentResult(target?.result || null);
  };

  const handleNewTab = () => {
    const newId = `tab-${Date.now()}`;
    const newTitle = `Snippet ${tabs.length + 1}`;
    const newTab: SnippetTab = { id: newId, title: newTitle, result: null };
    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(newId);
    setCurrentResult(null);
    setCapturedImage(null);
  };

  const handleCloseTab = (tabId: string) => {
    if (tabs.length === 1) return;
    const nextTabs = tabs.filter((t) => t.id !== tabId);
    setTabs(nextTabs);
    if (activeTabId === tabId) {
      const fallback = nextTabs[0];
      setActiveTabId(fallback.id);
      setCurrentResult(fallback.result);
    }
  };

  const handleMergeTabs = () => {
    const tabsWithContent = tabs.filter((t) => t.result && t.result.cleanCode.trim().length > 0);
    if (tabsWithContent.length === 0) return;

    const mergedCode = tabsWithContent
      .map((t) => `// ==========================================\n// ${t.title} (${t.result?.language.name || 'Code'})\n// ==========================================\n\n${t.result?.cleanCode}\n`)
      .join('\n\n');

    const primaryResult = tabsWithContent[0].result!;
    const mergedResult: OcrProcessingResult = {
      ...primaryResult,
      id: `merged-${Date.now()}`,
      cleanCode: mergedCode.trim(),
    };

    const mergedTabId = `tab-merged-${Date.now()}`;
    const mergedTab: SnippetTab = {
      id: mergedTabId,
      title: `Merged (${tabsWithContent.length})`,
      result: mergedResult,
    };

    setTabs((prev) => [...prev, mergedTab]);
    setActiveTabId(mergedTabId);
    setCurrentResult(mergedResult);
  };

  // History management
  const handleDeleteHistoryItem = (id: string) => {
    setHistory((prev) => {
      const updated = prev.filter((h) => h.id !== id);
      localStorage.setItem('shot2code_history', JSON.stringify(updated));
      return updated;
    });
  };

  const handleClearAllHistory = () => {
    setHistory([]);
    localStorage.removeItem('shot2code_history');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-brand-500/30 selection:text-brand-400">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 bg-slate-950/85 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-8 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-700/80 flex items-center justify-center p-1.5 shadow-lg shadow-brand-500/10">
            <img src="/logo.svg" alt="Shot2Code Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight text-white">Shot2Code</span>
              <span className="px-1.5 py-0.2 text-[10px] font-semibold bg-brand-500/10 text-brand-400 border border-brand-500/20 rounded">
                v1.2 Studio
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Intelligent Code Snip &amp; OCR Studio
            </p>
          </div>
        </div>

        {/* Global Nav Actions */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Capture Screen Button */}
          <button
            type="button"
            onClick={handleScreenCapture}
            disabled={isCapturingScreen || isProcessing}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 bg-brand-500 hover:bg-brand-400 text-slate-950 rounded-lg text-xs font-semibold shadow-glow-brand transition-all disabled:opacity-50"
          >
            <Camera className="w-4 h-4" />
            <span>Capture Screen</span>
          </button>

          {/* Upload Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium transition-all"
          >
            <Upload className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Upload</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => e.target.files?.[0] && loadImageFile(e.target.files[0])}
            accept="image/*"
            className="hidden"
          />

          {/* Settings Button */}
          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-lg transition-all"
            title="Settings &amp; AI Config"
          >
            <Sliders className="w-4 h-4" />
          </button>

          {/* History Drawer Toggle */}
          <button
            type="button"
            onClick={() => setIsHistoryOpen(true)}
            className="relative p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-lg transition-all"
            title="Open History"
          >
            <HistoryIcon className="w-4 h-4" />
            {history.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-brand-500 text-slate-950 text-[10px] font-bold rounded-full flex items-center justify-center">
                {history.length > 9 ? '9+' : history.length}
              </span>
            )}
          </button>

          {/* GitHub Repository */}
          <a
            href="https://github.com/alexandrmotologa/shot2code"
            target="_blank"
            rel="noreferrer"
            className="p-2 text-slate-400 hover:text-white rounded-lg transition-colors"
            title="View Source on GitHub"
          >
            <Github className="w-4 h-4" />
          </a>
        </div>
      </header>

      {/* Auto-Copy Toast Notification */}
      {autoCopyNotice && (
        <div className="fixed top-16 right-6 z-50 flex items-center gap-2 px-4 py-2.5 bg-brand-500 text-slate-950 font-semibold text-xs rounded-xl shadow-2xl animate-fade-in">
          <Check className="w-4 h-4" />
          <span>Clean code automatically copied to clipboard!</span>
        </div>
      )}

      {/* Multi-Snippet Workspace TabBar */}
      <TabBar
        tabs={tabs}
        activeTabId={activeTabId}
        onSelectTab={handleSelectTab}
        onNewTab={handleNewTab}
        onCloseTab={handleCloseTab}
        onMergeTabs={handleMergeTabs}
      />

      {/* Main Studio Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Error Notification Alert */}
        {(snipError || ocrError) && (
          <div className="p-4 bg-red-950/40 border border-red-800/80 rounded-xl flex items-center gap-3 text-red-200 text-xs">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <div className="flex-1">{snipError || ocrError}</div>
          </div>
        )}

        {/* OCR Processing Progress */}
        {isProcessing && (
          <div className="p-6 bg-slate-900/90 border border-brand-500/30 rounded-2xl shadow-glow-brand space-y-3 animate-fade-in">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-brand-400 font-medium">
                <Sparkles className="w-4 h-4 animate-spin" />
                <span>{statusText}</span>
              </div>
              <span className="font-mono text-slate-400">{Math.round(progress * 100)}%</span>
            </div>

            {/* Track */}
            <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-brand-500 to-accent-400 transition-all duration-300 rounded-full"
                style={{ width: `${Math.max(5, progress * 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Dynamic State 1: Active Extracted Code Result View */}
        {currentResult && !isProcessing ? (
          <div className="space-y-4 animate-fade-in">
            {/* Action Bar Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-900/90 border border-slate-800 rounded-xl shadow-lg">
              <div className="flex items-center gap-3">
                <LanguageBadgeSelector
                  language={currentResult.language}
                  onLanguageChange={handleLanguageChange}
                />
                <span className="text-xs text-slate-500 font-mono hidden sm:inline">
                  {currentResult.processingTimeMs}ms
                </span>
              </div>

              <div className="flex items-center gap-2">
                <ActionToolbar
                  code={currentResult.cleanCode}
                  language={currentResult.language}
                  onReconstructIndent={handleReconstructIndent}
                  onFormatCode={handleFormatCode}
                  onChangeCasing={handleChangeCasing}
                  onStripComments={handleStripComments}
                  onAiPolish={handleAiPolish}
                  isAiEnabled={settings.aiPolish.enabled}
                  isAiLoading={isAiLoading}
                  onOpenExport={() => setIsExportOpen(true)}
                  onRerunOcr={handleRerunOcr}
                  isProcessing={isProcessing}
                />

                <div className="h-4 w-[1px] bg-slate-800 hidden sm:block" />

                <button
                  type="button"
                  onClick={() => {
                    setCurrentResult(null);
                    setCapturedImage(null);
                  }}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
                >
                  New Snip
                </button>
              </div>
            </div>

            {/* Split Inspection & Diff Correction View with Ambiguity Lens */}
            <DiffCorrectionView
              originalImage={currentResult.originalImage}
              preprocessedImage={currentResult.preprocessedImage}
              code={currentResult.cleanCode}
              language={currentResult.language}
              onCodeChange={handleCodeChange}
              isDarkTheme={currentResult.isDarkTheme}
            />
          </div>
        ) : (
          /* Dynamic State 2: Hero Dropzone & Instructions */
          <div className="space-y-8">
            {/* Interactive Hero Dropzone */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="group relative flex flex-col items-center justify-center p-8 sm:p-12 border-2 border-dashed border-slate-800 hover:border-brand-500/60 rounded-3xl bg-slate-900/40 hover:bg-slate-900/70 transition-all cursor-pointer text-center space-y-4 shadow-xl"
            >
              <div className="w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center group-hover:scale-105 group-hover:shadow-glow-brand transition-all">
                <Camera className="w-8 h-8" />
              </div>

              <div className="space-y-1.5 max-w-md">
                <h2 className="text-lg font-semibold text-white group-hover:text-brand-300 transition-colors">
                  Drop a code screenshot or capture your screen
                </h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Click to browse files, drag and drop an image, or press{' '}
                  <kbd className="px-1.5 py-0.5 text-[11px] font-mono bg-slate-800 text-brand-400 border border-slate-700 rounded shadow">
                    Ctrl + V
                  </kbd>{' '}
                  to paste directly from clipboard.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleScreenCapture();
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-brand-500 hover:bg-brand-400 text-slate-950 text-xs font-semibold rounded-xl shadow-glow-brand transition-all"
                >
                  <Crop className="w-4 h-4" />
                  Snip from Screen
                </button>
                <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-800/80 text-slate-300 text-xs font-medium rounded-xl border border-slate-700">
                  <ClipboardPaste className="w-3.5 h-3.5 text-accent-400" />
                  <span>Supports Win+Shift+S Paste</span>
                </div>
              </div>
            </div>

            {/* Feature Highlights Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
                <div className="w-8 h-8 rounded-lg bg-brand-500/10 text-brand-400 flex items-center justify-center">
                  <Zap className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold text-white">Smart Indentation &amp; Ambiguity Lens</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Automatically reconstructs tab and space indentation trees. Identifies ambiguous OCR glyphs and offers 1-click repairs.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
                <div className="w-8 h-8 rounded-lg bg-accent-500/10 text-accent-400 flex items-center justify-center">
                  <Code2 className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold text-white">Gutter &amp; Prompt Stripper</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Intelligently recognizes and strips IDE line numbers (1 |, 02:) and shell prompts ($ , &gt;&gt;&gt;) without distorting code.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold text-white">100% Private &amp; Offline</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Runs completely client-side using WebAssembly OCR. No screenshot or source code is ever sent to external cloud servers.
                </p>
              </div>
            </div>

            {/* Pre-bundled Quick Demo Gallery */}
            <SampleGallery onSelectSample={handleSelectSample} isProcessing={isProcessing} />
          </div>
        )}
      </main>

      {/* Snipping / Cropping Region Modal */}
      {showCropModal && rawCaptureDataUrl && (
        <SnippingOverlay
          imageDataUrl={rawCaptureDataUrl}
          onConfirmCrop={handleConfirmCrop}
          onCancel={() => {
            setShowCropModal(false);
            setRawCaptureDataUrl(null);
          }}
        />
      )}

      {/* History Slide-Out Drawer */}
      <HistorySidebar
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onSelectSnippet={(snippet) => {
          setCurrentResult(snippet);
        }}
        onDeleteSnippet={handleDeleteHistoryItem}
        onClearAll={handleClearAllHistory}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
      />

      {/* Export & Presentation Modal */}
      {currentResult && (
        <ExportModal
          isOpen={isExportOpen}
          onClose={() => setIsExportOpen(false)}
          code={currentResult.cleanCode}
          language={currentResult.language}
        />
      )}

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800/80 bg-slate-950/60 px-4 py-4 text-center text-xs text-slate-500">
        <p>
          Shot2Code — Open source developer tool. Built with React, TypeScript, Vite, Tailwind CSS, and Tesseract WASM.
        </p>
      </footer>
    </div>
  );
};
