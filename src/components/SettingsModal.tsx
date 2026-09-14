import React, { useState } from 'react';
import { X, Sliders, Key, Zap, Check, Sparkles, Server } from 'lucide-react';
import { AiProvider, AiPolishConfig } from '../engine/aiPolish';

export interface AppSettings {
  autoCopyOnParse: boolean;
  defaultIndent: 2 | 4;
  aiPolish: AiPolishConfig & { enabled: boolean };
}

export const DEFAULT_SETTINGS: AppSettings = {
  autoCopyOnParse: true,
  defaultIndent: 2,
  aiPolish: {
    enabled: false,
    provider: 'gemini',
    apiKey: '',
    endpointUrl: 'http://localhost:11434',
    modelName: 'gemini-1.5-flash',
  },
};

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSaveSettings: (newSettings: AppSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
}) => {
  const [formData, setFormData] = useState<AppSettings>(settings);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveSettings(formData);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 select-none animate-fade-in">
      <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-2.5 text-slate-100">
            <Sliders className="w-5 h-5 text-brand-400" />
            <h3 className="font-semibold text-sm">Shot2Code Studio Settings</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh] text-xs">
          {/* General Productivity Section */}
          <div className="space-y-3">
            <h4 className="font-semibold text-slate-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-brand-400" />
              <span>Productivity Preferences</span>
            </h4>

            {/* Auto-Copy Toggle */}
            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors">
              <div className="space-y-0.5">
                <div className="font-medium text-slate-200">Auto-copy code to clipboard</div>
                <div className="text-[11px] text-slate-400">
                  Immediately copies clean code when an image or snip finishes processing.
                </div>
              </div>
              <input
                type="checkbox"
                checked={formData.autoCopyOnParse}
                onChange={(e) =>
                  setFormData({ ...formData, autoCopyOnParse: e.target.checked })
                }
                className="w-4 h-4 rounded text-brand-500 bg-slate-800 border-slate-700 focus:ring-brand-500"
              />
            </label>

            {/* Default Indentation */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <div>
                <div className="font-medium text-slate-200">Default Indentation Size</div>
                <div className="text-[11px] text-slate-400">Spaces per indentation nesting level.</div>
              </div>
              <select
                value={formData.defaultIndent}
                onChange={(e) =>
                  setFormData({ ...formData, defaultIndent: Number(e.target.value) as 2 | 4 })
                }
                className="px-2.5 py-1 bg-slate-800 text-slate-200 border border-slate-700 rounded-lg text-xs font-mono focus:outline-none focus:border-brand-500"
              >
                <option value={2}>2 Spaces</option>
                <option value={4}>4 Spaces</option>
              </select>
            </div>
          </div>

          {/* AI Polish (BYOK) Section */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <h4 className="font-semibold text-slate-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-accent-400" />
              <span>Optional AI Syntax Polish (BYOK)</span>
            </h4>

            {/* Enable Toggle */}
            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors">
              <div className="space-y-0.5">
                <div className="font-medium text-slate-200">Enable AI Syntax Polish button</div>
                <div className="text-[11px] text-slate-400">
                  Allows 1-click syntax repair for low-res video artifacts using your own API key.
                </div>
              </div>
              <input
                type="checkbox"
                checked={formData.aiPolish.enabled}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    aiPolish: { ...formData.aiPolish, enabled: e.target.checked },
                  })
                }
                className="w-4 h-4 rounded text-accent-500 bg-slate-800 border-slate-700 focus:ring-accent-500"
              />
            </label>

            {formData.aiPolish.enabled && (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 animate-fade-in">
                {/* Provider Picker */}
                <div>
                  <label className="block text-slate-400 mb-1">Provider</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['gemini', 'openai', 'ollama'] as AiProvider[]).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            aiPolish: {
                              ...formData.aiPolish,
                              provider: p,
                              modelName:
                                p === 'gemini'
                                  ? 'gemini-1.5-flash'
                                  : p === 'openai'
                                  ? 'gpt-4o-mini'
                                  : 'codellama',
                            },
                          })
                        }
                        className={`py-1.5 px-2 rounded-lg text-xs font-medium capitalize border transition-all ${
                          formData.aiPolish.provider === p
                            ? 'bg-accent-500/20 text-accent-300 border-accent-500/50 font-semibold'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                {/* API Key or Ollama URL */}
                {formData.aiPolish.provider !== 'ollama' ? (
                  <div>
                    <label className="block text-slate-400 mb-1 flex items-center gap-1">
                      <Key className="w-3 h-3 text-slate-500" />
                      <span>{formData.aiPolish.provider.toUpperCase()} API Key</span>
                    </label>
                    <input
                      type="password"
                      placeholder="sk-... or AIzaSy..."
                      value={formData.aiPolish.apiKey || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          aiPolish: { ...formData.aiPolish, apiKey: e.target.value },
                        })
                      }
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-accent-500"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      Stored only in your browser localStorage. Never sent to any external server.
                    </p>
                  </div>
                ) : (
                  <div>
                    <label className="block text-slate-400 mb-1 flex items-center gap-1">
                      <Server className="w-3 h-3 text-slate-500" />
                      <span>Ollama Endpoint URL</span>
                    </label>
                    <input
                      type="text"
                      value={formData.aiPolish.endpointUrl || 'http://localhost:11434'}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          aiPolish: { ...formData.aiPolish, endpointUrl: e.target.value },
                        })
                      }
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-accent-500"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 bg-slate-950 border-t border-slate-800">
          <span className="text-[11px] text-slate-500">Changes take effect immediately</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-slate-400 hover:text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-brand-500 hover:bg-brand-400 text-slate-950 font-semibold rounded-lg text-xs shadow-glow-brand transition-all"
            >
              {savedSuccess ? <Check className="w-3.5 h-3.5" /> : null}
              <span>{savedSuccess ? 'Saved!' : 'Save Changes'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
