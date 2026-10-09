// app/components/EnergyWisdomCard.tsx - 常驻精力与注意力管理科学技巧卡片 (Cartesian 笛卡尔/建筑志风格)

'use client';

import { useState } from 'react';
import { ENERGY_TIPS, EnergyTip } from '@/lib/energy-tips';

interface EnergyWisdomCardProps {
  variant?: 'compact' | 'full' | 'banner';
  initialTipId?: number;
  className?: string;
}

export function EnergyWisdomCard({
  variant = 'full',
  initialTipId,
  className = '',
}: EnergyWisdomCardProps) {
  const [currentIndex, setCurrentIndex] = useState(() => {
    if (initialTipId) {
      const idx = ENERGY_TIPS.findIndex((t) => t.id === initialTipId);
      if (idx !== -1) return idx;
    }
    return Math.floor(Math.random() * ENERGY_TIPS.length);
  });
  const [showEvidence, setShowEvidence] = useState(false);
  const [isModalListOpen, setIsModalListOpen] = useState(false);

  const currentTip = ENERGY_TIPS[currentIndex];

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % ENERGY_TIPS.length);
    setShowEvidence(false);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + ENERGY_TIPS.length) % ENERGY_TIPS.length);
    setShowEvidence(false);
  };

  const handleSelectTip = (idx: number) => {
    setCurrentIndex(idx);
    setShowEvidence(false);
    setIsModalListOpen(false);
  };

  if (variant === 'banner') {
    return (
      <div className={`py-2.5 px-4 bg-[#EAF1EB] border border-[#C5D8C9] border-l-4 border-l-[#3B6647] flex items-center justify-between gap-3 text-sm font-body animate-fade-in ${className}`}>
        <div className="flex items-center gap-3 overflow-hidden">
          <span className="cartesian-micro px-2 py-0.5 bg-[#3B6647] text-white shrink-0 font-mono text-xs font-semibold tracking-wider">
            Rule #{currentTip.id}
          </span>
          <div className="flex items-center gap-1.5 overflow-hidden text-sm leading-normal">
            <span className="text-[#1A3320] font-semibold shrink-0">
              {currentTip.title}
            </span>
            <span className="text-[#3B6647]/60 shrink-0">—</span>
            <span className="text-[#2F4D37] truncate font-normal">
              {currentTip.oneLiner}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleNext}
            className="px-2.5 py-1 border border-[#3B6647]/40 bg-white/80 text-[#243E2B] hover:bg-[#3B6647] hover:text-white text-xs font-mono transition-colors flex items-center gap-1"
            title="换一条精力法则"
          >
            <span>Next</span>
            <span className="text-[11px]">↻</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`py-5 px-1 space-y-4 transition-all relative border-b border-cartesian-line/40 ${className}`}>
        {/* 顶部标签与切换工具 */}
        <div className="flex items-center justify-between gap-2 border-b border-cartesian-line/30 pb-2">
          <div className="flex items-center gap-2">
            <span className="cartesian-micro px-1.5 py-0.5 border border-cartesian-line/60 bg-white/50 text-cartesian-ink">
              {currentTip.categoryLabel}
            </span>
            <span className="cartesian-micro text-cartesian-muted">
              Rule #{currentTip.id} · Level {currentTip.evidenceGrade}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsModalListOpen(true)}
              className="cartesian-micro text-cartesian-accent hover:text-cartesian-ink underline transition-colors mr-1"
            >
              Index ({ENERGY_TIPS.length})
            </button>
            <button
              type="button"
              onClick={handlePrev}
              className="w-6 h-6 border border-cartesian-line/60 bg-white flex items-center justify-center text-cartesian-ink hover:bg-cartesian-ink hover:text-white text-xs transition-colors"
              title="上一条"
            >
              ←
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="w-6 h-6 border border-cartesian-line/60 bg-white flex items-center justify-center text-cartesian-ink hover:bg-cartesian-ink hover:text-white text-xs transition-colors"
              title="下一条"
            >
              →
            </button>
          </div>
        </div>

        {/* 标题与核心格言 */}
        <div>
          <h4 className="font-sans text-body font-semibold text-cartesian-ink mb-1 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-cartesian-accent inline-block"></span>
            <span>{currentTip.title}</span>
          </h4>
          <p className="font-sans text-base text-cartesian-ink leading-relaxed pl-3 border-l-2 border-cartesian-line">
            “{currentTip.oneLiner}”
          </p>
        </div>

        {/* 落地行动指南 */}
        <div className="p-3.5 bg-cartesian-bg/70 border border-cartesian-line space-y-1">
          <span className="cartesian-micro text-cartesian-accent block">
            Action Protocol / 落地动作
          </span>
          <p className="font-body text-small text-cartesian-ink leading-relaxed">
            {currentTip.actionableGuide}
          </p>
        </div>

        {/* 科学机理与文献出处折叠 */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowEvidence((prev) => !prev)}
            className="cartesian-micro text-cartesian-accent hover:text-cartesian-ink underline transition-colors"
          >
            {showEvidence ? 'Hide Mechanism ↑' : 'Scientific Mechanism & Citations ↓'}
          </button>

          {showEvidence && (
            <div className="mt-2.5 p-3.5 bg-cartesian-bg-subtle/50 border border-cartesian-line text-xs font-body text-cartesian-muted space-y-2 animate-fade-in">
              <p className="leading-relaxed">
                <strong className="text-cartesian-ink font-medium">机理：</strong>
                {currentTip.scientificEvidence}
              </p>
              <div className="pt-2 border-t border-cartesian-line/50 cartesian-micro text-cartesian-accent">
                <strong>Source: </strong>
                <span>{currentTip.source}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 法则全集列表弹窗 */}
      {isModalListOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1A1A1A]/75 backdrop-blur-md animate-fade-in">
          <div
            className="bg-[#EDE8E0] border border-cartesian-line max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden text-cartesian-ink"
            style={{ backgroundColor: '#EDE8E0' }}
          >
            <div className="px-6 py-4 border-b border-cartesian-line flex items-center justify-between bg-[#E5DFD6]">
              <div>
                <div className="cartesian-label">System Index</div>
                <h3 className="font-display text-h3 font-normal text-cartesian-ink">
                  实证精力与注意力管理法则全集
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalListOpen(false)}
                className="w-7 h-7 border border-cartesian-line bg-white flex items-center justify-center text-cartesian-ink hover:bg-cartesian-ink hover:text-white text-xs transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-3 flex-1 custom-scrollbar bg-[#EDE8E0]">
              {ENERGY_TIPS.map((tip, idx) => (
                <div
                  key={tip.id}
                  onClick={() => handleSelectTip(idx)}
                  className={`p-3.5 border transition-all cursor-pointer ${
                    idx === currentIndex
                      ? 'bg-white border-cartesian-ink shadow-sm'
                      : 'bg-[#FAF7F2] border-cartesian-line hover:border-cartesian-ink/60'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <span className="cartesian-micro px-1.5 py-0.5 border border-cartesian-line bg-[#EDE8E0]">
                        #{tip.id} {tip.categoryLabel}
                      </span>
                      <h5 className="font-sans text-small font-medium text-cartesian-ink">
                        {tip.title}
                      </h5>
                    </div>
                    <span className="cartesian-micro text-cartesian-muted">
                      Level {tip.evidenceGrade}
                    </span>
                  </div>
                  <p className="font-body text-xs text-cartesian-muted line-clamp-1 pl-1">
                    {tip.oneLiner}
                  </p>
                </div>
              ))}
            </div>

            <div className="px-6 py-3 border-t border-cartesian-line bg-[#E5DFD6] text-right">
              <button
                type="button"
                onClick={() => setIsModalListOpen(false)}
                className="btn-cartesian-outline px-4 py-1.5 text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
