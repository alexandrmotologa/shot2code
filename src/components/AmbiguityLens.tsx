import React from 'react';
import { AlertCircle, Check, Wrench, ChevronDown, ChevronUp } from 'lucide-react';
import { AmbiguityAlert } from '../engine/ambiguityDetector';

interface AmbiguityLensProps {
  alerts: AmbiguityAlert[];
  onApplyFix: (alert: AmbiguityAlert) => void;
  onApplyAllFixes: () => void;
}

export const AmbiguityLens: React.FC<AmbiguityLensProps> = ({
  alerts,
  onApplyFix,
  onApplyAllFixes,
}) => {
  const [isExpanded, setIsExpanded] = React.useState(true);

  if (alerts.length === 0) return null;

  const fixableCount = alerts.filter((a) => a.suggestedFix).length;

  return (
    <div className="rounded-xl border border-amber-500/40 bg-amber-950/20 shadow-lg overflow-hidden animate-fade-in">
      {/* Header Bar */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between px-4 py-2.5 bg-amber-950/40 cursor-pointer select-none text-xs"
      >
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="font-semibold text-amber-200">
            Ambiguity Lens: {alerts.length} Potential Glitches Detected
          </span>
          <span className="px-1.5 py-0.5 text-[10px] rounded bg-amber-500/20 text-amber-300 font-mono">
            {fixableCount} auto-fixable
          </span>
        </div>

        <div className="flex items-center gap-2">
          {fixableCount > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onApplyAllFixes();
              }}
              className="flex items-center gap-1 px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-semibold shadow transition-all"
            >
              <Wrench className="w-3 h-3" />
              <span>Fix All ({fixableCount})</span>
            </button>
          )}

          <div className="text-amber-400 p-1">
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>
      </div>

      {/* Expanded List */}
      {isExpanded && (
        <div className="p-3 space-y-2 max-h-48 overflow-y-auto divide-y divide-amber-900/30 text-xs">
          {alerts.map((alert) => (
            <div key={alert.id} className="pt-2 first:pt-0 flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] text-amber-400 font-medium">
                    Line {alert.lineNumber}:{alert.columnStart}
                  </span>
                  <code className="px-1.5 py-0.2 bg-slate-900 text-amber-300 rounded font-mono text-[11px] border border-amber-500/30">
                    {alert.token}
                  </code>
                  {alert.suggestedFix && (
                    <span className="text-[11px] text-slate-400">
                      → replace with{' '}
                      <code className="text-emerald-400 font-mono font-medium">
                        {alert.suggestedFix}
                      </code>
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">{alert.reason}</p>
              </div>

              {alert.suggestedFix && (
                <button
                  type="button"
                  onClick={() => onApplyFix(alert)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/40 text-amber-200 border border-amber-500/30 text-[11px] font-medium shrink-0 transition-colors"
                >
                  <Check className="w-3 h-3 text-amber-400" />
                  <span>Fix</span>
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
