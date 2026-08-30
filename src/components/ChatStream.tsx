import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Zap,
  User,
  Copy,
  Check,
  Volume2,
  RotateCcw,
  Globe,
  Clock,
  FileText,
  ExternalLink,
} from 'lucide-react';
import { ChatMessage } from '../types';
import { AVAILABLE_MODELS } from '../data/models';

interface ChatStreamProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onRegenerate: (index: number) => void;
}

export const ChatStream: React.FC<ChatStreamProps> = ({
  messages,
  isLoading,
  onRegenerate,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSpeak = (id: string, text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      if (speakingId === id) {
        setSpeakingId(null);
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text.slice(0, 1000));
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      utterance.onend = () => setSpeakingId(null);
      utterance.onerror = () => setSpeakingId(null);

      setSpeakingId(id);
      window.speechSynthesis.speak(utterance);
    }
  };

  // 100% clean blank screen when there are no messages
  if (messages.length === 0 && !isLoading) {
    return <div className="flex-1" />;
  }

  return (
    <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-6 space-y-6">
      <div className="max-w-3xl mx-auto space-y-5">
        {messages.map((message, index) => {
          const isUser = message.role === 'user';
          const modelInfo = AVAILABLE_MODELS.find((m) => m.id === message.modelUsed);

          return (
            <div
              key={message.id}
              className={`flex gap-3 sm:gap-4 ${
                isUser ? 'justify-end' : 'justify-start'
              } group animate-fade-in`}
            >
              {/* Bot Neon Avatar */}
              {!isUser && (
                <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-black border border-[#00f3ff] flex items-center justify-center text-[#00f3ff] shadow-[0_0_10px_rgba(0,243,255,0.4)] mt-1">
                  <Zap className="w-4 h-4" />
                </div>
              )}

              {/* Message Bubble */}
              <div
                className={`max-w-[90%] sm:max-w-[85%] rounded-2xl p-4 sm:p-5 space-y-3 transition-all ${
                  isUser
                    ? 'bg-neutral-950/90 text-white rounded-tr-sm border border-[#b026ff]/60 shadow-[0_0_15px_rgba(176,38,255,0.2)]'
                    : 'bg-neutral-950/95 text-neutral-100 rounded-tl-sm border border-[#00f3ff]/35 shadow-[0_0_16px_rgba(0,243,255,0.12)]'
                }`}
              >
                {/* User attachment preview */}
                {message.attachment && (
                  <div className="mb-2">
                    {message.attachment.mimeType.startsWith('image/') ? (
                      <img
                        src={message.attachment.data}
                        alt="Uploaded attachment"
                        className="max-h-64 rounded-xl border border-[#b026ff]/40 object-contain shadow-md"
                      />
                    ) : (
                      <div className="inline-flex items-center gap-2 p-2 rounded-xl bg-black border border-[#b026ff]/40 text-xs">
                        <FileText className="w-4 h-4 text-[#b026ff]" />
                        <span>{message.attachment.name}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Header info for Bot messages */}
                {!isUser && (
                  <div className="flex items-center justify-between pb-2 border-b border-neutral-800 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white tracking-wide">MayurBot</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase bg-black text-[#00f3ff] border border-[#00f3ff]/40 shadow-[0_0_6px_rgba(0,243,255,0.2)]">
                        {modelInfo ? modelInfo.shortName : (message.modelUsed || 'Gemini 2.5')}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[10px] text-neutral-400 font-mono">
                      {message.latencyMs && (
                        <span className="flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5 text-[#00f3ff]" />
                          <span>{message.latencyMs}ms</span>
                        </span>
                      )}
                      <span>
                        {new Date(message.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                )}

                {/* Markdown Content */}
                <div className="text-sm sm:text-[15px] leading-relaxed overflow-x-auto prose prose-invert max-w-none prose-p:my-2 prose-pre:bg-black prose-pre:border prose-pre:border-[#00f3ff]/30 prose-pre:shadow-[0_0_12px_rgba(0,243,255,0.1)] prose-headings:text-[#00f3ff] prose-a:text-[#00f3ff] prose-code:text-[#00f3ff]">
                  {message.error ? (
                    <div className="p-3 rounded-xl bg-black border border-red-500/50 text-red-300 text-xs shadow-[0_0_10px_rgba(239,68,68,0.2)]">
                      {message.error}
                    </div>
                  ) : (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {message.text}
                    </ReactMarkdown>
                  )}
                </div>

                {/* Grounding Web Sources Display */}
                {message.groundingSources && message.groundingSources.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-neutral-800 space-y-1.5">
                    <div className="text-[10px] uppercase font-mono tracking-wider text-[#00f3ff] flex items-center gap-1">
                      <Globe className="w-3 h-3 text-[#00f3ff]" />
                      <span>Google Search Grounding Sources</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {message.groundingSources.map((source, idx) => (
                        <a
                          key={idx}
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-black hover:bg-neutral-950 text-neutral-300 hover:text-[#00f3ff] text-[11px] border border-[#00f3ff]/20 hover:border-[#00f3ff] transition-all shadow-sm hover:shadow-[0_0_8px_rgba(0,243,255,0.3)]"
                        >
                          <span className="truncate max-w-[180px]">{source.title || source.url}</span>
                          <ExternalLink className="w-3 h-3 flex-shrink-0 text-[#00f3ff]" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Toolbar for Bot Responses */}
                {!isUser && (
                  <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-end gap-1.5 text-xs text-neutral-400">
                    <button
                      onClick={() => handleSpeak(message.id, message.text)}
                      className={`p-1.5 rounded-lg hover:bg-black border border-transparent hover:border-[#00f3ff]/40 text-neutral-400 hover:text-[#00f3ff] transition-all cursor-pointer ${
                        speakingId === message.id
                          ? 'border-[#00f3ff] text-[#00f3ff] shadow-[0_0_8px_rgba(0,243,255,0.4)]'
                          : ''
                      }`}
                      title="Read aloud with Text-to-Speech"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleCopy(message.id, message.text)}
                      className="p-1.5 rounded-lg hover:bg-black border border-transparent hover:border-[#00f3ff]/40 text-neutral-400 hover:text-[#00f3ff] transition-all cursor-pointer"
                      title="Copy text"
                    >
                      {copiedId === message.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      onClick={() => onRegenerate(index)}
                      className="p-1.5 rounded-lg hover:bg-black border border-transparent hover:border-[#00f3ff]/40 text-neutral-400 hover:text-[#00f3ff] transition-all cursor-pointer"
                      title="Regenerate response"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* User Neon Avatar */}
              {isUser && (
                <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-black border border-[#b026ff] flex items-center justify-center text-[#b026ff] shadow-[0_0_10px_rgba(176,38,255,0.4)] mt-1 font-bold text-xs">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {/* Loading Indicator Spinner */}
        {isLoading && (
          <div className="flex gap-3 sm:gap-4 justify-start animate-fade-in">
            <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-black border border-[#00f3ff] flex items-center justify-center text-[#00f3ff] shadow-[0_0_12px_rgba(0,243,255,0.5)] mt-1">
              <Zap className="w-4 h-4 animate-spin text-[#00f3ff]" />
            </div>
            <div className="bg-neutral-950/90 rounded-2xl rounded-tl-sm p-4 border border-[#00f3ff]/40 text-neutral-200 text-xs flex items-center gap-3 shadow-[0_0_14px_rgba(0,243,255,0.15)]">
              <div className="flex gap-1.5">
                <div
                  className="w-2 h-2 rounded-full bg-[#00f3ff] animate-bounce shadow-[0_0_6px_#00f3ff]"
                  style={{ animationDelay: '0ms' }}
                />
                <div
                  className="w-2 h-2 rounded-full bg-[#00f3ff] animate-bounce shadow-[0_0_6px_#00f3ff]"
                  style={{ animationDelay: '150ms' }}
                />
                <div
                  className="w-2 h-2 rounded-full bg-[#b026ff] animate-bounce shadow-[0_0_6px_#b026ff]"
                  style={{ animationDelay: '300ms' }}
                />
              </div>
              <span className="font-mono text-[#00f3ff]">Processing prompt...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};
