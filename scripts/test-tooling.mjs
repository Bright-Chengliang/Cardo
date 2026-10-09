// scripts/test-tooling.mjs - 详细打印 LLM 返回与 Tool-Calling 流程

async function main() {
  const baseUrl = 'http://localhost:3025';
  const llmEndpoint = 'http://localhost:3002/v1/chat/completions';
  const apiKey = process.env.TEST_API_KEY || 'your_api_key_here';
  const model = 'gemini-3.8-flash-high';

  console.log('=== Step 1: 测试本地文件读取 Tooling 接口 ===');
  
  const res1 = await fetch(`${baseUrl}/api/fs/tool`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tool: 'inspect_project_structure',
      args: { path: 'D:\\D_disk\\Code\\Focus' }
    })
  });
  const data1 = await res1.json();
  console.log('✓ inspect_project_structure 结果:', {
    success: data1.success,
    keyFiles: data1.result?.keyFiles,
    treeSample: data1.result?.directoryTree?.slice(0, 5)
  });

  console.log('\n=== Step 2: 测试 Agent 识别目录并自主调用 Tool 拆解目标 ===');

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

  const goal = '阅读并了解 D:\\D_disk\\Code\\Focus 项目的整体架构与历史复盘模块代码，为复盘页面 (/history) 设计一套按时间跨度和准确率过滤的增强任务清单';

  let messages = [
    {
      role: 'system',
      content: '你是一个专业软件规划 Agent。你可以调用本地文件系统工具（inspect_project_structure, read_file）了解用户指定项目路径的结构与代码，之后输出纯 JSON 格式的任务拆解：{"tasks":[{"title":"...","estimatedMinutes":30}]}'
    },
    {
      role: 'user',
      content: goal
    }
  ];

  console.log('正在向 LLM 发送请求并提供 Tooling...');
  const proxyReq1 = await fetch(`${baseUrl}/api/llm/proxy`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url: llmEndpoint,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      data: {
        model,
        messages,
        tools,
        temperature: 0.2
      }
    })
  });

  const resJson1 = await proxyReq1.json();
  console.log('LLM 原始返回响应:', JSON.stringify(resJson1, null, 2));

  const choice1 = resJson1.choices?.[0]?.message;
  
  if (choice1?.tool_calls && choice1.tool_calls.length > 0) {
    console.log(`✓ Agent 决定调用 ${choice1.tool_calls.length} 个工具:`);
    messages.push(choice1);

    for (const tc of choice1.tool_calls) {
      console.log(`  -> 调用工具: ${tc.function.name} 参数: ${tc.function.arguments}`);
      const args = JSON.parse(tc.function.arguments || '{}');
      
      const toolRes = await fetch(`${baseUrl}/api/fs/tool`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: tc.function.name,
          args
        })
      });
      const toolData = await toolRes.json();
      
      messages.push({
        role: 'tool',
        tool_call_id: tc.id,
        content: JSON.stringify(toolData.result || toolData)
      });
    }

    console.log('\n正在将本地文件读取结果回传给 Agent 生成最终目标拆解...');
    const proxyReq2 = await fetch(`${baseUrl}/api/llm/proxy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: llmEndpoint,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        data: {
          model,
          messages,
          tools,
          temperature: 0.2
        }
      })
    });

    const resJson2 = await proxyReq2.json();
    console.log('LLM 第二轮返回响应:', JSON.stringify(resJson2, null, 2));
    const finalContent = resJson2.choices?.[0]?.message?.content;
    console.log('\n=== Step 3: Agent 输出的最终项目感知拆解结果 ===');
    console.log(finalContent);
  }
}

main().catch(console.error);
