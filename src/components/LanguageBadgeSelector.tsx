import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { DetectedLanguage } from '../engine/languageDetector';

export const SUPPORTED_LANGUAGES: { id: string; name: string; ext: string; color: string }[] = [
  { id: 'python', name: 'Python', ext: 'py', color: '#3b82f6' },
  { id: 'typescript', name: 'TypeScript', ext: 'ts', color: '#3178c6' },
  { id: 'javascript', name: 'JavaScript', ext: 'js', color: '#f7df1e' },
  { id: 'rust', name: 'Rust', ext: 'rs', color: '#dea584' },
  { id: 'go', name: 'Go', ext: 'go', color: '#00add8' },
  { id: 'sql', name: 'SQL', ext: 'sql', color: '#e38c00' },
  { id: 'html', name: 'HTML', ext: 'html', color: '#e34f26' },
  { id: 'css', name: 'CSS', ext: 'css', color: '#1572b6' },
  { id: 'cpp', name: 'C++', ext: 'cpp', color: '#f34b7d' },
  { id: 'bash', name: 'Shell / Bash', ext: 'sh', color: '#4eaa25' },
  { id: 'json', name: 'JSON', ext: 'json', color: '#cbcfd7' },
];

interface LanguageBadgeSelectorProps {
  language: DetectedLanguage;
  onLanguageChange: (newLang: DetectedLanguage) => void;
}

export const LanguageBadgeSelector: React.FC<LanguageBadgeSelectorProps> = ({
  language,
  onLanguageChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeLang =
    SUPPORTED_LANGUAGES.find((l) => l.id === language.id) || {
      id: language.id,
      name: language.name,
      ext: language.fileExtension,
      color: '#22c55e',
    };

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (lang: (typeof SUPPORTED_LANGUAGES)[0]) => {
    onLanguageChange({
      id: lang.id,
      name: lang.name,
      confidence: 1.0,
      fileExtension: lang.ext,
    });
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/90 hover:bg-slate-800/90 border border-slate-700/80 rounded-lg text-xs font-medium text-slate-200 shadow-sm transition-all focus:outline-none focus:ring-1 focus:ring-brand-500/50"
      >
        <span
          className="w-2.5 h-2.5 rounded-full ring-2 ring-slate-950"
          style={{ backgroundColor: activeLang.color }}
        />
        <span className="font-semibold">{activeLang.name}</span>
        {language.confidence > 0 && (
          <span className="text-[10px] text-slate-400 font-mono">
            {Math.round(language.confidence * 100)}%
          </span>
        )}
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-1.5 w-48 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl z-30 py-1.5 max-h-64 overflow-y-auto animate-fade-in">
          <div className="px-3 py-1 text-[10px] uppercase tracking-wider text-slate-400 font-semibold border-b border-slate-800">
            Override Language
          </div>
          {SUPPORTED_LANGUAGES.map((lang) => {
            const isSelected = lang.id === language.id;
            return (
              <button
                key={lang.id}
                type="button"
                onClick={() => handleSelect(lang)}
                className={`w-full flex items-center justify-between px-3 py-1.5 text-xs text-left transition-colors ${
                  isSelected
                    ? 'bg-brand-500/10 text-brand-300 font-medium'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: lang.color }}
                  />
                  <span>{lang.name}</span>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-brand-400" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
