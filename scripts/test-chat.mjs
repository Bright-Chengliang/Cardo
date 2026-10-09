// scripts/test-chat.mjs - 测试 127.0.0.1 基础对话与 Tool-Calling

async function test() {
  const endpoint = 'http://127.0.0.1:3002/v1/chat/completions';
  const apiKey = process.env.TEST_API_KEY || 'your_api_key_here';
  const model = 'gemini-3.8-flash-high';

  // 1. 基础对话测试
  console.log('1. 测试 127.0.0.1 基础 Chat Completions...');
  const res1 = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: 'Say hello in 3 words' }]
    })
  });
  const data1 = await res1.json();
  console.log('基础响应:', data1?.choices?.[0]?.message?.content || data1);

  // 2. 带 Tool Calling 测试
  console.log('\n2. 测试 Tool Calling...');
  const tools = [
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
  ];

  const res2 = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: 'You are a coding assistant. When the user specifies a directory path, you must call the inspect_project_structure tool.' },
        { role: 'user', content: 'Please inspect the project structure of D:\\D_disk\\Code\\Focus' }
      ],
      tools
    })
  });
  const data2 = await res2.json();
  console.log('Tool Calling 响应:', JSON.stringify(data2, null, 2));
}

test().catch(console.error);
