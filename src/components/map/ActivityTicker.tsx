import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { ActivityItem } from '../../types';
import { cn } from '../../lib/cn';
import { eur } from "../../lib/format";

export function ActivityTicker({ items, className }: { items: ActivityItem[]; className?: string }) {
	const [index, setIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % Math.max(1, items.length));
      setElapsed((e) => e + 3.5 / 60); 
    }, 3500);
    return () => clearInterval(timer);
	}, [items.length]);

  const item = items[index];
  if (!item) return null
	const minutes = Math.max(1, Math.round(item.minutesAgo % 30) + Math.floor(elapsed % 3));

  return (
    <div className={cn('flex h-9 items-center gap-3 overflow-hidden', className)}>	
      <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-leaf-500 px-2.5 py-0.5 text-[10px] font-black tracking-wider text-white dark:text-on-sun uppercase">
        <span className="size-1.5 animate-pulse rounded-full bg-white" /> Live
			</span>
      <div className="relative h-full min-w-0 flex-1">
				<AnimatePresence mode="popLayout" initial={false}>
          <motion.p
            key={item.id}
            initial={{ y: 22, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -22, opacity: 0 }}
						transition={{ duration: 0.4 }}
						className="absolute inset-0 flex items-center gap-1.5 truncate text-[13px] font-semibold text-ink-soft"
					>
            <Zap size={14} className="shrink-0 text-amber-500" />
            <b className="text-ink">{item.sellerName}</b> ({item.sellerCity}) sold <b className="text-leaf-700">{item.kwh.toFixed(1)} kWh</b> to
						<b className="text-ink">{item.buyerName}</b> ({item.buyerCity})
            <ArrowRight size={12} className="shrink-0 text-ink-muted" />
            <b className="text-ink">{eur(item.total)}</b>
						<span className="text-ink-muted">- {minutes} min ago</span>
          </motion.p>
        </AnimatePresence>
			</div>
    </div>
	);
}
