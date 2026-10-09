// lib/types.ts - 数据模型定义

export interface Task {
  id: string;
  title: string;
  estimatedMinutes: number;
  actualMinutes?: number;
  status: 'pending' | 'in_progress' | 'completed';
  startedAt?: string;
  completedAt?: string;
}

export interface Session {
  id: string;
  goal: string;
  tasks: Task[];
  fallbackTask: string;
  currentTaskId: string | null;
  status: 'planning' | 'executing' | 'completed' | 'paused';
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  lastActiveAt?: string;
}

export interface SessionSummary {
  sessionId: string;
  goal: string;
  totalTasks: number;
  completedTasks: number;
  totalEstimatedMinutes: number;
  totalActualMinutes: number;
  accuracyRate: number; // 预估准确率 (0-1)
  createdAt: string;
  completedAt: string;
}

export interface AppConfig {
  deviceId: string;
  accessKey: string;
  serverUrl?: string;
  llmConfig?: {
    provider: 'openai' | 'anthropic';
    apiKey: string;
    baseUrl: string;
    model: string;
    favoriteModels?: string[];
  };
}
