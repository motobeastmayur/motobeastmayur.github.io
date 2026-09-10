export type ModelProvider = 'google' | 'openai' | 'anthropic' | 'deepseek';

export interface AIModel {
  id: string;
  name: string;
  shortName: string;
  provider: ModelProvider;
  description: string;
  badge: string;
  badgeColor: string;
  speed: string;
  supportsVision: boolean;
  supportsWebSearch: boolean;
  isPro?: boolean;
}

export interface ChatAttachment {
  name: string;
  mimeType: string;
  data: string; // base64 string
  size?: number;
}

export interface GroundingSource {
  title: string;
  url: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  modelUsed?: string;
  latencyMs?: number;
  attachment?: ChatAttachment;
  groundingSources?: GroundingSource[];
  error?: string;
  thoughtDurationSec?: number;
  thoughtSteps?: string[];
}

export interface ChatFolder {
  id: string;
  name: string;
  color?: string;
  createdAt: number;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  model: string;
  folderId?: string | null;
  isPinned?: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface ToastMessage {
  id: string;
  text: string;
  type?: 'info' | 'warning' | 'error' | 'success';
}
