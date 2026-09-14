import React from 'react';
import { Play, Sparkles, Terminal } from 'lucide-react';

export interface SampleItem {
  id: string;
  title: string;
  desc: string;
  lang: string;
  path: string;
  badgeColor: string;
}

export const PRESET_SAMPLES: SampleItem[] = [
  {
    id: 'python-async',
    title: 'Python 3.12 FastAPI',
    desc: 'Async route with Pydantic payload and httpx client',
    lang: 'Python',
    path: '/samples/python_async_sample.png',
    badgeColor: '#3b82f6',
  },
  {
    id: 'react-hook',
    title: 'React TypeScript Hook',
    desc: 'useDebounce generic hook with cleanup timer',
    lang: 'TypeScript',
    path: '/samples/react_hook_sample.png',
    badgeColor: '#3178c6',
  },
  {
    id: 'rust-struct',
    title: 'Rust 2021 Tokio Cache',
    desc: 'AsyncCache with Arc<RwLock<HashMap>> and generics',
    lang: 'Rust',
    path: '/samples/rust_struct_sample.png',
    badgeColor: '#dea584',
  },
  {
    id: 'go-concurrency',
    title: 'Go 1.22 Worker Pool',
    desc: 'Goroutines, sync.WaitGroup, and buffered channels',
    lang: 'Go',
    path: '/samples/go_concurrency_sample.png',
    badgeColor: '#00add8',
  },
  {
    id: 'sql-window',
    title: 'PostgreSQL 16 CTE & Window',
    desc: 'WITH clause with DATE_TRUNC and RANK() OVER()',
    lang: 'SQL',
    path: '/samples/sql_query_sample.png',
    badgeColor: '#e38c00',
  },
];

interface SampleGalleryProps {
  onSelectSample: (sample: SampleItem) => void;
  isProcessing: boolean;
}

export const SampleGallery: React.FC<SampleGalleryProps> = ({
  onSelectSample,
  isProcessing,
}) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-brand-400" />
          <span>Quick Demo Screenshots</span>
        </div>
        <span className="text-xs text-slate-500">Test OCR without capturing screen</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {PRESET_SAMPLES.map((sample) => (
          <div
            key={sample.id}
            onClick={() => !isProcessing && onSelectSample(sample)}
            className={`group relative flex flex-col p-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-brand-500/50 hover:bg-slate-800/60 transition-all cursor-pointer shadow-md ${
              isProcessing ? 'opacity-60 pointer-events-none' : ''
            }`}
          >
            {/* Header Badge */}
            <div className="flex items-center justify-between mb-2">
              <span
                className="px-2 py-0.5 text-[10px] font-semibold rounded"
                style={{
                  backgroundColor: `${sample.badgeColor}15`,
                  color: sample.badgeColor,
                  border: `1px solid ${sample.badgeColor}30`,
                }}
              >
                {sample.lang}
              </span>
              <Play className="w-3 h-3 text-slate-500 group-hover:text-brand-400 group-hover:translate-x-0.5 transition-all" />
            </div>

            <h4 className="font-medium text-xs text-slate-200 group-hover:text-white transition-colors mb-1">
              {sample.title}
            </h4>
            <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
              {sample.desc}
            </p>

            <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center gap-1.5 text-[10px] text-slate-500 group-hover:text-brand-400/90 transition-colors">
              <Terminal className="w-3 h-3" />
              <span>Click to Parse</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
