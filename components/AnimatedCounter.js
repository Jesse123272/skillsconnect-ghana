'use client';

import React, { useEffect, useState } from 'react';

export default function AnimatedCounter({ value = 0, duration = 900 }) {
  const target = Number(value) || 0;
  const [count, setCount] = useState(0);

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion || target === 0) {
      const frameId = window.requestAnimationFrame(() => setCount(target));
      return () => window.cancelAnimationFrame(frameId);
    }

    let frameId;
    const startTime = performance.now();

    const update = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const easedProgress = 1 - ((1 - progress) ** 3);
      setCount(Math.round(target * easedProgress));
      if (progress < 1) {
        frameId = window.requestAnimationFrame(update);
      }
    };

    frameId = window.requestAnimationFrame(update);
    return () => window.cancelAnimationFrame(frameId);
  }, [duration, target]);

  return <span aria-live="polite">{count.toLocaleString()}</span>;
}
