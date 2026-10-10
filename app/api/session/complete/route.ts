// app/api/session/complete/route.ts - 移动端标记任务完成 API（支持指定任意任务/批量，整轮总用时累计）

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession, setServerSession, addServerSummary } from '@/lib/server-store';

export async function POST(req: NextRequest) {
  try {
    const session = getServerSession();
    if (!session || session.status !== 'executing') {
      return NextResponse.json({ error: 'No active session to complete' }, { status: 400 });
    }

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    // 解析要完成的任务：taskIds[] > taskId > 当前聚焦任务
    const ids: string[] = Array.isArray(body?.taskIds) && body.taskIds.length > 0
      ? body.taskIds.filter((x: any) => typeof x === 'string')
      : typeof body?.taskId === 'string' && body.taskId
        ? [body.taskId]
        : session.currentTaskId
          ? [session.currentTaskId]
          : [];

    const idSet = new Set(ids.filter(Boolean));
    if (idSet.size === 0) {
      return NextResponse.json({ error: 'No task to complete' }, { status: 400 });
    }

    const now = new Date().toISOString();
    const nowMs = new Date(now).getTime();

    // 标记完成（任意顺序，可顺手完成多个）
    let tasks = session.tasks.map((t) =>
      idSet.has(t.id) && t.status !== 'completed'
        ? { ...t, status: 'completed' as const, completedAt: now }
        : t
    );

    // 重算焦点：原焦点被完成后自动续接第一个未完成任务
    const remaining = tasks.filter((t) => t.status !== 'completed');
    let focus = session.currentTaskId;
    if (!focus || !remaining.some((t) => t.id === focus)) {
      focus = remaining[0]?.id ?? null;
    }
    tasks = tasks.map((t) =>
      t.status === 'completed'
        ? t
        : { ...t, status: t.id === focus ? ('in_progress' as const) : ('pending' as const) }
    );

    const allDone = tasks.length > 0 && tasks.every((t) => t.status === 'completed');

    // 累计整轮总用时：结算当前执行段并重置执行段起点（供多端继续实时计时）
    const segmentSeconds = session.lastResumedAt
      ? Math.max(0, Math.floor((nowMs - new Date(session.lastResumedAt).getTime()) / 1000))
      : 0;
    const elapsedSeconds = Math.max(0, Math.floor(session.elapsedSeconds || 0)) + segmentSeconds;

    const updatedSession = {
      ...session,
      tasks,
      currentTaskId: focus,
      status: allDone ? ('completed' as const) : ('executing' as const),
      completedAt: allDone ? now : undefined,
      elapsedSeconds,
      lastResumedAt: allDone ? undefined : now,
    };

    setServerSession(updatedSession);

    // 如果全部完成，自动记录服务端总结
    if (allDone) {
      const completedTasks = updatedSession.tasks.filter((t) => t.status === 'completed');
      const totalEstimated = updatedSession.tasks.reduce((sum, t) => sum + t.estimatedMinutes, 0);
      const timed = completedTasks.filter(
        (t) => typeof t.actualMinutes === 'number' && (t.actualMinutes || 0) > 0
      );
      const accurate = timed.filter(
        (t) => Math.abs((t.actualMinutes || 0) - t.estimatedMinutes) <= t.estimatedMinutes * 0.2
      );

      addServerSummary({
        sessionId: updatedSession.id,
        goal: updatedSession.goal,
        totalTasks: updatedSession.tasks.length,
        completedTasks: completedTasks.length,
        totalEstimatedMinutes: totalEstimated,
        totalActualMinutes: Math.round(elapsedSeconds / 60),
        accuracyRate: timed.length > 0 ? accurate.length / timed.length : 0,
        timedTasks: timed.length,
        createdAt: updatedSession.createdAt,
        completedAt: now,
      });
    }

    return NextResponse.json({ ok: true, session: updatedSession });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to complete task' }, { status: 500 });
  }
}
