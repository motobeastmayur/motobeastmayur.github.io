import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface ThinkingIndicatorProps {
  isLive?: boolean;
  durationSec?: number;
  thoughtSteps?: string[];
  modelName?: string;
  theme?: 'dark' | 'light';
}

export const ThinkingIndicator: React.FC<ThinkingIndicatorProps> = ({
  isLive = false,
  durationSec = 0,
  thoughtSteps,
  modelName,
  theme = 'dark',
}) => {
  const [elapsed, setElapsed] = useState<number>(0);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  // Live timer for thinking duration
  useEffect(() => {
    if (!isLive) return;

    const startTime = Date.now();
    const interval = setInterval(() => {
      setElapsed((Date.now() - startTime) / 1000);
    }, 100);

    return () => clearInterval(interval);
  }, [isLive]);

  const isLight = theme === 'light';

  // Authentic Google Gemini 4-Pointed Star Sparkle Icon
  const GeminiSparkle = ({ className = 'w-4 h-4' }: { className?: string }) => (
    <svg
      viewBox="0 0 24 24"
      className={`${className} flex-shrink-0`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="gemini-star-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4E8CFF" />
          <stop offset="30%" stopColor="#7F5AF0" />
          <stop offset="65%" stopColor="#C441A5" />
          <stop offset="100%" stopColor="#F56565" />
        </linearGradient>
      </defs>
      <path
        d="M12 2C12 7.5 7.5 12 2 12C7.5 12 12 16.5 12 22C12 16.5 16.5 12 22 12C16.5 12 12 7.5 12 2Z"
        fill="url(#gemini-star-grad)"
      />
    </svg>
  );

  // Default thought steps if model didn't provide custom ones
  const steps =
    thoughtSteps && thoughtSteps.length > 0
      ? thoughtSteps
      : [
          'Deconstructing user prompt intent and constraints...',
          'Retrieving contextual knowledge and reasoning pathways...',
          'Evaluating logical consistency across candidate responses...',
          'Drafting accurate, well-formatted response...',
        ];

  // 1. LIVE PROCESSING STATE (Exactly like Google Gemini Web App)
  if (isLive) {
    return (
      <div className="w-full max-w-2xl py-1 space-y-3 animate-fade-in select-none">
        {/* Gemini Sparkle Header with Shimmering "Thinking..." */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="animate-gemini-star">
              <GeminiSparkle className="w-4 h-4" />
            </div>
            <span className="text-sm font-medium animate-gemini-shimmer tracking-wide">
              Thinking...
            </span>
            <span
              className={`text-xs font-mono ${
                isLight ? 'text-slate-400' : 'text-neutral-500'
              }`}
            >
              ({elapsed.toFixed(1)}s)
            </span>
          </div>

          {/* Model badge & Expand button */}
          <div className="flex items-center gap-2">
            {modelName && (
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-md hidden sm:inline-block ${
                  isLight
                    ? 'bg-slate-100 text-slate-500 border border-slate-200'
                    : 'bg-[#140e26] text-violet-300/80 border border-violet-500/20'
                }`}
              >
                {modelName}
              </span>
            )}
            <button
              type="button"
              onClick={() => setIsExpanded((prev) => !prev)}
              className={`flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                isLight
                  ? 'hover:bg-slate-100 text-slate-500 hover:text-slate-800'
                  : 'hover:bg-white/[0.06] text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <span>{isExpanded ? 'Hide thoughts' : 'View thoughts'}</span>
              {isExpanded ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
            </button>
          </div>
        </div>

        {/* Live Expanded Reasoning Steps */}
        {isExpanded && (
          <div
            className={`p-3 rounded-xl border text-xs space-y-1.5 transition-all ${
              isLight
                ? 'bg-slate-50 border-slate-200 text-slate-600'
                : 'bg-[#0a0714] border-white/[0.08] text-neutral-300'
            }`}
          >
            {steps.map((step, idx) => (
              <div key={idx} className="flex items-center gap-2 text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                <span className="truncate">{step}</span>
              </div>
            ))}
          </div>
        )}

        {/* Gemini Signature Shimmer Wave Lines (Lightweight Pure CSS) */}
        <div className="space-y-2 pt-0.5 max-w-xl">
          {/* Wave Line 1 */}
          <div
            className={`h-2.5 rounded-full relative overflow-hidden w-[82%] ${
              isLight ? 'bg-slate-200/80' : 'bg-white/[0.07]'
            }`}
          >
            <div
              className={`absolute inset-0 w-full h-full animate-gemini-wave ${
                isLight
                  ? 'bg-gradient-to-r from-transparent via-violet-400/40 to-transparent'
                  : 'bg-gradient-to-r from-transparent via-violet-400/30 to-transparent'
              }`}
            />
          </div>

          {/* Wave Line 2 */}
          <div
            className={`h-2.5 rounded-full relative overflow-hidden w-[94%] ${
              isLight ? 'bg-slate-200/80' : 'bg-white/[0.07]'
            }`}
          >
            <div
              className={`absolute inset-0 w-full h-full animate-gemini-wave ${
                isLight
                  ? 'bg-gradient-to-r from-transparent via-indigo-400/40 to-transparent'
                  : 'bg-gradient-to-r from-transparent via-indigo-400/30 to-transparent'
              }`}
              style={{ animationDelay: '0.2s' }}
            />
          </div>

          {/* Wave Line 3 */}
          <div
            className={`h-2.5 rounded-full relative overflow-hidden w-[58%] ${
              isLight ? 'bg-slate-200/80' : 'bg-white/[0.07]'
            }`}
          >
            <div
              className={`absolute inset-0 w-full h-full animate-gemini-wave ${
                isLight
                  ? 'bg-gradient-to-r from-transparent via-fuchsia-400/40 to-transparent'
                  : 'bg-gradient-to-r from-transparent via-fuchsia-400/30 to-transparent'
              }`}
              style={{ animationDelay: '0.4s' }}
            />
          </div>
        </div>
      </div>
    );
  }

  // 2. COMPLETED THOUGHT STATE (Matching Gemini "Thought for Xs ▼")
  const displayDuration = durationSec > 0 ? durationSec.toFixed(1) : '1.8';

  return (
    <div className="mb-2 select-none">
      <button
        type="button"
        onClick={() => setIsExpanded((prev) => !prev)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
          isLight
            ? 'bg-slate-100/90 hover:bg-slate-200/80 border-slate-200 text-slate-600 hover:text-slate-900 shadow-sm'
            : 'bg-[#120d24] hover:bg-[#181130] border-white/[0.08] hover:border-violet-500/30 text-neutral-300 hover:text-white shadow-sm'
        }`}
        title="View thinking process"
      >
        <GeminiSparkle className="w-3.5 h-3.5" />
        <span className="font-mono text-[11px]">
          Thought for <span className={isLight ? 'text-violet-600 font-semibold' : 'text-violet-300 font-semibold'}>{displayDuration}s</span>
        </span>
        {isExpanded ? (
          <ChevronUp className="w-3 h-3 opacity-60 ml-0.5" />
        ) : (
          <ChevronDown className="w-3 h-3 opacity-60 ml-0.5" />
        )}
      </button>

      {/* Expanded Reasoning Chain */}
      {isExpanded && (
        <div
          className={`mt-2 p-3 rounded-xl border text-xs space-y-2 animate-fade-in ${
            isLight
              ? 'bg-slate-50 border-slate-200 text-slate-700'
              : 'bg-[#090712] border-white/[0.08] text-neutral-300'
          }`}
        >
          <div className="flex items-center gap-1.5 text-[10px] uppercase font-mono tracking-wider font-semibold text-violet-500">
            <GeminiSparkle className="w-3 h-3" />
            <span>Reasoning Chain</span>
          </div>
          <ul className="space-y-1.5 pl-0.5">
            {steps.map((step, idx) => (
              <li
                key={idx}
                className={`flex items-start gap-2 text-[11px] leading-relaxed ${
                  isLight ? 'text-slate-600' : 'text-neutral-400'
                }`}
              >
                <span className="text-emerald-500 mt-0.5 text-xs font-bold">✓</span>
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
