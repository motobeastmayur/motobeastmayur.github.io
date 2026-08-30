import React, { useState, useRef, useEffect } from 'react';
import {
  Plus,
  FolderPlus,
  Folder,
  MessageSquare,
  Pin,
  Edit2,
  Trash2,
  MoreVertical,
  X,
  Check,
  FolderInput,
  Sparkles,
  ChevronRight,
  Layers,
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
}) => {
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [menuOpenSessionId, setMenuOpenSessionId] = useState<string | null>(null);
  const [renamingSessionId, setRenamingSessionId] = useState<string | null>(null);
  const [renamingTitle, setRenamingTitle] = useState('');

  const menuRef = useRef<HTMLDivElement>(null);

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
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-72 sm:w-80 bg-[#000000]/95 backdrop-blur-2xl border-r border-[#00f3ff]/20 flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-neutral-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#00f3ff] shadow-[0_0_8px_#00f3ff]" />
            <span className="font-bold text-sm tracking-wide text-white">Workspaces</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors cursor-pointer"
            title="Close sidebar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Controls: New Chat & Add Folder */}
        <div className="p-3 space-y-2 border-b border-neutral-900">
          {/* New Chat Button */}
          <button
            id="sidebar-new-chat-btn"
            type="button"
            onClick={() => {
              onNewChat();
              if (window.innerWidth < 1024) onClose();
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#00f3ff]/20 to-[#b026ff]/20 hover:from-[#00f3ff]/30 hover:to-[#b026ff]/30 border border-[#00f3ff]/50 hover:border-[#00f3ff] text-white font-semibold text-xs shadow-[0_0_15px_rgba(0,243,255,0.2)] hover:shadow-[0_0_20px_rgba(0,243,255,0.35)] transition-all cursor-pointer group"
          >
            <Plus className="w-4 h-4 text-[#00f3ff] group-hover:rotate-90 transition-transform duration-200" />
            <span>New Chat</span>
          </button>

          {/* Add Folder Button */}
          <button
            id="sidebar-add-folder-btn"
            type="button"
            onClick={() => setIsCreatingFolder((prev) => !prev)}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-black hover:bg-neutral-950 border border-neutral-800 hover:border-[#b026ff]/60 text-neutral-300 hover:text-[#b026ff] text-xs font-medium transition-all cursor-pointer"
          >
            <FolderPlus className="w-3.5 h-3.5 text-[#b026ff]" />
            <span>Add Folder</span>
          </button>

          {/* Inline Folder Creation Form */}
          {isCreatingFolder && (
            <form
              onSubmit={handleCreateFolderSubmit}
              className="p-2 rounded-xl bg-neutral-950 border border-[#b026ff]/40 space-y-2 animate-fade-in"
            >
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Folder name..."
                autoFocus
                className="w-full bg-black px-2.5 py-1.5 rounded-lg border border-neutral-800 focus:border-[#b026ff] text-xs text-white placeholder-neutral-500 outline-none"
              />
              <div className="flex justify-end gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsCreatingFolder(false)}
                  className="px-2 py-1 rounded-md text-[11px] text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-2.5 py-1 rounded-md bg-[#b026ff] hover:bg-[#b026ff]/90 text-white text-[11px] font-medium"
                >
                  Create
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Folders Navigation Filter */}
        {folders.length > 0 && (
          <div className="px-3 pt-3 pb-2 border-b border-neutral-900">
            <div className="text-[10px] uppercase font-mono tracking-wider text-neutral-400 font-bold mb-2 flex items-center gap-1">
              <Folder className="w-3 h-3 text-[#00f3ff]" />
              <span>Folders</span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedFolderId(null)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  selectedFolderId === null
                    ? 'bg-[#00f3ff]/20 text-[#00f3ff] border border-[#00f3ff]/50'
                    : 'bg-black text-neutral-400 hover:text-white border border-neutral-800'
                }`}
              >
                All ({sessions.length})
              </button>

              {folders.map((folder) => {
                const count = sessions.filter((s) => s.folderId === folder.id).length;
                const isSelected = selectedFolderId === folder.id;

                return (
                  <div
                    key={folder.id}
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs border transition-all ${
                      isSelected
                        ? 'bg-[#b026ff]/20 text-[#b026ff] border-[#b026ff]/60'
                        : 'bg-black text-neutral-400 hover:text-white border-neutral-800'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedFolderId(folder.id)}
                      className="cursor-pointer font-medium"
                    >
                      {folder.name} ({count})
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteFolder(folder.id);
                      }}
                      className="hover:text-red-400 p-0.5"
                      title="Delete folder"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Chat Sessions List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          <div className="text-[10px] uppercase font-mono tracking-wider text-neutral-400 font-bold px-1 mb-1">
            <span>Conversations ({sortedSessions.length})</span>
          </div>

          {sortedSessions.length === 0 ? (
            <div className="py-8 text-center text-xs text-neutral-500">
              No saved conversations yet.
            </div>
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
                      ? 'bg-neutral-950 border border-[#00f3ff]/60 shadow-[0_0_12px_rgba(0,243,255,0.15)]'
                      : 'bg-black/50 hover:bg-neutral-950/80 border border-neutral-900 hover:border-neutral-800'
                  }`}
                >
                  {isRenaming ? (
                    /* Inline Rename Mode */
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
                        className="flex-1 bg-black px-2 py-1 rounded-lg border border-[#00f3ff] text-xs text-white outline-none"
                      />
                      <button
                        onClick={() => handleSaveRename(session.id)}
                        className="p-1 rounded-md bg-[#00f3ff]/20 text-[#00f3ff] hover:bg-[#00f3ff]/30 cursor-pointer"
                        title="Save title"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setRenamingSessionId(null)}
                        className="p-1 rounded-md text-neutral-400 hover:text-white"
                        title="Cancel"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    /* Normal Session Row */
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
                            <Pin className="w-3.5 h-3.5 text-[#00f3ff] fill-[#00f3ff]/20" />
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
                                <span className="text-[#b026ff]">
                                  {folders.find((f) => f.id === session.folderId)?.name || 'Folder'}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </button>

                      {/* Three-Dot Menu Trigger */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuOpenSessionId((prev) => (prev === session.id ? null : session.id));
                          }}
                          className={`p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors cursor-pointer ${
                            isMenuOpen ? 'text-[#00f3ff] bg-neutral-900' : 'opacity-70 group-hover:opacity-100'
                          }`}
                          title="Chat Options"
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>

                        {/* Three-Dot Sleek Dropdown Menu */}
                        {isMenuOpen && (
                          <div
                            ref={menuRef}
                            className="absolute right-0 top-full mt-1 w-44 rounded-xl bg-black/95 backdrop-blur-2xl border border-[#00f3ff]/40 shadow-[0_8px_25px_rgba(0,0,0,0.9),0_0_15px_rgba(0,243,255,0.2)] p-1.5 z-50 animate-fade-in divide-y divide-neutral-900"
                          >
                            <div className="space-y-0.5 pb-1">
                              {/* Pin / Unpin */}
                              <button
                                type="button"
                                onClick={() => {
                                  onPinChat(session.id);
                                  setMenuOpenSessionId(null);
                                }}
                                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left text-xs text-neutral-300 hover:text-[#00f3ff] hover:bg-neutral-900 transition-colors cursor-pointer"
                              >
                                <Pin className="w-3.5 h-3.5 text-[#00f3ff]" />
                                <span>{session.isPinned ? 'Unpin Chat' : 'Pin Chat'}</span>
                              </button>

                              {/* Rename */}
                              <button
                                type="button"
                                onClick={() => handleStartRename(session)}
                                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left text-xs text-neutral-300 hover:text-white hover:bg-neutral-900 transition-colors cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5 text-amber-400" />
                                <span>Rename Chat</span>
                              </button>
                            </div>

                            {/* Move to Folder Options */}
                            {folders.length > 0 && (
                              <div className="py-1">
                                <div className="px-2 py-0.5 text-[9px] uppercase font-mono text-neutral-400">
                                  Folder
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    onMoveChatToFolder(session.id, null);
                                    setMenuOpenSessionId(null);
                                  }}
                                  className={`w-full flex items-center gap-2 px-2.5 py-1 rounded-lg text-left text-xs hover:bg-neutral-900 cursor-pointer ${
                                    !session.folderId ? 'text-[#00f3ff]' : 'text-neutral-400'
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
                                    className={`w-full flex items-center gap-2 px-2.5 py-1 rounded-lg text-left text-xs hover:bg-neutral-900 cursor-pointer ${
                                      session.folderId === f.id ? 'text-[#b026ff]' : 'text-neutral-400'
                                    }`}
                                  >
                                    <Folder className="w-3 h-3 text-[#b026ff]" />
                                    <span className="truncate">{f.name}</span>
                                  </button>
                                ))}
                              </div>
                            )}

                            {/* Delete Action */}
                            <div className="pt-1">
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
      </aside>
    </>
  );
};
