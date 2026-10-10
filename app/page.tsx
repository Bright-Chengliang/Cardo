// app/page.tsx - Cardo 主页 (Cartesian 笛卡尔/建筑志体系)

'use client';

import { useState, useEffect } from 'react';
import { useCurrentSession } from '@/lib/hooks/useCurrentSession';
import { PlanningForm } from './components/PlanningForm';
import { ExecutionView } from './components/ExecutionView';
import { CompletionView } from './components/CompletionView';
import { MobileConnectModal } from './components/MobileConnectModal';
import Link from 'next/link';

export default function HomePage() {
  const [mobileModalOpen, setMobileModalOpen] = useState(false);
  const { 
    session, 
    loading, 
    createSession, 
    startSession,
    resumeSession,
    pauseSession,
    resetSessionTimer,
    completeCurrentTask,
    completeTask,
    setFocusTask,
    updateTask,
    setTaskActualMinutes,
    deleteTask,
    moveTask,
    addTaskToSession,
    applyTasksUpdate,
    updateChatHistory,
    endSession 
  } = useCurrentSession();

  // 动态更新浏览器标签页标题
  useEffect(() => {
    if (!session || session.status === 'planning') {
      document.title = 'Cardo · Deep Work & Energy System';
    } else if (session.status === 'executing') {
      const currentTask = session.tasks.find((t) => t.id === session.currentTaskId);
      document.title = currentTask ? `[${currentTask.title}] · Cardo` : 'Cardo · Executing';
    } else if (session.status === 'completed') {
      document.title = 'Complete · Cardo';
    }
  }, [session?.status, session?.currentTaskId, session?.tasks]);

  // 监听 URL 中的 resume 参数以实现从历史记录一键读档跳转
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const resumeId = urlParams.get('resumeId');
      if (resumeId) {
        resumeSession(resumeId);
        window.history.replaceState({}, '', '/');
      }
    }
  }, [resumeSession]);

  if (loading) {
    return (
      <main className="min-h-screen bg-cartesian-bg flex items-center justify-center">
        <div className="px-6 py-3 border border-cartesian-line bg-cartesian-bg-subtle text-cartesian-ink font-body text-xs uppercase tracking-[3px]">
          Loading System...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-cartesian-bg text-cartesian-ink relative pb-24 cartesian-drafting-bg">
      {/* 建筑图录背景几何圆规与辅助线 (Cartesian Geometric Drafting Elements) */}
      <div className="geo-decoration w-[460px] h-[460px] -top-32 -right-32 opacity-30" />
      <div className="geo-ring-lg w-[700px] h-[700px] -bottom-64 -left-64 opacity-20" />
      <div className="absolute top-0 left-1/4 w-[1px] h-full bg-cartesian-line-faint pointer-events-none hidden lg:block" />
      <div className="absolute top-0 right-1/4 w-[1px] h-full bg-cartesian-line-faint pointer-events-none hidden lg:block" />

      <div className="relative z-10 container mx-auto px-6 md:px-12 py-14 max-w-5xl">
        {/* 顶部标题栏与导航 */}
        <header className="mb-14 flex flex-wrap items-end justify-between gap-6 pb-6 border-b border-cartesian-line">
          <div>
            <div className="cartesian-label mb-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-cartesian-ink rounded-none inline-block"></span>
              <span>Single Task & Time Calibration</span>
            </div>
            <h1 className="font-display text-h1 font-normal tracking-tight text-cartesian-ink">
              Cardo
            </h1>
            <p className="font-body text-cartesian-muted text-small mt-1.5 max-w-md">
              面向开发者的单任务专注与时间预估校准小工具
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileModalOpen(true)}
              className="btn-cartesian-outline px-4 py-2 text-xs flex items-center gap-2"
            >
              <span>📱</span>
              <span>Mobile Sync</span>
            </button>
            <Link
              href="/history"
              className="btn-cartesian-outline px-4 py-2 text-xs flex items-center gap-2"
            >
              <span>📊</span>
              <span>Review Archives</span>
            </Link>
          </div>
        </header>

        {/* 主内容区域 (Cartesian Open Canvas Layout) */}
        <div className="transition-all">
          {!session && (
            <PlanningForm 
              onSubmit={(goal, tasks, fallbackTask) => {
                const newSession = createSession(goal, tasks, fallbackTask);
                startSession(newSession);
              }}
              onResumeSession={resumeSession}
            />
          )}

          {session && session.status === 'executing' && (
            <ExecutionView 
              session={session} 
              onCompleteCurrent={completeCurrentTask}
              onCompleteTask={completeTask}
              onSetFocus={setFocusTask}
              onUpdateTask={updateTask}
              onSetTaskActualMinutes={setTaskActualMinutes}
              onDeleteTask={deleteTask}
              onMoveTask={moveTask}
              onAddTask={addTaskToSession}
              onApplyTasks={applyTasksUpdate}
              onChatChange={updateChatHistory}
              onPause={pauseSession}
              onResetTimer={resetSessionTimer}
            />
          )}

          {session && session.status === 'completed' && (
            <CompletionView 
              session={session} 
              onSetTaskActualMinutes={setTaskActualMinutes}
              onNewSession={() => {
                endSession();
              }} 
            />
          )}
        </div>

        {/* 底部暂存与放弃轮次操作 */}
        {session && session.status !== 'completed' && (
          <div className="mt-8 flex items-center justify-center gap-6">
            <button
              type="button"
              onClick={pauseSession}
              className="cartesian-micro px-4 py-2 border border-cartesian-line bg-transparent text-cartesian-muted hover:text-cartesian-ink hover:border-cartesian-ink transition-colors uppercase"
            >
              ⏸ Pause & Save Archive
            </button>
            <button
              type="button"
              onClick={() => {
                if (confirm('确定要放弃当前工作轮次吗？')) {
                  endSession();
                }
              }}
              className="cartesian-micro px-4 py-2 border border-cartesian-line bg-transparent text-cartesian-muted hover:text-cartesian-danger hover:border-cartesian-danger transition-colors uppercase"
            >
              Abandon Session
            </button>
          </div>
        )}

        {/* 手机端连接弹窗 */}
        <MobileConnectModal
          isOpen={mobileModalOpen}
          onClose={() => setMobileModalOpen(false)}
        />
      </div>
    </main>
  );
}
