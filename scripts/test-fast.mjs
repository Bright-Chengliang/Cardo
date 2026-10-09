// scripts/test-fast.mjs - 验证 LLM 响应速度与单次工具调用测试

async function main() {
  const llmEndpoint = 'http://127.0.0.1:3002/v1/chat/completions';
  const apiKey = process.env.TEST_API_KEY || 'your_api_key_here';
  const model = 'gemini-3.8-flash-high';

  console.log('1. 发送测试请求给 gemini-3.8-flash-high...');
  const t0 = Date.now();
  
  const res = await fetch(llmEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'Connection': 'close'
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'system',
          content: 'You are a task decomposition assistant. When given a goal, return a JSON array of tasks: {"tasks":[{"title":"...","estimatedMinutes":30}]}'
        },
        {
          role: 'user',
          content: 'Goal: Read project D:\\D_disk\\Code\\Focus and add filter by date range in history page'
        }
      ],
      tools: [
        {
          type: 'function',
          function: {
            name: 'inspect_project_structure',
            description: 'Scans project directory and reads key files like README.md, package.json',
            parameters: {
              type: 'object',
              properties: {
                path: { type: 'string', description: 'Directory path' }
              },
              required: ['path']
            }
          }
        }
      ],
      temperature: 0.2
    })
  });

  const duration = ((Date.now() - t0) / 1000).toFixed(2);
  console.log(`HTTP Status: ${res.status} (耗时 ${duration}s)`);
  
  const text = await res.text();
  console.log('响应内容:', text.slice(0, 800));
}

main().catch(console.error);
