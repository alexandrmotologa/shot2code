import React, { useState } from 'react';
import { X, ExternalLink, Github, Copy, Check, Share2 } from 'lucide-react';
import { DetectedLanguage } from '../engine/languageDetector';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  code: string;
  language: DetectedLanguage;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  code,
  language,
}) => {
  const [gistDescription, setGistDescription] = useState('Code snippet extracted with Shot2Code');
  const [isCreatingGist, setIsCreatingGist] = useState(false);
  const [gistUrl, setGistUrl] = useState<string | null>(null);
  const [gistError, setGistError] = useState<string | null>(null);
  const [copiedGist, setCopiedGist] = useState(false);

  if (!isOpen) return null;

  // Generate Ray.so URL
  const openRaySo = () => {
    const encoded = encodeURIComponent(btoa(unescape(encodeURIComponent(code))));
    const url = `https://ray.so/#code=${encoded}&language=${language.id}&title=Shot2Code%20Snippet`;
    window.open(url, '_blank');
  };

  // Generate Carbon URL
  const openCarbon = () => {
    const encoded = encodeURIComponent(code);
    const url = `https://carbon.now.sh/?l=${language.id}&code=${encoded}`;
    window.open(url, '_blank');
  };

  // Create GitHub Gist
  const handleCreateGist = async () => {
    setIsCreatingGist(true);
    setGistError(null);
    setGistUrl(null);

    const fileName = `snippet.${language.fileExtension}`;

    try {
      const response = await fetch('https://api.github.com/gists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/vnd.github+json',
        },
        body: JSON.stringify({
          description: gistDescription,
          public: false,
          files: {
            [fileName]: {
              content: code,
            },
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`GitHub Gist creation failed (status ${response.status})`);
      }

      const data = await response.json();
      setGistUrl(data.html_url);
    } catch (err: any) {
      setGistError(err.message || 'Could not create Gist.');
    } finally {
      setIsCreatingGist(false);
    }
  };

  const copyGistLink = async () => {
    if (gistUrl) {
      await navigator.clipboard.writeText(gistUrl);
      setCopiedGist(true);
      setTimeout(() => setCopiedGist(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 select-none animate-fade-in">
      <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-2 text-slate-100">
            <Share2 className="w-5 h-5 text-accent-400" />
            <h3 className="font-semibold text-sm">Export & Share Snippet</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 text-xs">
          {/* Visual Presentation Cards */}
          <div className="space-y-2">
            <h4 className="font-semibold text-slate-300 uppercase tracking-wider text-[11px]">
              Presentation & Social Sharing
            </h4>
            <div className="grid grid-cols-2 gap-3">
              {/* Ray.so */}
              <button
                type="button"
                onClick={openRaySo}
                className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-brand-500/50 hover:bg-slate-800/60 transition-all text-left group"
              >
                <div>
                  <div className="font-semibold text-slate-200 group-hover:text-brand-300 flex items-center gap-1.5">
                    <span>Open in Ray.so</span>
                    <ExternalLink className="w-3 h-3 text-slate-500" />
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Create aesthetic gradient code slides
                  </div>
                </div>
              </button>

              {/* Carbon */}
              <button
                type="button"
                onClick={openCarbon}
                className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-accent-500/50 hover:bg-slate-800/60 transition-all text-left group"
              >
                <div>
                  <div className="font-semibold text-slate-200 group-hover:text-accent-300 flex items-center gap-1.5">
                    <span>Open in Carbon</span>
                    <ExternalLink className="w-3 h-3 text-slate-500" />
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Export high-res PNG for slides & tweets
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* GitHub Gist Integration */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <h4 className="font-semibold text-slate-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Github className="w-3.5 h-3.5 text-slate-400" />
              <span>Publish to GitHub Gist</span>
            </h4>

            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
              <div>
                <label className="block text-slate-400 mb-1">Gist Description</label>
                <input
                  type="text"
                  value={gistDescription}
                  onChange={(e) => setGistDescription(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-brand-500"
                />
              </div>

              {gistError && <div className="text-red-400 text-xs">{gistError}</div>}

              {gistUrl ? (
                <div className="p-3 bg-brand-500/10 border border-brand-500/30 rounded-lg flex items-center justify-between gap-2">
                  <a
                    href={gistUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-brand-300 hover:underline truncate font-mono text-xs"
                  >
                    {gistUrl}
                  </a>
                  <button
                    type="button"
                    onClick={copyGistLink}
                    className="px-2.5 py-1 bg-brand-500 text-slate-950 rounded font-semibold text-xs shrink-0 flex items-center gap-1"
                  >
                    {copiedGist ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedGist ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleCreateGist}
                  disabled={isCreatingGist}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  <Github className="w-4 h-4" />
                  <span>{isCreatingGist ? 'Publishing Gist...' : 'Create Anonymous Gist'}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
