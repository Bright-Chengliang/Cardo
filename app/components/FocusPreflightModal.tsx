// app/components/FocusPreflightModal.tsx - 启动 Focus 仪式化四步就绪指引 (Cartesian 风格)

'use client';

import { useState, useEffect } from 'react';
import { FOCUS_PREFLIGHT_STEPS } from '@/lib/energy-tips';

interface FocusPreflightModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmStart: () => void;
  goal: string;
  firstTaskTitle: string;
  fallbackTask: string;
}

const STORAGE_KEY_SKIP_PREFLIGHT = 'focus_skip_preflight_guide';

export function FocusPreflightModal({
  isOpen,
  onClose,
  onConfirmStart,
  goal,
  firstTaskTitle,
  fallbackTask,
}: FocusPreflightModalProps) {
  const [checkedMap, setCheckedMap] = useState<Record<string, boolean>>({});
  const [expandedWhy, setExpandedWhy] = useState<Record<string, boolean>>({});
  const [rememberSkip, setRememberSkip] = useState(false);

  // 初始化所有项为未勾选
  useEffect(() => {
    if (isOpen) {
      const allIds: Record<string, boolean> = {};
      FOCUS_PREFLIGHT_STEPS.forEach((step) => {
        step.items.forEach((item) => {
          allIds[item.id] = false;
        });
      });
      setCheckedMap(allIds);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const allItemIds = FOCUS_PREFLIGHT_STEPS.flatMap((s) => s.items.map((i) => i.id));
  const checkedCount = allItemIds.filter((id) => checkedMap[id]).length;
  const totalCount = allItemIds.length;
  const isAllChecked = checkedCount === totalCount;

  const toggleCheck = (id: string) => {
    setCheckedMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCheckAll = () => {
    const nextState = !isAllChecked;
    const nextMap: Record<string, boolean> = {};
    allItemIds.forEach((id) => {
      nextMap[id] = nextState;
    });
    setCheckedMap(nextMap);
  };

  const toggleWhy = (id: string) => {
    setExpandedWhy((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleLaunch = () => {
    if (rememberSkip && typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_SKIP_PREFLIGHT, 'true');
    }
    onConfirmStart();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-[#1A1A1A]/75 backdrop-blur-md animate-fade-in">
      <div
        className="bg-[#EDE8E0] border border-cartesian-line max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-cartesian-ink relative"
        style={{ backgroundColor: '#EDE8E0' }}
      >
        {/* 顶部标题栏 */}
        <div className="px-8 py-6 border-b border-cartesian-line flex items-start justify-between gap-4 bg-[#E5DFD6]">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="cartesian-label">
                Pre-Flight Protocol
              </span>
              <span className="text-cartesian-line">·</span>
              <span className="cartesian-micro text-cartesian-muted">
                Cognitive Readiness Standard
              </span>
            </div>
            <h2 className="font-display text-h3 font-normal text-cartesian-ink">
              进入深度专注前的就绪核验
            </h2>
            <p className="font-body text-cartesian-muted text-small mt-1">
              基于实证注意力科学：挡住微小打断与视线干扰，保护宝贵的认知带宽。
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 border border-cartesian-line bg-white flex items-center justify-center text-cartesian-ink hover:bg-cartesian-ink hover:text-white transition-colors shrink-0 font-serif"
            title="关闭"
          >
            ✕
          </button>
        </div>

        {/* 核心检查步骤（可滚动） */}
        <div className="p-6 md:p-8 overflow-y-auto space-y-6 flex-1 custom-scrollbar bg-[#EDE8E0]">
          {/* 本轮上下文微摘要 */}
          <div className="p-4 bg-[#FAF7F2] border border-cartesian-line flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
            <div className="space-y-1 flex-1">
              <span className="cartesian-micro text-cartesian-muted block">
                Target Session Goal
              </span>
              <p className="font-body text-body font-medium text-cartesian-ink line-clamp-1">
                {goal}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0 font-body text-small text-cartesian-ink bg-[#E2DBD1] px-3 py-1 border border-cartesian-line">
              <span className="cartesian-micro">首项动作:</span>
              <span className="font-medium truncate max-w-[200px]">{firstTaskTitle}</span>
            </div>
          </div>

          {/* 四步指引卡片 */}
          <div className="space-y-5">
            {FOCUS_PREFLIGHT_STEPS.map((step) => (
              <div
                key={step.stepNumber}
                className="bg-[#FAF7F2] border border-cartesian-line p-5 space-y-4"
              >
                {/* 步骤标题 */}
                <div className="flex items-center justify-between pb-2 border-b border-cartesian-line/50">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 flex items-center justify-center border border-cartesian-line bg-[#EDE8E0] font-serif text-sm text-cartesian-ink">
                      {step.stepNumber}
                    </span>
                    <div>
                      <h3 className="font-sans text-body font-semibold text-cartesian-ink">
                        {step.title}
                      </h3>
                      <p className="cartesian-micro text-cartesian-muted">{step.subtitle}</p>
                    </div>
                  </div>
                </div>

                {/* 步骤内检查项清单 */}
                <div className="space-y-2.5">
                  {step.items.map((item) => {
                    const isChecked = !!checkedMap[item.id];
                    const isWhyExpanded = !!expandedWhy[item.id];

                    return (
                      <div
                        key={item.id}
                        className={`p-3 border transition-colors ${
                          isChecked
                            ? 'bg-[#E2DBD1] border-cartesian-ink/40'
                            : 'bg-white border-cartesian-line hover:border-cartesian-ink/60'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {/* 建筑志复选框 */}
                          <button
                            type="button"
                            onClick={() => toggleCheck(item.id)}
                            className={`w-5 h-5 mt-0.5 flex items-center justify-center border transition-colors shrink-0 ${
                              isChecked
                                ? 'bg-cartesian-ink text-[#EDE8E0] border-cartesian-ink'
                                : 'bg-white border-cartesian-line hover:border-cartesian-ink'
                            }`}
                          >
                            {isChecked && <span className="text-xs font-serif leading-none">✓</span>}
                          </button>

                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="cartesian-micro px-1.5 py-0.5 border border-cartesian-line bg-[#EDE8E0] text-cartesian-ink">
                                {item.tag}
                              </span>
                              <span
                                onClick={() => toggleCheck(item.id)}
                                className={`font-body text-small cursor-pointer select-none ${
                                  isChecked
                                    ? 'text-cartesian-muted line-through'
                                    : 'text-cartesian-ink font-medium'
                                }`}
                              >
                                {item.target}
                              </span>
                            </div>

                            {/* 科学依据折叠按钮与内容 */}
                            <div className="pt-0.5">
                              <button
                                type="button"
                                onClick={() => toggleWhy(item.id)}
                                className="cartesian-micro text-cartesian-accent hover:text-cartesian-ink underline transition-colors"
                              >
                                {isWhyExpanded ? '收起机理 ↑' : '科学依据 · 为什么？ ↓'}
                              </button>

                              {isWhyExpanded && (
                                <div className="mt-2 p-3 bg-[#EDE8E0] border border-cartesian-line text-xs font-body text-cartesian-muted space-y-1 animate-fade-in">
                                  <p className="font-medium text-cartesian-ink">{item.why}</p>
                                  <p className="cartesian-micro text-cartesian-accent">{item.action}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 底部控制栏与直接启动操作 */}
        <div className="px-8 py-5 border-t border-cartesian-line bg-[#E5DFD6] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleCheckAll}
              className="btn-cartesian-outline px-3 py-1.5 text-xs"
            >
              {isAllChecked ? '取消全选' : '一键全选'}
            </button>

            <span className="cartesian-micro text-cartesian-muted">
              Ready: <strong className="font-serif text-cartesian-ink text-sm">{checkedCount}</strong> / {totalCount}
            </span>

            <label className="flex items-center gap-1.5 cursor-pointer select-none ml-2">
              <input
                type="checkbox"
                checked={rememberSkip}
                onChange={(e) => setRememberSkip(e.target.checked)}
                className="w-3.5 h-3.5 border-cartesian-line"
              />
              <span className="cartesian-micro text-cartesian-muted">下次直接跳过</span>
            </label>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="btn-cartesian-outline px-4 py-2.5 text-xs flex-1 sm:flex-none"
            >
              Back to Edit
            </button>
            <button
              type="button"
              onClick={handleLaunch}
              className="btn-cartesian-primary px-6 py-2.5 text-xs flex-1 sm:flex-none flex items-center justify-center gap-2"
            >
              <span>✦ Confirm & Enter Cardo</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
