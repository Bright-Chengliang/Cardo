// scripts/test-direct-llm.mjs - 详细事件日志诊断

import http from 'http';

function callNewApi(bodyObj) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(bodyObj);
    console.log(`[HTTP] 准备发送 POST 请求，大小: ${Buffer.byteLength(payload)} 字节`);

    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: 3002,
        path: '/v1/chat/completions',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.TEST_API_KEY || 'your_api_key_here'}`,
          'Content-Length': Buffer.byteLength(payload),
        },
      },
      (res) => {
        console.log(`[HTTP] 收到响应头: HTTP ${res.statusCode}`);
        console.log('[HTTP] 响应头信息:', res.headers);
        
        const chunks = [];
        let done = false;

        res.on('data', (chunk) => {
          console.log(`[HTTP] 收到数据块: ${chunk.length} 字节`);
          chunks.push(chunk);
          
          // 如果是完整 JSON，尝试解析并完成
          const currentText = Buffer.concat(chunks).toString('utf-8');
          try {
            const parsed = JSON.parse(currentText);
            if (!done) {
              done = true;
              console.log('[HTTP] 成功解析完整 JSON 响应！');
              resolve(parsed);
            }
          } catch {
            // 继续接收
          }
        });

        res.on('end', () => {
          console.log('[HTTP] 响应流结束 (end event)');
          if (!done) {
            done = true;
            const raw = Buffer.concat(chunks).toString('utf-8');
            try {
              resolve(JSON.parse(raw));
            } catch {
              resolve(raw);
            }
          }
        });

        res.on('close', () => {
          console.log('[HTTP] 连接关闭 (close event)');
        });
      }
    );

    req.on('error', (err) => {
      console.error('[HTTP Error]', err);
      reject(err);
    });

    req.write(payload);
    req.end();
  });
}

async function main() {
  const tools = [
    {
      type: 'function',
      function: {
        name: 'inspect_project_structure',
        description: 'Scans project directory and reads key files like README.md, package.json',
        parameters: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'Directory path' },
          },
          required: ['path'],
        },
      },
    },
  ];

  const res = await callNewApi({
    model: 'gemini-3.8-flash-high',
    messages: [
      {
        role: 'system',
        content: 'You are a planner. When the user mentions a directory, call inspect_project_structure.',
      },
      {
        role: 'user',
        content: 'Please inspect D:\\D_disk\\Code\\Focus',
      },
    ],
    tools,
    temperature: 0.2,
  });

  console.log('\n=== 最终解析结果 ===');
  console.log(JSON.stringify(res, null, 2));
}

main().catch(console.error);
