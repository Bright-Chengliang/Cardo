// lib/agent.ts - LLM Agent 辅助拆解与多模态文件/视觉 Tooling 探索体系

import { saveConfig, getConfig, getSessions } from './storage';
import { ChatMessage } from './types';

export type { ChatMessage } from './types';

export type ResponseFormat = 'openai' | 'anthropic';

export interface LlmConfig {
  provider: ResponseFormat;
  apiKey: string;
  baseUrl: string;
  model: string;
  favoriteModels?: string[];
}

export interface ModelInfo {
  id: string;
  contextLength?: number;
  ownedBy?: string;
}

export interface SuggestedTask {
  id?: string;
  title: string;
  estimatedMinutes: number;
  historyRef?: {
    matches: number;
    avgActual: number;
  };
}

const DEFAULT_BASE: Record<ResponseFormat, string> = {
  openai: process.env.NEXT_PUBLIC_LLM_BASE_URL || 'http://localhost:3002/v1',
  anthropic: 'https://api.anthropic.com',
};

const ENV_CONFIG = {
  provider: ((process.env.NEXT_PUBLIC_LLM_PROVIDER as ResponseFormat) || 'openai'),
  apiKey: process.env.NEXT_PUBLIC_LLM_API_KEY || '',
  baseUrl: process.env.NEXT_PUBLIC_LLM_BASE_URL || 'http://localhost:3002/v1',
  model: process.env.NEXT_PUBLIC_LLM_MODEL || 'gemini-3.8-flash-high',
};

// ---------- 配置持久化 ----------

export function getLlmConfig(): LlmConfig {
  const cfg = getConfig();
  if (cfg.llmConfig) {
    return {
      provider: cfg.llmConfig.provider || ENV_CONFIG.provider,
      apiKey: cfg.llmConfig.apiKey || ENV_CONFIG.apiKey,
      baseUrl: cfg.llmConfig.baseUrl || ENV_CONFIG.baseUrl,
      model: cfg.llmConfig.model || ENV_CONFIG.model,
      favoriteModels: cfg.llmConfig.favoriteModels && cfg.llmConfig.favoriteModels.length > 0
        ? cfg.llmConfig.favoriteModels
        : [ENV_CONFIG.model],
    };
  }
  return {
    provider: ENV_CONFIG.provider,
    apiKey: ENV_CONFIG.apiKey,
    baseUrl: ENV_CONFIG.baseUrl,
    model: ENV_CONFIG.model,
    favoriteModels: [ENV_CONFIG.model],
  };
}

export function saveLlmConfig(config: LlmConfig): void {
  saveConfig({ llmConfig: config });
}

// ---------- URL 处理 ----------

function trimSlash(url: string): string {
  return url.replace(/\/+$/, '');
}

/** 端点是否缺少 /v1 提示（OpenAI 格式常见问题） */
export function needsV1Hint(provider: ResponseFormat, baseUrl: string): boolean {
  if (!baseUrl) return false;
  const base = trimSlash(baseUrl);
  if (provider === 'openai') {
    return !/\/v\d+($|\/)/.test(base) && !base.includes('/chat/completions');
  }
  return !/\/v\d+($|\/)/.test(base);
}

/** 构造聊天补全端点 */
export function chatEndpoint(provider: ResponseFormat, baseUrl: string): string {
  const base = trimSlash(baseUrl || DEFAULT_BASE[provider]);
  if (provider === 'openai') {
    if (base.includes('/chat/completions')) return base;
    if (!/\/v\d+/.test(base)) return `${base}/v1/chat/completions`;
    return `${base}/chat/completions`;
  }
  if (base.includes('/messages')) return base;
  if (!/\/v\d+/.test(base)) return `${base}/v1/messages`;
  return `${base}/messages`;
}

/** 构造模型列表端点 */
export function modelsEndpoint(provider: ResponseFormat, baseUrl: string): string {
  const base = trimSlash(baseUrl || DEFAULT_BASE[provider]);
  if (provider === 'openai') {
    if (base.includes('/models')) return base;
    if (!/\/v\d+/.test(base)) return `${base}/v1/models`;
    return `${base}/models`;
  }
  if (base.includes('/models')) return base;
  if (!/\/v\d+/.test(base)) return `${base}/v1/models`;
  return `${base}/models`;
}

