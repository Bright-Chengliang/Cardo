// app/components/TaskRefineChat.tsx - 与 LLM 对话微调任务拆解 (Cartesian 笛卡尔/建筑志风格)

'use client';

import { useEffect, useRef, useState } from 'react';
import { SuggestedTask, ChatMessage, getLlmConfig, refineTasks } from '@/lib/agent';

interface TaskRefineChatProps {
  goal: string;
  tasks: SuggestedTask[];
  onTasksUpdate: (tasks: SuggestedTask[]) => void;
}

export function TaskRefineChat({ goal, tasks, onTasksUpdate }: TaskRefineChatProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [updatedHint, setUpdatedHint] = useState('');
  const [progressStatus, setProgressStatus] = useState('');
  const listRef = useRef<HTMLDivElement>(null);

  // 新消息时滚动到底部
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, loading, progressStatus, open]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    if (!goal.trim() || tasks.length === 0) {
      setError('请先输入总目标和子任务，再进行对话微调');
      return;
    }

    const history = [...messages];
    setMessages([...history, { role: 'user', content: text }]);
    setInput('');
    setLoading(true);
    setError('');
    setUpdatedHint('');
    setProgressStatus('✦ Agent 正在思考...');

    try {
      const result = await refineTasks(goal, tasks, history, text, getLlmConfig(), (status) => {
        setProgressStatus(status);
      });
      setMessages([...history, { role: 'user', content: text }, { role: 'assistant', content: result.reply }]);
      if (result.tasks && result.tasks.length > 0) {
        onTasksUpdate(result.tasks);
        setUpdatedHint(`✓ 任务清单已重构（${result.tasks.length} 项）`);
      }
      setProgressStatus('');
    } catch (e: any) {
      setError(e?.message || '发送失败');
      setMessages(history);
      setInput(text);
      setProgressStatus('');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      send();
    }
  };

  const quickPrompts = ['任务再拆细一点', '第 2 个任务时间预估太乐观', '增加环境隔离检查任务'];

  return (
    <div className="border border-cartesian-line bg-white/60">
      {/* 折叠头 */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-white/80 transition-colors text-left"
      >
        <span className="cartesian-label flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-cartesian-accent inline-block"></span>
          Interactive Task Refinement
        </span>
        <div className="flex items-center gap-2">
          <span className="cartesian-micro px-2 py-0.5 border border-cartesian-line bg-cartesian-bg text-cartesian-muted">
            {messages.length > 0 ? `${messages.length} Messages` : 'Dialogue Mode'}
          </span>
          <span className="font-serif text-sm text-cartesian-ink">
            {open ? '▾' : '▸'}
          </span>
        </div>
      </button>

      {open && (
        <div className="border-t border-cartesian-line bg-cartesian-bg/30">
          {/* 消息区 */}
          <div
            ref={listRef}
            className="max-h-72 overflow-y-auto px-5 py-4 space-y-3 custom-scrollbar"
          >
            {messages.length === 0 && (
              <div className="p-3.5 bg-white/70 border border-cartesian-line text-small font-body text-cartesian-muted leading-relaxed">
                💡 可通过自然语言对话微调拆解结构。例如：「把任务 2 再拆细一点」「为所有任务多预留 15% 缓冲时间」。
              </div>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] px-4 py-2.5 border font-body text-small whitespace-pre-wrap ${
                    m.role === 'user'
                      ? 'bg-cartesian-bg-subtle border-cartesian-ink/40 text-cartesian-ink'
                      : 'bg-white border-cartesian-line text-cartesian-ink'
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="p-3 bg-[#FCF6EE] border-2 border-[#C07028] shadow-sm max-w-[90%] transition-all duration-200">
                  <div className="flex items-center gap-2.5">
                    <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C07028] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#A34F10]"></span>
                    </span>
                    <div className="flex-1 flex flex-wrap items-center gap-2 font-mono text-xs leading-relaxed">
                      {progressStatus && progressStatus.startsWith('[TOOL:') ? (
                        <>
                          <span className="px-2 py-0.5 bg-[#A34F10] text-white font-bold tracking-wider uppercase text-[10px]">
                            {progressStatus.slice(1, progressStatus.indexOf(']'))}
                          </span>
                          <span className="text-[#3E2310] font-semibold font-mono break-all text-xs">
                            {progressStatus.slice(progressStatus.indexOf(']') + 1).trim()}
                          </span>
                        </>
                      ) : (
                        <span className="text-[#6E350E] font-medium tracking-wide">
                          {progressStatus || 'AI 正在思考并探索上下文...'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 状态提示 */}
          {updatedHint && (
            <p className="px-5 pb-2 cartesian-micro text-cartesian-success">{updatedHint}</p>
          )}
          {error && (
            <p className="px-5 pb-2 cartesian-micro text-cartesian-danger">{error}</p>
          )}

          {/* 快捷提示按钮 */}
          {messages.length === 0 && (
            <div className="px-5 pb-3 flex flex-wrap gap-2">
              {quickPrompts.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setInput(q)}
                  className="px-2.5 py-1 bg-white/70 border border-cartesian-line cartesian-micro text-cartesian-ink hover:bg-cartesian-ink hover:text-white transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* 输入区 */}
          <div className="flex gap-2 px-5 pb-5">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入修改建议，按 Enter 发送..."
              disabled={loading}
              className="flex-1 px-3.5 py-2 font-body text-small disabled:opacity-50"
            />
            <button
              type="button"
              onClick={send}
              disabled={loading || !input.trim()}
              className="btn-cartesian-primary px-5 py-2 text-xs disabled:opacity-40"
            >
              {loading ? '...' : 'Send'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
