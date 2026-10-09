// app/components/CompletionView.tsx - 完成总结视图 (Cartesian 笛卡尔/建筑志风格)

'use client';

import { Session } from '@/lib/types';
import Link from 'next/link';

interface CompletionViewProps {
  session: Session;
  onNewSession: () => void;
}

export function CompletionView({ session, onNewSession }: CompletionViewProps) {
  const completedTasks = session.tasks.filter(t => t.status === 'completed');
  const totalEstimated = session.tasks.reduce((sum, t) => sum + t.estimatedMinutes, 0);
  const totalActual = completedTasks.reduce((sum, t) => sum + (t.actualMinutes || 0), 0);
  
  // 计算准确率
  const accurateTasks = completedTasks.filter(t => {
    const actual = t.actualMinutes || 0;
    const estimated = t.estimatedMinutes;
    const diff = Math.abs(actual - estimated);
    return diff <= estimated * 0.2; // ±20% 以内算准确
  });
  
  const accuracyRate = completedTasks.length > 0 
    ? (accurateTasks.length / completedTasks.length) * 100 
    : 0;

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
        <div className="p-8 bg-white/70 border border-cartesian-line text-center space-y-2">
          <p className="font-serif text-5xl md:text-6xl font-normal text-cartesian-ink">
            {completedTasks.length}
          </p>
          <p className="cartesian-micro text-cartesian-muted">
            Completed Tasks
          </p>
          <div className="w-8 h-[1px] bg-cartesian-line mx-auto mt-2" />
        </div>

        <div className="p-8 bg-white/70 border border-cartesian-line text-center space-y-2">
          <p className="font-serif text-5xl md:text-6xl font-normal text-cartesian-ink">
            {totalActual}
          </p>
          <p className="cartesian-micro text-cartesian-muted">
            Actual Minutes
          </p>
          <div className="w-8 h-[1px] bg-cartesian-line mx-auto mt-2" />
        </div>

        <div className="p-8 bg-white/70 border border-cartesian-line text-center space-y-2">
          <p className="font-serif text-5xl md:text-6xl font-normal text-cartesian-ink">
            {accuracyRate.toFixed(0)}%
          </p>
          <p className="cartesian-micro text-cartesian-muted">
            Accuracy Rate
          </p>
          <div className="w-8 h-[1px] bg-cartesian-line mx-auto mt-2" />
        </div>
      </div>

      {/* 预估 vs 实际对比明细 */}
      <div className="space-y-4">
        <h3 className="cartesian-label pb-2 border-b border-cartesian-line">
          Execution Ledger & Variances
        </h3>
        <div className="space-y-2.5">
          {completedTasks.map((task, idx) => {
            const diff = (task.actualMinutes || 0) - task.estimatedMinutes;
            const diffPercent = task.estimatedMinutes > 0 
              ? (diff / task.estimatedMinutes) * 100 
              : 0;
            const isAccurate = Math.abs(diffPercent) <= 20;

            return (
              <div
                key={task.id || idx}
                className="p-4 bg-white/60 border border-cartesian-line flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 border border-cartesian-line bg-cartesian-bg flex items-center justify-center font-serif text-xs text-cartesian-ink shrink-0">
                    {idx + 1}
                  </span>
                  <h4 className="font-body text-body font-medium text-cartesian-ink">
                    {task.title}
                  </h4>
                  {isAccurate && (
                    <span className="cartesian-micro px-1.5 py-0.5 border border-cartesian-line bg-cartesian-bg-subtle text-cartesian-success">
                      Exact
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4 cartesian-micro text-cartesian-muted pl-9 sm:pl-0">
                  <span>Est: {task.estimatedMinutes}m</span>
                  <span>Act: {task.actualMinutes}m</span>
                  <span className={`px-2 py-0.5 border border-cartesian-line font-mono text-xs ${
                    diff > 0
                      ? 'bg-cartesian-bg-subtle text-cartesian-warning'
                      : 'bg-cartesian-bg text-cartesian-success'
                  }`}>
                    {diff > 0 ? '+' : ''}{diff}m ({diffPercent > 0 ? '+' : ''}{diffPercent.toFixed(0)}%)
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 总结提示 (Cartesian Editorial Feedback) */}
      <div className="p-6 bg-cartesian-bg-subtle/70 border border-cartesian-line space-y-3">
        <h3 className="cartesian-label text-cartesian-ink flex items-center gap-2">
          <span>✦</span>
          <span>Time Calibration & Energy Analysis</span>
        </h3>
        <div className="font-body text-small text-cartesian-ink space-y-2 leading-relaxed">
          {accuracyRate >= 80 && (
            <p>✓ 预估能力非常出色：时间感知与执行节奏高度匹配，继续保持当前拆解粒度。</p>
          )}
          {accuracyRate >= 50 && accuracyRate < 80 && (
            <p>📊 预估准确率良好，多次轮次后大脑的锚定效应会进一步自我校准。</p>
          )}
          {accuracyRate < 50 && (
            <p>💡 预估偏差较大，建议下次把颗粒度拆小（25-35 分钟为佳），或适当为未知步骤增加缓冲。</p>
          )}
          {totalActual > totalEstimated * 1.3 && (
            <p>⏰ 整体超时较多，注意在专注时警惕完美主义陷阱，按时间盒推进可交付最小版本。</p>
          )}
          {totalActual < totalEstimated * 0.7 && (
            <p>⚡ 完成速度超出预期，认知状态极佳，可以适当挑战更紧凑的节奏。</p>
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