// ---------- 服务端代理请求 ----------

async function proxiedFetch(
  url: string,
  options: {
    method?: string;
    headers?: Record<string, string>;
    body?: any;
  } = {}
): Promise<Response> {
  return fetch('/api/llm/proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url,
      method: options.method || 'GET',
      headers: options.headers || {},
      data: options.body,
    }),
  });
}

// ---------- 获取模型列表 ----------

export async function fetchModels(config: LlmConfig): Promise<ModelInfo[]> {
  const url = modelsEndpoint(config.provider, config.baseUrl);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {}),
  };
  if (config.provider === 'anthropic' && config.apiKey) {
    headers['x-api-key'] = config.apiKey;
    headers['anthropic-version'] = '2023-06-01';
    delete headers.Authorization;
  }

  const res = await proxiedFetch(url, { headers, method: 'GET' });
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`获取模型列表失败 (HTTP ${res.status}): ${errText.slice(0, 150)}`);
  }
  const data = await res.json();

  const list: any[] = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
  return list
    .map((m) => ({
      id: String(m.id ?? m.name ?? ''),
      contextLength: typeof m.context_length === 'number' ? m.context_length : undefined,
      ownedBy: typeof m.owned_by === 'string' ? m.owned_by : undefined,
    }))
    .filter((m) => m.id);
}

// ---------- 连接测试 ----------

export async function testConnection(config: LlmConfig): Promise<string> {
  if (!config.apiKey) throw new Error('未填写 API 密钥');
  const models = await fetchModels(config);
  if (models.length === 0 && config.provider === 'openai') {
    throw new Error('连接成功但未返回模型列表');
  }
  return `连接成功，获取到 ${models.length} 个模型`;
}

// ---------- 历史任务参考（用于估时校准） ----------

export interface HistoryTaskRecord {
  title: string;
  estimatedMinutes: number;
  actualMinutes: number;
  sessionId: string;
  completedAt?: string;
}

export function getHistoryRecords(): HistoryTaskRecord[] {
  const sessions = getSessions();
  const records: HistoryTaskRecord[] = [];
  sessions.forEach((session) => {
    session.tasks.forEach((task) => {
      if (task.status === 'completed' && typeof task.actualMinutes === 'number') {
        records.push({
          title: task.title,
          estimatedMinutes: task.estimatedMinutes,
          actualMinutes: task.actualMinutes,
          sessionId: session.id,
          completedAt: task.completedAt,
        });
      }
    });
  });
  return records.sort((a, b) => {
    const ta = a.completedAt || '';
    const tb = b.completedAt || '';
    return tb.localeCompare(ta);
  });
}

function tokenize(text: string): Set<string> {
  const lower = text.toLowerCase();
  const tokens = new Set<string>();
  const ascii = lower.match(/[a-z0-9]+/g);
  if (ascii) ascii.forEach((w) => tokens.add(w));
  const cjk = lower.match(/[\u4e00-\u9fa5]+/g);
  if (cjk) {
    cjk.forEach((seg) => {
      if (seg.length === 1) {
        tokens.add(seg);
      } else {
        for (let i = 0; i < seg.length - 1; i++) {
          tokens.add(seg.slice(i, i + 2));
        }
        tokens.add(seg[0]);
        tokens.add(seg[seg.length - 1]);
      }
    });
  }
  return tokens;
}

export function similarity(a: string, b: string): number {
  const A = tokenize(a);
  const B = tokenize(b);
  if (A.size === 0 || B.size === 0) return 0;
  let intersection = 0;
  A.forEach((token) => {
    if (B.has(token)) intersection++;
  });
  return intersection / Math.sqrt(A.size * B.size);
}

export function findSimilarHistory(
  query: string,
  records: HistoryTaskRecord[],
  limit = 8
): Array<{ record: HistoryTaskRecord; score: number }> {
  const scored = records
    .map((r) => ({ record: r, score: similarity(query, r.title) }))
    .filter((s) => s.score > 0.2)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
  return scored;
}

