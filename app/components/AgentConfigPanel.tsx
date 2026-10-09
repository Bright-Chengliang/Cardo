// app/components/AgentConfigPanel.tsx - Agent 配置面板 (Cartesian 笛卡尔/建筑志风格)

'use client';

import { useEffect, useRef, useState } from 'react';
import {
  LlmConfig,
  ModelInfo,
  ResponseFormat,
  fetchModels,
  getLlmConfig,
  needsV1Hint,
  saveLlmConfig,
  testConnection,
} from '@/lib/agent';

interface AgentConfigPanelProps {
  onConfigChange?: (config: LlmConfig) => void;
}

export function AgentConfigPanel({ onConfigChange }: AgentConfigPanelProps) {
  const [open, setOpen] = useState(false);
  const [config, setConfig] = useState<LlmConfig>({
    provider: 'openai',
    apiKey: '',
    baseUrl: '',
    model: '',
    favoriteModels: [],
  });
  const [showKey, setShowKey] = useState(false);
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [modelQuery, setModelQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ kind: 'ok' | 'err' | null; msg: string }>({ kind: null, msg: '' });
  const loadedOnce = useRef(false);

  // 首次挂载/展开时加载配置
  useEffect(() => {
    if (!loadedOnce.current) {
      const cfg = getLlmConfig();
      setConfig({
        provider: cfg.provider || 'openai',
        apiKey: cfg.apiKey || '',
        baseUrl: cfg.baseUrl || '',
        model: cfg.model || '',
        favoriteModels: cfg.favoriteModels || [],
      });
      loadedOnce.current = true;
    }
  }, [open]);

  const update = (patch: Partial<LlmConfig>, persist = true) => {
    const next = { ...config, ...patch };
    setConfig(next);
    if (persist) saveLlmConfig(next);
    onConfigChange?.(next);
  };

  const handleFetchModels = async () => {
    setLoading(true);
    setStatus({ kind: null, msg: '' });
    try {
      const list = await fetchModels(config);
      setModels(list);
      setStatus({
        kind: 'ok',
        msg: list.length > 0 ? `获取到 ${list.length} 个模型` : '接口可达，但未返回模型列表，可手动输入模型名',
      });
    } catch (e: any) {
      setStatus({ kind: 'err', msg: e?.message || '获取失败' });
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    setLoading(true);
    setStatus({ kind: null, msg: '' });
    try {
      const msg = await testConnection(config);
      setStatus({ kind: 'ok', msg });
    } catch (e: any) {
      setStatus({ kind: 'err', msg: e?.message || '测试失败' });
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = (modelId: string) => {
    const favs = config.favoriteModels || [];
    const next = favs.includes(modelId) ? favs.filter((m) => m !== modelId) : [...favs, modelId];
    update({ favoriteModels: next });
  };

  // 收藏置顶 + 模糊过滤
  const q = modelQuery.trim().toLowerCase();
  const visibleModels = models
    .filter((m) => !q || m.id.toLowerCase().includes(q))
    .sort((a, b) => {
      const fa = (config.favoriteModels || []).includes(a.id) ? 0 : 1;
      const fb = (config.favoriteModels || []).includes(b.id) ? 0 : 1;
      if (fa !== fb) return fa - fb;
      return a.id.localeCompare(b.id);
    });

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
          AI Agent Engine Parameters
        </span>
        <div className="flex items-center gap-2">
          <span className="cartesian-micro px-2 py-0.5 border border-cartesian-line bg-cartesian-bg text-cartesian-muted truncate max-w-[200px]">
            {config.model ? config.model : 'Not Configured'}
          </span>
          <span className="font-serif text-sm text-cartesian-ink">
            {open ? '▾' : '▸'}
          </span>
        </div>
      </button>

      {open && (
        <div className="px-5 py-5 space-y-4 border-t border-cartesian-line bg-cartesian-bg/30">
          {/* API 端点 */}
          <div className="space-y-1.5">
            <label className="block cartesian-label">
              API Endpoint
            </label>
            <input
              type="text"
              value={config.baseUrl}
              onChange={(e) => update({ baseUrl: e.target.value })}
              placeholder="https://api.openai.com/v1"
              className="w-full px-3 py-2 font-mono text-small"
            />
            {needsV1Hint(config.provider, config.baseUrl) && (
              <p className="cartesian-micro text-cartesian-warning mt-1">
                是否需要补充 <code>/v1</code> 路径？示例：
                {config.provider === 'openai'
                  ? ' https://api.openai.com/v1'
                  : ' https://api.anthropic.com'}
              </p>
            )}
          </div>

          {/* 响应格式选择 */}
          <div className="space-y-1.5">
            <label className="block cartesian-label">
              Protocol Standard
            </label>
            <div className="flex gap-2">
              {(['openai', 'anthropic'] as ResponseFormat[]).map((fmt) => (
                <label
                  key={fmt}
                  className={`flex items-center gap-2 px-3.5 py-1.5 border cursor-pointer transition-colors text-xs font-body ${
                    config.provider === fmt
                      ? 'bg-cartesian-ink text-cartesian-bg border-cartesian-ink'
                      : 'bg-white/70 text-cartesian-ink border-cartesian-line hover:border-cartesian-ink'
                  }`}
                >
                  <input
                    type="radio"
                    name="response-format"
                    checked={config.provider === fmt}
                    onChange={() => update({ provider: fmt, baseUrl: '' })}
                    className="accent-cartesian-ink"
                  />
                  {fmt === 'openai' ? 'OpenAI Compatible' : 'Anthropic Format'}
                </label>
              ))}
            </div>
          </div>

          {/* API 密钥 */}
          <div className="space-y-1.5">
            <label className="block cartesian-label">
              API Key
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={config.apiKey}
                onChange={(e) => update({ apiKey: e.target.value })}
                placeholder="sk-..."
                className="w-full px-3 py-2 pr-16 font-mono text-small"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-0.5 border border-cartesian-line bg-cartesian-bg cartesian-micro text-cartesian-ink hover:bg-cartesian-ink hover:text-white transition-colors"
              >
                {showKey ? 'HIDE' : 'SHOW'}
              </button>
            </div>
            <p className="cartesian-micro text-cartesian-muted mt-1">
              密钥仅保存在本地浏览器 localStorage 中，不经过第三方代理。
            </p>
          </div>

          {/* 模型管理 */}
          <div className="space-y-2.5">
            <label className="block cartesian-label">
              Model Selection
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleFetchModels}
                disabled={loading}
                className="btn-cartesian-outline px-3 py-1.5 text-xs disabled:opacity-40"
              >
                {loading ? '... Fetching' : '↻ Fetch Models'}
              </button>
              <button
                type="button"
                onClick={handleTest}
                disabled={loading}
                className="btn-cartesian-outline px-3 py-1.5 text-xs disabled:opacity-40"
              >
                ✦ Test Connection
              </button>
            </div>

            {models.length > 0 && (
              <div className="space-y-2 pt-1">
                <input
                  type="text"
                  value={modelQuery}
                  onChange={(e) => setModelQuery(e.target.value)}
                  placeholder="搜索模型（模糊匹配）..."
                  className="w-full px-3 py-1.5 font-body text-xs"
                />
                <div className="max-h-44 overflow-y-auto border border-cartesian-line divide-y divide-cartesian-line bg-white/80 custom-scrollbar">
                  {visibleModels.length === 0 && (
                    <p className="px-3 py-2 cartesian-micro text-cartesian-muted">无匹配模型</p>
                  )}
                  {visibleModels.map((m) => {
                    const fav = (config.favoriteModels || []).includes(m.id);
                    const active = config.model === m.id;
                    return (
                      <div
                        key={m.id}
                        className={`flex items-center gap-2.5 px-3 py-2 cursor-pointer transition-colors ${
                          active ? 'bg-cartesian-bg-subtle text-cartesian-ink font-medium' : 'text-cartesian-ink hover:bg-cartesian-bg'
                        }`}
                        onClick={() => update({ model: m.id })}
                      >
                        <span className="font-mono text-xs flex-1 truncate">{m.id}</span>
                        {m.contextLength && (
                          <span className="cartesian-micro text-cartesian-muted">
                            {(m.contextLength / 1000).toFixed(0)}k ctx
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(m.id);
                          }}
                          className={`text-xs transition-colors ${fav ? 'text-cartesian-ink' : 'text-cartesian-line hover:text-cartesian-ink'}`}
                          title={fav ? '取消收藏' : '收藏/置顶'}
                        >
                          {fav ? '★' : '☆'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 手动输入模型名 */}
            <div className="space-y-1 pt-1">
              <p className="cartesian-micro text-cartesian-muted">
                Direct Model Identifier:
              </p>
              <input
                type="text"
                value={config.model}
                onChange={(e) => update({ model: e.target.value })}
                placeholder="gpt-4o-mini / claude-3-5-sonnet / deepseek-chat"
                className="w-full px-3 py-2 font-mono text-small"
              />
            </div>
          </div>

          {/* 状态消息 */}
          {status.kind && (
            <div
              className={`p-2.5 border cartesian-micro ${
                status.kind === 'ok'
                  ? 'bg-cartesian-bg border-cartesian-line text-cartesian-success'
                  : 'bg-cartesian-bg border-cartesian-line text-cartesian-danger'
              }`}
            >
              {status.kind === 'ok' ? '✓ ' : '✕ '}
              {status.msg}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
