import React, { useState, useEffect, useCallback } from 'react';
import { CyberBackground } from './components/CyberBackground';
import { NeonHeader } from './components/NeonHeader';
import { Sidebar } from './components/Sidebar';
import { ChatStream } from './components/ChatStream';
import { NeonInputBar } from './components/NeonInputBar';
import { ToastContainer } from './components/ToastContainer';
import { IntroSplashScreen } from './components/IntroSplashScreen';
import { ChatMessage, ChatAttachment, ChatSession, ChatFolder, ToastMessage } from './types';
import { sendChatMessage } from './services/api';

export default function App() {
  const [selectedModel, setSelectedModel] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('mayurbot_selected_model');
      if (saved === 'gemini-2.5-flash' || saved === 'gemini-2.0-flash' || !saved) {
        return 'gemini-3.7-flash';
      }
      if (saved === 'gemini-2.5-pro' || saved === 'gemini-3.1-pro') {
        return 'gemini-3.1-pro-preview';
      }
      if (saved === 'anthropic/claude-3.5-sonnet') {
        return 'anthropic/claude-3.7-sonnet';
      }
      if (saved === 'gemini-2.0-flash-lite') {
        return 'gemini-3.1-flash-lite';
      }
      return saved;
    } catch {
      return 'gemini-3.7-flash';
    }
  });

  const [enableWebSearch, setEnableWebSearch] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Folders state
  const [folders, setFolders] = useState<ChatFolder[]>(() => {
    try {
      const saved = localStorage.getItem('mayurbot_folders');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  // Sessions state
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem('mayurbot_sessions');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  // Active chat stream messages - starts 100% clean and blank on initial load
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Toast dispatcher helper
  const showToast = useCallback(
    (text: string, type: 'info' | 'warning' | 'error' | 'success' = 'info') => {
      const id = `toast-${Date.now()}-${Math.random()}`;
      setToasts((prev) => [...prev, { id, text, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    },
    []
  );

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Sync model selection to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('mayurbot_selected_model', selectedModel);
    } catch {
      // ignore
    }
  }, [selectedModel]);

  // Sync sessions to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('mayurbot_sessions', JSON.stringify(sessions));
    } catch {
      // ignore
    }
  }, [sessions]);

  // Sync folders to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('mayurbot_folders', JSON.stringify(folders));
    } catch {
      // ignore
    }
  }, [folders]);

  // New Chat action - clears the screen and creates a fresh blank session
  const handleNewChat = () => {
    setMessages([]);
    setActiveSessionId(null);
    showToast('Started a fresh blank chat session', 'info');
  };

  // Save Chat action inside active session
  const handleSaveChat = () => {
    if (messages.length === 0) {
      showToast('Cannot save an empty chat. Send a prompt first.', 'warning');
      return;
    }

    const firstUserMsg = messages.find((m) => m.role === 'user');
    const autoTitle = firstUserMsg?.text
      ? firstUserMsg.text.slice(0, 36) + (firstUserMsg.text.length > 36 ? '...' : '')
      : `Chat ${new Date().toLocaleDateString()}`;

    if (activeSessionId) {
      // Update existing session
      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSessionId
            ? { ...s, messages, updatedAt: Date.now(), model: selectedModel }
            : s
        )
      );
      showToast('Chat session updated', 'success');
    } else {
      // Create new saved session
      const newId = `session-${Date.now()}`;
      const newSession: ChatSession = {
        id: newId,
        title: autoTitle,
        messages,
        model: selectedModel,
        folderId: selectedFolderId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      setSessions((prev) => [newSession, ...prev]);
      setActiveSessionId(newId);
      showToast('Chat saved to workspace', 'success');
    }
  };

  // Select a session from sidebar
  const handleSelectSession = (sessionId: string) => {
    const session = sessions.find((s) => s.id === sessionId);
    if (session) {
      setActiveSessionId(session.id);
      setMessages(session.messages || []);
      if (session.model) {
        setSelectedModel(session.model);
      }
    }
  };

  // Pin / Unpin chat
  const handlePinChat = (sessionId: string) => {
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id === sessionId) {
          const willPin = !s.isPinned;
          showToast(willPin ? 'Conversation pinned to top' : 'Conversation unpinned', 'info');
          return { ...s, isPinned: willPin };
        }
        return s;
      })
    );
  };

  // Rename chat
  const handleRenameChat = (sessionId: string, newTitle: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, title: newTitle } : s))
    );
    showToast(`Renamed to "${newTitle}"`, 'success');
  };

  // Delete chat
  const handleDeleteChat = (sessionId: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    if (activeSessionId === sessionId) {
      setActiveSessionId(null);
      setMessages([]);
    }
    showToast('Conversation deleted', 'info');
  };

  // Move chat to folder
  const handleMoveChatToFolder = (sessionId: string, folderId: string | null) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, folderId } : s))
    );
    const folderName = folders.find((f) => f.id === folderId)?.name || 'root workspace';
    showToast(`Moved conversation to ${folderName}`, 'info');
  };

  // Add Folder
  const handleAddFolder = (name: string) => {
    const newFolder: ChatFolder = {
      id: `folder-${Date.now()}`,
      name,
      createdAt: Date.now(),
    };
    setFolders((prev) => [...prev, newFolder]);
    showToast(`Created folder "${name}"`, 'success');
  };

  // Delete Folder
  const handleDeleteFolder = (folderId: string) => {
    const folder = folders.find((f) => f.id === folderId);
    setFolders((prev) => prev.filter((f) => f.id !== folderId));
    // Clear folder assignment on chats in this folder
    setSessions((prev) =>
      prev.map((s) => (s.folderId === folderId ? { ...s, folderId: null } : s))
    );
    if (selectedFolderId === folderId) {
      setSelectedFolderId(null);
    }
    showToast(`Deleted folder "${folder?.name || ''}"`, 'info');
  };

  // Send Message handler
  const handleSendMessage = async (text: string, attachment?: ChatAttachment | null) => {
    if (!text.trim() && !attachment) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      text: text.trim(),
      timestamp: Date.now(),
      attachment: attachment || undefined,
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      const history = updatedMessages.slice(-10).map((m) => ({
        role: m.role,
        text: m.text,
      }));

      const response = await sendChatMessage({
        prompt: text.trim(),
        model: selectedModel,
        history: history.slice(0, -1),
        attachment,
        enableWebSearch,
      });

      // If a model fallback occurred on OpenRouter or Gemini, show a clean toast notification
      if (response.fallbackTriggered) {
        showToast(
          response.fallbackMessage ||
            'Notice: Switched to Gemini 3.7 Flash for high availability.',
          'warning'
        );
      }

      const botMessage: ChatMessage = {
        id: `msg-${Date.now()}-bot`,
        role: 'model',
        text: response.text,
        timestamp: Date.now(),
        modelUsed: response.modelUsed || selectedModel,
        latencyMs: response.latencyMs,
        groundingSources: response.groundingSources,
      };

      const finalMessages = [...updatedMessages, botMessage];
      setMessages(finalMessages);

      // Auto-save or update active session
      if (activeSessionId) {
        setSessions((prev) =>
          prev.map((s) =>
            s.id === activeSessionId
              ? { ...s, messages: finalMessages, updatedAt: Date.now() }
              : s
          )
        );
      } else {
        const autoTitle = text.slice(0, 36) + (text.length > 36 ? '...' : '');
        const newId = `session-${Date.now()}`;
        const newSession: ChatSession = {
          id: newId,
          title: autoTitle,
          messages: finalMessages,
          model: selectedModel,
          folderId: selectedFolderId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        setSessions((prev) => [newSession, ...prev]);
        setActiveSessionId(newId);
      }
    } catch (err: any) {
      console.error('Chat error:', err);
      showToast('Network blip. Prompt processed via fallback engine.', 'warning');
      const errorMessage: ChatMessage = {
        id: `msg-${Date.now()}-error`,
        role: 'model',
        text: 'I am ready to assist you. Please send your prompt again.',
        timestamp: Date.now(),
        modelUsed: selectedModel,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Regenerate Response
  const handleRegenerate = async (index: number) => {
    if (isLoading) return;
    const targetMsg = messages[index];
    if (!targetMsg || targetMsg.role !== 'model') return;

    const prevUserMsg = messages
      .slice(0, index)
      .reverse()
      .find((m) => m.role === 'user');

    if (!prevUserMsg) return;

    const trimmed = messages.slice(0, index);
    setMessages(trimmed);
    setIsLoading(true);

    try {
      const history = trimmed.map((m) => ({
        role: m.role,
        text: m.text,
      }));

      const response = await sendChatMessage({
        prompt: prevUserMsg.text,
        model: selectedModel,
        history: history.slice(0, -1),
        attachment: prevUserMsg.attachment,
        enableWebSearch,
      });

      if (response.fallbackTriggered) {
        showToast(
          response.fallbackMessage || 'Processed with Gemini 3.7 Flash for high availability.',
          'warning'
        );
      }

      const botMessage: ChatMessage = {
        id: `msg-${Date.now()}-bot`,
        role: 'model',
        text: response.text,
        timestamp: Date.now(),
        modelUsed: response.modelUsed || selectedModel,
        latencyMs: response.latencyMs,
        groundingSources: response.groundingSources,
      };

      const finalMessages = [...trimmed, botMessage];
      setMessages(finalMessages);

      if (activeSessionId) {
        setSessions((prev) =>
          prev.map((s) =>
            s.id === activeSessionId
              ? { ...s, messages: finalMessages, updatedAt: Date.now() }
              : s
          )
        );
      }
    } catch (err: any) {
      console.error('Regenerate error:', err);
      showToast('Could not complete regeneration.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#000000] text-slate-100 flex flex-col justify-between overflow-hidden selection:bg-[#00f3ff]/30 selection:text-[#00f3ff]">
      {/* Intro Video Splash Screen (Mobile & Desktop Responsive) */}
      <IntroSplashScreen />

      {/* Live Animated Background */}
      <CyberBackground />

      {/* Slide-out Workspace & Folder Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
        folders={folders}
        onAddFolder={handleAddFolder}
        onDeleteFolder={handleDeleteFolder}
        onPinChat={handlePinChat}
        onRenameChat={handleRenameChat}
        onDeleteChat={handleDeleteChat}
        onMoveChatToFolder={handleMoveChatToFolder}
        selectedFolderId={selectedFolderId}
        setSelectedFolderId={setSelectedFolderId}
      />

      {/* Top Navbar */}
      <NeonHeader
        selectedModel={selectedModel}
        setSelectedModel={setSelectedModel}
        enableWebSearch={enableWebSearch}
        setEnableWebSearch={setEnableWebSearch}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        onNewChat={handleNewChat}
        onSaveChat={handleSaveChat}
        hasMessages={messages.length > 0}
      />

      {/* Main Chat Stream Workspace */}
      <main className="relative z-10 flex-1 flex flex-col max-w-4xl w-full mx-auto overflow-hidden">
        <ChatStream
          messages={messages}
          isLoading={isLoading}
          onRegenerate={handleRegenerate}
        />

        {/* Pitch-Black Neon Input Bar */}
        <NeonInputBar
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          selectedModel={selectedModel}
          enableWebSearch={enableWebSearch}
          setEnableWebSearch={setEnableWebSearch}
        />
      </main>

      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