function buildHistoryBlock(query: string): string {
  const records = getHistoryRecords();
  if (records.length === 0) return '';
  const similar = findSimilarHistory(query, records, 8);
  if (similar.length === 0) return '';
  const lines = similar.map(
    ({ record: r }) =>
      `- "${r.title}"（预估 ${r.estimatedMinutes} 分钟 → 实际 ${r.actualMinutes} 分钟）`
  );
  return `
历史相似任务参考（供估时参考，优先使用实际用时数据）：
${lines.join('\n')}
`;
}

function applyHistoryEstimates(tasks: SuggestedTask[]): SuggestedTask[] {
  const records = getHistoryRecords();
  if (records.length === 0) return tasks;

  return tasks.map((task) => {
    const matches = findSimilarHistory(task.title, records, 3).filter((m) => m.score >= 0.45);
    if (matches.length === 0) return task;
    const avgActual = Math.round(
      matches.reduce((sum, m) => sum + m.record.actualMinutes, 0) / matches.length
    );
    const blended = Math.max(
      15,
      Math.round((task.estimatedMinutes * 0.4 + avgActual * 0.6) / 5) * 5
    );
    return {
      ...task,
      estimatedMinutes: blended,
      historyRef: { matches: matches.length, avgActual },
    };
  });
}

// ---------- 多模态文件与视觉 Tooling 套件定义 ----------

export const AGENT_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'list_directory',
      description: 'Lists files and subdirectories in a directory path. Supports controlling recursion depth and count limit.',
      parameters: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'Directory path to list (e.g. D:\\D_disk\\Code\\Focus or ./app)',
          },
          depth: {
            type: 'number',
            description: 'Directory recursion depth (default: 2)',
          },
          limit: {
            type: 'number',
            description: 'Maximum entries to return (default: 100)',
          },
        },
        required: ['path'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'read_file',
      description: 'Reads the text content of a specific source code, markdown, configuration, or documentation file with line numbers.',
      parameters: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'Absolute or relative file path to read (e.g. D:\\D_disk\\Code\\Focus\\app\\page.tsx)',
          },
          limit: {
            type: 'number',
            description: 'Maximum number of lines to read (default: 300)',
          },
          offset: {
            type: 'number',
            description: 'Starting line number (1-indexed, default: 1)',
          },
        },
        required: ['path'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'read_image',
      description: 'Reads a local image file (PNG, JPG, WebP, SVG, GIF, etc.) and provides visual image data for multimodal vision inspection (UI mockups, architecture diagrams, screenshots, design specifications).',
      parameters: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'Absolute or relative image file path (e.g. D:\\D_disk\\Code\\Focus\\public\\icon.svg or mockup.png)',
          },
        },
        required: ['path'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_files',
      description: 'Searches file contents across a directory for specific keywords, API names, function signatures, or regex patterns (grep).',
      parameters: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'Root directory or file path to search inside',
          },
          query: {
            type: 'string',
            description: 'Search keyword or pattern to match',
          },
          extension: {
            type: 'string',
            description: 'Optional file extension filter (e.g. .tsx, .ts, .py, .json)',
          },
          limit: {
            type: 'number',
            description: 'Max matches to return (default: 30)',
          },
        },
        required: ['path', 'query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'find_by_name',
      description: 'Finds files by filename substring or extension pattern across the project tree.',
      parameters: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'Directory path to search in',
          },
          pattern: {
            type: 'string',
            description: 'Filename pattern or substring (e.g. page.tsx, config, .svg)',
          },
          limit: {
            type: 'number',
            description: 'Max files to return (default: 50)',
          },
        },
        required: ['path', 'pattern'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'inspect_project_structure',
      description: 'High-level project scanner: discovers file tree and reads key manifest files (README.md, package.json, AGENTS.md, CLAUDE.md, Cargo.toml, tsconfig.json, etc.) to understand the project architecture in one call.',
      parameters: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'Absolute or relative project directory path (e.g. D:\\D_disk\\Code\\Focus)',
          },
        },
        required: ['path'],
      },
    },
  },
];

export async function executeServerTool(name: string, args: Record<string, any>): Promise<any> {
  try {
    const res = await fetch('/api/fs/tool', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tool: name, args }),
    });
    if (!res.ok) {
      const err = await res.text().catch(() => '');
      return { error: `Tool execution failed (HTTP ${res.status}): ${err}` };
    }
    const data = await res.json();
    return data.result || data;
  } catch (e: any) {
    return { error: `Tool call failed: ${e?.message || 'Network error'}` };
  }
}

