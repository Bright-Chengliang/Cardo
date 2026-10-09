// app/api/llm/proxy/route.ts - 服务端 API 代理，解决浏览器 CORS 与本地网关 Socket 连接限制

import { NextRequest, NextResponse } from 'next/server';
import http from 'http';
import https from 'https';

/** 使用 Node 原生 http/https 请求，完美兼容各类本地 NewAPI/OneAPI 与远程 LLM 端点 */
function doNativeRequest(
  targetUrl: string,
  method: string,
  headers: Record<string, string>,
  bodyData: any
): Promise<{ status: number; headers: Record<string, string>; bodyText: string }> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(targetUrl);
    const isHttps = parsed.protocol === 'https:';
    const client = isHttps ? https : http;

    const payload = bodyData
      ? (typeof bodyData === 'string' ? bodyData : JSON.stringify(bodyData))
      : null;

    const reqHeaders: Record<string, string> = {
      ...headers,
      'Connection': 'close',
    };

    if (payload) {
      reqHeaders['Content-Length'] = Buffer.byteLength(payload).toString();
      if (!reqHeaders['Content-Type']) {
        reqHeaders['Content-Type'] = 'application/json';
      }
    }

    const options: http.RequestOptions = {
      protocol: parsed.protocol,
      hostname: parsed.hostname,
      port: parsed.port || (isHttps ? 443 : 80),
      path: parsed.pathname + parsed.search,
      method,
      headers: reqHeaders,
      timeout: 90000,
    };

    let done = false;

    const req = client.request(options, (res) => {
      const chunks: Buffer[] = [];
      const responseHeaders: Record<string, string> = {};
      for (const [k, v] of Object.entries(res.headers)) {
        if (v) responseHeaders[k] = Array.isArray(v) ? v.join(', ') : v;
      }

      function finish() {
        if (done) return;
        done = true;
        const bodyText = Buffer.concat(chunks).toString('utf-8');
        resolve({
          status: res.statusCode || 200,
          headers: responseHeaders,
          bodyText,
        });
      }

      res.on('data', (chunk) => {
        chunks.push(Buffer.from(chunk));

        // 尝试即时解析完整 JSON（防止部分网关 Content-Length 不匹配导致 socket 空等）
        const currentText = Buffer.concat(chunks).toString('utf-8');
        try {
          JSON.parse(currentText);
          // 成功解析出完整 JSON，直接返回
          finish();
        } catch {
          // 尚未完全接收，继续等待后续 chunk
        }
      });

      res.on('end', () => {
        finish();
      });

      res.on('close', () => {
        finish();
      });
    });

    req.on('timeout', () => {
      req.destroy();
      if (!done) {
        done = true;
        reject(new Error('Proxy request timed out (90s)'));
      }
    });

    req.on('error', (err) => {
      if (!done) {
        done = true;
        reject(err);
      }
    });

    if (payload) {
      req.write(payload);
    }
    req.end();
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url, method = 'POST', headers = {}, data } = body;

    if (!url) {
      return NextResponse.json({ error: 'Missing target url' }, { status: 400 });
    }

    const { status, headers: resHeaders, bodyText } = await doNativeRequest(
      url,
      method,
      headers,
      data
    );

    const contentType = resHeaders['content-type'] || '';
    if (contentType.includes('application/json')) {
      try {
        const json = JSON.parse(bodyText);
        return NextResponse.json(json, { status });
      } catch {
        return new NextResponse(bodyText, {
          status,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    return new NextResponse(bodyText, {
      status,
      headers: {
        'Content-Type': contentType || 'text/plain',
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Proxy request failed' },
      { status: 500 }
    );
  }
}
