// scripts/test-tool-full.mjs - 增强多轮 Tool-calling 循环与详细输出

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

  console.log('=== Step 1: 验证本地文件系统 Tooling 接口 ===');
  const toolCheck = await postJson('http://localhost:3025/api/fs/tool', {
    tool: 'inspect_project_structure',
    args: { path: 'D:\\D_disk\\Code\\Focus' },
  });
  console.log('✓ 本地 Tooling 响应正常:', {
    keyFiles: toolCheck.data?.result?.keyFiles,
    treeCount: toolCheck.data?.result?.directoryTree?.length,
  });

  console.log('\n=== Step 2: 发起 Agent 自动感知项目与目标拆解（多轮工具循环） ===');

  const tools = [
    {
      type: 'function',
      function: {
        name: 'inspect_project_structure',
        description: 'Scans project directory and reads key files like README.md, package.json, AGENTS.md to understand background',
        parameters: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'Directory path' },
          },
          required: ['path'],
        },
      },
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
            offset: { type: 'number', description: 'Start line' },
          },
          required: ['path'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'list_directory',
        description: 'Lists files in a directory path',
        parameters: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'Directory path' },
            depth: { type: 'number', description: 'Depth' },
          },
          required: ['path'],
        },
      },
    },
  ];

  let messages = [
    {
      role: 'system',
      content:
        '你是一个专业软件架构与工作规划 Agent。你可以调用工具（inspect_project_structure, read_file, list_directory）了解项目真实结构与代码。在探索完毕后，最终必须输出纯 JSON 格式的任务拆解：{"tasks":[{"title":"...","estimatedMinutes":30}]}',
    },
    {
      role: 'user',
      content:
        '请根据项目路径 D:\\D_disk\\Code\\Focus 探索项目背景与代码，为历史复盘模块 (/history) 设计 3 个增加按时间范围和准确率区间高级筛选的开发子任务',
    },
  ];

  const maxTurns = 5;
  for (let turn = 1; turn <= maxTurns; turn++) {
    console.log(`\n--- 第 ${turn} 轮交互 ---`);
    const turnRes = await postJson(proxyUrl, {
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

    const msg = turnRes.data?.choices?.[0]?.message;
    if (!msg) {
      console.error('未收到有效响应:', turnRes.data);
      break;
    }

    if (msg.tool_calls && msg.tool_calls.length > 0) {
      console.log(`✓ Agent 决定调用 ${msg.tool_calls.length} 个工具:`);
      messages.push({
        role: 'assistant',
        content: msg.content || '',
        tool_calls: msg.tool_calls,
      });

      for (const tc of msg.tool_calls) {
        console.log(`  -> 执行工具: [${tc.function.name}] 参数: ${tc.function.arguments}`);
        const args = JSON.parse(tc.function.arguments || '{}');
        const toolExec = await postJson('http://localhost:3025/api/fs/tool', {
          tool: tc.function.name,
          args,
        });

        const toolResultObj = toolExec.data?.result || toolExec.data;
        const summary = toolResultObj.keyFiles
          ? `元文件: ${toolResultObj.keyFiles.join(', ')}`
          : toolResultObj.totalLines
          ? `共 ${toolResultObj.totalLines} 行`
          : toolResultObj.count
          ? `共 ${toolResultObj.count} 项`
          : '执行成功';
        console.log(`  ✓ 工具执行完成 (${summary})`);

        messages.push({
          role: 'tool',
          tool_call_id: tc.id,
          content: JSON.stringify(toolResultObj),
        });
      }
    } else {
      console.log('✓ Agent 探索完成，输出最终任务拆解:');
      console.log(msg.content);
      break;
    }
  }
}

main().catch(console.error);
