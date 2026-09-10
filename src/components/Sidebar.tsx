import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquarePlus,
  FolderPlus,
  Folder,
  MessageSquare,
  Pin,
  Edit2,
  Trash2,
  MoreVertical,
  X,
  Check,
  Layers,
  Settings,
} from 'lucide-react';
import { ChatSession, ChatFolder } from '../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  folders: ChatFolder[];
  onAddFolder: (name: string) => void;
  onDeleteFolder: (folderId: string) => void;
  onPinChat: (sessionId: string) => void;
  onRenameChat: (sessionId: string, newTitle: string) => void;
  onDeleteChat: (sessionId: string) => void;
  onMoveChatToFolder: (sessionId: string, folderId: string | null) => void;
  selectedFolderId: string | null;
  setSelectedFolderId: (folderId: string | null) => void;
  theme?: 'dark' | 'light';
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  folders,
  onAddFolder,
  onDeleteFolder,
  onPinChat,
  onRenameChat,
  onDeleteChat,
  onMoveChatToFolder,
  selectedFolderId,
  setSelectedFolderId,
  theme = 'dark',
}) => {
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [menuOpenSessionId, setMenuOpenSessionId] = useState<string | null>(null);
  const [renamingSessionId, setRenamingSessionId] = useState<string | null>(null);
  const [renamingTitle, setRenamingTitle] = useState('');

  const menuRef = useRef<HTMLDivElement>(null);
  const isLight = theme === 'light';

  // Close three-dot menu on click outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpenSessionId(null);
      }
    };
    if (menuOpenSessionId) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [menuOpenSessionId]);

  const handleCreateFolderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    onAddFolder(newFolderName.trim());
    setNewFolderName('');
    setIsCreatingFolder(false);
  };

  const handleStartRename = (session: ChatSession) => {
    setRenamingSessionId(session.id);
    setRenamingTitle(session.title);
    setMenuOpenSessionId(null);
  };

  const handleSaveRename = (sessionId: string) => {
    if (renamingTitle.trim()) {
      onRenameChat(sessionId, renamingTitle.trim());
    }
    setRenamingSessionId(null);
  };

  // Filter and sort sessions: Pinned first, then by updatedAt descending
  const filteredSessions = sessions.filter((s) => {
    if (!selectedFolderId) return true;
    return s.folderId === selectedFolderId;
  });

  const sortedSessions = [...filteredSessions].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return (b.updatedAt || 0) - (a.updatedAt || 0);
  });

  return (
    <>
      {/* Backdrop overlay on mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-40 w-72 flex flex-col p-3.5 transition-all duration-300 ease-in-out select-none flex-shrink-0 ${
          isLight
            ? 'bg-white border-r border-slate-200 text-slate-800'
            : 'bg-[#090712] border-r border-white/[0.07] text-neutral-200'
        } ${isOpen ? 'translate-x-0' : '-translate-x-full lg:hidden'}`}
      >
        {/* Top Button 1: Primary button */}
        <button
          id="sidebar-new-chat-btn"
          type="button"
          onClick={() => {
            onNewChat();
            if (window.innerWidth < 1024) onClose();
          }}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-medium text-xs tracking-wide transition-all shadow-[0_2px_12px_rgba(124,58,237,0.25)] border border-violet-400/25 cursor-pointer active:scale-[0.98]"
        >
          <MessageSquarePlus className="w-4 h-4 text-white" />
          <span>New Chat Workspace</span>
        </button>

        {/* Top Button 2: Folder pill */}
        <button
          id="sidebar-add-folder-btn"
          type="button"
          onClick={() => setIsCreatingFolder((prev) => !prev)}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 mt-2 rounded-xl text-xs font-medium transition-all cursor-pointer border ${
            isLight
              ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
              : 'bg-[#120e20] hover:bg-[#19142c] text-neutral-200 border-white/[0.08] hover:border-violet-500/40'
          }`}
        >
          <FolderPlus className="w-4 h-4 text-violet-500" />
          <span>New Project Folder</span>
        </button>

        {/* Inline Folder Creation Form */}
        {isCreatingFolder && (
          <form
            onSubmit={handleCreateFolderSubmit}
            className="mt-2 p-2 rounded-xl bg-[#140f24] border border-violet-500/40 space-y-2 animate-fade-in"
          >
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Folder name..."
              autoFocus
              className="w-full bg-[#0a0714] px-2.5 py-1.5 rounded-lg border border-white/[0.1] focus:border-violet-500 text-xs text-white placeholder-neutral-500 outline-none"
            />
            <div className="flex justify-end gap-1.5">
              <button
                type="button"
                onClick={() => setIsCreatingFolder(false)}
                className="px-2 py-1 rounded-md text-[11px] text-neutral-400 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-2.5 py-1 rounded-md bg-violet-600 hover:bg-violet-500 text-white text-[11px] font-medium cursor-pointer"
              >
                Create
              </button>
            </div>
          </form>
        )}

        {/* Section 1: PROJECTS */}
        <div className="mt-5 mb-2 px-1">
          <h3
            className={`text-[11px] font-semibold uppercase tracking-wider ${
              isLight ? 'text-slate-500' : 'text-neutral-400'
            }`}
          >
            PROJECTS
          </h3>
        </div>

        {folders.length === 0 ? (
          <p className={`text-xs italic px-1 mb-2 ${isLight ? 'text-slate-400' : 'text-neutral-500'}`}>
            No projects created...
          </p>
        ) : (
          <div className="space-y-1 mb-2">
            <button
              type="button"
              onClick={() => setSelectedFolderId(null)}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                selectedFolderId === null
                  ? isLight
                    ? 'bg-violet-50 text-violet-700 border border-violet-200 font-medium'
                    : 'bg-[#1a132e] text-violet-200 border border-violet-500/40 font-medium'
                  : isLight
                  ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  : 'text-neutral-400 hover:text-white hover:bg-[#120e22]'
              }`}
            >
              <span>All Workspaces</span>
              <span className={`text-[10px] font-mono ${isLight ? 'text-slate-400' : 'text-neutral-500'}`}>
                {sessions.length}
              </span>
            </button>

            {folders.map((folder) => {
              const count = sessions.filter((s) => s.folderId === folder.id).length;
              const isSelected = selectedFolderId === folder.id;

              return (
                <div
                  key={folder.id}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-all ${
                    isSelected
                      ? isLight
                        ? 'bg-violet-50 text-violet-700 border border-violet-200 font-medium'
                        : 'bg-[#1a132e] text-violet-200 border border-violet-500/40 font-medium'
                      : isLight
                      ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      : 'text-neutral-400 hover:text-white hover:bg-[#120e22]'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedFolderId(folder.id)}
                    className="flex items-center gap-2 min-w-0 flex-1 text-left cursor-pointer"
                  >
                    <Folder className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
                    <span className="truncate">{folder.name}</span>
                  </button>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono text-neutral-500">{count}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteFolder(folder.id);
                      }}
                      className="text-neutral-500 hover:text-red-400 p-0.5 cursor-pointer"
                      title="Delete folder"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Section 2: SAVED CONVERSATIONS */}
        <div className="mt-4 mb-2 px-1">
          <h3
            className={`text-[11px] font-semibold uppercase tracking-wider ${
              isLight ? 'text-slate-500' : 'text-neutral-400'
            }`}
          >
            SAVED CONVERSATIONS
          </h3>
        </div>

        <div className="flex-1 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
          {sortedSessions.length === 0 ? (
            <p className={`text-xs px-1 leading-relaxed ${isLight ? 'text-slate-400' : 'text-neutral-500'}`}>
              Start typing to save chat history automatically...
            </p>
          ) : (
            sortedSessions.map((session) => {
              const isActive = session.id === activeSessionId;
              const isRenaming = session.id === renamingSessionId;
              const isMenuOpen = session.id === menuOpenSessionId;

              return (
                <div
                  key={session.id}
                  className={`group relative rounded-xl transition-all duration-150 ${
                    isActive
                      ? isLight
                        ? 'bg-violet-50 border border-violet-200 shadow-sm'
                        : 'bg-[#18122c] border border-violet-500/40 shadow-[0_0_12px_rgba(124,58,237,0.12)]'
                      : isLight
                      ? 'bg-slate-50/70 hover:bg-slate-100 border border-slate-200/80'
                      : 'bg-[#0d0a17] hover:bg-[#140f24] border border-white/[0.05]'
                  }`}
                >
                  {isRenaming ? (
                    <div className="p-2 flex items-center gap-1.5">
                      <input
                        type="text"
                        value={renamingTitle}
                        onChange={(e) => setRenamingTitle(e.target.value)}
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveRename(session.id);
                          if (e.key === 'Escape') setRenamingSessionId(null);
                        }}
                        className="flex-1 bg-[#090710] px-2 py-1 rounded-lg border border-violet-500 text-xs text-white outline-none"
                      />
                      <button
                        onClick={() => handleSaveRename(session.id)}
                        className="p-1 rounded-md bg-violet-600/30 text-violet-300 hover:bg-violet-600/40 cursor-pointer"
                        title="Save title"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setRenamingSessionId(null)}
                        className="p-1 rounded-md text-neutral-400 hover:text-white cursor-pointer"
                        title="Cancel"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-2.5">
                      <button
                        type="button"
                        onClick={() => {
                          onSelectSession(session.id);
                          if (window.innerWidth < 1024) onClose();
                        }}
                        className="flex-1 min-w-0 text-left flex items-start gap-2 cursor-pointer"
                      >
                        <div className="mt-0.5 flex-shrink-0">
                          {session.isPinned ? (
                            <Pin className="w-3.5 h-3.5 text-violet-400 fill-violet-400/20" />
                          ) : (
                            <MessageSquare className="w-3.5 h-3.5 text-neutral-500 group-hover:text-neutral-300" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p
                            className={`text-xs font-medium truncate ${
                              isActive ? 'text-white font-semibold' : 'text-neutral-300'
                            }`}
                          >
                            {session.title || 'Untitled Conversation'}
                          </p>
                          <div className="flex items-center gap-1.5 text-[10px] text-neutral-500 font-mono mt-0.5">
                            <span>{session.messages?.length || 0} msgs</span>
                            {session.folderId && (
                              <>
                                <span>•</span>
                                <span className="text-violet-400">
                                  {folders.find((f) => f.id === session.folderId)?.name || 'Folder'}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </button>

                      {/* Options menu trigger */}
                      <div className="relative ml-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuOpenSessionId(isMenuOpen ? null : session.id);
                          }}
                          className="p-1 rounded-md text-neutral-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                          title="More options"
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>

                        {/* Dropdown menu */}
                        {isMenuOpen && (
                          <div
                            ref={menuRef}
                            className="absolute right-0 top-6 w-44 rounded-xl bg-[#0e0b1c] border border-white/[0.1] shadow-2xl p-1 z-50 animate-fade-in divide-y divide-white/[0.06]"
                          >
                            <div className="py-0.5">
                              <button
                                type="button"
                                onClick={() => {
                                  onPinChat(session.id);
                                  setMenuOpenSessionId(null);
                                }}
                                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left text-xs text-neutral-300 hover:text-white hover:bg-[#1a142e] cursor-pointer"
                              >
                                <Pin className="w-3.5 h-3.5" />
                                <span>{session.isPinned ? 'Unpin Chat' : 'Pin to Top'}</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStartRename(session)}
                                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left text-xs text-neutral-300 hover:text-white hover:bg-[#1a142e] cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                                <span>Rename</span>
                              </button>
                            </div>

                            {/* Move to folder */}
                            {folders.length > 0 && (
                              <div className="py-0.5">
                                <p className="px-2.5 py-1 text-[9px] uppercase font-mono text-neutral-500 font-semibold">
                                  Move to Folder
                                </p>
                                <button
                                  type="button"
                                  onClick={() => {
                                    onMoveChatToFolder(session.id, null);
                                    setMenuOpenSessionId(null);
                                  }}
                                  className={`w-full flex items-center gap-2 px-2.5 py-1 rounded-lg text-left text-xs hover:bg-[#1a142e] cursor-pointer ${
                                    !session.folderId ? 'text-violet-400' : 'text-neutral-400'
                                  }`}
                                >
                                  <Layers className="w-3 h-3" />
                                  <span>No Folder</span>
                                </button>
                                {folders.map((f) => (
                                  <button
                                    key={f.id}
                                    type="button"
                                    onClick={() => {
                                      onMoveChatToFolder(session.id, f.id);
                                      setMenuOpenSessionId(null);
                                    }}
                                    className={`w-full flex items-center gap-2 px-2.5 py-1 rounded-lg text-left text-xs hover:bg-[#1a142e] cursor-pointer ${
                                      session.folderId === f.id ? 'text-violet-400' : 'text-neutral-400'
                                    }`}
                                  >
                                    <Folder className="w-3 h-3 text-violet-400" />
                                    <span className="truncate">{f.name}</span>
                                  </button>
                                ))}
                              </div>
                            )}

                            {/* Delete Action */}
                            <div className="pt-0.5">
                              <button
                                type="button"
                                onClick={() => {
                                  onDeleteChat(session.id);
                                  setMenuOpenSessionId(null);
                                }}
                                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left text-xs text-red-400 hover:text-red-300 hover:bg-red-950/30 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-red-400" />
                                <span>Delete Chat</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Bottom Profile Card */}
        <div className="mt-auto pt-3">
          <div
            className={`p-2.5 rounded-xl border flex items-center justify-between ${
              isLight
                ? 'bg-slate-50 border-slate-200'
                : 'bg-[#0f0c1b] border-white/[0.08]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div
                className={`w-8 h-8 rounded-full border flex items-center justify-center font-bold text-xs ${
                  isLight
                    ? 'bg-violet-100 border-violet-200 text-violet-700'
                    : 'bg-[#1b152e] border-violet-500/30 text-violet-200'
                }`}
              >
                G
              </div>
              <div>
                <p className={`text-xs font-semibold leading-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Guest User
                </p>
                <p className={`text-[11px] leading-tight mt-0.5 ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
                  Workspace Active
                </p>
              </div>
            </div>
            <button
              type="button"
              className={`p-1 rounded-lg transition-colors cursor-pointer ${
                isLight ? 'text-slate-400 hover:text-slate-700' : 'text-neutral-400 hover:text-white'
              }`}
              title="Workspace Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
