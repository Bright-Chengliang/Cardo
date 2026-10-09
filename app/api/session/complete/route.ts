// app/api/session/complete/route.ts - 移动端标记任务完成 API

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession, setServerSession, addServerSummary } from '@/lib/server-store';

export async function POST(req: NextRequest) {
  try {
    const session = getServerSession();
    if (!session || session.status !== 'executing' || !session.currentTaskId) {
      return NextResponse.json({ error: 'No active task to complete' }, { status: 400 });
    }

    const currentIndex = session.tasks.findIndex((t) => t.id === session.currentTaskId);
    if (currentIndex === -1) {
      return NextResponse.json({ error: 'Current task not found' }, { status: 404 });
    }

    const currentTask = session.tasks[currentIndex];
    const now = new Date().toISOString();
    const actualMinutes = currentTask.startedAt
      ? Math.max(1, Math.round((new Date(now).getTime() - new Date(currentTask.startedAt).getTime()) / 60000))
      : 1;

    // 更新当前任务为已完成
    const updatedTasks = [...session.tasks];
    updatedTasks[currentIndex] = {
      ...currentTask,
      status: 'completed',
      completedAt: now,
      actualMinutes,
    };

    // 查找下一个待办任务
    const nextTask = updatedTasks.find((t) => t.status === 'pending');

    const updatedSession = {
      ...session,
      tasks: updatedTasks.map((t) =>
        t.id === nextTask?.id ? { ...t, status: 'in_progress' as const, startedAt: now } : t
      ),
      currentTaskId: nextTask?.id || null,
      status: nextTask ? ('executing' as const) : ('completed' as const),
      completedAt: nextTask ? undefined : now,
    };

    setServerSession(updatedSession);

    // 如果全部完成，自动记录服务端总结
    if (!nextTask) {
      const completedTasks = updatedSession.tasks.filter((t) => t.status === 'completed');
      const totalEstimated = updatedSession.tasks.reduce((sum, t) => sum + t.estimatedMinutes, 0);
      const totalActual = completedTasks.reduce((sum, t) => sum + (t.actualMinutes || 0), 0);
      const accurateTasks = completedTasks.filter((t) => {
        const actual = t.actualMinutes || 0;
        const est = t.estimatedMinutes;
        return Math.abs(actual - est) <= est * 0.2;
      });

      addServerSummary({
        sessionId: updatedSession.id,
        goal: updatedSession.goal,
        totalTasks: updatedSession.tasks.length,
        completedTasks: completedTasks.length,
        totalEstimatedMinutes: totalEstimated,
        totalActualMinutes: totalActual,
        accuracyRate: completedTasks.length > 0 ? accurateTasks.length / completedTasks.length : 0,
        createdAt: updatedSession.createdAt,
        completedAt: now,
      });
    }

    return NextResponse.json({ ok: true, session: updatedSession });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to complete task' }, { status: 500 });
  }
}
