import React from 'react';
import { Plus, X, Layers, Combine } from 'lucide-react';
import { OcrProcessingResult } from '../hooks/useCodeOcr';

export interface SnippetTab {
  id: string;
  title: string;
  result: OcrProcessingResult | null;
}

interface TabBarProps {
  tabs: SnippetTab[];
  activeTabId: string;
  onSelectTab: (id: string) => void;
  onNewTab: () => void;
  onCloseTab: (id: string) => void;
  onMergeTabs: () => void;
}

export const TabBar: React.FC<TabBarProps> = ({
  tabs,
  activeTabId,
  onSelectTab,
  onNewTab,
  onCloseTab,
  onMergeTabs,
}) => {
  const tabsWithCode = tabs.filter((t) => t.result && t.result.cleanCode.trim().length > 0);

  return (
    <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/90 px-2 py-1 gap-2 overflow-x-auto select-none">
      {/* Tab List */}
      <div className="flex items-center gap-1 overflow-x-auto py-1">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          const langBadge = tab.result?.language.name || 'Empty';

          return (
            <div
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`group flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all border ${
                isActive
                  ? 'bg-slate-850 text-white border-brand-500/50 shadow-sm'
                  : 'bg-slate-900/60 text-slate-400 border-transparent hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <Layers className={`w-3.5 h-3.5 ${isActive ? 'text-brand-400' : 'text-slate-500'}`} />
              <span>{tab.title}</span>
              {tab.result && (
                <span className="px-1.5 py-0.2 text-[10px] rounded bg-slate-800 text-slate-400">
                  {langBadge}
                </span>
              )}

              {tabs.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCloseTab(tab.id);
                  }}
                  className="p-0.5 rounded text-slate-500 hover:text-red-400 hover:bg-slate-800 transition-colors"
                  title="Close tab"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        })}

        {/* Add New Tab Button */}
        <button
          type="button"
          onClick={onNewTab}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors"
          title="Create new snippet tab"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">New Tab</span>
        </button>
      </div>

      {/* Merge Action */}
      {tabsWithCode.length > 1 && (
        <button
          type="button"
          onClick={onMergeTabs}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-accent-400 text-xs font-semibold rounded-lg border border-accent-500/30 transition-all shrink-0"
          title="Combine all open tabs into a single source file"
        >
          <Combine className="w-3.5 h-3.5" />
          <span>Merge {tabsWithCode.length} Tabs</span>
        </button>
      )}
    </div>
  );
};