// ---------- 拆解子任务 (F9) ----------

function buildDecomposePrompt(goal: string): string {
  const historyBlock = buildHistoryBlock(goal);

  return `你是一个具备多模态与代码感知能力的高级软件架构与任务规划 Agent。
把用户给出的总目标拆解为若干个可以顺序执行的子任务。

你拥有完整的本地文件系统与视觉读取工具套件（Tooling Suite）：
1. inspect_project_structure(path)：综合扫描项目整体架构，自动读取 README、package.json、AGENTS.md 等核心元信息。
2. list_directory(path, depth?, limit?)：列出指定目录结构与文件清单。
3. read_file(path, limit?, offset?)：读取源代码、文档、配置文件的行号文本。
4. read_image(path)：读取本地图片、UI 设计稿、架构流程图、截图或 SVG 视觉资源，支持多模态视觉感知。
5. search_files(path, query, extension?)：全局关键字与正则代码检索（grep）。
6. find_by_name(path, pattern)：按文件名快速定位特定文件路径。

**Tool 使用规范**：
- 当用户的提示中提及项目路径、目录（如 "D:\\D_disk\\Code\\Focus"、"./app"）、具体文件或设计图时，**你必须自主调用相应工具探索项目结构、代码实现与视觉设计背景**。
- 你可以多轮自主探索，完全由你决定何时收集到了足够的上下文。
- 当你掌握完整背景并准备好后，结束工具调用，直接输出最终纯 JSON 任务拆解。

任务要求：
1. 每个子任务对应 15-45 分钟的工作量，粒度适中，可落地。
2. estimatedMinutes 为预估用时（分钟，15-45 的整数，个别复杂任务可到 60）。
3. **若历史有相似任务，优先参考其实际用时来估计新任务的 estimatedMinutes**。
4. 最终返回纯 JSON，不要包含任何 markdown 代码块围栏或多余文字。
${historyBlock}
返回格式：
{"tasks":[{"title":"子任务标题","estimatedMinutes":30}]}`;
}

