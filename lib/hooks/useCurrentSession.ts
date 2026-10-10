// lib/hooks/useCurrentSession.ts - 当前会话 Hook
// 整轮总用时计时 · 任意顺序/批量完成子任务 · 执行中实时编辑 · Agent 对话记忆 · 多端实时同步

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Session, Task, ChatMessage } from '../types';
import {
  getCurrentSession,
  getSessions,
  saveSession,
  setCurrentSession as setCurrentSessionId,
  saveSummary
} from '../storage';
import { SuggestedTask } from '../agent';
import { nanoid } from 'nanoid';

/** 计算会话总专注秒数（暂停期间不增长，执行中实时累加） */
export function getSessionElapsedSeconds(session: Session | null): number {
  if (!session) return 0;
  const base = Math.max(0, Math.floor(session.elapsedSeconds || 0));
  if (session.status === 'executing' && session.lastResumedAt) {
    const start = new Date(session.lastResumedAt).getTime();
    if (Number.isFinite(start)) {
      return base + Math.max(0, Math.floor((Date.now() - start) / 1000));
    }
  }
  return base;
}

/** 重算焦点任务：保持原焦点（仍存在且未完成），否则聚焦第一个未完成任务 */
function refocusSession(session: Session, preferredId?: string | null): Session {
  const remaining = session.tasks.filter((t) => t.status !== 'completed');
  let focus = preferredId !== undefined ? preferredId : session.currentTaskId;
  if (!focus || !remaining.some((t) => t.id === focus)) {
    focus = remaining[0]?.id ?? null;
  }
  return {
    ...session,
    currentTaskId: focus,
    tasks: session.tasks.map((t) =>
      t.status === 'completed' ? t : { ...t, status: t.id === focus ? 'in_progress' : 'pending' }
    ),
  };
}

/** 若全部子任务完成，冻结总用时并标记轮次结束 */
function finalizeIfDone(session: Session): Session {
  const allDone = session.tasks.length > 0 && session.tasks.every((t) => t.status === 'completed');
  if (!allDone || session.status === 'completed') return session;
  return {
    ...session,
    status: 'completed',
    completedAt: new Date().toISOString(),
    currentTaskId: null,
    elapsedSeconds: getSessionElapsedSeconds(session),
    lastResumedAt: undefined,
  };
}

/** 生成并保存轮次总结 */
function writeSummary(session: Session): void {
  const completedTasks = session.tasks.filter((t) => t.status === 'completed');
  const totalEstimated = session.tasks.reduce((sum, t) => sum + t.estimatedMinutes, 0);
  const totalActual = Math.round(getSessionElapsedSeconds(session) / 60);

  // 准确率为装饰性指标：仅统计手动填写过用时的任务
  const timedTasks = completedTasks.filter(
    (t) => typeof t.actualMinutes === 'number' && (t.actualMinutes || 0) > 0
  );
  const accurateTasks = timedTasks.filter(
    (t) => Math.abs((t.actualMinutes || 0) - t.estimatedMinutes) <= t.estimatedMinutes * 0.2
  );

  saveSummary({
    sessionId: session.id,
    goal: session.goal,
    totalTasks: session.tasks.length,
    completedTasks: completedTasks.length,
    totalEstimatedMinutes: totalEstimated,
    totalActualMinutes: totalActual,
    accuracyRate: timedTasks.length > 0 ? accurateTasks.length / timedTasks.length : 0,
    timedTasks: timedTasks.length,
    createdAt: session.createdAt,
    completedAt: session.completedAt || new Date().toISOString(),
  });
}

// 同步到服务端（供移动端访问）
async function pushServerSession(s: Session | null) {
  try {
    await fetch('/api/session/current', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session: s }),
    });
  } catch (e) {
    // 忽略离线同步失败
  }
}

// 服务端会话的任务/状态签名（用于检测多端变更）
function sessionSyncSignature(s: Session | null): string {
  if (!s) return 'null';
  return `${s.id}#${s.status}#${s.currentTaskId}#${s.tasks.map((t) => `${t.id}:${t.status}`).join('|')}`;
}

