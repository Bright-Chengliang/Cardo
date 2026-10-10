// lib/hooks/useTimer.ts - 整轮总用时计时 Hook（暂停期间不增长）

'use client';

import { useState, useEffect, useCallback } from 'react';

/** 格式化时长：超过 1 小时显示 hh:mm:ss，否则 mm:ss */
export function formatDuration(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * 整轮总用时计时器。
 * @param baseSeconds 已累计的专注秒数（session.elapsedSeconds）
 * @param running 是否处于执行中（暂停时停止累加）
 * @param runningSince 当前执行段起点 ISO（session.lastResumedAt）
 */
export function useElapsedTimer(baseSeconds: number, running: boolean, runningSince?: string | null) {
  const compute = useCallback(() => {
    const base = Math.max(0, Math.floor(baseSeconds || 0));
    if (!running || !runningSince) return base;
    const start = new Date(runningSince).getTime();
    if (!Number.isFinite(start)) return base;
    return base + Math.max(0, Math.floor((Date.now() - start) / 1000));
  }, [baseSeconds, running, runningSince]);

  const [seconds, setSeconds] = useState(compute);

  useEffect(() => {
    setSeconds(compute());
    if (!running || !runningSince) return;
    const interval = setInterval(() => setSeconds(compute()), 1000);
    return () => clearInterval(interval);
  }, [compute, running, runningSince]);

  return {
    elapsedSeconds: seconds,
    elapsedMinutes: Math.floor(seconds / 60),
    formattedTime: formatDuration(seconds),
  };
}
