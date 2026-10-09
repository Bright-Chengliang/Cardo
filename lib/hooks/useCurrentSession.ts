// lib/hooks/useCurrentSession.ts - 当前会话 Hook (支持跨设备多端实时同步)

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Session, Task } from '../types';
import { 
  getCurrentSession, 
  getSessions,
  saveSession, 
  setCurrentSession as setCurrentSessionId,
  saveSummary
} from '../storage';
import { nanoid } from 'nanoid';

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

  // 轮询服务端状态：当在执行中时，实时同步手机端的完成操作
  useEffect(() => {
    if (!session || session.status !== 'executing') return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/session/current');
        if (res.ok) {
          const data = await res.json();
          const serverS: Session | null = data.session;
          if (serverS && serverS.id === sessionRef.current?.id) {
            // 检查当前任务或状态是否发生变化
            if (
              serverS.currentTaskId !== sessionRef.current?.currentTaskId ||
              serverS.status !== sessionRef.current?.status
            ) {
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

  // 创建新会话
  const createSession = useCallback((goal: string, tasks: Task[], fallbackTask: string) => {
    const newSession: Session = {
      id: nanoid(),
      goal,
      tasks: tasks.map(t => ({ ...t, id: nanoid(), status: 'pending' })),
      fallbackTask,
      currentTaskId: null,
      status: 'planning',
      createdAt: new Date().toISOString(),
    };
    
    saveSession(newSession);
    setCurrentSessionId(newSession.id);
    setSession(newSession);
    pushServerSession(newSession);
    
    return newSession;
  }, []);

  // 开始会话（可传入刚创建的会话，避免 state 异步导致读到旧值）
  const startSession = useCallback((target?: Session) => {
    const current = target || session;
    if (!current) return;
    
    const firstTask = current.tasks[0];
    if (!firstTask) return;

    const updated: Session = {
      ...current,
      status: 'executing',
      startedAt: new Date().toISOString(),
      currentTaskId: firstTask.id,
      tasks: current.tasks.map((t, i) => 
        i === 0 
          ? { ...t, status: 'in_progress', startedAt: new Date().toISOString() }
          : t
      ),
    };

    saveSession(updated);
    setSession(updated);
    pushServerSession(updated);
  }, [session]);

  // 完成当前任务
  const completeCurrentTask = useCallback(() => {
    if (!session || !session.currentTaskId) return;

    const currentIndex = session.tasks.findIndex(t => t.id === session.currentTaskId);
    if (currentIndex === -1) return;

    const currentTask = session.tasks[currentIndex];
    const now = new Date().toISOString();
    const actualMinutes = currentTask.startedAt 
      ? Math.round((new Date(now).getTime() - new Date(currentTask.startedAt).getTime()) / 60000)
      : 0;

    // 更新当前任务为完成
    const updatedTasks = [...session.tasks];
    updatedTasks[currentIndex] = {
      ...currentTask,
      status: 'completed',
      completedAt: now,
      actualMinutes,
    };

    // 找到下一个待完成任务
    const nextTask = updatedTasks.find(t => t.status === 'pending');
    
    const updated: Session = {
      ...session,
      tasks: updatedTasks.map(t => 
        t.id === nextTask?.id 
          ? { ...t, status: 'in_progress', startedAt: now }
          : t
      ),
      currentTaskId: nextTask?.id || null,
      status: nextTask ? 'executing' : 'completed',
      completedAt: nextTask ? undefined : now,
    };

    saveSession(updated);
    setSession(updated);
    pushServerSession(updated);

    // 如果全部完成，生成总结
    if (!nextTask) {
      generateSummary(updated);
    }
  }, [session]);

  // 执行中动态插入临时子任务
  const addTaskToSession = useCallback((title: string, estimatedMinutes: number) => {
    if (!session || session.status !== 'executing') return;
    const newTask: Task = {
      id: nanoid(),
      title: title.trim(),
      estimatedMinutes: Math.max(1, estimatedMinutes),
      status: 'pending',
    };
    const updated: Session = {
      ...session,
      tasks: [...session.tasks, newTask],
    };
    saveSession(updated);
    setSession(updated);
    pushServerSession(updated);
  }, [session]);

  // 生成会话总结
  const generateSummary = useCallback((completedSession: Session) => {
    const completedTasks = completedSession.tasks.filter(t => t.status === 'completed');
    const totalEstimated = completedSession.tasks.reduce((sum, t) => sum + t.estimatedMinutes, 0);
    const totalActual = completedTasks.reduce((sum, t) => sum + (t.actualMinutes || 0), 0);
    
    // 计算准确率：实际用时在预估的 ±20% 以内算准确
    const accurateTasks = completedTasks.filter(t => {
      const actual = t.actualMinutes || 0;
      const estimated = t.estimatedMinutes;
      const diff = Math.abs(actual - estimated);
      return diff <= estimated * 0.2;
    });
    
    const accuracyRate = completedTasks.length > 0 
      ? accurateTasks.length / completedTasks.length 
      : 0;

    saveSummary({
      sessionId: completedSession.id,
      goal: completedSession.goal,
      totalTasks: completedSession.tasks.length,
      completedTasks: completedTasks.length,
      totalEstimatedMinutes: totalEstimated,
      totalActualMinutes: totalActual,
      accuracyRate,
      createdAt: completedSession.createdAt,
      completedAt: completedSession.completedAt || new Date().toISOString(),
    });
  }, []);

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

    // 确定当前应该聚焦的任务（优先当前进行中任务，其次首个待完成任务）
    let activeTaskId = target.currentTaskId;
    const pendingTask = target.tasks.find(t => t.status === 'in_progress') || target.tasks.find(t => t.status === 'pending');
    if (!activeTaskId || !target.tasks.some(t => t.id === activeTaskId && t.status !== 'completed')) {
      activeTaskId = pendingTask ? pendingTask.id : null;
    }

    const now = new Date().toISOString();
    const updated: Session = {
      ...target,
      status: activeTaskId ? 'executing' : 'completed',
      currentTaskId: activeTaskId,
      lastActiveAt: now,
      tasks: target.tasks.map(t => {
        if (t.id === activeTaskId && t.status !== 'completed') {
          return { ...t, status: 'in_progress', startedAt: t.startedAt || now };
        }
        return t;
      }),
    };

    saveSession(updated);
    setCurrentSessionId(updated.id);
    setSession(updated);
    pushServerSession(updated);
    return updated;
  }, []);

  // 暂停当前会话（暂存读档，不删除会话）
  const pauseSession = useCallback(() => {
    if (!session) return;
    const now = new Date().toISOString();
    const updated: Session = {
      ...session,
      status: 'paused',
      lastActiveAt: now,
    };
    saveSession(updated);
    setCurrentSessionId(null);
    setSession(null);
    pushServerSession(null);
  }, [session]);

  // 结束当前会话（清除）
  const endSession = useCallback(() => {
    if (session) {
      // 确保会话最后状态被存盘
      saveSession({ ...session, lastActiveAt: new Date().toISOString() });
    }
    setCurrentSessionId(null);
    setSession(null);
    pushServerSession(null);
  }, [session]);

  // 重置当前任务计时器（清零已耗时间）
  const resetCurrentTaskTimer = useCallback(() => {
    if (!session) return;
    const now = new Date().toISOString();
    const activeTaskId = session.currentTaskId;
    const updated: Session = {
      ...session,
      startedAt: now,
      lastActiveAt: now,
      tasks: session.tasks.map(t =>
        t.id === activeTaskId
          ? { ...t, startedAt: now, actualMinutes: 0 }
          : t
      ),
    };
    saveSession(updated);
    setSession(updated);
    pushServerSession(updated);
  }, [session]);

  return {
    session,
    loading,
    createSession,
    startSession,
    resumeSession,
    pauseSession,
    resetCurrentTaskTimer,
    completeCurrentTask,
    addTaskToSession,
    endSession,
  };
}
