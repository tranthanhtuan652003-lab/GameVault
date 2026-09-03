"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "motion/react";

/**
 * Animates a number counting up from 0 to `value` when scrolled into view.
 * `format` is a function receiving the current value, useful for prices/counts.
 */
export function AnimatedCounter({
  value,
  duration = 1.2,
  format = (v: number) => v.toLocaleString(),
}: {
  value: number;
  duration?: number;
  format?: (v: number) => string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / (duration * 1000), 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(value * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value, duration]);

  return <span ref={ref}>{format(display)}</span>;
}
