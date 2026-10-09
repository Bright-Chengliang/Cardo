// app/components/MobileConnectModal.tsx - 移动端连接与局域网副屏同步弹窗 (Cartesian 笛卡尔/建筑志风格)

'use client';

import { useEffect, useState } from 'react';

interface MobileConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileConnectModal({ isOpen, onClose }: MobileConnectModalProps) {
  const [ips, setIps] = useState<string[]>([]);
  const [selectedIp, setSelectedIp] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // 获取本机局域网 IP
      fetch('/api/network/ip')
        .then((r) => r.json())
        .then((data) => {
          if (data.ips && data.ips.length > 0) {
            setIps(data.ips);
            setSelectedIp(data.ips[0]);
          } else {
            setSelectedIp('localhost');
          }
        })
        .catch(() => {
          setSelectedIp('localhost');
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const mobileUrl = selectedIp ? `http://${selectedIp}:3025/mobile` : 'http://localhost:3025/mobile';

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A1A1A]/75 backdrop-blur-md p-4 animate-fade-in">
      <div
        className="bg-[#EDE8E0] border border-cartesian-line max-w-lg w-full p-8 shadow-2xl relative text-cartesian-ink"
        style={{ backgroundColor: '#EDE8E0' }}
      >
        {/* 关闭按钮 */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center border border-cartesian-line bg-white text-cartesian-ink hover:bg-cartesian-ink hover:text-white transition-colors font-serif text-sm"
        >
          ✕
        </button>

        {/* 标题 */}
        <div className="mb-6">
          <div className="cartesian-label mb-1">
            Device Synchronization
          </div>
          <h2 className="font-display text-h3 font-normal text-cartesian-ink">
            移动端副屏局域网直连
          </h2>
          <p className="cartesian-micro text-cartesian-muted mt-1">
            同一 Wi-Fi 局域网即时响应 · 零云端依赖 · 纯本地同步
          </p>
        </div>

        <div className="space-y-5">
          {/* 局域网 IP 选择 */}
          {ips.length > 1 && (
            <div className="space-y-1">
              <label className="block cartesian-label">
                Network Interface IP
              </label>
              <select
                value={selectedIp}
                onChange={(e) => setSelectedIp(e.target.value)}
                className="w-full px-3 py-2 bg-white/80 border border-cartesian-line text-small font-mono text-cartesian-ink"
              >
                {ips.map((ip) => (
                  <option key={ip} value={ip}>
                    {ip}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* 移动端访问地址 */}
          <div className="space-y-1.5">
            <label className="block cartesian-label">
              Mobile Access URL
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={mobileUrl}
                className="flex-1 px-3 py-2.5 bg-white/90 border border-cartesian-line text-small font-mono text-cartesian-ink select-all"
              />
              <button
                type="button"
                onClick={() => handleCopy(mobileUrl)}
                className="btn-cartesian-primary px-4 py-2.5 text-xs shrink-0"
              >
                {copied ? '✓ Copied' : 'Copy URL'}
              </button>
            </div>
          </div>

          {/* 连接指引说明 */}
          <div className="p-4 bg-[#FAF7F2] border border-cartesian-line/70 text-xs font-body text-cartesian-muted space-y-2">
            <div className="font-semibold text-cartesian-ink flex items-center gap-1.5">
              <span>📱</span>
              <span>副屏打卡使用方式</span>
            </div>
            <ol className="list-decimal pl-4 space-y-1 leading-relaxed">
              <li>确保手机与当前电脑连接在<strong>同一个局域网 / Wi-Fi</strong> 下；</li>
              <li>在手机浏览器中打开上方地址（建议点击分享添加到主屏幕作为独立 PWA App）；</li>
              <li>电脑端开始专注轮次后，手机端将自动秒级同步并充当触感震动打卡器。</li>
            </ol>
          </div>

          <div className="pt-2 text-right">
            <button
              type="button"
              onClick={onClose}
              className="btn-cartesian-outline px-5 py-2 text-xs"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
