// scripts/test-proxy-tooling.mjs - 测试代理与 Agent Tool-Calling 完整流程

import http from 'http';

function postJson(urlStr, data) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const body = JSON.stringify(data);
    const req = http.request(
      {
        protocol: url.protocol,
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
          'Connection': 'close',
        },
      },
      (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          const raw = Buffer.concat(chunks).toString('utf-8');
          try {
            resolve({ status: res.statusCode, data: JSON.parse(raw) });
          } catch {
            resolve({ status: res.statusCode, raw });
          }
        });
      }
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  const proxyUrl = 'http://localhost:3025/api/llm/proxy';
  const llmEndpoint = 'http://127.0.0.1:3002/v1/chat/completions';
  const apiKey = process.env.TEST_API_KEY || 'your_api_key_here';
  const model = 'gemini-3.8-flash-high';

  console.log('=== Step 1: 测试 /api/fs/tool 本地文件读取 ===');
  const toolCheck = await postJson('http://localhost:3025/api/fs/tool', {
    tool: 'inspect_project_structure',
    args: { path: 'D:\\D_disk\\Code\\Focus' },
  });
  console.log('inspect_project_structure 结果:', {
    keyFiles: toolCheck.data?.result?.keyFiles,
    treeCount: toolCheck.data?.result?.directoryTree?.length,
  });

  console.log('\n=== Step 2: 测试 Agent 调用 Tooling 并完成任务拆解 ===');

  const tools = [
    {
      type: 'function',
      function: {
        name: 'inspect_project_structure',
        description: 'Scans project directory and reads key files like README.md, package.json, AGENTS.md to understand background',
        parameters: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'Directory path' }
          },
          required: ['path']
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'read_file',
        description: 'Reads text content of a file',
        parameters: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'File path' },
            limit: { type: 'number', description: 'Max lines' },
            offset: { type: 'number', description: 'Start line' }
          },
          required: ['path']
        }
      }
    }
  ];

  let messages = [
    {
      role: 'system',
      content: '你是一个专业软件规划 Agent。你可以调用工具（inspect_project_structure, read_file）了解项目结构，最终输出 JSON 任务拆解：{"tasks":[{"title":"...","estimatedMinutes":30}]}'
    },
    {
      role: 'user',
      content: '请先了解 D:\\D_disk\\Code\\Focus 项目，为复盘历史模块 (/history) 拆解 3 个增加按时间范围和准确率区间高级筛选的开发子任务'
    }
  ];

  console.log('1. 发起第 1 轮 LLM 请求 (提供 Tooling)...');
  const turn1 = await postJson(proxyUrl, {
    url: llmEndpoint,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    data: {
      model,
      messages,
      tools,
      temperature: 0.2,
    },
  });

  console.log('Turn 1 HTTP Status:', turn1.status);
  const msg1 = turn1.data?.choices?.[0]?.message;

  if (msg1?.tool_calls && msg1.tool_calls.length > 0) {
    console.log(`✓ Agent 成功发起 ${msg1.tool_calls.length} 个工具调用:`);
    messages.push(msg1);

    for (const tc of msg1.tool_calls) {
      console.log(`  -> 执行工具 [${tc.function.name}] 参数: ${tc.function.arguments}`);
      const args = JSON.parse(tc.function.arguments || '{}');
      const toolExec = await postJson('http://localhost:3025/api/fs/tool', {
        tool: tc.function.name,
        args,
      });

      messages.push({
        role: 'tool',
        tool_call_id: tc.id,
        content: JSON.stringify(toolExec.data?.result || toolExec.data),
      });
    }

    console.log('\n2. 发起第 2 轮 LLM 请求 (回传 Tool 读取结果)...');
    const turn2 = await postJson(proxyUrl, {
      url: llmEndpoint,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      data: {
        model,
        messages,
        tools,
        temperature: 0.2,
      },
    });

    console.log('Turn 2 HTTP Status:', turn2.status);
    const finalContent = turn2.data?.choices?.[0]?.message?.content;
    console.log('\n=== Step 3: Agent 最终拆解结果 ===');
    console.log(finalContent);
  } else {
    console.log('Agent 直接输出:', msg1?.content);
  }
}

main().catch(console.error);
