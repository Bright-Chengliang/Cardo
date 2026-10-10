// lib/types.ts - 数据模型定义

export interface Task {
  id: string;
  title: string;
  estimatedMinutes: number;
  actualMinutes?: number; // 仅手动填写（旧版本自动计时数据兼容保留）
  status: 'pending' | 'in_progress' | 'completed';
  startedAt?: string; // 历史遗留字段（旧版逐任务自动计时），新版本不再写入
  completedAt?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
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
  /** 累计专注秒数（暂停/暂存期间不增长） */
  elapsedSeconds?: number;
  /** 当前执行段起点 ISO，与 elapsedSeconds 配合实时计算总用时 */
  lastResumedAt?: string;
  /** 执行期 Agent 多轮对话记忆（随会话持久化并同步到手机副屏） */
  chatHistory?: ChatMessage[];
}

export interface SessionSummary {
  sessionId: string;
  goal: string;
  totalTasks: number;
  completedTasks: number;
  totalEstimatedMinutes: number;
  totalActualMinutes: number;
  accuracyRate: number; // 装饰性指标：仅基于手动填写了用时的任务计算
  timedTasks?: number; // 有独立用时的任务数（为 0 时准确率不展示）
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