export function useCurrentSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const sessionRef = useRef<Session | null>(null);
  sessionRef.current = session;

  // 加载当前会话
  useEffect(() => {
    const current = getCurrentSession();
    setSession(current);
    sessionRef.current = current;
    setLoading(false);
    pushServerSession(current);
  }, []);

  // 统一提交：持久化 + 同步服务端 + 自动结算
  const commit = useCallback((next: Session) => {
    const wasCompleted = sessionRef.current?.status === 'completed';
    const updated = finalizeIfDone(next);
    saveSession(updated);
    setSession(updated);
    sessionRef.current = updated;
    pushServerSession(updated);
    if (updated.status === 'completed' && !wasCompleted) {
      writeSummary(updated);
    }
  }, []);

  // 轮询服务端状态：实时同步手机端的完成/暂停操作
  useEffect(() => {
    if (!session || (session.status !== 'executing' && session.status !== 'paused')) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/session/current');
        if (res.ok) {
          const data = await res.json();
          const serverS: Session | null = data.session;
          const local = sessionRef.current;
          if (serverS && serverS.id === local?.id) {
            // 检查任务完成情况/焦点/状态是否发生变化（手机端操作）
            if (sessionSyncSignature(serverS) !== sessionSyncSignature(local)) {
              saveSession(serverS);
              setSession(serverS);
              sessionRef.current = serverS;
            }
          }
        }
      } catch (e) {
        // 忽略轮询错误
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [session?.id, session?.status]);

  // 创建新会话（规划阶段）
  const createSession = useCallback((goal: string, tasks: Task[], fallbackTask: string) => {
    const newSession: Session = {
      id: nanoid(),
      goal,
      tasks: tasks.map(t => ({ ...t, id: nanoid(), status: 'pending' })),
      fallbackTask,
      currentTaskId: null,
      status: 'planning',
      createdAt: new Date().toISOString(),
      elapsedSeconds: 0,
      chatHistory: [],
    };

    saveSession(newSession);
    setCurrentSessionId(newSession.id);
    setSession(newSession);
    sessionRef.current = newSession;
    pushServerSession(newSession);

    return newSession;
  }, []);

  // 开始会话（可传入刚创建的会话，避免 state 异步导致读到旧值）
  const startSession = useCallback((target?: Session) => {
    const current = target || sessionRef.current;
    if (!current || current.tasks.length === 0) return;

    const now = new Date().toISOString();
    let updated: Session = {
      ...current,
      status: 'executing',
      startedAt: current.startedAt || now,
      completedAt: undefined,
      elapsedSeconds: 0,
      lastResumedAt: now,
      currentTaskId: current.currentTaskId ?? current.tasks[0].id,
    };
    updated = refocusSession(updated, updated.currentTaskId);
    commit(updated);
  }, [commit]);

  // 完成任意子任务（支持"顺手完成"多个；完成当前焦点任务自动续接下一个）
  const completeTasks = useCallback((taskIds: string[]) => {
    const current = sessionRef.current;
    if (!current || current.status !== 'executing') return;

    const idSet = new Set(taskIds.filter(Boolean));
    if (idSet.size === 0) return;

    const now = new Date().toISOString();
    let updated: Session = {
      ...current,
      tasks: current.tasks.map(t =>
        idSet.has(t.id) && t.status !== 'completed'
          ? { ...t, status: 'completed', completedAt: now }
          : t
      ),
    };
    updated = refocusSession(updated);
    commit(updated);
  }, [commit]);

  const completeCurrentTask = useCallback(() => {
    const current = sessionRef.current;
    if (!current?.currentTaskId) return;
    completeTasks([current.currentTaskId]);
  }, [completeTasks]);

  const completeTask = useCallback((taskId: string) => {
    completeTasks([taskId]);
  }, [completeTasks]);

  // 切换当前聚焦任务
  const setFocusTask = useCallback((taskId: string) => {
    const current = sessionRef.current;
    if (!current || current.status !== 'executing') return;
    if (current.tasks.some(t => t.id === taskId && t.status === 'completed')) return;
    commit(refocusSession(current, taskId));
  }, [commit]);

  // 执行中实时编辑任务
  const updateTask = useCallback((taskId: string, patch: { title?: string; estimatedMinutes?: number }) => {
    const current = sessionRef.current;
    if (!current) return;
    commit({
      ...current,
      tasks: current.tasks.map(t => {
        if (t.id !== taskId) return t;
        const next = { ...t };
        if (typeof patch.title === 'string') next.title = patch.title;
        if (typeof patch.estimatedMinutes === 'number' && Number.isFinite(patch.estimatedMinutes)) {
          next.estimatedMinutes = Math.max(1, Math.min(600, Math.round(patch.estimatedMinutes)));
        }
        return next;
      }),
    });
  }, [commit]);

  // 手动填写/修正单个子任务的用时（分钟，null 表示清除）
  const setTaskActualMinutes = useCallback((taskId: string, minutes: number | null) => {
    const current = sessionRef.current;
    if (!current) return;
    commit({
      ...current,
      tasks: current.tasks.map(t => {
        if (t.id !== taskId) return t;
        if (minutes === null || !Number.isFinite(minutes)) {
          const { actualMinutes, ...rest } = t;
          return rest;
        }
        return { ...t, actualMinutes: Math.max(0, Math.round(minutes)) };
      }),
    });
  }, [commit]);

  // 删除任务
  const deleteTask = useCallback((taskId: string) => {
    const current = sessionRef.current;
    if (!current) return;
    const tasks = current.tasks.filter(t => t.id !== taskId);
    if (tasks.length === current.tasks.length) return;
    commit(refocusSession({ ...current, tasks }));
  }, [commit]);

  // 调整未完成任务顺序（在未完成任务列表内上移/下移）
  const moveTask = useCallback((taskId: string, direction: 'up' | 'down') => {
    const current = sessionRef.current;
    if (!current) return;

    const remaining = current.tasks.filter(t => t.status !== 'completed');
    const idx = remaining.findIndex(t => t.id === taskId);
    if (idx === -1) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= remaining.length) return;

    const other = remaining[targetIdx];
    const arr = [...current.tasks];
    const a = arr.findIndex(t => t.id === taskId);
    const b = arr.findIndex(t => t.id === other.id);
    [arr[a], arr[b]] = [arr[b], arr[a]];
    commit({ ...current, tasks: arr });
  }, [commit]);

  // 执行中动态插入临时子任务
  const addTaskToSession = useCallback((title: string, estimatedMinutes: number) => {
    const current = sessionRef.current;
    if (!current || current.status !== 'executing') return;
    const newTask: Task = {
      id: nanoid(),
      title: title.trim(),
      estimatedMinutes: Math.max(1, estimatedMinutes),
      status: 'pending',
    };
    commit({ ...current, tasks: [...current.tasks, newTask] });
  }, [commit]);

  // 应用 Agent 对话返回的待办清单（保留未修改任务的 id，已完成任务不受影响）
  const applyTasksUpdate = useCallback((next: SuggestedTask[]) => {
    const current = sessionRef.current;
    if (!current) return;

    const completed = current.tasks.filter(t => t.status === 'completed');
    const oldRemaining = current.tasks.filter(t => t.status !== 'completed');

    const newTasks: Task[] = next
      .map(s => {
        const title = String(s.title || '').trim();
        if (!title) return null;
        const estimatedMinutes = Math.max(1, Math.min(600, Math.round(Number(s.estimatedMinutes) || 30)));
        const existing = s.id ? oldRemaining.find(o => o.id === s.id) : undefined;
        if (existing) return { ...existing, title, estimatedMinutes };
        return { id: nanoid(), title, estimatedMinutes, status: 'pending' as const };
      })
      .filter((t): t is Task => t !== null);

    const updated: Session = { ...current, tasks: [...completed, ...newTasks] };
    commit(refocusSession(updated));
  }, [commit]);

  // 持久化执行期 Agent 对话记忆
  const updateChatHistory = useCallback((messages: ChatMessage[]) => {
    const current = sessionRef.current;
    if (!current) return;
    commit({ ...current, chatHistory: messages });
  }, [commit]);

  // 读档/恢复历史或中断的会话
  const resumeSession = useCallback((sessionOrId: Session | string) => {
    let target: Session | null = null;
    if (typeof sessionOrId === 'string') {
      const allSessions = getSessions();
      target = allSessions.find(s => s.id === sessionOrId) || null;
    } else {
      target = sessionOrId;
    }

    if (!target) return;

    const hasRemaining = target.tasks.some(t => t.status !== 'completed');
    let updated = refocusSession(target);
    if (hasRemaining) {
      updated = {
        ...updated,
        status: 'executing',
        completedAt: undefined,
        lastResumedAt: new Date().toISOString(),
      };
    }

    setCurrentSessionId(updated.id);
    commit(updated);
    return updated;
  }, [commit]);

  // 暂停当前会话（暂存读档，不删除会话；总用时冻结）
  const pauseSession = useCallback(() => {
    const current = sessionRef.current;
    if (!current) return;
    const now = new Date().toISOString();
    const updated: Session = {
      ...current,
      status: 'paused',
      lastActiveAt: now,
      elapsedSeconds: getSessionElapsedSeconds(current),
      lastResumedAt: undefined,
    };
    saveSession(updated);
    setCurrentSessionId(null);
    setSession(null);
    sessionRef.current = null;
    pushServerSession(null);
  }, []);

  // 结束当前会话（清除）
  const endSession = useCallback(() => {
    const current = sessionRef.current;
    if (current) {
      saveSession({
        ...current,
        elapsedSeconds: getSessionElapsedSeconds(current),
        lastResumedAt: undefined,
        lastActiveAt: new Date().toISOString(),
      });
    }
    setCurrentSessionId(null);
    setSession(null);
    sessionRef.current = null;
    pushServerSession(null);
  }, []);

  // 重置整轮总计时（清零已累计时间）
  const resetSessionTimer = useCallback(() => {
    const current = sessionRef.current;
    if (!current) return;
    const now = new Date().toISOString();
    commit({
      ...current,
      elapsedSeconds: 0,
      lastResumedAt: current.status === 'executing' ? now : undefined,
      lastActiveAt: now,
    });
  }, [commit]);

  return {
    session,
    loading,
    createSession,
    startSession,
    resumeSession,
    pauseSession,
    resetSessionTimer,
    completeCurrentTask,
    completeTask,
    completeTasks,
    setFocusTask,
    updateTask,
    setTaskActualMinutes,
    deleteTask,
    moveTask,
    addTaskToSession,
    applyTasksUpdate,
    updateChatHistory,
    endSession,
  };
}
