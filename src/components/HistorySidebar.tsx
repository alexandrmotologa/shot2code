import React, { useState } from 'react';
import { History, Trash2, Search, Download, Clock, ChevronRight, X, Code } from 'lucide-react';
import { OcrProcessingResult } from '../hooks/useCodeOcr';

interface HistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  history: OcrProcessingResult[];
  onSelectSnippet: (snippet: OcrProcessingResult) => void;
  onDeleteSnippet: (id: string) => void;
  onClearAll: () => void;
}

export const HistorySidebar: React.FC<HistorySidebarProps> = ({
  isOpen,
  onClose,
  history,
  onSelectSnippet,
  onDeleteSnippet,
  onClearAll,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguageFilter, setSelectedLanguageFilter] = useState<string>('all');

  if (!isOpen) return null;

  const languagesInHistory = Array.from(new Set(history.map((h) => h.language.id)));

  const filteredHistory = history.filter((item) => {
    const matchesSearch =
      item.cleanCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.language.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLang =
      selectedLanguageFilter === 'all' || item.language.id === selectedLanguageFilter;
    return matchesSearch && matchesLang;
  });

  const formatRelativeTime = (timestamp: number) => {
    const diffSec = Math.floor((Date.now() - timestamp) / 1000);
    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  const exportHistoryJson = () => {
    const blob = new Blob([JSON.stringify(history, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `shot2code_history_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full sm:w-96 bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col animate-fade-in">
      {/* Sidebar Header */}
      <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-100">
          <History className="w-4 h-4 text-brand-400" />
          <h2 className="font-semibold text-sm">Snippet History</h2>
          <span className="px-2 py-0.5 text-xs bg-slate-800 text-slate-400 rounded-full font-mono">
            {history.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {history.length > 0 && (
            <button
              type="button"
              onClick={exportHistoryJson}
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
              title="Export history JSON"
            >
              <Download className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
            title="Close drawer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="p-3 bg-slate-950/60 border-b border-slate-800 space-y-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search code content or language..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-700/80 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500"
          />
        </div>

        {/* Language Pills */}
        {languagesInHistory.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
            <button
              type="button"
              onClick={() => setSelectedLanguageFilter('all')}
              className={`px-2 py-0.5 rounded-full transition-colors ${
                selectedLanguageFilter === 'all'
                  ? 'bg-brand-500/20 text-brand-300 font-medium border border-brand-500/40'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-300'
              }`}
            >
              All
            </button>
            {languagesInHistory.map((langId) => (
              <button
                key={langId}
                type="button"
                onClick={() => setSelectedLanguageFilter(langId)}
                className={`px-2 py-0.5 rounded-full capitalize transition-colors ${
                  selectedLanguageFilter === langId
                    ? 'bg-brand-500/20 text-brand-300 font-medium border border-brand-500/40'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-300'
                }`}
              >
                {langId}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Snippet List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filteredHistory.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs">
            <Code className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p>No captured snippets found.</p>
            <p className="text-[11px] text-slate-600 mt-1">
              Snip a code block or try a sample from the gallery.
            </p>
          </div>
        ) : (
          filteredHistory.map((item) => {
            const firstLine = item.cleanCode.split('\n')[0] || '';
            const secondLine = item.cleanCode.split('\n')[1] || '';
            const lineCount = item.cleanCode.split('\n').length;

            return (
              <div
                key={item.id}
                className="group relative flex flex-col p-3 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 hover:bg-slate-800/50 transition-all cursor-pointer"
                onClick={() => {
                  onSelectSnippet(item);
                  onClose();
                }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded bg-brand-500/10 text-brand-400 border border-brand-500/20">
                    {item.language.name}
                  </span>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                    <Clock className="w-3 h-3" />
                    <span>{formatRelativeTime(item.timestamp)}</span>
                  </div>
                </div>

                {/* Code Preview */}
                <div className="font-mono text-[11px] text-slate-300 bg-slate-900/90 rounded p-2 border border-slate-800/80 line-clamp-2 overflow-hidden select-none">
                  <div>{firstLine}</div>
                  {secondLine && <div className="text-slate-500">{secondLine}</div>}
                </div>

                <div className="flex items-center justify-between mt-2 text-[10px] text-slate-500">
                  <span>{lineCount} lines</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSnippet(item.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-all"
                      title="Delete snippet"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 transition-colors" />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Clear All */}
      {history.length > 0 && (
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex justify-between items-center text-xs">
          <span className="text-slate-500">{history.length} items saved locally</span>
          <button
            type="button"
            onClick={onClearAll}
            className="text-xs text-red-400/80 hover:text-red-300 hover:underline transition-colors"
          >
            Clear All History
          </button>
        </div>
      )}
    </div>
  );
};
