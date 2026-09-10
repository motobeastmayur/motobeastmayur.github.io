import React from 'react';
import {
  PanelLeft,
  Bot,
  Sun,
  Moon,
  Plus,
} from 'lucide-react';

interface NeonHeaderProps {
  onToggleSidebar: () => void;
  onNewChat: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const NeonHeader: React.FC<NeonHeaderProps> = ({
  onToggleSidebar,
  onNewChat,
  theme,
  onToggleTheme,
}) => {
  const isLight = theme === 'light';

  return (
    <header
      className={`sticky top-0 z-30 w-full backdrop-blur-xl border-b px-3 sm:px-6 py-2.5 transition-colors duration-200 ${
        isLight
          ? 'bg-white/95 border-slate-200/90 shadow-sm'
          : 'bg-[#090712]/95 border-white/[0.07]'
      }`}
    >
      <div className="w-full flex items-center justify-between gap-3">
        {/* Left Section: Sidebar Toggle & Brand */}
        <div className="flex items-center gap-3">
          <button
            id="header-sidebar-toggle-btn"
            type="button"
            onClick={onToggleSidebar}
            className={`p-2 rounded-lg border transition-all cursor-pointer shadow-sm ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                : 'bg-[#120e20] hover:bg-[#18132b] border-white/[0.08] hover:border-violet-500/40 text-neutral-300 hover:text-white'
            }`}
            title="Toggle Sidebar"
          >
            <PanelLeft className="w-4 h-4" />
          </button>

          {/* Bot Logo & Name */}
          <div className="flex items-center gap-2 select-none">
            <div
              className={`relative flex items-center justify-center w-7 h-7 rounded-lg border shadow-sm ${
                isLight
                  ? 'bg-violet-100 border-violet-200 text-violet-600'
                  : 'bg-[#19122c] border-violet-500/30 text-violet-300'
              }`}
            >
              <Bot className="w-4 h-4" />
            </div>
            <span
              className={`font-semibold text-sm tracking-tight ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}
            >
              MayurBot
            </span>
          </div>
        </div>

        {/* Right Section: Theme Toggle & Quick Mobile New Chat */}
        <div className="flex items-center gap-2">
          {/* Quick New Chat button on mobile */}
          <button
            id="header-new-chat-btn"
            type="button"
            onClick={onNewChat}
            className={`sm:hidden p-2 rounded-lg border transition-colors cursor-pointer ${
              isLight
                ? 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                : 'bg-[#120e20] border-white/[0.08] text-neutral-300 hover:text-white'
            }`}
            title="New Chat"
          >
            <Plus className="w-4 h-4" />
          </button>

          {/* Working Light Mode / Dark Mode Toggle Button */}
          <button
            id="header-theme-toggle-btn"
            type="button"
            onClick={onToggleTheme}
            className={`p-2 rounded-lg border transition-all cursor-pointer shadow-sm ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700 hover:text-slate-900'
                : 'bg-[#120e20] hover:bg-[#18132b] border-white/[0.08] hover:border-violet-500/40 text-neutral-300 hover:text-white'
            }`}
            title={isLight ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            aria-label={isLight ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          >
            {isLight ? (
              <Moon className="w-4 h-4 text-indigo-600 transition-transform rotate-0" />
            ) : (
              <Sun className="w-4 h-4 text-amber-400 transition-transform rotate-0" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
