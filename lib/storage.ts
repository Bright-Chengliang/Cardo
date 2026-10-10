// lib/storage.ts - localStorage 封装 (Cardo / 兼容历史 focus 数据)

import { Session, SessionSummary, AppConfig, Task } from './types';

const STORAGE_KEYS = {
  SESSIONS: 'cardo_sessions',
  CURRENT_SESSION: 'cardo_current_session',
  SUMMARIES: 'cardo_summaries',
  CONFIG: 'cardo_config',
  LEGACY_SESSIONS: 'focus_sessions',
  LEGACY_CURRENT_SESSION: 'focus_current_session',
  LEGACY_SUMMARIES: 'focus_summaries',
  LEGACY_CONFIG: 'focus_config',
} as const;

// 会话存储
export function saveSession(session: Session): void {
  if (typeof window === 'undefined') return;
  
  const sessions = getSessions();
  const index = sessions.findIndex(s => s.id === session.id);
  const updatedSession = {
    ...session,
    lastActiveAt: new Date().toISOString(),
  };
  
  if (index >= 0) {
    sessions[index] = updatedSession;
  } else {
    sessions.unshift(updatedSession); // 新的排在最前
  }
  
  localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
}

export function getSessions(): Session[] {
  if (typeof window === 'undefined') return [];
  
  // 优先读取新 cardo 键，若无则平滑迁移旧 focus 键
  let data = localStorage.getItem(STORAGE_KEYS.SESSIONS);
  if (!data) {
    data = localStorage.getItem(STORAGE_KEYS.LEGACY_SESSIONS);
    if (data) {
      localStorage.setItem(STORAGE_KEYS.SESSIONS, data);
    }
  }
  if (!data) return [];
  try {
    const list: Session[] = JSON.parse(data);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function getIncompleteSessions(): Session[] {
  const sessions = getSessions();
  return sessions.filter((s) => s.status === 'executing' || s.status === 'paused' || s.status === 'planning');
}

export function getSession(id: string): Session | null {
  const sessions = getSessions();
  return sessions.find(s => s.id === id) || null;
}

export function deleteSession(id: string): void {
  if (typeof window === 'undefined') return;
  
  const sessions = getSessions().filter(s => s.id !== id);
  localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
  deleteSummary(id);
}

// 更新会话内单个任务字段（历史页补录用时/标题等），不刷新 lastActiveAt
export function updateSessionTaskField(
  sessionId: string,
  taskId: string,
  patch: Partial<Pick<Task, 'actualMinutes' | 'title' | 'estimatedMinutes'>>
): void {
  if (typeof window === 'undefined') return;

  const sessions = getSessions();
  const index = sessions.findIndex(s => s.id === sessionId);
  if (index === -1) return;
  const session = sessions[index];
  if (!session.tasks?.some(t => t.id === taskId)) return;

  sessions[index] = {
    ...session,
    tasks: session.tasks.map(t => (t.id === taskId ? { ...t, ...patch } : t)),
  };
  localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
}

// 当前会话
export function setCurrentSession(sessionId: string | null): void {
  if (typeof window === 'undefined') return;
  
  if (sessionId === null) {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_SESSION);
    localStorage.removeItem(STORAGE_KEYS.LEGACY_CURRENT_SESSION);
  } else {
    localStorage.setItem(STORAGE_KEYS.CURRENT_SESSION, sessionId);
  }
}

export function getCurrentSessionId(): string | null {
  if (typeof window === 'undefined') return null;
  
  return localStorage.getItem(STORAGE_KEYS.CURRENT_SESSION) || localStorage.getItem(STORAGE_KEYS.LEGACY_CURRENT_SESSION);
}

export function getCurrentSession(): Session | null {
  const id = getCurrentSessionId();
  return id ? getSession(id) : null;
}

// 会话总结
export function saveSummary(summary: SessionSummary): void {
  if (typeof window === 'undefined') return;
  
  const summaries = getSummaries();
  summaries.unshift(summary); // 新的在前
  localStorage.setItem(STORAGE_KEYS.SUMMARIES, JSON.stringify(summaries));
}

export function getSummaries(): SessionSummary[] {
  if (typeof window === 'undefined') return [];
  
  let data = localStorage.getItem(STORAGE_KEYS.SUMMARIES);
  if (!data) {
    data = localStorage.getItem(STORAGE_KEYS.LEGACY_SUMMARIES);
    if (data) {
      localStorage.setItem(STORAGE_KEYS.SUMMARIES, data);
    }
  }
  return data ? JSON.parse(data) : [];
}

export function deleteSummary(sessionId: string): void {
  if (typeof window === 'undefined') return;
  const summaries = getSummaries().filter(s => s.sessionId !== sessionId);
  localStorage.setItem(STORAGE_KEYS.SUMMARIES, JSON.stringify(summaries));
}

export function clearAllHistory(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEYS.SUMMARIES);
  localStorage.removeItem(STORAGE_KEYS.SESSIONS);
  localStorage.removeItem(STORAGE_KEYS.LEGACY_SUMMARIES);
  localStorage.removeItem(STORAGE_KEYS.LEGACY_SESSIONS);
}

// 应用配置
export function saveConfig(config: Partial<AppConfig>): void {
  if (typeof window === 'undefined') return;
  
  const current = getConfig();
  const updated = { ...current, ...config };
  localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(updated));
}

export function getConfig(): AppConfig {
  if (typeof window === 'undefined') {
    return {
      deviceId: '',
      accessKey: '',
    };
  }
  
  const data = localStorage.getItem(STORAGE_KEYS.CONFIG) || localStorage.getItem(STORAGE_KEYS.LEGACY_CONFIG);
  if (data) {
    return JSON.parse(data);
  }
  
  // 首次使用，生成默认配置（直接写入避免递归）
  const config: AppConfig = {
    deviceId: generateId(),
    accessKey: generateId(),
  };
  localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
  return config;
}

// 工具函数
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
