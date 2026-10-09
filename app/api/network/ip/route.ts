// app/api/network/ip/route.ts - 获取本机局域网 IP 地址供移动端扫码/连接

import { NextResponse } from 'next/server';
import os from 'os';

export async function GET() {
  const interfaces = os.networkInterfaces();
  const addresses: string[] = [];

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      // 过滤 IPv4 且非本地回环地址
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push(iface.address);
      }
    }
  }

  return NextResponse.json({
    ips: addresses,
    port: 3025,
    mobileUrl: addresses.length > 0 ? `http://${addresses[0]}:3025/mobile` : `http://localhost:3025/mobile`,
  });
}