export async function decomposeGoal(
  goal: string,
  config: LlmConfig,
  onProgress?: (status: string) => void
): Promise<SuggestedTask[]> {
  if (!config.apiKey) throw new Error('请先在 Agent 配置中填写 API 密钥');
  if (!config.model) throw new Error('请先在 Agent 配置中选择模型');

    onProgress?.('[PLANNING] Agent 正在分析目标并准备自主探索...');
    const prompt = buildDecomposePrompt(goal);
    const endpoint = chatEndpoint(config.provider, config.baseUrl);
    let text = '';

    if (config.provider === 'openai') {
      let messages: any[] = [
        { role: 'system', content: prompt },
        { role: 'user', content: goal },
      ];

      const maxSafetyTurns = 30;
      for (let turn = 0; turn < maxSafetyTurns; turn++) {
        const res = await proxiedFetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${config.apiKey}`,
          },
          body: {
            model: config.model,
            messages,
            tools: AGENT_TOOLS,
            temperature: 0.2,
          },
        });

        if (!res.ok) {
          const errText = await res.text().catch(() => '');
          throw new Error(`调用失败 (HTTP ${res.status}) ${errText.slice(0, 200)}`);
        }

        const data = await res.json();
        const message = data?.choices?.[0]?.message;
        if (!message) break;

        // 如果模型决定继续调用工具深入了解文件与项目
        if (message.tool_calls && message.tool_calls.length > 0) {
          messages.push({
            role: 'assistant',
            content: message.content || '',
            tool_calls: message.tool_calls,
          });

          for (const toolCall of message.tool_calls) {
            const fnName = toolCall.function?.name;
            let fnArgs: any = {};
            try {
              fnArgs = JSON.parse(toolCall.function?.arguments || '{}');
            } catch {
              fnArgs = {};
            }

            if (fnName === 'inspect_project_structure') {
              onProgress?.(`[TOOL: 项目架构扫描] 目标目录: ${fnArgs.path || ''}`);
            } else if (fnName === 'read_file') {
              onProgress?.(`[TOOL: 阅读代码/文档] ${fnArgs.path || ''} (从第 ${fnArgs.offset || 1} 行开始)`);
            } else if (fnName === 'read_image') {
              onProgress?.(`[TOOL: 多模态视觉感知] ${fnArgs.path || ''}`);
            } else if (fnName === 'list_directory') {
              onProgress?.(`[TOOL: 遍历目录清单] ${fnArgs.path || ''}`);
            } else if (fnName === 'search_files') {
              onProgress?.(`[TOOL: 全文代码检索] "${fnArgs.query || ''}" in ${fnArgs.path || ''}`);
            } else if (fnName === 'find_by_name') {
              onProgress?.(`[TOOL: 定位文件名] "${fnArgs.pattern || ''}" in ${fnArgs.path || ''}`);
            } else {
              onProgress?.(`[TOOL: 执行工具] ${fnName}`);
            }

            const toolResult = await executeServerTool(fnName, fnArgs);

          // 如果是多模态读图且返回了 dataUrl，将图像注入给多模态大模型
          if (fnName === 'read_image' && toolResult.dataUrl) {
            messages.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              content: JSON.stringify({
                path: toolResult.path,
                mimeType: toolResult.mimeType,
                sizeBytes: toolResult.sizeBytes,
                summary: toolResult.summary,
              }),
            });
            // 附带多模态视觉图像内容
            messages.push({
              role: 'user',
              content: [
                { type: 'text', text: `[Visual Asset loaded from ${toolResult.path}]` },
                { type: 'image_url', image_url: { url: toolResult.dataUrl } },
              ],
            });
          } else {
            messages.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              content: JSON.stringify(toolResult),
            });
          }
        }
        // 继续循环，完全由 Agent 决定是否继续调用更多工具
        continue;
      }

      // 当 Agent 判定已获取足够信息并决定结束工具调用，直接输出拆解方案
      onProgress?.('✦ Agent 探索完毕，正在结合项目与代码背景生成拆解...');
      text = message.content ?? '';
      break;
    }
  } else {
    // Anthropic 格式
    const res = await proxiedFetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: {
        model: config.model,
        max_tokens: 2048,
        system: prompt,
        messages: [{ role: 'user', content: goal }],
      },
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`调用失败 (HTTP ${res.status}) ${errText.slice(0, 200)}`);
    }
    const data = await res.json();
    text = data?.content?.[0]?.text ?? '';
  }

  const tasks = parseDecomposeResult(text);
  return applyHistoryEstimates(tasks);
}

/** 解析 LLM 返回的 JSON */
export function parseDecomposeResult(text: string): SuggestedTask[] {
  const parsed = parseJsonLoose<{ tasks?: unknown }>(text);
  const list: Array<{ title?: unknown; estimatedMinutes?: unknown }> = Array.isArray(parsed?.tasks)
    ? (parsed.tasks as [])
    : [];
  const tasks: SuggestedTask[] = list
    .map((t) => ({
      title: String(t?.title ?? '').trim(),
      estimatedMinutes: Math.max(1, Math.round(Number(t?.estimatedMinutes) || 30)),
    }))
    .filter((t) => t.title);

  if (tasks.length === 0) throw new Error('模型未返回有效子任务');
  return tasks;
}

/** 宽松 JSON 解析：容忍代码块围栏与前后杂文 */
function parseJsonLoose<T>(text: string): T | null {
  let raw = text.trim();
  const fence = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) raw = fence[1].trim();
  if (!raw.startsWith('{') && !raw.startsWith('[')) {
    const start = raw.indexOf('{') === -1 ? raw.indexOf('[') : raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    const endArr = raw.lastIndexOf(']');
    const last = Math.max(end, endArr);
    if (start >= 0 && last > start) raw = raw.slice(start, last + 1);
  }
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// ---------- 对话微调拆解 (F9.4) ----------

export interface RefineResult {
  reply: string;
  tasks?: SuggestedTask[];
}

/** 执行期对话上下文（当前进度与已完成任务，供 Agent 调整计划） */
export interface ExecutionContext {
  completedTasks: Array<{ title: string; estimatedMinutes: number; actualMinutes?: number }>;
  elapsedMinutes: number;
  currentTaskId: string | null;
}

function buildRefineSystemPrompt(
  goal: string,
  tasks: SuggestedTask[],
  execution?: ExecutionContext
): string {
  const historyBlock = buildHistoryBlock(goal);

  if (execution) {
    const completedLines = execution.completedTasks.length > 0
      ? execution.completedTasks
          .map((t) => `- "${t.title}"（预估 ${t.estimatedMinutes} 分钟${typeof t.actualMinutes === 'number' ? `，记录用时 ${t.actualMinutes} 分钟` : ''}）`)
          .join('\n')
      : '（暂无已完成任务）';

    return `你是一个具备多模态与代码感知能力的高级工作规划 Agent，正在任务执行过程中与用户对话，帮助其调整与优化计划。

当前总目标：
${goal}

本轮已消耗总时长：约 ${execution.elapsedMinutes} 分钟
当前聚焦任务 ID：${execution.currentTaskId || '（无）'}

已完成任务（只读上下文，不可修改，也不要放进返回列表）：
${completedLines}

当前待办任务清单（JSON，含 id，按执行顺序排列）：
${JSON.stringify(tasks.map(t => ({ id: t.id, title: t.title, estimatedMinutes: t.estimatedMinutes })), null, 0)}
${historyBlock}

用户在执行过程中可能会：反馈实际进展、发现计划不合理、要求增删改或重排剩余任务、拆细任务、咨询下一步怎么做。你可以调用本地文件与视觉工具（list_directory, read_file, read_image, search_files, find_by_name, inspect_project_structure）随时核对项目上下文。

探索或思考完毕后，你必须只返回 JSON，不要用 markdown 代码块，不要多余文字。返回格式：
{"reply":"给用户的简短中文说明（说明你改了什么或你的建议）","tasks":[{"id":"保留的任务原样带 id","title":"任务标题","estimatedMinutes":30}]}

规则：
1. 若需要修改待办任务（增删改、调整预估、重排、拆分、新增），返回修改后的完整待办清单（全量替换待办部分，不含已完成任务）。
2. 未修改的任务必须原样保留其 id；新增任务省略 id（系统会自动生成）；被删除的任务直接不出现。
3. 你只能调整计划，不能标记任务完成——完成与否由用户决定。
4. 若用户只是提问、讨论思路或无需修改，只返回 {"reply":"..."}，省略 tasks。
5. 每个子任务建议对应 15-45 分钟工作量，estimatedMinutes 为整数（复杂任务可到 60）。
6. 调整预估时，优先参考历史相似任务的实际用时数据。`;
  }

  return `你是一个具备多模态与代码感知能力的高级工作规划 Agent，正在与用户对话微调子任务拆解清单。

当前总目标：
${goal}

当前子任务清单（JSON）：
${JSON.stringify(tasks.map(t => ({ title: t.title, estimatedMinutes: t.estimatedMinutes })), null, 0)}
${historyBlock}

你同样拥有完整的本地文件系统与视觉读取工具（list_directory, read_file, read_image, search_files, find_by_name, inspect_project_structure）。用户提及具体文件、代码或图片时，可随时调用工具查看。

用户会提出修改意见或问题。在探索完毕后，你必须只返回 JSON，不要用 markdown 代码块，不要多余文字。返回格式：
{"reply":"给用户的简短中文说明（说明你改了什么）","tasks":[{"title":"任务标题","estimatedMinutes":30}]}

规则：
1. 如果用户要求修改任务（增删改、调整预估时间、重排），返回完整修改后的 tasks 清单（全量替换，不要增量）。
2. **调整预估时间时，优先参考历史相似任务的实际用时数据**。
3. 如果用户只是提问、闲聊或你无需修改，只返回 {"reply":"..."}，省略 tasks。
4. 每个子任务对应 15-45 分钟工作量，estimatedMinutes 为 15-45 的整数（复杂任务可到 60）。`;
}

export async function refineTasks(
  goal: string,
  tasks: SuggestedTask[],
  history: ChatMessage[],
  userMessage: string,
  config: LlmConfig,
  onProgress?: (status: string) => void,
  execution?: ExecutionContext
): Promise<RefineResult> {
  if (!config.apiKey) throw new Error('请先在 Agent 配置中填写 API 密钥');
  if (!config.model) throw new Error('请先在 Agent 配置中选择模型');

  const system = buildRefineSystemPrompt(goal, tasks, execution);
  const messages: ChatMessage[] = [
    ...history,
    { role: 'user', content: userMessage },
  ];

  const endpoint = chatEndpoint(config.provider, config.baseUrl);
  let text = '';

  if (config.provider === 'openai') {
    let conv: any[] = [{ role: 'system', content: system }, ...messages];
    const maxSafetyTurns = 30;

    for (let turn = 0; turn < maxSafetyTurns; turn++) {
      const res = await proxiedFetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: {
          model: config.model,
          messages: conv,
          tools: AGENT_TOOLS,
          temperature: 0.2,
        },
      });
      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        throw new Error(`调用失败 (HTTP ${res.status}) ${errText.slice(0, 200)}`);
      }
      const data = await res.json();
      const message = data?.choices?.[0]?.message;
      if (!message) break;

      if (message.tool_calls && message.tool_calls.length > 0) {
        conv.push({
          role: 'assistant',
          content: message.content || '',
          tool_calls: message.tool_calls,
        });

        for (const toolCall of message.tool_calls) {
          const fnName = toolCall.function?.name;
          let fnArgs: any = {};
          try {
            fnArgs = JSON.parse(toolCall.function?.arguments || '{}');
          } catch {
            fnArgs = {};
          }

          if (fnName === 'inspect_project_structure') {
            onProgress?.(`[TOOL: 项目架构扫描] 目标目录: ${fnArgs.path || ''}`);
          } else if (fnName === 'read_file') {
            onProgress?.(`[TOOL: 阅读代码/文档] ${fnArgs.path || ''} (从第 ${fnArgs.offset || 1} 行开始)`);
          } else if (fnName === 'read_image') {
            onProgress?.(`[TOOL: 多模态视觉感知] ${fnArgs.path || ''}`);
          } else if (fnName === 'list_directory') {
            onProgress?.(`[TOOL: 遍历目录清单] ${fnArgs.path || ''}`);
          } else if (fnName === 'search_files') {
            onProgress?.(`[TOOL: 全文代码检索] "${fnArgs.query || ''}" in ${fnArgs.path || ''}`);
          } else if (fnName === 'find_by_name') {
            onProgress?.(`[TOOL: 定位文件名] "${fnArgs.pattern || ''}" in ${fnArgs.path || ''}`);
          } else {
            onProgress?.(`[TOOL: 执行工具] ${fnName}`);
          }
          const toolResult = await executeServerTool(fnName, fnArgs);

          if (fnName === 'read_image' && toolResult.dataUrl) {
            conv.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              content: JSON.stringify({
                path: toolResult.path,
                mimeType: toolResult.mimeType,
                sizeBytes: toolResult.sizeBytes,
              }),
            });
            conv.push({
              role: 'user',
              content: [
                { type: 'text', text: `[Visual Asset from ${toolResult.path}]` },
                { type: 'image_url', image_url: { url: toolResult.dataUrl } },
              ],
            });
          } else {
            conv.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              content: JSON.stringify(toolResult),
            });
          }
        }
        continue;
      }

      text = message.content ?? '';
      break;
    }
  } else {
    const res = await proxiedFetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: {
        model: config.model,
        max_tokens: 4096,
        system,
        messages,
        temperature: 0.3,
      },
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`调用失败 (HTTP ${res.status}) ${errText.slice(0, 200)}`);
    }
    const data = await res.json();
    text = data?.content?.[0]?.text ?? '';
  }

  const parsed = parseJsonLoose<{ reply?: unknown; tasks?: unknown }>(text);
  if (!parsed) {
    return { reply: text.trim() || '（无回复）' };
  }

  const reply = String(parsed.reply ?? '').trim() || '（无回复）';
  if (Array.isArray(parsed.tasks)) {
    const list: Array<{ id?: unknown; title?: unknown; estimatedMinutes?: unknown }> = parsed.tasks as [];
    const next: SuggestedTask[] = list
      .map((t) => ({
        id: typeof t?.id === 'string' && t.id ? t.id : undefined,
        title: String(t?.title ?? '').trim(),
        estimatedMinutes: Math.max(1, Math.round(Number(t?.estimatedMinutes) || 30)),
      }))
      .filter((t) => t.title);
    if (next.length > 0) {
      const adjusted = applyHistoryEstimates(next);
      return { reply, tasks: adjusted };
    }
  }
  return { reply };
}
