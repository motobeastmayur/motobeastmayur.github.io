import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Paperclip,
  Globe,
  Mic,
  MicOff,
  X,
  FileText,
  Loader2,
} from 'lucide-react';
import { ChatAttachment } from '../types';
import { ModelSelectorDropdown } from './ModelSelectorDropdown';

interface NeonInputBarProps {
  onSendMessage: (text: string, attachment: ChatAttachment | null) => void;
  isLoading: boolean;
  selectedModel: string;
  setSelectedModel?: (modelId: string) => void;
  enableWebSearch: boolean;
  setEnableWebSearch: (enable: boolean | ((prev: boolean) => boolean)) => void;
  theme?: 'dark' | 'light';
}

export const NeonInputBar: React.FC<NeonInputBarProps> = ({
  onSendMessage,
  isLoading,
  selectedModel,
  setSelectedModel,
  enableWebSearch,
  setEnableWebSearch,
  theme = 'dark',
}) => {
  const [prompt, setPrompt] = useState('');
  const [attachment, setAttachment] = useState<ChatAttachment | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  const isLight = theme === 'light';

  // Auto-resize textarea as content expands
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        180
      )}px`;
    }
  }, [prompt]);

  const toggleSpeechRecognition = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechError('Speech recognition is not supported in this browser. Try Chrome/Edge.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsRecording(true);
        setSpeechError(null);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setPrompt((prev) => (prev ? `${prev} ${transcript}` : transcript));
      };

      recognition.onerror = (event: any) => {
        setIsRecording(false);
        if (event.error === 'not-allowed') {
          setSpeechError('Microphone permission was denied.');
        } else {
          setSpeechError(`Voice error: ${event.error}`);
        }
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      setSpeechError(`Failed to start speech recognition: ${err.message}`);
      setIsRecording(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Limit file size to 15MB
    if (file.size > 15 * 1024 * 1024) {
      setSpeechError('File exceeds 15MB limit. Please upload a smaller file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64Data = reader.result as string;
      setAttachment({
        name: file.name,
        mimeType: file.type || 'application/octet-stream',
        data: base64Data,
        size: file.size,
      });
    };
    reader.readAsDataURL(file);

    // Reset input so same file can be uploaded again if needed
    e.target.value = '';
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if ((!prompt.trim() && !attachment) || isLoading) return;
    onSendMessage(prompt.trim(), attachment);
    setPrompt('');
    setAttachment(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-3 sm:px-6 pb-3 pt-1">
      {speechError && (
        <div
          className={`mb-2 p-2 rounded-xl text-xs flex items-center justify-between shadow-sm animate-fade-in border ${
            isLight
              ? 'bg-red-50 border-red-200 text-red-700'
              : 'bg-[#1d1136] border-red-500/60 text-red-300'
          }`}
        >
          <span>{speechError}</span>
          <button
            onClick={() => setSpeechError(null)}
            className="p-1 hover:opacity-80 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Floating Input Card (Supports both Light & Dark modes) */}
      <div
        className={`backdrop-blur-2xl rounded-2xl p-3 sm:p-3.5 transition-all border ${
          isLight
            ? 'bg-white/95 border-slate-200/90 shadow-[0_4px_25px_rgba(0,0,0,0.06)] focus-within:border-violet-500/60 focus-within:shadow-[0_4px_25px_rgba(124,58,237,0.12)]'
            : 'bg-[#0c0918]/95 border-white/[0.09] shadow-[0_10px_35px_rgba(0,0,0,0.6)] focus-within:border-violet-500/60 focus-within:shadow-[0_10px_35px_rgba(124,58,237,0.15)]'
        }`}
      >
        {/* Attachment preview if any */}
        {attachment && (
          <div
            className={`mb-2 inline-flex items-center gap-2 p-1.5 pl-2.5 pr-2 rounded-xl text-xs border ${
              isLight
                ? 'bg-slate-100 border-slate-200 text-slate-800'
                : 'bg-[#151026] border-violet-500/40 text-neutral-200'
            }`}
          >
            {attachment.mimeType.startsWith('image/') ? (
              <img
                src={attachment.data}
                alt="Upload preview"
                className="w-7 h-7 rounded-lg object-cover border border-violet-500/30"
              />
            ) : (
              <FileText className="w-4 h-4 text-violet-500" />
            )}
            <div className="min-w-0 flex-1">
              <p
                className={`truncate font-medium max-w-[200px] ${
                  isLight ? 'text-slate-900' : 'text-white'
                }`}
              >
                {attachment.name}
              </p>
              <p
                className={`text-[9px] font-mono ${
                  isLight ? 'text-slate-500' : 'text-neutral-400'
                }`}
              >
                {attachment.size ? `${(attachment.size / 1024).toFixed(1)} KB` : 'Attached'}
              </p>
            </div>
            <button
              onClick={() => setAttachment(null)}
              className="p-1 rounded-lg text-neutral-400 hover:text-red-500 transition-colors cursor-pointer"
              title="Remove attachment"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Textarea */}
        <div className="relative">
          <textarea
            id="chat-prompt-textarea"
            ref={textareaRef}
            rows={1}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask MayurBot anything, or describe an image or task..."
            className={`w-full bg-transparent text-sm sm:text-base resize-none focus:outline-none min-h-[44px] max-h-44 leading-relaxed px-1 py-1 ${
              isLight
                ? 'text-slate-900 placeholder:text-slate-400'
                : 'text-white placeholder:text-neutral-500'
            }`}
          />
        </div>

        {/* Bottom Actions Row */}
        <div className="flex items-center justify-between pt-2 px-0.5">
          {/* Left Controls: Model pill, Paperclip, Web search, Mic */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Model Selector in input bar */}
            {setSelectedModel && (
              <ModelSelectorDropdown
                selectedModel={selectedModel}
                onSelectModel={setSelectedModel}
                variant="input"
                theme={theme}
              />
            )}

            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*,video/*,text/plain,application/pdf"
              className="hidden"
              id="chat-file-input"
            />

            {/* Paperclip Button */}
            <button
              id="attach-file-btn"
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`p-2 rounded-lg border transition-all cursor-pointer ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                  : 'bg-[#141022] hover:bg-[#1a142c] text-neutral-300 hover:text-white border-white/[0.08] hover:border-violet-500/40'
              }`}
              title="Attach an image, video, or document"
            >
              <Paperclip className="w-3.5 h-3.5" />
            </button>

            {/* Web Search Toggle Pill */}
            <button
              id="input-websearch-btn"
              type="button"
              onClick={() => setEnableWebSearch((prev) => !prev)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                enableWebSearch
                  ? isLight
                    ? 'bg-violet-100 border-violet-300 text-violet-700 shadow-sm'
                    : 'bg-violet-600/25 border-violet-500/50 text-violet-200 shadow-sm'
                  : isLight
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                  : 'bg-[#141022] hover:bg-[#1a142c] border-white/[0.08] hover:border-violet-500/40 text-neutral-300 hover:text-white'
              }`}
              title="Toggle Google Web Search Grounding"
            >
              <Globe className={`w-3.5 h-3.5 ${enableWebSearch ? 'text-violet-500 animate-pulse' : ''}`} />
              <span>Search</span>
            </button>

            {/* Microphone Button */}
            <button
              id="input-mic-btn"
              type="button"
              onClick={toggleSpeechRecognition}
              className={`p-2 rounded-lg border transition-all cursor-pointer ${
                isRecording
                  ? isLight
                    ? 'bg-red-100 border-red-300 text-red-600 shadow-sm animate-pulse'
                    : 'bg-red-500/20 border-red-500 text-red-300 shadow-sm animate-pulse'
                  : isLight
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                  : 'bg-[#141022] hover:bg-[#1a142c] border-white/[0.08] hover:border-violet-500/40 text-neutral-300 hover:text-white'
              }`}
              title={isRecording ? 'Stop Voice Recording' : 'Dictate with Voice Input'}
            >
              {isRecording ? <MicOff className="w-3.5 h-3.5 text-red-500" /> : <Mic className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Right Control: Send Button */}
          <button
            id="submit-prompt-btn"
            type="button"
            onClick={handleSubmit}
            disabled={isLoading || (!prompt.trim() && !attachment)}
            className="w-8 h-8 rounded-lg bg-violet-600 hover:bg-violet-700 text-white flex items-center justify-center transition-all shadow-[0_2px_12px_rgba(124,58,237,0.3)] active:scale-95 disabled:opacity-30 cursor-pointer flex-shrink-0"
            title="Send prompt to MayurBot"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              <Send className="w-3.5 h-3.5 text-white ml-0.5" />
            )}
          </button>
        </div>
      </div>

      {/* Subtle Disclaimer Note */}
      <div
        className={`text-[11px] text-center mt-2.5 select-none ${
          isLight ? 'text-slate-400' : 'text-neutral-500'
        }`}
      >
        MayurBot is an independent platform. Model names are used for technological reference only. Created by MAYUR B SANNAKKI.
      </div>
    </div>
  );
};
