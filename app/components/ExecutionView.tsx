// app/components/ExecutionView.tsx - 执行视图 (Cartesian 笛卡尔/建筑志纯净极简风格)

'use client';

import { useState, useEffect } from 'react';
import { Session } from '@/lib/types';
import { useTimer } from '@/lib/hooks/useTimer';
import { EnergyWisdomCard } from './EnergyWisdomCard';

interface ExecutionViewProps {
  session: Session;
  onComplete: () => void;
  onAddTask?: (title: string, estimatedMinutes: number) => void;
  onPause?: () => void;
  onResetTimer?: () => void;
}

// 柔和完成提示音 (Web Audio API 合成，零外部资源依赖)
function playSoftChime() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(523.25, now); // C5
    gain1.gain.setValueAtTime(0.08, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(659.25, now + 0.12); // E5
    gain2.gain.setValueAtTime(0.08, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.55);
  } catch (e) {
    // 忽略音频异常
  }
}

export function ExecutionView({ session, onComplete, onAddTask, onPause, onResetTimer }: ExecutionViewProps) {
  const currentTask = session.tasks.find(t => t.id === session.currentTaskId);
  const { formattedTime } = useTimer(currentTask?.startedAt);
  const [showFallback, setShowFallback] = useState(false);
  const [zenMode, setZenMode] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newMinutes, setNewMinutes] = useState(25);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEnergyCard, setShowEnergyCard] = useState(false);

  const handleAddAdHocTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onAddTask?.(newTitle.trim(), newMinutes);
    setNewTitle('');
    setShowAddForm(false);
  };

  const handleCompleteWithSound = () => {
    playSoftChime();
    onComplete();
  };

  // 键盘快捷键：Ctrl+Enter 标记完成，Alt+F 切换兜底任务，Alt+Z 切换极简模式
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleCompleteWithSound();
      } else if (e.altKey && (e.key === 'f' || e.key === 'F')) {
        e.preventDefault();
        setShowFallback((prev) => !prev);
      } else if (e.altKey && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault();
        setZenMode((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onComplete]);
  
  const completedCount = session.tasks.filter(t => t.status === 'completed').length;
  const totalCount = session.tasks.length;

  // 极简专注沉浸模式 (Zen Mode) - Cartesian Architectural Quiet Room
  if (zenMode && currentTask) {
    return (
      <div className="py-16 px-6 flex flex-col items-center justify-center text-center space-y-12 animate-fade-in relative">
        <button
          type="button"
          onClick={() => setZenMode(false)}
          className="absolute top-0 right-0 btn-cartesian-outline px-3.5 py-1.5 text-xs"
        >
          ✕ Exit Zen (Alt+Z)
        </button>

        {/* 顶部极细发丝进度 */}
        <div className="w-full max-w-md space-y-2">
          <div className="flex justify-between cartesian-micro text-cartesian-muted">
            <span>Progress Execution</span>
            <span>{completedCount} / {totalCount} Completed</span>
          </div>
          <div className="h-[1px] bg-cartesian-line/40 w-full overflow-hidden">
            <div 
              className="h-full bg-cartesian-ink transition-all duration-500"
              style={{ width: `${(completedCount / totalCount) * 100}%` }}
            />
          </div>
        </div>

        {/* 当前任务大标题 (Unified Clean Sans & Modern HeiTi) */}
        <div className="max-w-2xl space-y-3">
          <div className="cartesian-label">
            Active Channel
          </div>
          <h2 className="font-sans text-2xl md:text-3xl font-semibold text-cartesian-ink leading-snug">
            {currentTask.title}
          </h2>
          <p className="cartesian-micro text-cartesian-muted">
            Est. {currentTask.estimatedMinutes} min · Single-task Isolation
          </p>
        </div>

        {/* 笛卡尔巨大计时器 (Didone Serif Numeral) */}
        <div className="font-serif text-8xl md:text-9xl font-normal text-cartesian-ink tracking-tight select-none">
          {formattedTime}
        </div>

        {/* 极简模式下的常驻精力微提示条 */}
        <div className="w-full max-w-xl">
          <EnergyWisdomCard variant="banner" />
        </div>

        {/* 完成与暂存按钮 */}
        <div className="w-full max-w-md space-y-4">
          <button
            type="button"
            onClick={handleCompleteWithSound}
            className="w-full py-4 btn-cartesian-primary text-sm flex flex-col items-center justify-center gap-1"
          >
            <span>Complete Task</span>
            <span className="cartesian-micro text-cartesian-bg/75 tracking-widest">Ctrl + Enter</span>
          </button>

          <div className="flex items-center justify-between gap-4 pt-1">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowFallback(!showFallback)}
                className="cartesian-micro text-cartesian-muted hover:text-cartesian-ink underline transition-colors"
              >
                {showFallback ? 'Hide Fallback Routine' : '⏸ Fallback Routine (Alt+F)'}
              </button>
              {onResetTimer && (
                <button
                  type="button"
                  onClick={onResetTimer}
                  className="cartesian-micro text-cartesian-muted hover:text-cartesian-ink transition-colors"
                  title="重置当前计时，清零已耗时间"
                >
                  ↺ Reset Timer
                </button>
              )}
            </div>
            {onPause && (
              <button
                type="button"
                onClick={onPause}
                className="cartesian-micro text-cartesian-muted hover:text-cartesian-ink transition-colors"
              >
                ⏸ Pause & Save Archive
              </button>
            )}
          </div>

          {showFallback && (
            <div className="p-4 bg-white/60 border-l-2 border-cartesian-ink text-small font-body text-cartesian-ink animate-fade-in text-left">
              <span className="cartesian-micro text-cartesian-accent block mb-1">
                Fallback Routine (阻断空转反刍)：
              </span>
              {session.fallbackTask}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* 顶部常驻精力贴士横幅 */}
      <div>
        <EnergyWisdomCard variant="banner" />
      </div>

      {/* 顶部目标与操作栏 (Pure Open Layout with Single Hairline Divider) */}
      <div className="space-y-4 pb-6 border-b border-cartesian-line/40">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="cartesian-label">
            Phase 02 · Execution Channel
          </div>

          <div className="flex items-center gap-3">
            {onPause && (
              <button
                type="button"
                onClick={onPause}
                className="btn-cartesian-outline px-3 py-1.5 text-xs text-cartesian-muted hover:text-cartesian-ink"
                title="暂停并存盘，稍后可随时在历史记录中读档恢复"
              >
                ⏸ 暂存读档
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowEnergyCard(!showEnergyCard)}
              className="btn-cartesian-outline px-3.5 py-1.5 text-xs"
              title="查看精力管理技巧卡片"
            >
              {showEnergyCard ? 'Close Wisdom ✕' : '✦ Energy Wisdom'}
            </button>
            <button
              type="button"
              onClick={() => setZenMode(true)}
              className="btn-cartesian-outline px-3.5 py-1.5 text-xs"
              title="切换至极简专注全屏模式 (快捷键: Alt + Z)"
            >
              🔕 Zen Mode (Alt+Z)
            </button>
          </div>
        </div>

        {/* 总目标大标题 */}
        <h2 className="font-sans text-xl md:text-2xl font-medium text-cartesian-ink leading-relaxed">
          {session.goal}
        </h2>

        {/* 展开的精力管理技巧卡片 */}
        {showEnergyCard && (
          <div className="animate-fade-in pt-2">
            <EnergyWisdomCard />
          </div>
        )}

        {/* 进度条 (Ultra-fine 1px Hairline) */}
        <div className="space-y-2 pt-2">
          <div className="flex justify-between cartesian-micro text-cartesian-muted">
            <span>Execution Progress</span>
            <span>{completedCount} / {totalCount} Completed</span>
          </div>
          <div className="h-[2px] bg-cartesian-line/30 w-full overflow-hidden">
            <div 
              className="h-full bg-cartesian-ink transition-all duration-500"
              style={{ width: `${(completedCount / totalCount) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* 核心活动任务区 (Open Architectural Focal Section) */}
      {currentTask && (
        <div className="space-y-6 pb-8 border-b border-cartesian-line/40">
          <div className="flex items-center justify-between">
            <span className="cartesian-label text-cartesian-accent">
              Active Task
            </span>
            <span className="cartesian-micro text-cartesian-muted font-mono">
              Est. {currentTask.estimatedMinutes} Min · Single Channel Focus
            </span>
          </div>

          {/* 任务大标题 (Unified Clean Sans & Modern HeiTi) */}
          <h3 className="font-sans text-2xl md:text-3xl font-semibold text-cartesian-ink leading-snug">
            {currentTask.title}
          </h3>

          {/* 计时器与完成按钮 */}
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-8 pt-4">
            <div>
              <p className="text-7xl md:text-8xl font-serif font-normal text-cartesian-ink tracking-tight select-none">
                {formattedTime}
              </p>
              <p className="cartesian-micro text-cartesian-muted mt-2">
                Active Timer · Deep Work Channel
              </p>
            </div>

            <button
              type="button"
              onClick={handleCompleteWithSound}
              className="w-full sm:w-auto px-10 py-5 btn-cartesian-primary text-xs flex flex-col items-center justify-center shrink-0"
            >
              <span className="tracking-wider font-semibold text-sm">Complete Task</span>
              <span className="cartesian-micro text-cartesian-bg/75 tracking-widest mt-1">Ctrl + Enter</span>
            </button>
          </div>

          {/* 兜底任务切换与计时重置链接 */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => setShowFallback(!showFallback)}
              className="cartesian-micro text-cartesian-muted hover:text-cartesian-ink underline transition-colors"
            >
              {showFallback ? '← Return to Active Task' : '⏸ Switch to Fallback Routine (Alt+F)'}
            </button>

            {onResetTimer && (
              <button
                type="button"
                onClick={onResetTimer}
                className="cartesian-micro text-cartesian-muted hover:text-cartesian-ink transition-colors flex items-center gap-1"
                title="重置当前计时，清零已耗时间"
              >
                <span>↺</span>
                <span>Reset Timer (重置计时)</span>
              </button>
            )}
          </div>

          {/* 兜底任务展开区域 */}
          {showFallback && (
            <div className="p-5 bg-white/50 border-l-2 border-cartesian-ink animate-fade-in space-y-2 mt-3">
              <span className="cartesian-micro text-cartesian-accent block">
                Fallback Routine / 兜底任务
              </span>
              <p className="font-sans text-sm text-cartesian-ink whitespace-pre-wrap leading-relaxed">
                {session.fallbackTask}
              </p>
              <p className="cartesian-micro text-cartesian-muted pt-1">
                遇到卡壳、编译等待或反复内耗时，换个动手的低认知活能阻断反刍思维。完成或等待结束后点击上方返回。
              </p>
            </div>
          )}
        </div>
      )}

      {/* 剩余待办队列 (Clean Architectural Open List - No Enclosing Boxes) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-cartesian-line/40">
          <h3 className="cartesian-label">
            Remaining Tasks ({session.tasks.filter(t => t.status === 'pending').length})
          </h3>
          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="cartesian-micro text-cartesian-accent hover:text-cartesian-ink transition-colors"
          >
            {showAddForm ? '✕ Cancel' : '+ Insert Sub-Task'}
          </button>
        </div>

        {/* 临时插入任务表单 */}
        {showAddForm && (
          <form
            onSubmit={handleAddAdHocTask}
            className="p-4 bg-white/60 border border-cartesian-line/50 flex flex-wrap items-center gap-3 animate-fade-in mb-4"
          >
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="临时发现需要执行的任务标题..."
              className="flex-1 px-3.5 py-2 font-body text-small min-w-[200px]"
              autoFocus
            />
            <div className="flex items-center gap-2 shrink-0">
              <input
                type="number"
                min="1"
                max="120"
                value={newMinutes}
                onChange={(e) => setNewMinutes(parseInt(e.target.value) || 25)}
                className="w-16 px-2 py-2 font-body text-small text-center"
              />
              <span className="cartesian-micro text-cartesian-muted">min</span>
            </div>
            <button
              type="submit"
              disabled={!newTitle.trim()}
              className="btn-cartesian-primary px-4 py-2 text-xs disabled:opacity-40"
            >
              Insert
            </button>
          </form>
        )}

        {session.tasks.filter(t => t.status === 'pending').length > 0 ? (
          <div className="divide-y divide-cartesian-line/25 border-b border-cartesian-line/25">
            {session.tasks
              .filter(t => t.status === 'pending')
              .map((task, idx) => (
                <div 
                  key={task.id}
                  className="py-4 px-1 flex justify-between items-center hover:bg-black/[0.015] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-cartesian-muted w-5">
                      {idx + 1}.
                    </span>
                    <span className="font-body text-body text-cartesian-ink">
                      {task.title}
                    </span>
                  </div>
                  <span className="font-mono text-xs text-cartesian-muted tabular-nums shrink-0 ml-4">
                    {task.estimatedMinutes} min
                  </span>
                </div>
              ))}
          </div>
        ) : (
          !showAddForm && (
            <p className="py-6 cartesian-micro text-cartesian-muted text-center">
              这是最后一个任务，完成后将自动进入复盘飞轮。
            </p>
          )
        )}
      </div>

      {/* 已完成任务归档 */}
      {completedCount > 0 && (
        <div className="space-y-3 pt-4">
          <h3 className="cartesian-label text-cartesian-muted">
            Completed Archive ({completedCount})
          </h3>
          <div className="divide-y divide-cartesian-line/20 border-b border-cartesian-line/20">
            {session.tasks
              .filter(t => t.status === 'completed')
              .map(task => (
                <div 
                  key={task.id}
                  className="py-3 px-1 flex justify-between items-center opacity-50"
                >
                  <span className="font-body text-small text-cartesian-muted line-through">{task.title}</span>
                  <span className="cartesian-micro text-cartesian-accent shrink-0 ml-4">
                    ✓ {task.actualMinutes} min
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
