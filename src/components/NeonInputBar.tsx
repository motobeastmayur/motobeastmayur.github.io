import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Paperclip,
  Globe,
  Mic,
  MicOff,
  X,
  Loader2,
  FileText,
  Zap,
} from 'lucide-react';
import { ChatAttachment } from '../types';
import { AVAILABLE_MODELS } from '../data/models';

interface NeonInputBarProps {
  onSendMessage: (text: string, attachment?: ChatAttachment | null) => void;
  isLoading: boolean;
  selectedModel: string;
  enableWebSearch: boolean;
  setEnableWebSearch: (enable: boolean | ((prev: boolean) => boolean)) => void;
}

export const NeonInputBar: React.FC<NeonInputBarProps> = ({
  onSendMessage,
  isLoading,
  selectedModel,
  enableWebSearch,
  setEnableWebSearch,
}) => {
  const [prompt, setPrompt] = useState('');
  const [attachment, setAttachment] = useState<ChatAttachment | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  const modelObj = AVAILABLE_MODELS.find((m) => m.id === selectedModel) || AVAILABLE_MODELS[0];

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [prompt]);

  const toggleSpeechRecognition = () => {
    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechError('Voice dictation is not supported in this browser.');
      setTimeout(() => setSpeechError(null), 3500);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsRecording(true);
        setSpeechError(null);
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setPrompt((prev) => (prev ? `${prev} ${transcript}` : transcript));
      };

      recognition.onerror = (event: any) => {
        setIsRecording(false);
        setSpeechError(`Voice input: ${event.error}`);
        setTimeout(() => setSpeechError(null), 3500);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsRecording(false);
      setSpeechError('Could not initialize microphone.');
      setTimeout(() => setSpeechError(null), 3500);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('File size exceeds 10MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const base64Data = uploadEvent.target?.result as string;
      setAttachment({
        name: file.name,
        mimeType: file.type || 'image/png',
        data: base64Data,
        size: file.size,
      });
    };
    reader.readAsDataURL(file);
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
    <div className="w-full max-w-3xl mx-auto px-3 sm:px-6 pb-4 pt-1">
      {speechError && (
        <div className="mb-2 p-2 rounded-xl bg-black border border-red-500/60 text-red-300 text-xs flex items-center justify-between shadow-[0_0_10px_rgba(239,68,68,0.3)] animate-fade-in">
          <span>{speechError}</span>
          <button onClick={() => setSpeechError(null)} className="p-1 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Pitch-Black Neon Input Container */}
      <div className="bg-black/90 backdrop-blur-2xl rounded-2xl sm:rounded-3xl p-3 border border-[#00f3ff]/40 shadow-[0_0_18px_rgba(0,243,255,0.2)] focus-within:border-[#00f3ff] focus-within:shadow-[0_0_24px_rgba(0,243,255,0.35)] transition-all">
        {/* Model & Search Status Badges */}
        <div className="flex items-center justify-between pb-2 px-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-black border border-[#00f3ff]/40 text-[#00f3ff] text-[11px] font-mono shadow-[0_0_8px_rgba(0,243,255,0.15)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00f3ff] animate-pulse" />
              <span>{modelObj.name}</span>
            </div>

            {enableWebSearch && (
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-black border border-[#00f3ff] text-[#00f3ff] text-[10px] font-mono shadow-[0_0_8px_rgba(0,243,255,0.25)]">
                <Globe className="w-3 h-3 text-[#00f3ff]" />
                <span>Grounded Search</span>
              </div>
            )}
          </div>

          <div className="text-[10px] text-neutral-500 font-mono hidden sm:block">
            Shift + Enter for new line • Enter to send
          </div>
        </div>

        {/* Attachment preview */}
        {attachment && (
          <div className="mt-1 mb-2 inline-flex items-center gap-2 p-1.5 pl-2.5 pr-2 rounded-xl bg-black border border-[#b026ff]/50 text-xs text-neutral-200 shadow-[0_0_10px_rgba(176,38,255,0.25)]">
            {attachment.mimeType.startsWith('image/') ? (
              <img
                src={attachment.data}
                alt="Upload preview"
                className="w-7 h-7 rounded-lg object-cover border border-[#b026ff]/40"
              />
            ) : (
              <FileText className="w-5 h-5 text-[#b026ff]" />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium max-w-[200px] text-white">{attachment.name}</p>
              <p className="text-[9px] text-neutral-400 font-mono">
                {attachment.size ? `${(attachment.size / 1024).toFixed(1)} KB` : 'Attached'}
              </p>
            </div>
            <button
              onClick={() => setAttachment(null)}
              className="p-1 rounded-lg hover:bg-neutral-900 text-neutral-400 hover:text-red-400 transition-colors"
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
            placeholder={
              enableWebSearch
                ? "Ask anything with live Google Web Search..."
                : `Ask ${modelObj.shortName} anything...`
            }
            className="w-full bg-transparent text-white placeholder-neutral-500 text-sm sm:text-base resize-none focus:outline-none max-h-48 leading-relaxed px-1 py-1"
          />
        </div>

        {/* Bottom Actions Row */}
        <div className="flex items-center justify-between pt-2 px-1">
          <div className="flex items-center gap-1.5">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/png,image/jpeg,image/webp,image/gif,text/plain,application/pdf"
              className="hidden"
              id="chat-file-input"
            />

            {/* Attach button */}
            <button
              id="attach-file-btn"
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-xl bg-black hover:bg-neutral-950 text-neutral-300 hover:text-[#00f3ff] border border-neutral-800 hover:border-[#00f3ff]/60 hover:shadow-[0_0_10px_rgba(0,243,255,0.3)] transition-all cursor-pointer"
              title="Attach an image or file"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            {/* Web Search toggle */}
            <button
              id="input-websearch-btn"
              type="button"
              onClick={() => setEnableWebSearch((prev) => !prev)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                enableWebSearch
                  ? 'bg-[#00f3ff]/15 border-[#00f3ff] text-[#00f3ff] shadow-[0_0_10px_rgba(0,243,255,0.35)]'
                  : 'bg-black border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700'
              }`}
              title="Toggle Google Web Search Grounding"
            >
              <Globe className={`w-3.5 h-3.5 ${enableWebSearch ? 'text-[#00f3ff]' : ''}`} />
              <span className="hidden sm:inline">Web Search</span>
            </button>

            {/* Microphone button */}
            <button
              id="input-mic-btn"
              type="button"
              onClick={toggleSpeechRecognition}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                isRecording
                  ? 'bg-black border-red-500 text-red-400 shadow-[0_0_12px_rgba(239,68,68,0.5)] animate-pulse'
                  : 'bg-black border-neutral-800 text-neutral-300 hover:text-[#00f3ff] hover:border-[#00f3ff]/60 hover:shadow-[0_0_10px_rgba(0,243,255,0.3)]'
              }`}
              title={isRecording ? 'Stop Voice Recording' : 'Dictate with Voice Input'}
            >
              {isRecording ? <MicOff className="w-4 h-4 text-red-400" /> : <Mic className="w-4 h-4" />}
            </button>
          </div>

          {/* Send Button */}
          <button
            id="submit-prompt-btn"
            type="button"
            onClick={handleSubmit}
            disabled={isLoading || (!prompt.trim() && !attachment)}
            className={`flex items-center justify-center p-2.5 sm:px-4 sm:py-2 rounded-xl font-bold text-xs sm:text-sm text-black transition-all duration-200 cursor-pointer ${
              isLoading || (!prompt.trim() && !attachment)
                ? 'bg-neutral-900 text-neutral-600 border border-neutral-800 cursor-not-allowed'
                : 'bg-gradient-to-r from-[#00f3ff] to-[#b026ff] text-black hover:brightness-110 shadow-[0_0_16px_rgba(0,243,255,0.4)] hover:scale-105 active:scale-95'
            }`}
            title="Send prompt to MayurBot"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-black" />
            ) : (
              <div className="flex items-center gap-1.5">
                <span className="hidden sm:inline">Send</span>
                <Send className="w-4 h-4" />
              </div>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
