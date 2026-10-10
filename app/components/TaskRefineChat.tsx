// app/components/TaskRefineChat.tsx - 与 LLM 对话微调任务拆解（规划期 / 执行期实时调整，支持多轮记忆）(Cartesian 笛卡尔/建筑志风格)

'use client';

import { useEffect, useRef, useState } from 'react';
import { SuggestedTask, ChatMessage, getLlmConfig, refineTasks, ExecutionContext } from '@/lib/agent';

interface TaskRefineChatProps {
  goal: string;
  tasks: SuggestedTask[];
  onTasksUpdate: (tasks: SuggestedTask[]) => void;
  /** planning: 规划期微调；execution: 执行期实时调整（含进度上下文与持久对话） */
  mode?: 'planning' | 'execution';
  /** 受控对话记录（提供后由父组件持久化，如 session.chatHistory） */
  messages?: ChatMessage[];
  onMessagesChange?: (messages: ChatMessage[]) => void;
  /** 执行期上下文（已完成任务、已耗时、当前焦点） */
  execution?: ExecutionContext;
}

export function TaskRefineChat({
  goal,
  tasks,
  onTasksUpdate,
  mode = 'planning',
  messages,
  onMessagesChange,
  execution,
}: TaskRefineChatProps) {
  const isControlled = messages !== undefined;
  const [internalMessages, setInternalMessages] = useState<ChatMessage[]>([]);
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [updatedHint, setUpdatedHint] = useState('');
  const [progressStatus, setProgressStatus] = useState('');
  const listRef = useRef<HTMLDivElement>(null);

  const messageList: ChatMessage[] = isControlled ? (messages as ChatMessage[]) : internalMessages;
  const updateMessages = (next: ChatMessage[]) => {
    if (isControlled) {
      onMessagesChange?.(next);
    } else {
      setInternalMessages(next);
    }
  };

  // 新消息时滚动到底部
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messageList, loading, progressStatus, open]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    if (!goal.trim() || tasks.length === 0) {
      setError(mode === 'execution' ? '当前没有可调整的待办任务' : '请先输入总目标和子任务，再进行对话微调');
      return;
    }

    const history = [...messageList];
    updateMessages([...history, { role: 'user', content: text }]);
    setInput('');
    setLoading(true);
    setError('');
    setUpdatedHint('');
    setProgressStatus('✦ Agent 正在思考...');

    try {
      const result = await refineTasks(
        goal,
        tasks,
        history,
        text,
        getLlmConfig(),
        (status) => {
          setProgressStatus(status);
        },
        mode === 'execution' ? execution : undefined
      );
      updateMessages([
        ...history,
        { role: 'user', content: text },
        { role: 'assistant', content: result.reply },
      ]);
      if (result.tasks && result.tasks.length > 0) {
        onTasksUpdate(result.tasks);
        setUpdatedHint(`✓ 待办清单已重构（${result.tasks.length} 项）`);
      }
      setProgressStatus('');
    } catch (e: any) {
      setError(e?.message || '发送失败');
      updateMessages(history);
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

  const handleClearHistory = () => {
    if (confirm('确定要清空本轮与 Agent 的对话记录吗？')) {
      updateMessages([]);
      setUpdatedHint('');
      setError('');
    }
  };

  const quickPrompts = mode === 'execution'
    ? ['根据当前进度重新调整剩余计划', '把剩余任务再拆细一点', '新增一个临时任务']
    : ['任务再拆细一点', '第 2 个任务时间预估太乐观', '增加环境隔离检查任务'];

  return (
    <div className="border-l-2 border-[#C07028]/60 bg-[#FCF6EE]/45">
      {/* 折叠头 */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-[#FCF6EE] transition-colors text-left"
      >
        <span className="cartesian-label flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-[#A34F10] inline-block"></span>
          {mode === 'execution' ? 'Live Plan Adjustment · Agent Dialogue' : 'Interactive Task Refinement'}
        </span>
        <div className="flex items-center gap-2">
          <span className="cartesian-micro px-2 py-0.5 bg-cartesian-bg/80 text-cartesian-muted">
            {messageList.length > 0 ? `${messageList.length} Messages` : 'Dialogue Mode'}
          </span>
          <span className="font-serif text-sm text-cartesian-ink">
            {open ? '▾' : '▸'}
          </span>
        </div>
      </button>

      {open && (
        <div className="bg-white/40">
          {/* 消息区 */}
          <div
            ref={listRef}
            className="max-h-72 overflow-y-auto px-5 py-4 space-y-3 custom-scrollbar"
          >
            {messageList.length === 0 && (
              <div className="p-3.5 bg-white/60 text-small font-body text-cartesian-muted leading-relaxed">
                {mode === 'execution'
                  ? '💡 执行中计划走样很正常。可直接告诉 Agent 当前实际进展，让它重排、拆分或增删剩余任务（对话会随本轮会话保存，刷新或手机端继续看）。'
                  : '💡 可通过自然语言对话微调拆解结构。例如：「把任务 2 再拆细一点」「为所有任务多预留 15% 缓冲时间」。'}
              </div>
            )}
            {messageList.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] px-4 py-2.5 font-body text-small whitespace-pre-wrap ${
                    m.role === 'user'
                      ? 'bg-cartesian-bg-subtle text-cartesian-ink'
                      : 'bg-white text-cartesian-ink'
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

          {/* 快捷提示与清空对话 */}
          {messageList.length === 0 ? (
            <div className="px-5 pb-3 flex flex-wrap gap-2">
              {quickPrompts.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setInput(q)}
                  className="px-2.5 py-1 bg-white/70 cartesian-micro text-cartesian-ink hover:bg-cartesian-ink hover:text-white transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          ) : (
            <div className="px-5 pb-3">
              <button
                type="button"
                onClick={handleClearHistory}
                className="cartesian-micro text-cartesian-accent hover:text-cartesian-danger underline transition-colors"
              >
                Clear Conversation
              </button>
            </div>
          )}

          {/* 输入区 */}
          <div className="flex gap-2 px-5 pb-5">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={mode === 'execution' ? '告诉 Agent 实际进展或调整想法，按 Enter 发送...' : '输入修改建议，按 Enter 发送...'}
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
