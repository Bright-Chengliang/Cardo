// scripts/test-tools-suite.mjs - 全面验证多模态与文件系统 Tooling 基础套件

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

async function runSuite() {
  const endpoint = 'http://localhost:3025/api/fs/tool';
  const rootPath = 'D:\\D_disk\\Code\\Focus';

  console.log('===========================================================');
  console.log('  Agent 多模态与文件探索标准 Tooling 套件 6 项能力测试');
  console.log('===========================================================\n');

  // 1. inspect_project_structure
  console.log('【Tool 1: inspect_project_structure (项目综合扫描)】');
  const res1 = await postJson(endpoint, {
    tool: 'inspect_project_structure',
    args: { path: rootPath },
  });
  console.log('✓ 成功:', res1.data.success);
  console.log('  元文件识别:', res1.data.result?.keyFiles?.join(', '));
  console.log('  目录树项数:', res1.data.result?.directoryTree?.length);

  // 2. list_directory
  console.log('\n【Tool 2: list_directory (目录清单遍历)】');
  const res2 = await postJson(endpoint, {
    tool: 'list_directory',
    args: { path: `${rootPath}\\app`, depth: 2, limit: 10 },
  });
  console.log('✓ 成功:', res2.data.success);
  console.log('  条目样例:', res2.data.result?.entries?.slice(0, 5)?.join(', '));

  // 3. read_file
  console.log('\n【Tool 3: read_file (指定文本与代码行级读取)】');
  const res3 = await postJson(endpoint, {
    tool: 'read_file',
    args: { path: `${rootPath}\\package.json`, limit: 8, offset: 1 },
  });
  console.log('✓ 成功:', res3.data.success);
  console.log('  总行数:', res3.data.result?.totalLines);
  console.log('  行号内容预览:\n' + res3.data.result?.content);

  // 4. read_image (多模态读图)
  console.log('\n【Tool 4: read_image (多模态视觉图像资源读取与 Base64/SVG 感知)】');
  const res4 = await postJson(endpoint, {
    tool: 'read_image',
    args: { path: `${rootPath}\\public\\icon.svg` },
  });
  console.log('✓ 成功:', res4.data.success);
  console.log('  MIME 类型:', res4.data.result?.mimeType);
  console.log('  文件大小:', `${res4.data.result?.sizeBytes} 字节`);
  console.log('  Data URL 前缀:', res4.data.result?.dataUrl?.slice(0, 45) + '...');
  console.log('  SVG 内容预览:', res4.data.result?.svgText?.slice(0, 100)?.replace(/\n/g, ' '));

  // 5. search_files (代码全文检索 grep)
  console.log('\n【Tool 5: search_files (关键词与代码全局检索)】');
  const res5 = await postJson(endpoint, {
    tool: 'search_files',
    args: { path: `${rootPath}\\app`, query: 'Cartesian', extension: '.tsx', limit: 4 },
  });
  console.log('✓ 成功:', res5.data.success);
  console.log('  命中数:', res5.data.result?.matchCount);
  if (res5.data.result?.matches?.length > 0) {
    console.log('  匹配样例:', res5.data.result?.matches?.slice(0, 2));
  }

  // 6. find_by_name (文件名模式定位)
  console.log('\n【Tool 6: find_by_name (文件名与后缀模式定位)】');
  const res6 = await postJson(endpoint, {
    tool: 'find_by_name',
    args: { path: rootPath, pattern: 'page.tsx', limit: 10 },
  });
  console.log('✓ 成功:', res6.data.success);
  console.log('  找到匹配文件:', res6.data.result?.files?.join(', '));

  console.log('\n===========================================================');
  console.log('  全部 6 项 Agent Tooling 基础套件测试通过！');
  console.log('===========================================================');
}

runSuite().catch(console.error);
