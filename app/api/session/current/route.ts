// app/api/session/current/route.ts - 获取与同步当前工作轮次

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession, setServerSession } from '@/lib/server-store';

export async function GET() {
  const session = getServerSession();
  return NextResponse.json({ session });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { session } = body;
    setServerSession(session || null);
    return NextResponse.json({ ok: true, session: getServerSession() });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Sync failed' }, { status: 400 });
  }
}
