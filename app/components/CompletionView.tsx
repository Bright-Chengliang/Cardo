// app/components/CompletionView.tsx - 完成总结视图 (Cartesian 笛卡尔/建筑志风格)
// 以「整轮总用时」为主口径；准确率降级为装饰性指标

'use client';

import { Session } from '@/lib/types';
import { getSessionElapsedSeconds } from '@/lib/hooks/useCurrentSession';
import Link from 'next/link';

interface CompletionViewProps {
  session: Session;
  onSetTaskActualMinutes: (taskId: string, minutes: number | null) => void;
  onNewSession: () => void;
}

export function CompletionView({ session, onSetTaskActualMinutes, onNewSession }: CompletionViewProps) {
  const completedTasks = session.tasks.filter(t => t.status === 'completed');
  const totalEstimated = session.tasks.reduce((sum, t) => sum + t.estimatedMinutes, 0);
  const totalActual = Math.round(getSessionElapsedSeconds(session) / 60);
  const diff = totalActual - totalEstimated;

  // 装饰性指标：仅基于手动填写过用时的任务
  const timedTasks = completedTasks.filter(t => typeof t.actualMinutes === 'number');
  const accurateTimed = timedTasks.filter(t => {
    const actual = t.actualMinutes || 0;
    return Math.abs(actual - t.estimatedMinutes) <= t.estimatedMinutes * 0.2;
  });

  return (
    <div className="space-y-10">
      {/* 庆祝标题 */}
      <div className="text-center space-y-3">
        <div className="cartesian-label">
          Phase 03 · Reflection & Flywheel
        </div>
        <h2 className="font-display text-h1 font-normal text-cartesian-ink tracking-tight">
          Session Complete
        </h2>
        <p className="font-sans text-lead text-cartesian-muted whitespace-pre-wrap max-w-2xl mx-auto">
          “{session.goal}”
        </p>
      </div>

      {/* 总体统计 (Cartesian Architectural Stat Blocks) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-8 bg-white/60 text-center space-y-2">
          <p className="font-serif text-5xl md:text-6xl font-normal text-cartesian-ink">
            {completedTasks.length}
          </p>
          <p className="cartesian-micro text-cartesian-muted">
            Completed Tasks
          </p>
          <div className="w-8 h-[1px] bg-cartesian-line mx-auto mt-2" />
        </div>

        <div className="p-8 bg-white/60 text-center space-y-2">
          <p className="font-serif text-5xl md:text-6xl font-normal text-cartesian-ink">
            {totalActual}
          </p>
          <p className="cartesian-micro text-cartesian-muted">
            Total Focus Minutes · 本轮总用时
          </p>
          <div className="w-8 h-[1px] bg-cartesian-line mx-auto mt-2" />
        </div>

        <div className="p-8 bg-white/60 text-center space-y-2">
          <p className="font-serif text-5xl md:text-6xl font-normal text-cartesian-ink">
            {totalEstimated}
          </p>
          <p className="cartesian-micro text-cartesian-muted">
            Estimated Minutes · 预估总量
          </p>
          <div className="w-8 h-[1px] bg-cartesian-line mx-auto mt-2" />
        </div>
      </div>

      {/* 总量偏差（主校准口径） */}
      {totalEstimated > 0 && (
        <div className="text-center">
          <span className={`inline-block px-3 py-1 font-mono text-xs ${
            diff > 0 ? 'bg-cartesian-bg-subtle text-cartesian-warning' : 'bg-cartesian-bg text-cartesian-success'
          }`}>
            {diff > 0 ? '+' : ''}{diff}m Total Variance（本轮总量与预估的偏差）
          </span>
        </div>
      )}

      {/* 执行明细与个别任务用时补录 */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-cartesian-line">
          <h3 className="cartesian-label">
            Execution Ledger & Variances
          </h3>
          <span className="cartesian-micro text-cartesian-muted">
            任务常相互耦合 · 个别任务可手动补录用时
          </span>
        </div>
        <div className="space-y-2.5">
          {completedTasks.map((task, idx) => {
            const hasActual = typeof task.actualMinutes === 'number';
            const taskDiff = hasActual ? (task.actualMinutes || 0) - task.estimatedMinutes : 0;

            return (
              <div
                key={task.id || idx}
                className="p-4 bg-white/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-6 h-6 bg-cartesian-bg flex items-center justify-center font-serif text-xs text-cartesian-ink shrink-0">
                    {idx + 1}
                  </span>
                  <h4 className="font-body text-body font-medium text-cartesian-ink truncate">
                    {task.title}
                  </h4>
                </div>

                <div className="flex items-center gap-4 cartesian-micro text-cartesian-muted pl-9 sm:pl-0 shrink-0">
                  <span>Est: {task.estimatedMinutes}m</span>
                  <div className="flex items-center gap-1.5" title="可选：手动填写该任务真实用时（分钟）">
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
                      className="w-16 px-2 py-0.5 font-mono text-xs text-center bg-transparent border-0 focus:bg-white/70 focus:ring-0 rounded-none"
                    />
                    <span className="cartesian-micro text-cartesian-muted">MIN</span>
                  </div>
                  {hasActual && (
                    <span className={`px-2 py-0.5 font-mono text-xs ${
                      taskDiff > 0
                        ? 'bg-cartesian-bg-subtle text-cartesian-warning'
                        : 'bg-cartesian-bg text-cartesian-success'
                    }`}>
                      {taskDiff > 0 ? '+' : ''}{taskDiff}m
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 总结提示 (Cartesian Editorial Feedback) */}
      <div className="p-6 bg-cartesian-bg-subtle/60 space-y-3">
        <h3 className="cartesian-label text-cartesian-ink flex items-center gap-2">
          <span>✦</span>
          <span>Time Calibration & Energy Analysis</span>
        </h3>
        <div className="font-body text-small text-cartesian-ink space-y-2 leading-relaxed">
          {totalEstimated > 0 && diff <= -Math.max(5, totalEstimated * 0.2) && (
            <p>⚡ 本轮完成得分外利落，实际用时明显低于预估，可以适当挑战更紧凑的节奏。</p>
          )}
          {totalEstimated > 0 && Math.abs(diff) < Math.max(5, totalEstimated * 0.2) && (
            <p>✓ 本轮总量预估与真实节奏相当接近，时间感知在线。</p>
          )}
          {totalEstimated > 0 && diff >= Math.max(5, totalEstimated * 0.2) && (
            <p>📊 本轮实际长于预估。任务耦合、被动等待都会拉长时间，下轮规划时可为未知步骤留出缓冲。</p>
          )}
          {totalEstimated > 0 && totalActual > totalEstimated * 1.3 && (
            <p>⏰ 整体超时较多，注意警惕完美主义陷阱，按时间盒推进可交付最小版本。</p>
          )}
          {timedTasks.length > 0 && (
            <p className="cartesian-micro text-cartesian-muted pt-1">
              个别计时任务 {timedTasks.length} 项 · 估算命中 {accurateTimed.length} 项（装饰性指标，不必在意）
            </p>
          )}
        </div>
      </div>

      {/* 底部操作按钮 */}
      <div className="flex flex-col sm:flex-row gap-4 pt-2 border-t border-cartesian-line">
        <button
          onClick={onNewSession}
          className="flex-1 py-3.5 btn-cartesian-primary text-xs text-center"
        >
          Start New Session
        </button>
        <Link
          href="/history"
          className="flex-1 py-3.5 btn-cartesian-outline text-xs text-center"
        >
          View Review Archives
        </Link>
      </div>
    </div>
  );
}
