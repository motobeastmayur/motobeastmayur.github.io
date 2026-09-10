import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { FastForward } from 'lucide-react';

interface StreamingMarkdownProps {
  content: string;
  isNew?: boolean;
  onStreamComplete?: () => void;
  theme?: 'dark' | 'light';
}

export const StreamingMarkdown: React.FC<StreamingMarkdownProps> = ({
  content,
  isNew = false,
  onStreamComplete,
  theme = 'dark',
}) => {
  const [displayedText, setDisplayedText] = useState<string>(isNew ? '' : content);
  const [isFinished, setIsFinished] = useState<boolean>(!isNew);
  const indexRef = useRef<number>(isNew ? 0 : content.length);
  const isLight = theme === 'light';

  useEffect(() => {
    // If not a newly arrived message, show full text immediately
    if (!isNew) {
      setDisplayedText(content);
      setIsFinished(true);
      return;
    }

    // Reset stream state for newly arrived response
    indexRef.current = 0;
    setDisplayedText('');
    setIsFinished(false);

    const totalLength = content.length;
    // Dynamic stream pacing: finish ~1.2s to 2s for ideal reading cadence
    const targetSteps = 50;
    const chunkSize = Math.max(3, Math.ceil(totalLength / targetSteps));

    const interval = setInterval(() => {
      indexRef.current += chunkSize;

      if (indexRef.current >= totalLength) {
        setDisplayedText(content);
        setIsFinished(true);
        clearInterval(interval);
        onStreamComplete?.();
      } else {
        setDisplayedText(content.slice(0, indexRef.current));
      }
    }, 20);

    return () => clearInterval(interval);
  }, [content, isNew, onStreamComplete]);

  const handleSkip = () => {
    setDisplayedText(content);
    setIsFinished(true);
    onStreamComplete?.();
  };

  return (
    <div className="relative group/markdown">
      <div
        className={`leading-relaxed overflow-x-auto prose max-w-none ${
          isLight
            ? 'prose-slate prose-p:my-2 prose-pre:bg-slate-100 prose-pre:border prose-pre:border-slate-200 prose-pre:text-slate-800 prose-headings:text-slate-900 prose-a:text-violet-600 prose-code:text-violet-700 prose-code:bg-slate-100 prose-code:px-1 prose-code:rounded'
            : 'prose-invert prose-p:my-2 prose-pre:bg-[#07050d] prose-pre:border prose-pre:border-white/[0.08] prose-headings:text-white prose-a:text-violet-300 prose-code:text-violet-200'
        }`}
      >
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{displayedText}</ReactMarkdown>
      </div>

      {/* Streaming cursor */}
      {!isFinished && (
        <span className="inline-block w-2 h-4 bg-violet-500 align-middle ml-1 animate-pulse" />
      )}

      {/* Quick skip button while streaming */}
      {!isFinished && (
        <div className="mt-2 pt-1 flex items-center justify-end">
          <button
            type="button"
            onClick={handleSkip}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono transition-colors cursor-pointer ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800'
                : 'bg-white/[0.06] hover:bg-white/[0.12] text-neutral-400 hover:text-white'
            }`}
            title="Display full response immediately"
          >
            <FastForward className="w-2.5 h-2.5 text-violet-500" />
            <span>Skip</span>
          </button>
        </div>
      )}
    </div>
  );
};
