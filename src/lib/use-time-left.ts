import { useEffect, useState } from "react";

/**
 * Milliseconds until `endsAt` (device clock), updated every `tickMs`; null when there is nothing to
 * count. The timer stops at 0, so a finished countdown doesn't keep redrawing its screen.
 */
export function useTimeLeft(endsAt: number | null, tickMs = 1_000): number | null {
  const [now, setNow] = useState(Date.now);

  useEffect(() => {
    if (endsAt === null) return;
    const tick = () => {
      const time = Date.now();
      setNow(time);
      if (time >= endsAt) clearInterval(timer);
    };
    // Right away too: `now` may be old if there was nothing to count until now.
    const first = setTimeout(tick, 0);
    const timer = setInterval(tick, tickMs);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [endsAt, tickMs]);

  return endsAt === null ? null : Math.max(endsAt - now, 0);
}

/**
 * Whole seconds left until `endsAt`, rounded up, as a countdown shows them. It renders once per
 * second, right when the number changes, and stops at 0.
 */
export function useSecondsLeft(endsAt: number | null): number | null {
  const [now, setNow] = useState(Date.now);

  useEffect(() => {
    if (endsAt === null) return;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      const time = Date.now();
      setNow(time);
      const left = endsAt - time;
      // Wake up just after the next whole second is crossed.
      if (left > 0) timer = setTimeout(tick, (left % 1_000 || 1_000) + 5);
    };
    timer = setTimeout(tick, 0);
    return () => clearTimeout(timer);
  }, [endsAt]);

  return endsAt === null ? null : Math.ceil(Math.max(endsAt - now, 0) / 1_000);
}

/**
 * True once `beforeMs` or less is left until `endsAt`. Unlike `useTimeLeft` it renders only when the
 * answer changes, for screens that are costly to redraw on every tick.
 */
export function useTimeAlmostUp(endsAt: number | null, beforeMs: number): boolean {
  const [reached, setReached] = useState<number | null>(null);

  useEffect(() => {
    if (endsAt === null) return;
    const timer = setTimeout(() => setReached(endsAt), Math.max(endsAt - beforeMs - Date.now(), 0));
    return () => clearTimeout(timer);
  }, [endsAt, beforeMs]);

  return endsAt !== null && reached === endsAt;
}
