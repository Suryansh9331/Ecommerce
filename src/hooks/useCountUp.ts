import { useState, useEffect } from 'react';

const easeOutQuart = (t: number) => 1 - (1 - t) ** 4;

/**
 * Animates from 0 to target over duration. Good for earnings, pipeline counts.
 */
export function useCountUp(
  target: number,
  durationMs = 1200,
  enabled = true
): number {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!enabled || target === 0) {
      setValue(target);
      return;
    }
    let start: number;
    let rafId: number;
    const tick = (timestamp: number) => {
      if (start === undefined) start = timestamp;
      const elapsed = timestamp - start;
      const progress = Math.min(elapsed / durationMs, 1);
      setValue(Math.round(easeOutQuart(progress) * target));
      if (progress < 1) rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [target, durationMs, enabled]);

  return value;
}

/**
 * For currency string like "₹2,400" — animates the numeric part.
 */
export function useCountUpCurrency(
  amount: number,
  durationMs = 1200,
  enabled = true,
  prefix = '₹'
): string {
  const value = useCountUp(amount, durationMs, enabled);
  return `${prefix}${value.toLocaleString('en-IN')}`;
}
