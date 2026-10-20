import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

type Tone = 'sun' | 'leaf' | 'sky' | 'orange' | 'neutral' | 'loss'

const TONES: Record<Tone, string> = {
  sun: 'bg-sun-100 text-sun-700 border-sun-300',
  leaf: 'bg-leaf-100 text-leaf-700 border-leaf-200',
  sky: 'bg-sky-100 text-sky-500 border-sky-100',
  orange: 'bg-orange-100 text-orange-500 border-orange-100',   
  neutral: 'bg-cream text-ink-soft border-line',
  loss: 'bg-loss-100 text-loss border-loss-100',
}

export function Badge({ tone = 'sun', children, className, icon }: { tone?: Tone; children: ReactNode; className?: string; icon?: ReactNode }) {
  return (
    <span
	      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-bold whitespace-nowrap',
        TONES[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  )
}
