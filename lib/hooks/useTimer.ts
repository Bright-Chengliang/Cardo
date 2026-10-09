// lib/hooks/useTimer.ts - 计时器 Hook

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export function useTimer(startedAt?: string) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // 计算已过去的时间
  const calculateElapsed = useCallback(() => {
    if (!startedAt) return 0;
    
    const start = new Date(startedAt).getTime();
    const now = Date.now();
    return Math.floor((now - start) / 1000);
  }, [startedAt]);

  // 启动计时器
  useEffect(() => {
    if (!startedAt) {
      setElapsedSeconds(0);
      return;
    }

    // 立即更新一次
    setElapsedSeconds(calculateElapsed());

    // 每秒更新
    intervalRef.current = setInterval(() => {
      setElapsedSeconds(calculateElapsed());
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [startedAt, calculateElapsed]);

  // 格式化时间显示 (超 1 小时自动显示 hh:mm:ss，否则 mm:ss)
  const formatTime = useCallback((seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  return {
    elapsedSeconds,
    elapsedMinutes: Math.floor(elapsedSeconds / 60),
    formattedTime: formatTime(elapsedSeconds),
  };
}
