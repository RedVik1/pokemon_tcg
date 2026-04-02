import { useState, useEffect, useRef } from "react";

export function useCountUp(target, duration = 600) {
  const [value, setValue] = useState(Number.isFinite(target) ? target : 0);
  const prevTarget = useRef(Number.isFinite(target) ? target : 0);
  const frameRef = useRef(null);

  useEffect(() => {
    const safeTarget = Number.isFinite(target) ? target : 0;
    const start = prevTarget.current;
    const diff = safeTarget - start;
    if (Math.abs(diff) < 0.01) {
      setValue(safeTarget);
      prevTarget.current = safeTarget;
      return;
    }

    const startTime = performance.now();
    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(start + diff * eased);
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        prevTarget.current = safeTarget;
      }
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [target, duration]);

  return value;
}
