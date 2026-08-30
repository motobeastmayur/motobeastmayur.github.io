import React from 'react';
import {
  Globe,
  Bookmark,
  Menu,
  Plus,
  Zap,
} from 'lucide-react';
import { ModelSelectorDropdown } from './ModelSelectorDropdown';

interface NeonHeaderProps {
  selectedModel: string;
  setSelectedModel: (modelId: string) => void;
  enableWebSearch: boolean;
  setEnableWebSearch: (enable: boolean | ((prev: boolean) => boolean)) => void;
  onToggleSidebar: () => void;
  onNewChat: () => void;
  onSaveChat: () => void;
  hasMessages: boolean;
}

export const NeonHeader: React.FC<NeonHeaderProps> = ({
  selectedModel,
  setSelectedModel,
  enableWebSearch,
  setEnableWebSearch,
  onToggleSidebar,
  onNewChat,
  onSaveChat,
  hasMessages,
}) => {
  return (
    <header className="sticky top-0 z-30 w-full bg-[#000000]/85 backdrop-blur-xl border-b border-[#00f3ff]/20 px-3 sm:px-6 py-2.5 shadow-[0_4px_30px_rgba(0,0,0,0.85)]">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
        {/* Left Section: Sidebar Toggle & Brand */}
        <div className="flex items-center gap-3">
          <button
            id="header-sidebar-toggle-btn"
            type="button"
            onClick={onToggleSidebar}
            className="p-1.5 rounded-xl bg-black hover:bg-neutral-900 border border-neutral-800 hover:border-[#00f3ff]/50 text-neutral-300 hover:text-[#00f3ff] transition-all cursor-pointer shadow-[0_0_10px_rgba(0,0,0,0.5)]"
            title="Toggle Workspaces & Folders"
          >
            <Menu className="w-4 h-4" />
          </button>

          {/* Clean Logo without "NEON AI" badge */}
          <div className="flex items-center gap-2">
            <div className="relative flex items-center justify-center w-7 h-7 rounded-xl bg-black border border-[#00f3ff] shadow-[0_0_10px_rgba(0,243,255,0.4)]">
              <Zap className="w-3.5 h-3.5 text-[#00f3ff] animate-pulse" />
            </div>
            <span className="font-extrabold text-base sm:text-lg tracking-tight bg-gradient-to-r from-white via-[#00f3ff] to-[#b026ff] bg-clip-text text-transparent select-none">
              MayurBot
            </span>
          </div>
        </div>

        {/* Center & Right Section: Model Selector & Actions */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Custom Floating Model Dropdown */}
          <ModelSelectorDropdown
            selectedModel={selectedModel}
            onSelectModel={setSelectedModel}
          />

          {/* Web Search Toggle */}
          <button
            id="header-websearch-btn"
            type="button"
            onClick={() => setEnableWebSearch((prev) => !prev)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer ${
              enableWebSearch
                ? 'bg-[#00f3ff]/15 border border-[#00f3ff] text-[#00f3ff] shadow-[0_0_12px_rgba(0,243,255,0.4)]'
                : 'bg-black/80 border border-neutral-800 text-neutral-400 hover:text-white hover:border-[#00f3ff]/40'
            }`}
            title="Toggle Real-time Web Search Grounding"
          >
            <Globe className={`w-3.5 h-3.5 ${enableWebSearch ? 'text-[#00f3ff] animate-pulse' : ''}`} />
            <span className="hidden md:inline">Search</span>
          </button>

          {/* Save Chat Action */}
          {hasMessages && (
            <button
              id="header-save-chat-btn"
              type="button"
              onClick={onSaveChat}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-black hover:bg-neutral-900 border border-neutral-800 hover:border-[#b026ff] text-neutral-300 hover:text-[#b026ff] text-xs font-medium transition-all duration-200 cursor-pointer hover:shadow-[0_0_12px_rgba(176,38,255,0.3)]"
              title="Save current chat session"
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Save</span>
            </button>
          )}

          {/* New Chat Quick Button */}
          <button
            id="header-new-chat-btn"
            type="button"
            onClick={onNewChat}
            className="p-1.5 rounded-xl bg-black hover:bg-neutral-900 border border-neutral-800 hover:border-[#00f3ff] text-neutral-300 hover:text-[#00f3ff] transition-all duration-200 cursor-pointer hover:shadow-[0_0_10px_rgba(0,243,255,0.3)]"
            title="Start New Chat"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
