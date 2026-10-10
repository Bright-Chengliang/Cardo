// app/components/ExecutionView.tsx - 执行视图 (Cartesian 笛卡尔/建筑志纯净极简风格)
// 整轮总用时计时 · 任意顺序/顺手完成 · 任务实时编辑 · Agent 实时调整对话

'use client';

import { useState, useEffect } from 'react';
import { Session } from '@/lib/types';
import { SuggestedTask, ChatMessage } from '@/lib/agent';
import { useElapsedTimer } from '@/lib/hooks/useTimer';
import { EnergyWisdomCard } from './EnergyWisdomCard';
import { TaskRefineChat } from './TaskRefineChat';

interface ExecutionViewProps {
  session: Session;
  onCompleteCurrent: () => void;
  onCompleteTask: (taskId: string) => void;
  onSetFocus: (taskId: string) => void;
  onUpdateTask: (taskId: string, patch: { title?: string; estimatedMinutes?: number }) => void;
  onSetTaskActualMinutes: (taskId: string, minutes: number | null) => void;
  onDeleteTask: (taskId: string) => void;
  onMoveTask: (taskId: string, direction: 'up' | 'down') => void;
  onAddTask: (title: string, estimatedMinutes: number) => void;
  onApplyTasks: (tasks: SuggestedTask[]) => void;
  onChatChange: (messages: ChatMessage[]) => void;
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

export function ExecutionView({
  session,
  onCompleteCurrent,
  onCompleteTask,
  onSetFocus,
  onUpdateTask,
  onSetTaskActualMinutes,
  onDeleteTask,
  onMoveTask,
  onAddTask,
  onApplyTasks,
  onChatChange,
  onPause,
  onResetTimer,
}: ExecutionViewProps) {
  const currentTask = session.tasks.find(t => t.id === session.currentTaskId);
  const { formattedTime, elapsedMinutes } = useElapsedTimer(
    session.elapsedSeconds || 0,
    session.status === 'executing',
    session.lastResumedAt
  );
  const [showFallback, setShowFallback] = useState(false);
  const [zenMode, setZenMode] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newMinutes, setNewMinutes] = useState(25);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEnergyCard, setShowEnergyCard] = useState(false);

  const handleAddAdHocTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onAddTask(newTitle.trim(), newMinutes);
    setNewTitle('');
    setShowAddForm(false);
  };

  const handleCompleteWithSound = () => {
    playSoftChime();
    onCompleteCurrent();
  };

  const handleDelete = (taskId: string, title: string) => {
    if (confirm(`删除任务「${title}」？`)) {
      onDeleteTask(taskId);
    }
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
  }, [onCompleteCurrent]);

  const completedTasks = session.tasks.filter(t => t.status === 'completed');
  const pendingTasks = session.tasks.filter(t => t.status !== 'completed');
  const completedCount = completedTasks.length;
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
              style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
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

        {/* 笛卡尔巨大总用时计时器 (Didone Serif Numeral) */}
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
                  title="重置本轮总计时，清零已累计时间"
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

      {/* 顶部目标、总用时与操作栏 */}
      <div className="space-y-5 pb-6 border-b border-cartesian-line/40">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="space-y-3 flex-1 min-w-[260px]">
            <div className="cartesian-label">
              Phase 02 · Execution Channel
            </div>
            <h2 className="font-sans text-xl md:text-2xl font-medium text-cartesian-ink leading-relaxed">
              {session.goal}
            </h2>

            {/* 进度条 (Ultra-fine 1px Hairline) */}
            <div className="space-y-2 pt-1 max-w-xl">
              <div className="flex justify-between cartesian-micro text-cartesian-muted">
                <span>Execution Progress</span>
                <span>{completedCount} / {totalCount} Completed</span>
              </div>
              <div className="h-[2px] bg-cartesian-line/30 w-full overflow-hidden">
                <div 
                  className="h-full bg-cartesian-ink transition-all duration-500"
                  style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>

          {/* 整轮总用时 */}
          <div className="text-left sm:text-right shrink-0">
            <p className="text-6xl md:text-7xl font-serif font-normal text-cartesian-ink tracking-tight select-none tabular-nums">
              {formattedTime}
            </p>
            <p className="cartesian-micro text-cartesian-muted mt-2">
              Total Session Time · 本轮总用时
            </p>
            <p className="cartesian-micro text-cartesian-accent mt-0.5">
              暂停不计时 · 子任务不计独立用时（可手动补录）
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
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

        {/* 展开的精力管理技巧卡片 */}
        {showEnergyCard && (
          <div className="animate-fade-in pt-2">
            <EnergyWisdomCard />
          </div>
        )}
      </div>

      {/* 核心活动任务区 (Open Architectural Focal Section) */}
      {currentTask && (
        <div className="space-y-6 pb-8 border-b border-cartesian-line/40">
          <div className="flex items-center justify-between">
            <span className="cartesian-label text-cartesian-accent">
              Active Task
            </span>
            <span className="cartesian-micro text-cartesian-muted font-mono">
              Est. {currentTask.estimatedMinutes} Min · 可在下方清单中实时编辑
            </span>
          </div>

          {/* 任务大标题 (Unified Clean Sans & Modern HeiTi) */}
          <h3 className="font-sans text-2xl md:text-3xl font-semibold text-cartesian-ink leading-snug">
            {currentTask.title}
          </h3>

          {/* 完成按钮 */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pt-1">
            <button
              type="button"
              onClick={handleCompleteWithSound}
              className="w-full sm:w-auto px-10 py-5 btn-cartesian-primary text-xs flex flex-col items-center justify-center shrink-0"
            >
              <span className="tracking-wider font-semibold text-sm">Complete Current Task</span>
              <span className="cartesian-micro text-cartesian-bg/75 tracking-widest mt-1">Ctrl + Enter</span>
            </button>

            <div className="flex flex-wrap items-center gap-5">
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
                  title="重置本轮总计时，清零已累计时间"
                >
                  <span>↺</span>
                  <span>Reset Timer (重置总计时)</span>
                </button>
              )}
            </div>
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

      {/* 剩余待办队列（任意顺序完成 + 实时编辑） */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-cartesian-line/40">
          <h3 className="cartesian-label">
            Remaining Tasks ({pendingTasks.length})
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
            className="p-4 bg-black/[0.02] flex flex-wrap items-center gap-3 animate-fade-in mb-4"
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

        {pendingTasks.length > 0 ? (
          <div className="divide-y divide-cartesian-line/15">
            {pendingTasks.map((task, idx) => {
              const isFocused = task.id === session.currentTaskId;
              return (
                <div
                  key={task.id}
                  className={`py-3 px-1 flex items-center gap-2.5 transition-colors ${
                    isFocused ? 'bg-black/[0.02] border-l-2 border-l-cartesian-ink pl-2.5' : 'hover:bg-black/[0.015]'
                  }`}
                >
                  {/* 勾选完成（顺手完成） */}
                  <button
                    type="button"
                    onClick={() => onCompleteTask(task.id)}
                    className="w-5 h-5 flex items-center justify-center border border-cartesian-line/50 bg-transparent hover:bg-cartesian-ink hover:border-cartesian-ink transition-colors shrink-0"
                    title="勾选完成（顺手做完的任务可直接勾掉，不影响当前聚焦）"
                  />

                  {/* 设为当前聚焦 */}
                  <button
                    type="button"
                    onClick={() => onSetFocus(task.id)}
                    className={`w-6 h-6 flex items-center justify-center text-sm shrink-0 transition-colors ${
                      isFocused
                        ? 'text-cartesian-ink'
                        : 'text-cartesian-line hover:text-cartesian-ink'
                    }`}
                    title={isFocused ? '当前聚焦任务' : '设为当前聚焦任务'}
                  >
                    ◉
                  </button>

                  {/* 任务标题（失焦自动保存） */}
                  <input
                    key={`${task.id}:${task.title}`}
                    type="text"
                    defaultValue={task.title}
                    onBlur={(e) => {
                      const v = e.target.value.trim();
                      if (v && v !== task.title) {
                        onUpdateTask(task.id, { title: v });
                      } else if (!v) {
                        e.target.value = task.title;
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                    }}
                    className="flex-1 min-w-0 px-2.5 py-1.5 font-body text-body bg-transparent border-0 border-b border-transparent focus:border-cartesian-ink focus:ring-0 rounded-none transition-colors"
                  />

                  {/* 预估用时（失焦自动保存） */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <input
                      key={`${task.id}:${task.estimatedMinutes}`}
                      type="number"
                      min="1"
                      max="600"
                      defaultValue={task.estimatedMinutes}
                      onBlur={(e) => {
                        const v = parseInt(e.target.value) || 0;
                        if (v > 0 && v !== task.estimatedMinutes) {
                          onUpdateTask(task.id, { estimatedMinutes: v });
                        } else {
                          e.target.value = String(task.estimatedMinutes);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                      }}
                      className="w-14 px-2 py-1.5 font-body text-small text-center bg-transparent border-0 focus:bg-white/70 focus:ring-0 rounded-none"
                    />
                    <span className="cartesian-micro text-cartesian-muted whitespace-nowrap">MIN</span>
                  </div>

                  {/* 排序与删除 */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => onMoveTask(task.id, 'up')}
                      className="w-6 h-6 flex items-center justify-center text-cartesian-line hover:text-cartesian-ink transition-colors disabled:opacity-20 text-xs"
                      title="上移"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      disabled={idx === pendingTasks.length - 1}
                      onClick={() => onMoveTask(task.id, 'down')}
                      className="w-6 h-6 flex items-center justify-center text-cartesian-line hover:text-cartesian-ink transition-colors disabled:opacity-20 text-xs"
                      title="下移"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(task.id, task.title)}
                      className="w-6 h-6 flex items-center justify-center text-cartesian-line hover:text-cartesian-danger transition-colors text-xs"
                      title="删除"
                    >
                      ×
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          !showAddForm && (
            <p className="py-6 cartesian-micro text-cartesian-muted text-center">
              这是最后一个任务，完成后将自动进入复盘飞轮。
            </p>
          )
        )}
      </div>

      {/* 执行期 Agent 实时调整对话（多轮记忆，随会话持久化） */}
      <TaskRefineChat
        goal={session.goal}
        tasks={pendingTasks.map(t => ({ id: t.id, title: t.title, estimatedMinutes: t.estimatedMinutes }))}
        onTasksUpdate={onApplyTasks}
        mode="execution"
        messages={session.chatHistory || []}
        onMessagesChange={onChatChange}
        execution={{
          completedTasks: completedTasks.map(t => ({
            title: t.title,
            estimatedMinutes: t.estimatedMinutes,
            actualMinutes: t.actualMinutes,
          })),
          elapsedMinutes,
          currentTaskId: session.currentTaskId,
        }}
      />

      {/* 已完成任务归档（可手动补录用时） */}
      {completedCount > 0 && (
        <div className="space-y-3 pt-4">
          <h3 className="cartesian-label text-cartesian-muted">
            Completed Archive ({completedCount})
          </h3>
          <div className="divide-y divide-cartesian-line/15">
            {completedTasks.map(task => (
              <div
                key={task.id}
                className="py-3 px-1 flex items-center gap-3 opacity-70 hover:opacity-100 transition-opacity"
              >
                <span className="w-6 h-6 flex items-center justify-center text-cartesian-success font-bold shrink-0">
                  ✓
                </span>
                <span className="font-body text-small text-cartesian-muted line-through truncate flex-1 min-w-0">
                  {task.title}
                </span>
                <div className="flex items-center gap-1.5 shrink-0" title="可选：手动填写该任务真实用时（分钟）">
                  <input
                    key={`${task.id}:${task.actualMinutes ?? ''}`}
                    type="number"
                    min="0"
                    placeholder="用时"
                    defaultValue={task.actualMinutes ?? ''}
                    onBlur={(e) => {
                      const raw = e.target.value.trim();
                      const v = raw === '' ? null : Math.max(0, parseInt(raw) || 0);
                      if (v !== (task.actualMinutes ?? null)) {
                        onSetTaskActualMinutes(task.id, v);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                    }}
                    className="w-16 px-2 py-1 font-mono text-small text-center bg-transparent border-0 focus:bg-white/70 focus:ring-0 rounded-none"
                  />
                  <span className="cartesian-micro text-cartesian-muted">MIN</span>
                </div>
              </div>
            ))}
          </div>
          <p className="cartesian-micro text-cartesian-muted">
            子任务默认不计独立用时（现实中任务常相互耦合），整轮总用时已自动统计；需要时可为个别任务补录分钟数。
          </p>
        </div>
      )}
    </div>
  );
}
