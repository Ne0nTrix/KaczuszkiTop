import { animate } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

interface AnimatedNumberProps {
  value: number
  format?: (v: number) => string
  duration?: number
  className?: string
}
   
export function AnimatedNumber({ value, format = (v) => v.toFixed(0), duration = 1.1, className }: AnimatedNumberProps) {
  const [display, setDisplay] = useState(0);
  const from = useRef(0);
	
  useEffect(() => {
    const controls = animate(from.current, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(v),
    });
    from.current = value;
    return () => controls.stop();
  }, [value, duration]);

  return <span className={className}>{format(display)}</span>
}
