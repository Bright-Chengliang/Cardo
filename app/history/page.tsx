// app/history/page.tsx - 历史趋势、任务明细复盘与数据管理 (Cartesian 笛卡尔/建筑志风格)

'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { SessionSummary, Session } from '@/lib/types';
import { getSummaries, getSessions, deleteSummary, deleteSession, clearAllHistory } from '@/lib/storage';
import Link from 'next/link';

export default function HistoryPage() {
  const [summaries, setSummaries] = useState<SessionSummary[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionsMap, setSessionsMap] = useState<Record<string, Session>>({});
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'in_progress' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [exportMsg, setExportMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = () => {
    const sumData = getSummaries();
    const sesData = getSessions();
    const map: Record<string, Session> = {};
    sesData.forEach((s) => {
      map[s.id] = s;
    });
    setSummaries(sumData);
    setSessions(sesData);
    setSessionsMap(map);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // 导出 JSON 数据
  const exportJson = () => {
    const allData = {
      version: '0.4',
      exportedAt: new Date().toISOString(),
      summaries: getSummaries(),
      sessions: getSessions(),
    };
    const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cardo-history-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExportMsg('✓ JSON 数据已导出');
    setTimeout(() => setExportMsg(''), 3000);
  };

  // 导出 CSV 数据
  const exportCsv = () => {
    if (summaries.length === 0) return;
    const header = ['会话ID', '完成时间', '总目标', '完成任务数', '总任务数', '预估用时(分)', '实际用时(分)', '预估准确率'];
    const rows = summaries.map((s) => [
      s.sessionId,
      `"${s.completedAt}"`,
      `"${s.goal.replace(/"/g, '""')}"`,
      s.completedTasks,
      s.totalTasks,
      s.totalEstimatedMinutes,
      s.totalActualMinutes,
      `${(s.accuracyRate * 100).toFixed(1)}%`,
    ]);
    const csvContent = '\uFEFF' + [header.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cardo-records-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setExportMsg('✓ CSV 数据已导出');
    setTimeout(() => setExportMsg(''), 3000);
  };

  // 导入 JSON 数据
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed?.summaries) || Array.isArray(parsed?.sessions)) {
          if (Array.isArray(parsed?.summaries)) {
            const current = getSummaries();
            const existingIds = new Set(current.map((s) => s.sessionId));
            const newSummaries = parsed.summaries.filter((s: SessionSummary) => !existingIds.has(s.sessionId));
            localStorage.setItem('cardo_summaries', JSON.stringify([...newSummaries, ...current]));
          }

          if (Array.isArray(parsed?.sessions)) {
            const currentSessions = getSessions();
            const existingSesIds = new Set(currentSessions.map((s) => s.id));
            const newSessions = parsed.sessions.filter((s: Session) => !existingSesIds.has(s.id));
            localStorage.setItem('cardo_sessions', JSON.stringify([...newSessions, ...currentSessions]));
          }

          loadData();
          setExportMsg(`✓ 成功导入历史数据`);
        } else {
          setExportMsg('✕ 文件格式不正确');
        }
      } catch (err: any) {
        setExportMsg(`✕ 导入解析失败: ${err?.message || '未知错误'}`);
      }
      setTimeout(() => setExportMsg(''), 4000);
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // 删除单条记录
  const handleDeleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('确定要删除这条历史记录吗？')) {
      deleteSession(sessionId);
      deleteSummary(sessionId);
      loadData();
    }
  };

  // 清空全部历史
  const handleClearAll = () => {
    if (confirm('确定要清空全部历史记录吗？此操作不可撤销，建议先导出备份。')) {
      clearAllHistory();
      loadData();
      setExportMsg('✓ 已清空全部历史数据');
      setTimeout(() => setExportMsg(''), 3000);
    }
  };

  // 综合全部会话列表 (根据 Tab 与关键词过滤)
  const displaySessions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    
    // 聚合出全量的 Session 列表
    let list = [...sessions];
    
    // 如果只有 Summary 没有对应 Session，则构造一个简易的 Session 用于显示
    summaries.forEach((sum) => {
      if (!list.some(s => s.id === sum.sessionId)) {
        list.push({
          id: sum.sessionId,
          goal: sum.goal,
          tasks: [],
          fallbackTask: '',
          currentTaskId: null,
          status: 'completed',
          createdAt: sum.createdAt,
          completedAt: sum.completedAt,
        });
      }
    });

    // 过滤 Tab
    if (activeTab === 'in_progress') {
      list = list.filter(s => s.status === 'executing' || s.status === 'paused' || s.status === 'planning');
    } else if (activeTab === 'completed') {
      list = list.filter(s => s.status === 'completed');
    }

    // 搜索词过滤
    if (q) {
      list = list.filter(s => 
        s.goal.toLowerCase().includes(q) || 
        s.tasks.some(t => t.title.toLowerCase().includes(q))
      );
    }

    // 按创建或最后活跃时间倒序
    return list.sort((a, b) => new Date(b.lastActiveAt || b.createdAt).getTime() - new Date(a.lastActiveAt || a.createdAt).getTime());
  }, [sessions, summaries, activeTab, searchQuery]);

  if (loading) {
    return (
      <main className="min-h-screen bg-cartesian-bg flex items-center justify-center">
        <div className="px-6 py-3 border border-cartesian-line bg-cartesian-bg-subtle text-cartesian-ink font-body text-xs uppercase tracking-[3px]">
          Loading Archives...
        </div>
      </main>
    );
  }

  const totalSessions = summaries.length;
  const totalActualMinutes = summaries.reduce((sum, s) => sum + (s.totalActualMinutes || 0), 0);
  const totalFocusHours = (totalActualMinutes / 60).toFixed(1);
  const avgAccuracy = totalSessions > 0
    ? summaries.reduce((sum, s) => sum + s.accuracyRate, 0) / totalSessions
    : 0;

  const inProgressCount = sessions.filter(s => s.status === 'executing' || s.status === 'paused' || s.status === 'planning').length;
  const completedCount = summaries.length || sessions.filter(s => s.status === 'completed').length;

  return (
    <main className="min-h-screen bg-cartesian-bg text-cartesian-ink relative pb-24 cartesian-drafting-bg">
      {/* 建筑图录背景几何圆规与辅助线 */}
      <div className="geo-decoration w-[400px] h-[400px] -top-24 -right-24 opacity-30" />
      <div className="geo-ring-lg w-[600px] h-[600px] -bottom-48 -left-48 opacity-20" />

      <div className="relative z-10 container mx-auto px-6 md:px-12 py-14 max-w-6xl">
        {/* 顶部导航 */}
        <header className="mb-10 flex flex-wrap items-end justify-between gap-6 pb-6 border-b border-cartesian-line/50">
          <div>
            <div className="cartesian-label mb-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-cartesian-ink inline-block"></span>
              <span>Archives & Analytics</span>
            </div>
            <h1 className="font-display text-h1 font-normal tracking-tight text-cartesian-ink">
              History & Calibration
            </h1>
            <p className="font-body text-cartesian-muted text-small mt-1.5 max-w-md">
              任务用时偏差复盘、历史专注存档与随时读档恢复
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="btn-cartesian-outline px-4 py-2 text-xs"
            >
              ← Return to Cardo
            </Link>
          </div>
        </header>

        {/* 导入导出与数据管理工具栏 */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 p-4 bg-white/60 border border-cartesian-line/60">
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={exportJson}
              disabled={displaySessions.length === 0}
              className="btn-cartesian-outline px-3.5 py-1.5 text-xs disabled:opacity-40"
            >
              Export JSON
            </button>
            <button
              type="button"
              onClick={exportCsv}
              disabled={summaries.length === 0}
              className="btn-cartesian-outline px-3.5 py-1.5 text-xs disabled:opacity-40"
            >
              Export CSV
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="btn-cartesian-outline px-3.5 py-1.5 text-xs"
            >
              Import Backup
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
            {displaySessions.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="cartesian-micro px-3 py-1.5 border border-cartesian-line text-cartesian-danger hover:bg-cartesian-danger hover:text-white transition-colors"
              >
                Clear All
              </button>
            )}
          </div>

          {exportMsg && (
            <span className="cartesian-micro text-cartesian-success font-medium animate-fade-in">
              {exportMsg}
            </span>
          )}
        </div>

        {displaySessions.length === 0 && summaries.length === 0 ? (
          <div className="text-center py-20 bg-white/40 border border-cartesian-line/60 p-8 space-y-4">
            <p className="font-serif text-h3 text-cartesian-muted">
              No Work Archives Yet
            </p>
            <p className="cartesian-micro text-cartesian-muted max-w-md mx-auto">
              开启你的第一个专注工作轮次，完成后系统将自动记录并校准你的预估与执行偏差。
            </p>
            <div className="pt-2">
              <Link
                href="/"
                className="btn-cartesian-primary px-6 py-2.5 text-xs inline-block"
              >
                Start First Session
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-10">
            {/* 顶栏核心数据指标卡片 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/60 border border-cartesian-line/50 p-6">
                <div className="cartesian-label mb-2 text-cartesian-muted">Total Sessions</div>
                <p className="font-serif text-4xl font-normal text-cartesian-ink">
                  {displaySessions.length}
                </p>
                <div className="cartesian-micro text-cartesian-accent mt-2">
                  历史工作轮次全集
                </div>
              </div>

              <div className="bg-white/60 border border-cartesian-line/50 p-6">
                <div className="cartesian-label mb-2 text-cartesian-muted">Focus Duration</div>
                <p className="font-serif text-4xl font-normal text-cartesian-ink">
                  {totalFocusHours} <span className="text-base font-normal text-cartesian-muted">hrs</span>
                </p>
                <div className="cartesian-micro text-cartesian-accent mt-2">
                  累计深度专注工时
                </div>
              </div>

              <div className="bg-white/60 border border-cartesian-line/50 p-6">
                <div className="cartesian-label mb-2 text-cartesian-muted">Mean Accuracy</div>
                <p className="font-serif text-4xl font-normal text-cartesian-ink">
                  {(avgAccuracy * 100).toFixed(1)}%
                </p>
                <div className="cartesian-micro text-cartesian-accent mt-2">
                  时间感知校准度
                </div>
              </div>

              <div className="bg-white/60 border border-cartesian-line/50 p-6">
                <div className="cartesian-label mb-2 text-cartesian-muted">Active / Paused</div>
                <p className="font-serif text-4xl font-normal text-[#9E6D38]">
                  {inProgressCount}
                </p>
                <div className="cartesian-micro text-cartesian-accent mt-2">
                  待读档中断轮次
                </div>
              </div>
            </div>

            {/* 趋势折线图 */}
            {summaries.length > 0 && (
              <div className="bg-white/60 border border-cartesian-line/50 p-8">
                <div className="flex flex-wrap justify-between items-center gap-3 mb-6 pb-3 border-b border-cartesian-line/40">
                  <div>
                    <h2 className="font-display text-h3 font-normal text-cartesian-ink">
                      预估准确率收敛趋势
                    </h2>
                    <p className="cartesian-micro text-cartesian-muted mt-1">
                      基于最近 20 轮执行数据的时间感知正反馈曲线
                    </p>
                  </div>
                  <span className="cartesian-micro px-2.5 py-1 border border-cartesian-line bg-cartesian-bg text-cartesian-ink">
                    Recent {Math.min(20, summaries.length)} Sessions
                  </span>
                </div>
                <AccuracyChart summaries={summaries.slice().reverse()} />
              </div>
            )}

            {/* 历史会话列表 */}
            <div className="space-y-4">
              {/* Tab 筛选与搜索 */}
              <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-cartesian-line/40">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('all')}
                    className={`px-3 py-1.5 text-xs transition-colors ${
                      activeTab === 'all'
                        ? 'bg-cartesian-ink text-white font-medium'
                        : 'border border-cartesian-line/60 bg-white/70 text-cartesian-muted hover:text-cartesian-ink'
                    }`}
                  >
                    全部会话 ({displaySessions.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('in_progress')}
                    className={`px-3 py-1.5 text-xs transition-colors ${
                      activeTab === 'in_progress'
                        ? 'bg-[#9E6D38] text-white font-medium'
                        : 'border border-cartesian-line/60 bg-white/70 text-cartesian-muted hover:text-cartesian-ink'
                    }`}
                  >
                    进行中 / 待读档 ({inProgressCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('completed')}
                    className={`px-3 py-1.5 text-xs transition-colors ${
                      activeTab === 'completed'
                        ? 'bg-cartesian-ink text-white font-medium'
                        : 'border border-cartesian-line/60 bg-white/70 text-cartesian-muted hover:text-cartesian-ink'
                    }`}
                  >
                    已结案复盘 ({completedCount})
                  </button>
                </div>

                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索目标关键词..."
                  className="px-3.5 py-1.5 font-body text-xs w-56 focus:w-72 bg-white/80 border border-cartesian-line/60"
                />
              </div>

              <div className="divide-y divide-cartesian-line/25">
                {displaySessions.length === 0 ? (
                  <p className="p-8 text-center cartesian-micro text-cartesian-muted">
                    未找到匹配的历史会话记录
                  </p>
                ) : (
                  displaySessions.map((session) => {
                    const isExpanded = expandedSessionId === session.id;
                    const sessionDetail = sessionsMap[session.id] || session;
                    const summary = summaries.find(s => s.sessionId === session.id);
                    const isPausedOrExec = session.status === 'executing' || session.status === 'paused' || session.status === 'planning';
                    const compCount = sessionDetail.tasks?.filter(t => t.status === 'completed').length || summary?.completedTasks || 0;
                    const totalTaskCount = sessionDetail.tasks?.length || summary?.totalTasks || 0;

                    return (
                      <div
                        key={session.id}
                        className={`py-5 px-3 transition-colors ${
                          isExpanded ? 'bg-[#FAF7F2]' : 'hover:bg-black/[0.015]'
                        }`}
                      >
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-2">
                          <div
                            onClick={() => setExpandedSessionId(isExpanded ? null : session.id)}
                            className="flex-1 cursor-pointer select-none"
                          >
                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                              <span className="font-serif text-sm text-cartesian-ink">
                                {isExpanded ? '▾' : '▸'}
                              </span>
                              <span className={`cartesian-micro px-2 py-0.5 ${
                                isPausedOrExec
                                  ? 'bg-[#9E6D38] text-white'
                                  : 'bg-[#E2DBD1] text-cartesian-muted'
                              }`}>
                                {isPausedOrExec ? '进行中 / 待读档' : '已结案'}
                              </span>
                              <span className="cartesian-micro text-cartesian-muted">
                                {new Date(session.lastActiveAt || session.createdAt).toLocaleString('zh-CN', {
                                  year: 'numeric',
                                  month: '2-digit',
                                  day: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                            <h3 className="font-sans text-body font-medium text-cartesian-ink line-clamp-2 pl-4">
                              {session.goal}
                            </h3>
                          </div>

                          {/* 右侧动作与准确率 */}
                          <div className="flex items-center gap-3 shrink-0 self-start">
                            {summary && (
                              <div className="text-right pr-2">
                                <p className="font-serif text-2xl font-normal text-cartesian-ink">
                                  {(summary.accuracyRate * 100).toFixed(0)}%
                                </p>
                                <p className="cartesian-micro text-cartesian-muted">准确率</p>
                              </div>
                            )}

                            {isPausedOrExec && (
                              <Link
                                href={`/?resumeId=${session.id}`}
                                className="btn-cartesian-primary px-3 py-1.5 text-xs flex items-center gap-1.5"
                                title="继续从断点恢复执行"
                              >
                                <span>⚡ 继续读档</span>
                              </Link>
                            )}

                            <button
                              type="button"
                              onClick={(e) => handleDeleteSession(session.id, e)}
                              className="w-7 h-7 border border-cartesian-line/60 bg-white flex items-center justify-center text-cartesian-ink hover:bg-cartesian-danger hover:text-white hover:border-cartesian-danger text-xs transition-colors"
                              title="删除此条记录"
                            >
                              ✕
                            </button>
                          </div>
                        </div>

                        {/* 摘要指标行 */}
                        <div className="flex flex-wrap gap-4 cartesian-micro text-cartesian-muted pl-4 pt-1">
                          <span>{compCount} / {totalTaskCount} Tasks Completed</span>
                          {summary && (
                            <>
                              <span>Est: {summary.totalEstimatedMinutes}m</span>
                              <span>Act: {summary.totalActualMinutes}m</span>
                              <span className={`px-1.5 py-0.2 border border-cartesian-line/40 font-mono text-xs ${
                                summary.totalActualMinutes > summary.totalEstimatedMinutes
                                  ? 'text-cartesian-warning'
                                  : 'text-cartesian-success'
                              }`}>
                                {summary.totalActualMinutes > summary.totalEstimatedMinutes ? '+' : ''}
                                {summary.totalActualMinutes - summary.totalEstimatedMinutes}m Diff
                              </span>
                            </>
                          )}
                        </div>

                        {/* 展开的子任务明细 */}
                        {isExpanded && sessionDetail && sessionDetail.tasks && (
                          <div className="mt-4 pt-3 pl-2 md:pl-4 space-y-2 animate-fade-in border-t border-cartesian-line/20">
                            <h4 className="cartesian-label text-cartesian-muted">
                              Sub-Task Breakdown
                            </h4>
                            <div className="divide-y divide-cartesian-line/20">
                              {sessionDetail.tasks.map((task, idx) => {
                                const actual = task.actualMinutes || 0;
                                const est = task.estimatedMinutes;
                                const isDone = task.status === 'completed';
                                const isInProg = task.status === 'in_progress';

                                return (
                                  <div
                                    key={task.id || idx}
                                    className="py-2 px-1 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-small font-body"
                                  >
                                    <div className="flex items-center gap-2">
                                      <span className={`w-5 h-5 flex items-center justify-center font-serif text-xs shrink-0 ${
                                        isDone ? 'bg-cartesian-ink text-white' : isInProg ? 'border border-[#9E6D38] text-[#9E6D38]' : 'border border-cartesian-line/60 text-cartesian-muted'
                                      }`}>
                                        {isDone ? '✓' : idx + 1}
                                      </span>
                                      <span className={`text-cartesian-ink ${isDone ? 'line-through opacity-60' : ''}`}>
                                        {task.title}
                                      </span>
                                      {isInProg && (
                                        <span className="cartesian-micro px-1 py-0.2 bg-[#9E6D38] text-white">
                                          Active
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-3 cartesian-micro text-cartesian-muted pl-7 sm:pl-0">
                                      <span>Est: {est}m</span>
                                      {isDone && <span>Act: {actual}m</span>}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            {sessionDetail.fallbackTask && (
                              <div className="p-3 bg-[#FAF7F2] border-l-2 border-cartesian-line text-xs font-body text-cartesian-muted mt-2">
                                <strong className="cartesian-micro text-cartesian-ink mr-2">Fallback Routine:</strong>
                                {sessionDetail.fallbackTask}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

// 准确率趋势折线图组件 (Cartesian Architectural 1px Hairline SVG Style)
function AccuracyChart({ summaries }: { summaries: SessionSummary[] }) {
  if (summaries.length === 0) return null;

  const width = 800;
  const height = 260;
  const padding = { top: 25, right: 60, bottom: 40, left: 60 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // 数据点：最多显示最近 20 个
  const data = summaries.slice(-20);
  const maxIndex = data.length - 1;

  // 计算坐标
  const points = data.map((s, i) => {
    const x = padding.left + (i / Math.max(1, maxIndex)) * chartWidth;
    const y = padding.top + (1 - s.accuracyRate) * chartHeight;
    return { x, y, rate: s.accuracyRate };
  });

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return (
    <div className="w-full overflow-x-auto">
      <svg
        width={width}
        height={height}
        className="mx-auto"
        style={{ maxWidth: '100%', height: 'auto' }}
      >
        {/* 背景网格细线 */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = padding.top + (1 - ratio) * chartHeight;
          return (
            <g key={ratio}>
              <line
                x1={padding.left}
                y1={y}
                x2={padding.left + chartWidth}
                y2={y}
                stroke="#B8B0A4"
                strokeOpacity="0.4"
                strokeWidth="1"
              />
              <text
                x={padding.left - 10}
                y={y + 4}
                textAnchor="end"
                fill="#5A5A5A"
                fontSize="10"
                fontFamily="Inter, sans-serif"
                letterSpacing="1px"
              >
                {(ratio * 100).toFixed(0)}%
              </text>
            </g>
          );
        })}

        {/* X 轴标签 */}
        <text
          x={width / 2}
          y={height - 8}
          textAnchor="middle"
          fill="#5A5A5A"
          fontSize="10"
          fontFamily="Inter, sans-serif"
          letterSpacing="2px"
          style={{ textTransform: 'uppercase' }}
        >
          SESSION TIMELINE (RECENT {data.length} SESSIONS)
        </text>

        {/* Y 轴标签 */}
        <text
          x={18}
          y={height / 2}
          textAnchor="middle"
          fill="#5A5A5A"
          fontSize="10"
          fontFamily="Inter, sans-serif"
          letterSpacing="2px"
          style={{ textTransform: 'uppercase' }}
          transform={`rotate(-90, 18, ${height / 2})`}
        >
          ACCURACY
        </text>

        {/* 准确率折线 */}
        <path
          d={pathD}
          fill="none"
          stroke="#1A1A1A"
          strokeWidth="1.5"
        />

        {/* 数据圆点 */}
        {points.map((p, i) => (
          <g key={i}>
            <circle
              cx={p.x}
              cy={p.y}
              r="4"
              fill="#EDE8E0"
              stroke="#1A1A1A"
              strokeWidth="1.5"
            />
            <text
              x={p.x}
              y={p.y - 10}
              textAnchor="middle"
              fill="#1A1A1A"
              fontSize="10"
              fontFamily="Inter, sans-serif"
              fontWeight="500"
            >
              {(p.rate * 100).toFixed(0)}%
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
