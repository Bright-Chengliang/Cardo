// lib/server-store.ts - 服务端会话同步存储（支持局域网直连与多端实时同步）

import { Session, SessionSummary, AppConfig } from './types';

declare global {
  var __focus_server_session: Session | null | undefined;
  var __focus_server_summaries: SessionSummary[] | undefined;
  var __focus_server_config: AppConfig | undefined;
}

export function getServerSession(): Session | null {
  return globalThis.__focus_server_session || null;
}

export function setServerSession(session: Session | null): void {
  globalThis.__focus_server_session = session;
}

export function getServerSummaries(): SessionSummary[] {
  return globalThis.__focus_server_summaries || [];
}

export function addServerSummary(summary: SessionSummary): void {
  if (!globalThis.__focus_server_summaries) {
    globalThis.__focus_server_summaries = [];
  }
  globalThis.__focus_server_summaries.unshift(summary);
}

export function setServerSummaries(summaries: SessionSummary[]): void {
  globalThis.__focus_server_summaries = summaries;
}
