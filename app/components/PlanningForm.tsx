// app/components/PlanningForm.tsx - 任务规划表单 (Cartesian 笛卡尔/建筑志风格)

'use client';

import { useState, useEffect } from 'react';
import { Task, Session } from '@/lib/types';
import { AgentConfigPanel } from './AgentConfigPanel';
import { TaskRefineChat } from './TaskRefineChat';
import { FocusPreflightModal } from './FocusPreflightModal';
import { EnergyWisdomCard } from './EnergyWisdomCard';
import { decomposeGoal, getLlmConfig, SuggestedTask } from '@/lib/agent';
import { getSummaries, getIncompleteSessions, getSessions } from '@/lib/storage';

interface PlanningFormProps {
  onSubmit: (goal: string, tasks: Task[], fallbackTask: string) => void;
  onResumeSession?: (sessionId: string) => void;
}

type FormTask = Omit<Task, 'id' | 'status'> & {
  historyRef?: { matches: number; avgActual: number };
};

export function PlanningForm({ onSubmit, onResumeSession }: PlanningFormProps) {
  const [goal, setGoal] = useState('');
  const [recentGoals, setRecentGoals] = useState<string[]>([]);
  const [fallbackTask, setFallbackTask] = useState('统计当日任务进展 / 规划下一轮任务列表');
  const [tasks, setTasks] = useState<FormTask[]>([
    { title: '', estimatedMinutes: 30 }
  ]);
  const [preflightOpen, setPreflightOpen] = useState(false);
  const [incompleteSessions, setIncompleteSessions] = useState<Session[]>([]);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [allPastSessions, setAllPastSessions] = useState<Session[]>([]);

  // 加载最近历史目标与未完成会话
  useEffect(() => {
    const summaries = getSummaries();
    const distinct: string[] = [];
    for (const s of summaries) {
      const g = s.goal.trim();
      if (g && !distinct.includes(g)) {
        distinct.push(g);
      }
      if (distinct.length >= 4) break;
    }
    setRecentGoals(distinct);

    // 检查是否有中断/待继续的会话
    const incompleted = getIncompleteSessions();
    setIncompleteSessions(incompleted);
    setAllPastSessions(getSessions());
  }, []);

  // 载入历史计划或草稿到当前表单
  const handleLoadDraft = (session: Session) => {
    setGoal(session.goal || '');
    setFallbackTask(session.fallbackTask || '统计当日任务进展 / 规划下一轮任务列表');
    if (session.tasks && session.tasks.length > 0) {
      setTasks(session.tasks.map(t => ({
        title: t.title,
        estimatedMinutes: t.estimatedMinutes,
      })));
    }
    setIsArchiveModalOpen(false);
  };

  const addTask = () => {
    setTasks([...tasks, { title: '', estimatedMinutes: 30 }]);
  };

  const updateTask = (index: number, field: 'title' | 'estimatedMinutes', value: string | number) => {
    const updated = [...tasks];
    updated[index] = { ...updated[index], [field]: value };
    setTasks(updated);
  };

  const removeTask = (index: number) => {
    setTasks(tasks.filter((_, i) => i !== index));
  };

  const moveTask = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= tasks.length) return;
    const updated = [...tasks];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setTasks(updated);
  };

  // AI 辅助拆解
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [aiProgressStatus, setAiProgressStatus] = useState('');

  const handleAiDecompose = async () => {
    if (!goal.trim()) {
      setAiError('请先输入总目标，再使用 AI 拆解');
      return;
    }
    setAiLoading(true);
    setAiError('');
    setAiProgressStatus('[PLANNING] Agent 正在分析总目标并准备项目探索...');
    try {
      const suggested = await decomposeGoal(goal, getLlmConfig(), (status) => {
        setAiProgressStatus(status);
      });
      setTasks(suggested.map(t => ({
        title: t.title,
        estimatedMinutes: t.estimatedMinutes,
        historyRef: t.historyRef,
      })));
      setAiProgressStatus('');
    } catch (e: any) {
      setAiError(e?.message || 'AI 拆解失败');
      setAiProgressStatus('');
    } finally {
      setAiLoading(false);
    }
  };

  const handleStartAttempt = () => {
    const validTasks = tasks.filter(t => t.title.trim()).map(({ historyRef, ...t }) => t);
    if (!goal.trim() || validTasks.length === 0) {
      alert('请输入总目标和至少一个任务');
      return;
    }

    setPreflightOpen(true);
  };

  const handleConfirmedLaunch = () => {
    const validTasks = tasks.filter(t => t.title.trim()).map(({ historyRef, ...t }) => t);
    setPreflightOpen(false);
    onSubmit(goal, validTasks as Task[], fallbackTask);
  };

  // 快捷键支持：按 Ctrl+Enter / Cmd+Enter 触发启动就绪检查
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleStartAttempt();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goal, tasks, fallbackTask]);

  const validTasks = tasks.filter(t => t.title.trim());
  const firstTaskTitle = validTasks[0]?.title || '未命名任务';
  const latestIncomplete = incompleteSessions[0];

  return (
    <div className="space-y-10">
      {/* 未完成专注计划读档提示条 */}
      {latestIncomplete && onResumeSession && (
        <div className="p-4 bg-[#FAF7F2] border-l-4 border-[#9E6D38] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-fade-in shadow-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="cartesian-micro px-1.5 py-0.5 bg-[#9E6D38] text-white font-mono uppercase text-[10px]">
                Paused Archive
              </span>
              <span className="cartesian-micro text-cartesian-muted">
                检测到未完成的专注轮次 (已完成 {latestIncomplete.tasks.filter(t => t.status === 'completed').length} / {latestIncomplete.tasks.length} 项)
              </span>
            </div>
            <p className="font-sans text-small font-medium text-cartesian-ink line-clamp-1">
              {latestIncomplete.goal}
            </p>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => onResumeSession(latestIncomplete.id)}
              className="btn-cartesian-primary px-3.5 py-1.5 text-xs flex items-center gap-1.5"
            >
              <span>⚡ 继续读档执行</span>
            </button>
            <button
              type="button"
              onClick={() => handleLoadDraft(latestIncomplete)}
              className="btn-cartesian-outline px-3 py-1.5 text-xs text-cartesian-muted hover:text-cartesian-ink"
            >
              📝 载入到表单
            </button>
          </div>
        </div>
      )}

      {/* 章节标题与模版载入入口 */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="cartesian-label mb-2">Phase 01 · Planning Architecture</div>
          <h2 className="font-display text-h2 font-normal text-cartesian-ink">Plan Your Session</h2>
          <p className="font-body text-cartesian-muted text-body mt-1">
            规划本轮工作的目标与子任务序列，遵循注意力单通道与精力分配规范
          </p>
        </div>
        {allPastSessions.length > 0 && (
          <button
            type="button"
            onClick={() => setIsArchiveModalOpen(true)}
            className="btn-cartesian-outline px-3.5 py-2 text-xs flex items-center gap-2 self-start"
          >
            <span>📂</span>
            <span>读档与历史计划模版</span>
          </button>
        )}
      </div>

      {/* 常驻精力管理法则卡片 */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="cartesian-micro flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-cartesian-accent inline-block"></span> Energy & Attention Wisdom
          </span>
          <span className="cartesian-micro text-cartesian-muted">
            Empirical Principles
          </span>
        </div>
        <EnergyWisdomCard />
      </div>

      {/* 总目标输入 */}
      <div className="space-y-3">
        <label className="block cartesian-label">
          Session Goal / 核心交付物
        </label>
        <textarea
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="例如：完成推荐模型的离线评估脚本&#10;&#10;详细描述本轮工作的核心交付物、验收条件与背景..."
          rows={4}
          className="w-full px-5 py-4 font-body text-body resize-y"
        />
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <p className="cartesian-micro text-cartesian-muted">
            清晰界定单一核心产出 · 避免多任务混杂
          </p>
          {recentGoals.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="cartesian-micro text-cartesian-muted">Recent:</span>
              {recentGoals.map((rg, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setGoal(rg)}
                  className="px-2.5 py-1 bg-white/70 border border-cartesian-line font-body text-xs text-cartesian-ink hover:bg-cartesian-ink hover:text-white transition-colors truncate max-w-[180px]"
                  title={rg}
                >
                  {rg}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* AI Agent 配置折叠 */}
      <AgentConfigPanel />

      {/* 子任务列表 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-cartesian-line/50">
          <label className="cartesian-label">
            Sub Tasks / 任务执行序列
          </label>
          <button
            type="button"
            onClick={handleAiDecompose}
            disabled={aiLoading}
            className="btn-cartesian-outline px-3.5 py-1.5 text-xs flex items-center gap-1.5 disabled:opacity-40"
          >
            {aiLoading ? '... Analyzing' : '✦ AI Decompose'}
          </button>
        </div>

        {aiProgressStatus && (
          <div className="p-3.5 bg-[#FCF6EE] border-2 border-[#C07028] shadow-sm transition-all duration-200">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C07028] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#A34F10]"></span>
              </span>
              <div className="flex-1 flex flex-wrap items-center gap-2 font-mono text-xs leading-relaxed">
                {aiProgressStatus.startsWith('[TOOL:') ? (
                  <>
                    <span className="px-2 py-0.5 bg-[#A34F10] text-white font-bold tracking-wider uppercase text-[11px]">
                      {aiProgressStatus.slice(1, aiProgressStatus.indexOf(']'))}
                    </span>
                    <span className="text-[#3E2310] font-semibold font-mono break-all">
                      {aiProgressStatus.slice(aiProgressStatus.indexOf(']') + 1).trim()}
                    </span>
                  </>
                ) : (
                  <span className="text-[#6E350E] font-medium tracking-wide">
                    {aiProgressStatus}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {aiError && (
          <p className="font-body text-small text-cartesian-danger">✕ {aiError}</p>
        )}

        <div className="divide-y divide-cartesian-line/25 border-t border-b border-cartesian-line/25">
          {tasks.map((task, index) => (
            <div key={index} className="py-3 px-1 flex gap-3 items-center hover:bg-black/[0.01] transition-colors">
              {/* 序号 (Cartesian Circular Drafting Mark) */}
              <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center font-serif text-xs text-cartesian-muted">
                {index + 1}.
              </div>

              {/* 任务标题输入框 (Hairline Bottom Border) */}
              <input
                type="text"
                value={task.title}
                onChange={(e) => updateTask(index, 'title', e.target.value)}
                placeholder={`任务 ${index + 1}`}
                className="flex-1 px-3 py-1.5 font-body text-body bg-transparent border-0 border-b border-cartesian-line/50 focus:border-cartesian-ink focus:ring-0 rounded-none transition-colors"
              />

              {/* 预估时间输入框 */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <input
                  type="number"
                  value={task.estimatedMinutes}
                  onChange={(e) => updateTask(index, 'estimatedMinutes', parseInt(e.target.value) || 0)}
                  min="1"
                  className="w-14 px-2 py-1.5 font-body text-small text-center bg-transparent border-0 border-b border-cartesian-line/50 focus:border-cartesian-ink focus:ring-0 rounded-none"
                />
                <span className="cartesian-micro text-cartesian-muted whitespace-nowrap">MIN</span>
                {task.historyRef && (
                  <span
                    className="px-1.5 py-0.5 border border-cartesian-line/60 bg-white/40 font-mono text-[11px] text-cartesian-ink whitespace-nowrap"
                    title={`参考 ${task.historyRef.matches} 个相似历史任务，平均实际用时 ${task.historyRef.avgActual} 分钟`}
                  >
                    avg {task.historyRef.avgActual}m
                  </span>
                )}
              </div>

              {/* 操作按钮 (上移/下移/删除) */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => moveTask(index, 'up')}
                  className="w-6 h-6 flex items-center justify-center border border-cartesian-line/50 bg-white/50 text-cartesian-muted hover:text-cartesian-ink hover:border-cartesian-ink transition-colors disabled:opacity-20 text-xs"
                  title="上移"
                >
                  ↑
                </button>
                <button
                  type="button"
                  disabled={index === tasks.length - 1}
                  onClick={() => moveTask(index, 'down')}
                  className="w-6 h-6 flex items-center justify-center border border-cartesian-line/50 bg-white/50 text-cartesian-muted hover:text-cartesian-ink hover:border-cartesian-ink transition-colors disabled:opacity-20 text-xs"
                  title="下移"
                >
                  ↓
                </button>
                {tasks.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeTask(index)}
                    className="w-6 h-6 flex items-center justify-center border border-cartesian-line/50 bg-white/50 text-cartesian-muted hover:text-cartesian-danger hover:border-cartesian-danger transition-colors text-xs"
                    title="删除"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addTask}
          className="mt-2 btn-cartesian-outline px-4 py-2 text-xs inline-flex items-center gap-1.5"
        >
          <span>+</span> Add Sub-Task
        </button>
      </div>

      {/* 对话微调 */}
      <TaskRefineChat
        goal={goal}
        tasks={tasks.filter(t => t.title.trim()).map(({ historyRef, ...t }) => t) as SuggestedTask[]}
        onTasksUpdate={(updated) =>
          setTasks(updated.map(t => ({
            title: t.title,
            estimatedMinutes: t.estimatedMinutes,
            historyRef: t.historyRef,
          })))
        }
      />

      {/* 兜底任务 */}
      <div className="space-y-2">
        <label className="block cartesian-label">
          Fallback Routine / 兜底任务
        </label>
        <input
          type="text"
          value={fallbackTask}
          onChange={(e) => setFallbackTask(e.target.value)}
          className="w-full px-4 py-3 font-body text-body"
        />
        <p className="cartesian-micro text-cartesian-muted">
          完成后或等待外部响应时的低认知兜底活（阻断停滞空转与注意力反刍）
        </p>
      </div>

      {/* 提交按钮 */}
      <div className="pt-4 border-t border-cartesian-line">
        <button
          type="button"
          onClick={handleStartAttempt}
          className="w-full py-4 btn-cartesian-primary text-sm flex items-center justify-center gap-3"
        >
          <span>✦ Pre-Flight Verification & Start Session</span>
        </button>
        <p className="text-center cartesian-micro text-cartesian-muted mt-3">
          4-Step Readiness Check · Press Ctrl + Enter to launch
        </p>
      </div>

      {/* 启动就绪四步指引弹窗 */}
      <FocusPreflightModal
        isOpen={preflightOpen}
        onClose={() => setPreflightOpen(false)}
        onConfirmStart={handleConfirmedLaunch}
        goal={goal}
        firstTaskTitle={firstTaskTitle}
        fallbackTask={fallbackTask}
      />

      {/* 历史存档与模版读档弹窗 */}
      {isArchiveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1A1A1A]/75 backdrop-blur-md animate-fade-in">
          <div
            className="bg-[#EDE8E0] border border-cartesian-line max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden text-cartesian-ink"
            style={{ backgroundColor: '#EDE8E0' }}
          >
            <div className="px-6 py-4 border-b border-cartesian-line flex items-center justify-between bg-[#E5DFD6]">
              <div>
                <div className="cartesian-label">Archive Registry</div>
                <h3 className="font-display text-h3 font-normal text-cartesian-ink">
                  历史工作轮次与计划模版
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsArchiveModalOpen(false)}
                className="w-7 h-7 border border-cartesian-line bg-white flex items-center justify-center text-cartesian-ink hover:bg-cartesian-ink hover:text-white text-xs transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-3 flex-1 custom-scrollbar bg-[#EDE8E0]">
              {allPastSessions.length === 0 ? (
                <p className="py-8 text-center cartesian-micro text-cartesian-muted">
                  暂无历史存档记录
                </p>
              ) : (
                allPastSessions.map((s) => {
                  const compCount = s.tasks.filter(t => t.status === 'completed').length;
                  const isPausedOrExec = s.status === 'executing' || s.status === 'paused';
                  return (
                    <div
                      key={s.id}
                      className="p-4 bg-[#FAF7F2] border border-cartesian-line/70 hover:border-cartesian-ink transition-all space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`cartesian-micro px-2 py-0.5 ${
                            isPausedOrExec
                              ? 'bg-[#9E6D38] text-white'
                              : 'border border-cartesian-line bg-[#EDE8E0] text-cartesian-muted'
                          }`}>
                            {isPausedOrExec ? '进行中 / 待读档' : '已归档'}
                          </span>
                          <span className="cartesian-micro text-cartesian-muted">
                            {new Date(s.createdAt).toLocaleString()} · {compCount}/{s.tasks.length} 项完成
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {isPausedOrExec && onResumeSession && (
                            <button
                              type="button"
                              onClick={() => {
                                setIsArchiveModalOpen(false);
                                onResumeSession(s.id);
                              }}
                              className="btn-cartesian-primary px-3 py-1 text-xs"
                            >
                              ⚡ 继续读档
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleLoadDraft(s)}
                            className="btn-cartesian-outline px-3 py-1 text-xs"
                          >
                            📝 载入到表单
                          </button>
                        </div>
                      </div>

                      <h4 className="font-sans text-body font-medium text-cartesian-ink">
                        {s.goal}
                      </h4>

                      <div className="divide-y divide-cartesian-line/20 pt-1 text-xs font-body text-cartesian-muted">
                        {s.tasks.slice(0, 4).map((t, idx) => (
                          <div key={idx} className="py-1 flex items-center justify-between">
                            <span className={t.status === 'completed' ? 'line-through opacity-60' : ''}>
                              {idx + 1}. {t.title}
                            </span>
                            <span className="font-mono text-[11px] tabular-nums">
                              {t.estimatedMinutes}m
                            </span>
                          </div>
                        ))}
                        {s.tasks.length > 4 && (
                          <div className="py-1 cartesian-micro text-cartesian-accent">
                            + 另有 {s.tasks.length - 4} 个子任务...
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="px-6 py-3 border-t border-cartesian-line bg-[#E5DFD6] text-right">
              <button
                type="button"
                onClick={() => setIsArchiveModalOpen(false)}
                className="btn-cartesian-outline px-4 py-1.5 text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
