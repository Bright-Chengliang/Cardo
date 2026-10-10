// app/mobile/page.tsx - 移动端专注视图 (Cartesian 笛卡尔/建筑志风格)

'use client';

import { useEffect, useState, useCallback } from 'react';
import { Session } from '@/lib/types';
import { useElapsedTimer } from '@/lib/hooks/useTimer';
import { ENERGY_TIPS, FOCUS_PREFLIGHT_STEPS } from '@/lib/energy-tips';
import Link from 'next/link';

export default function MobilePage() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [showFallback, setShowFallback] = useState(false);
  const [showGoalFull, setShowGoalFull] = useState(false);
  const [completeLoading, setCompleteLoading] = useState(false);
  const [tipIndex, setTipIndex] = useState(0);
  const [showRitualGuide, setShowRitualGuide] = useState(false);

  // 拉取服务端当前会话
  const fetchSession = useCallback(async (silent = false) => {
    if (!silent) setSyncing(true);
    try {
      const res = await fetch('/api/session/current');
      if (res.ok) {
        const data = await res.json();
        setSession(data.session);
      }
    } catch (err) {
      console.error('Failed to sync mobile session:', err);
    } finally {
      setLoading(false);
      if (!silent) setSyncing(false);
    }
  }, []);

  // 轮询同步（每 2.5 秒与桌面端同步一次）
  useEffect(() => {
    fetchSession();
    const interval = setInterval(() => {
      fetchSession(true);
    }, 2500);
    return () => clearInterval(interval);
  }, [fetchSession]);

  const currentTask = session?.tasks?.find((t) => t.id === session.currentTaskId);
  const { formattedTime } = useElapsedTimer(
    session?.elapsedSeconds || 0,
    !!session && session.status === 'executing',
    session?.lastResumedAt
  );

  const completedCount = session?.tasks?.filter((t) => t.status === 'completed').length || 0;
  const totalCount = session?.tasks?.length || 0;

  const currentTip = ENERGY_TIPS[tipIndex % ENERGY_TIPS.length];

  const handleNextTip = () => {
    setTipIndex((prev) => (prev + 1) % ENERGY_TIPS.length);
  };

  // 标记任务完成（可指定任意任务，带触感震动反馈）
  const handleComplete = async (taskId?: string) => {
    if (completeLoading || !session) return;
    setCompleteLoading(true);

    try {
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([40, 30, 40]);
      }
    } catch (e) {
      // 忽略不支持的环境
    }

    try {
      const res = await fetch('/api/session/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskId ? { taskId } : {}),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.session) {
          setSession(data.session);
        }
      }
    } catch (err) {
      alert('标记完成失败，请检查网络');
    } finally {
      setCompleteLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-cartesian-bg text-cartesian-ink flex items-center justify-center p-6">
        <div className="px-5 py-2.5 border border-cartesian-line bg-cartesian-bg-subtle font-body text-xs uppercase tracking-[2px] animate-pulse">
          Connecting to System...
        </div>
      </main>
    );
  }

  // 无进行中的工作轮次
  if (!session || session.status === 'planning') {
    return (
      <main className="min-h-screen bg-cartesian-bg text-cartesian-ink flex flex-col justify-between p-5 space-y-6 cartesian-drafting-bg">
        <header className="flex justify-between items-center py-2 border-b border-cartesian-line">
          <div className="flex items-center gap-2">
            <span className="font-display text-lead font-normal text-cartesian-ink">Cardo Mobile</span>
            <span className="cartesian-micro px-1.5 py-0.2 border border-cartesian-line bg-cartesian-bg-subtle text-cartesian-ink">
              Live
            </span>
          </div>
          <span className="w-2 h-2 rounded-full bg-cartesian-ink" title="Connected" />
        </header>

        <div className="bg-white/70 border border-cartesian-line p-6 text-center space-y-4 my-auto">
          <div className="cartesian-label">System Standby</div>
          <h2 className="font-display text-h3 font-normal text-cartesian-ink">暂无进行中的轮次</h2>
          <p className="font-body text-cartesian-muted text-small leading-relaxed">
            请在电脑端规划并开始一轮工作，手机将自动实时同步并作为副屏计时打卡。
          </p>

          <button
            type="button"
            onClick={() => setShowRitualGuide(!showRitualGuide)}
            className="w-full py-2.5 btn-cartesian-outline text-xs"
          >
            {showRitualGuide ? '✕ Hide Pre-Flight Guide' : '📋 View 4-Step Pre-Flight Guide'}
          </button>

          {/* 4 步仪式就绪展开 */}
          {showRitualGuide && (
            <div className="p-3.5 bg-cartesian-bg-subtle/50 border border-cartesian-line text-left space-y-2.5 animate-fade-in">
              <span className="cartesian-micro text-cartesian-accent block">
                [Pre-Flight Protocols]
              </span>
              {FOCUS_PREFLIGHT_STEPS.map((s) => (
                <div key={s.stepNumber} className="border-b border-cartesian-line/40 pb-2 last:border-0">
                  <span className="font-sans text-small font-medium text-cartesian-ink block">
                    {s.stepNumber}. {s.title}
                  </span>
                  <p className="cartesian-micro text-cartesian-muted mt-0.5">
                    {s.items.map((i) => i.target).join('；')}
                  </p>
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={() => fetchSession()}
            className="w-full py-2.5 btn-cartesian-primary text-xs"
          >
            ↻ Check Sync Status
          </button>
        </div>

        {/* 移动端常驻精力管理技巧 */}
        <div className="p-4 bg-white/60 border border-cartesian-line space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="cartesian-micro px-1.5 py-0.5 border border-cartesian-line bg-cartesian-bg text-cartesian-ink">
              Rule #{currentTip.id} · {currentTip.categoryLabel}
            </span>
            <button
              type="button"
              onClick={handleNextTip}
              className="cartesian-micro text-cartesian-accent hover:text-cartesian-ink underline transition-colors"
            >
              Next ↻
            </button>
          </div>
          <h4 className="font-sans text-small font-semibold text-cartesian-ink">
            {currentTip.title}
          </h4>
          <p className="font-sans text-xs text-cartesian-muted leading-relaxed">
            “{currentTip.oneLiner}”
          </p>
        </div>

        <footer className="text-center py-2">
          <Link href="/history" className="cartesian-micro text-cartesian-accent hover:text-cartesian-ink underline">
            Review Archives →
          </Link>
        </footer>
      </main>
    );
  }

  // 全部完成
  if (session.status === 'completed') {
    return (
      <main className="min-h-screen bg-cartesian-bg text-cartesian-ink flex flex-col justify-between p-6 cartesian-drafting-bg">
        <header className="flex justify-between items-center py-2 border-b border-cartesian-line">
          <span className="font-display text-h3 font-normal text-cartesian-ink">Cardo</span>
          <span className="cartesian-micro px-2 py-0.5 border border-cartesian-line bg-cartesian-bg-subtle text-cartesian-success">
            Complete
          </span>
        </header>

        <div className="bg-white/70 border border-cartesian-line p-8 text-center my-auto space-y-4">
          <div className="cartesian-label">Phase Complete</div>
          <h2 className="font-sans text-2xl font-semibold text-cartesian-ink">轮次已完成</h2>
          <p className="font-sans text-body text-cartesian-muted">“{session.goal}”</p>
          <p className="cartesian-micro text-cartesian-ink">
            Total {completedCount} tasks verified
          </p>
          <Link
            href="/history"
            className="block w-full py-3 btn-cartesian-primary text-xs text-center"
          >
            Review Archives & Trends
          </Link>
        </div>

        <footer className="text-center py-4 cartesian-micro text-cartesian-muted">
          Auto-syncs when new session starts on desktop
        </footer>
      </main>
    );
  }

  // 执行中视图
  return (
    <main className="min-h-screen bg-cartesian-bg text-cartesian-ink flex flex-col p-5 pb-8 justify-between select-none cartesian-drafting-bg">
      {/* 顶部标题与状态 */}
      <div>
        <header className="flex justify-between items-center mb-3 pb-2 border-b border-cartesian-line">
          <span className="font-display text-lead font-normal text-cartesian-ink">Cardo Mobile</span>
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                syncing ? 'bg-cartesian-warning animate-ping' : 'bg-cartesian-ink'
              }`}
            />
            <span className="cartesian-micro text-cartesian-muted">
              {syncing ? 'Syncing' : 'Live'}
            </span>
          </div>
        </header>

        {/* 精力法则常驻微提示条 */}
        <div
          onClick={handleNextTip}
          className="p-2.5 bg-[#EAF1EB] border border-[#C5D8C9] border-l-4 border-l-[#3B6647] mb-3 flex items-center justify-between gap-2 cursor-pointer transition-colors"
        >
          <span className="cartesian-micro px-1.5 py-0.5 bg-[#3B6647] text-white shrink-0 font-mono text-[10px] font-semibold">
            Rule #{currentTip.id}
          </span>
          <span className="font-body text-xs text-[#1A3320] font-medium truncate flex-1 pl-1">
            {currentTip.title}
          </span>
          <span className="cartesian-micro text-[#3B6647] shrink-0 font-mono">
            Next ↻
          </span>
        </div>

        {/* 目标折叠卡片 */}
        <div
          onClick={() => setShowGoalFull(!showGoalFull)}
          className="bg-white/60 border border-cartesian-line p-3.5 mb-3 cursor-pointer"
        >
          <div className="flex justify-between items-center mb-1">
            <span className="cartesian-label">
              Session Goal
            </span>
            <span className="cartesian-micro text-cartesian-muted">
              {showGoalFull ? '▲ Hide' : '▼ Expand'}
            </span>
          </div>
          <p className={`font-sans text-small text-cartesian-ink ${showGoalFull ? '' : 'line-clamp-1'}`}>
            {session.goal}
          </p>
        </div>

        {/* 进度条 */}
        <div className="mb-4 space-y-1">
          <div className="flex justify-between cartesian-micro text-cartesian-muted">
            <span>Execution Track</span>
            <span>
              {completedCount}/{totalCount} Completed
            </span>
          </div>
          <div className="h-1 bg-cartesian-line/30 w-full overflow-hidden">
            <div
              className="h-full bg-cartesian-ink transition-all duration-300"
              style={{ width: `${(completedCount / totalCount) * 100}%` }}
            />
          </div>
        </div>

        {/* 主任务卡片 */}
        {currentTask && (
          <div className="bg-white/70 border border-cartesian-line p-5 mb-3 space-y-3">
            <div className="flex justify-between items-center border-b border-cartesian-line/40 pb-1.5">
              <span className="cartesian-micro px-1.5 py-0.2 border border-cartesian-line bg-cartesian-bg text-cartesian-ink">
                Active Task
              </span>
              <span className="cartesian-micro text-cartesian-muted">Single Channel</span>
            </div>
            <h3 className="font-sans text-xl font-semibold text-cartesian-ink leading-snug">
              {currentTask.title}
            </h3>

            <div className="flex items-baseline justify-between border-t border-cartesian-line pt-3">
              <div>
                <span className="font-serif text-5xl font-normal text-cartesian-ink tracking-tight">
                  {formattedTime}
                </span>
                <span className="cartesian-micro text-cartesian-muted block mt-1">
                  Total Focus Time · 本轮总用时
                </span>
              </div>
              <div className="text-right">
                <span className="cartesian-micro text-cartesian-muted block font-mono">
                  Est. {currentTask.estimatedMinutes}m
                </span>
                <span className="cartesian-micro text-cartesian-accent font-mono">
                  Paused Time Excluded
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 兜底任务切换 */}
        <button
          type="button"
          onClick={() => setShowFallback(!showFallback)}
          className="w-full py-2 mb-3 btn-cartesian-outline text-xs"
        >
          {showFallback ? '✕ Hide Fallback Routine' : '⏸ View Fallback Routine (卡壳/等待)'}
        </button>

        {showFallback && (
          <div className="bg-cartesian-bg-subtle/70 border border-cartesian-line p-4 mb-3 animate-fade-in space-y-1">
            <span className="cartesian-micro text-cartesian-accent block">
              Fallback Routine / 兜底任务
            </span>
            <p className="font-sans text-small text-cartesian-ink whitespace-pre-wrap">
              {session.fallbackTask}
            </p>
            <p className="cartesian-micro text-cartesian-muted pt-1">
              遇到卡壳、编译等待或反复内耗时，换个动手的低认知活能阻断反刍思维。
            </p>
          </div>
        )}

        {/* 待完成子任务清单 */}
        {session.tasks.filter((t) => t.status === 'pending').length > 0 && (
          <div className="mb-3 space-y-1.5">
            <span className="cartesian-label block">
              Next In Queue
            </span>
            <div className="space-y-1.5">
              {session.tasks
                .filter((t) => t.status === 'pending')
                .slice(0, 3)
                .map((t) => (
                  <div
                    key={t.id}
                    className="p-2.5 bg-white/50 flex justify-between items-center gap-2"
                  >
                    <button
                      type="button"
                      onClick={() => handleComplete(t.id)}
                      disabled={completeLoading}
                      className="w-6 h-6 flex items-center justify-center border border-cartesian-line/60 bg-white text-cartesian-muted hover:text-white hover:bg-cartesian-ink hover:border-cartesian-ink transition-colors text-xs shrink-0 disabled:opacity-40"
                      title="顺手完成该任务"
                    />
                    <span className="font-body text-xs text-cartesian-ink line-clamp-1 flex-1">
                      {t.title}
                    </span>
                    <span className="cartesian-micro text-cartesian-muted shrink-0">
                      {t.estimatedMinutes}m
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* 底部全宽大完成按钮 */}
      <div className="sticky bottom-0 pt-2">
        <button
          type="button"
          onClick={() => handleComplete()}
          disabled={completeLoading}
          className="w-full py-4 btn-cartesian-primary text-xs flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {completeLoading ? 'Updating...' : '✦ Complete Task (Check-in)'}
        </button>
      </div>
    </main>
  );
}
