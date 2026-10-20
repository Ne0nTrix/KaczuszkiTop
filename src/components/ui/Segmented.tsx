import { motion } from "framer-motion";
import type { ReactNode } from 'react';


import { cn } from '../../lib/cn'

interface SegmentedProps<T extends string> {
  options: Array<{ value: T; label: string; icon?: ReactNode; badge?: number }>
  value: T
	onChange: (value: T) => void
  layoutId: string
  className?: string
  size?: 'sm' | 'md'
}

export function Segmented<T extends string>({ options, value, onChange, layoutId, className, size = 'md' }: SegmentedProps<T>) {
  return (
    <div className={cn('inline-flex rounded-2xl border border-line bg-surface/90 p-1 shadow-soft', className)}>
			{options.map((opt) => {
        const active = opt.value === value;
				return (
          <button
						key={opt.value}
            type="button"
						onClick={() => onChange(opt.value)}
            className={cn(
							'relative flex cursor-pointer items-center gap-1.5 rounded-xl font-bold transition-colors',
							size === 'sm' ? 'px-3 py-1 text-xs' : 'px-4 py-1.5 text-sm',
              active ? 'text-on-sun' : 'text-ink-muted hover:text-ink',
            )}
					>
						{active && (  
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 rounded-xl bg-sun-400 shadow-soft"
                transition={{ type: 'spring', stiffness: 450, damping: 34 }}
              />
            )}
						<span className="relative flex items-center gap-1.5">
              {opt.icon}
              {opt.label}
              {!!opt.badge && (
								<span className="grid h-4.5 min-w-4.5 place-items-center rounded-full bg-orange-500 px-1 text-[10px] text-white">{opt.badge}</span>
							)}
            </span>
          </button>
        )
      })}
    </div>
  )  
}
	