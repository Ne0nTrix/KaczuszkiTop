import { motion } from 'framer-motion';
import type { HTMLMotionProps } from 'framer-motion';
import type { ReactNode } from "react"  
import { cn } from '../../lib/cn';

interface CardProps extends HTMLMotionProps<'div'> {
  children?: ReactNode
  padded?: boolean
}

export const cardEntrance = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 260, damping: 26 } },
}

export function Card({ className, children, padded = true, ...rest }: CardProps) {
  return ( 
    <motion.div
      variants={cardEntrance}
      className={cn('rounded-2xl border border-line bg-surface shadow-soft', padded && 'p-5', className)}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

export function Stagger({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <motion.div
      className={className}
			initial="hidden"
	      animate="show" 
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
    >
      {children}
    </motion.div>
  );
} 

export function CardTitle({ icon, title, subtitle, action }: { icon?: ReactNode; title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div className="flex items-center gap-2.5">
        {icon && <span className="grid size-9 place-items-center rounded-xl bg-sun-100 text-amber-500">{icon}</span>}
        <div>
          <h3 className="text-[15px] font-extrabold text-ink">{title}</h3>
          {subtitle && <p className="text-xs font-semibold text-ink-muted">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}
