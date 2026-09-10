import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
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
import { ThinkingIndicator } from './ThinkingIndicator';
import { StreamingMarkdown } from './StreamingMarkdown';

interface ChatStreamProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onRegenerate: (index: number) => void;
  selectedModel?: string;
  enableWebSearch?: boolean;
  theme?: 'dark' | 'light';
}

export const ChatStream: React.FC<ChatStreamProps> = ({
  messages,
  isLoading,
  onRegenerate,
  selectedModel,
  enableWebSearch = false,
  theme = 'dark',
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [streamedIds, setStreamedIds] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isLight = theme === 'light';

  // Auto-scroll on messages or loading state
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

  const handleStreamComplete = (msgId: string) => {
    setStreamedIds((prev) => new Set(prev).add(msgId));
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const currentModelInfo = AVAILABLE_MODELS.find((m) => m.id === selectedModel);

  // Empty State
  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 select-none animate-fade-in">
        {/* Bot avatar */}
        <div
          className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5 shadow-sm border ${
            isLight
              ? 'bg-violet-100 border-violet-200 text-violet-600'
              : 'bg-[#140e26] border-white/[0.08] text-violet-300 shadow-[0_4px_25px_rgba(0,0,0,0.5)]'
          }`}
        >
          <Bot className="w-7 h-7" />
        </div>

        {/* Headline */}
        <h1
          className={`text-2xl sm:text-3xl font-bold tracking-tight text-center mb-2.5 ${
            isLight ? 'text-slate-900' : 'text-white'
          }`}
        >
          How can MayurBot help you today?
        </h1>

        {/* Subtitle */}
        <p
          className={`text-xs sm:text-sm text-center max-w-md leading-relaxed ${
            isLight ? 'text-slate-600' : 'text-neutral-400'
          }`}
        >
          Select models like Gemini 3.7 Flash, Claude 3.7 Sonnet, or GPT-4o. Ask questions, code, analyze data, or upload files.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-6 space-y-6 custom-scrollbar">
      <div className="max-w-3xl mx-auto space-y-5">
        {messages.map((message, index) => {
          const isUser = message.role === 'user';
          const isLastMessage = index === messages.length - 1;
          const isNewBotMessage = !isUser && isLastMessage && !streamedIds.has(message.id);
          const modelInfo = AVAILABLE_MODELS.find((m) => m.id === message.modelUsed);

          return (
            <div
              key={message.id}
              className={`flex gap-3 sm:gap-3.5 ${
                isUser ? 'justify-end' : 'justify-start'
              } group animate-fade-in`}
            >
              {/* Bot Avatar */}
              {!isUser && (
                <div
                  className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center mt-1 shadow-sm border ${
                    isLight
                      ? 'bg-violet-100 border-violet-200 text-violet-600'
                      : 'bg-[#140e26] border-violet-500/30 text-violet-300'
                  }`}
                >
                  <Bot className="w-3.5 h-3.5" />
                </div>
              )}

              {/* Message Bubble */}
              <div
                className={`max-w-[90%] sm:max-w-[85%] rounded-2xl p-4 sm:p-5 space-y-3 transition-all ${
                  isUser
                    ? isLight
                      ? 'bg-violet-600 text-white rounded-tr-sm shadow-sm border border-violet-500'
                      : 'bg-[#1a132c] text-white rounded-tr-sm border border-violet-500/30 shadow-sm'
                    : isLight
                    ? 'bg-white text-slate-800 rounded-tl-sm border border-slate-200/90 shadow-sm'
                    : 'bg-[#0c0918]/95 text-neutral-200 rounded-tl-sm border border-white/[0.08] shadow-sm'
                }`}
              >
                {/* User attachment preview */}
                {message.attachment && (
                  <div className="mb-2">
                    {message.attachment.mimeType.startsWith('image/') ? (
                      <img
                        src={message.attachment.data}
                        alt="Uploaded attachment"
                        className={`max-h-64 rounded-xl border object-contain shadow-md ${
                          isLight ? 'border-slate-200' : 'border-white/[0.1]'
                        }`}
                      />
                    ) : (
                      <div
                        className={`inline-flex items-center gap-2 p-2 rounded-xl text-xs border ${
                          isLight
                            ? 'bg-slate-100 border-slate-200 text-slate-800'
                            : 'bg-[#140e26] border-white/[0.08] text-neutral-200'
                        }`}
                      >
                        <FileText className="w-4 h-4 text-violet-500" />
                        <span>{message.attachment.name}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Header info for Bot messages */}
                {!isUser && (
                  <div
                    className={`flex items-center justify-between pb-2 border-b text-xs ${
                      isLight ? 'border-slate-200' : 'border-white/[0.06]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`font-semibold tracking-wide ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        MayurBot
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-mono uppercase border ${
                          isLight
                            ? 'bg-violet-50 text-violet-700 border-violet-200'
                            : 'bg-[#140e26] text-violet-300 border border-violet-500/30'
                        }`}
                      >
                        {modelInfo ? modelInfo.shortName : (message.modelUsed || 'Auto')}
                      </span>
                    </div>

                    <div
                      className={`flex items-center gap-2 text-[10px] font-mono ${
                        isLight ? 'text-slate-400' : 'text-neutral-400'
                      }`}
                    >
                      {message.latencyMs && (
                        <span className="flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5 text-violet-500" />
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

                {/* Completed Gemini Thinking Process Pill */}
                {!isUser && (
                  <ThinkingIndicator
                    isLive={false}
                    durationSec={
                      message.thoughtDurationSec ||
                      (message.latencyMs ? +(message.latencyMs / 1000).toFixed(1) : 1.8)
                    }
                    thoughtSteps={message.thoughtSteps}
                    theme={theme}
                  />
                )}

                {/* Markdown Content (Streaming for newly arrived message, static for others) */}
                <div className="text-sm sm:text-[15px] leading-relaxed">
                  {message.error ? (
                    <div className="p-3 rounded-xl bg-red-950/30 border border-red-500/40 text-red-300 text-xs shadow-sm">
                      {message.error}
                    </div>
                  ) : (
                    <StreamingMarkdown
                      content={message.text}
                      isNew={isNewBotMessage}
                      onStreamComplete={() => handleStreamComplete(message.id)}
                      theme={theme}
                    />
                  )}
                </div>

                {/* Grounding Web Sources Display */}
                {message.groundingSources && message.groundingSources.length > 0 && (
                  <div
                    className={`mt-3 pt-2.5 border-t space-y-1.5 ${
                      isLight ? 'border-slate-200' : 'border-white/[0.06]'
                    }`}
                  >
                    <div className="text-[10px] uppercase font-mono tracking-wider text-violet-500 flex items-center gap-1 font-semibold">
                      <Globe className="w-3 h-3 text-violet-500" />
                      <span>Google Search Grounding Sources</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {message.groundingSources.map((source, idx) => (
                        <a
                          key={idx}
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] border transition-all shadow-sm ${
                            isLight
                              ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border-slate-200'
                              : 'bg-[#140e26] hover:bg-[#1c1436] text-neutral-300 hover:text-white border-white/[0.08] hover:border-violet-500/40'
                          }`}
                        >
                          <span className="truncate max-w-[180px]">{source.title || source.url}</span>
                          <ExternalLink className="w-3 h-3 flex-shrink-0 text-violet-500" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Toolbar for Bot Responses */}
                {!isUser && (
                  <div
                    className={`pt-2 border-t flex items-center justify-end gap-1.5 text-xs ${
                      isLight ? 'border-slate-200 text-slate-400' : 'border-white/[0.06] text-neutral-400'
                    }`}
                  >
                    <button
                      onClick={() => handleSpeak(message.id, message.text)}
                      className={`p-1.5 rounded-lg border border-transparent transition-all cursor-pointer ${
                        speakingId === message.id
                          ? 'border-violet-500 text-violet-600 bg-violet-50'
                          : isLight
                          ? 'hover:bg-slate-100 text-slate-500 hover:text-slate-800'
                          : 'hover:bg-[#140e26] hover:border-white/[0.08] text-neutral-400 hover:text-white'
                      }`}
                      title="Read aloud with Text-to-Speech"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleCopy(message.id, message.text)}
                      className={`p-1.5 rounded-lg border border-transparent transition-all cursor-pointer ${
                        isLight
                          ? 'hover:bg-slate-100 text-slate-500 hover:text-slate-800'
                          : 'hover:bg-[#140e26] hover:border-white/[0.08] text-neutral-400 hover:text-white'
                      }`}
                      title="Copy text"
                    >
                      {copiedId === message.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      onClick={() => onRegenerate(index)}
                      className={`p-1.5 rounded-lg border border-transparent transition-all cursor-pointer ${
                        isLight
                          ? 'hover:bg-slate-100 text-slate-500 hover:text-slate-800'
                          : 'hover:bg-[#140e26] hover:border-white/[0.08] text-neutral-400 hover:text-white'
                      }`}
                      title="Regenerate response"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* User Avatar */}
              {isUser && (
                <div
                  className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center mt-1 font-bold text-xs shadow-sm border ${
                    isLight
                      ? 'bg-violet-100 border-violet-200 text-violet-700'
                      : 'bg-[#22183c] border-violet-500/40 text-violet-200'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          );
        })}

        {/* Live Active Thinking Indicator while processing (Google Gemini Style) */}
        {isLoading && (
          <div className="flex gap-3 sm:gap-3.5 justify-start animate-fade-in">
            <div
              className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center mt-1 shadow-sm border ${
                isLight
                  ? 'bg-violet-100 border-violet-200 text-violet-600'
                  : 'bg-[#140e26] border-violet-500/40 text-violet-300'
              }`}
            >
              <Bot className="w-3.5 h-3.5 animate-pulse text-violet-500" />
            </div>
            <ThinkingIndicator
              isLive={true}
              modelName={currentModelInfo?.name}
              theme={theme}
            />
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};
