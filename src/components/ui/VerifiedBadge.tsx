import { ShieldCheck } from 'lucide-react'
import { cn } from '../../lib/cn'

export function VerifiedBadge({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <span className={cn('group/verified relative inline-flex align-middle text-leaf-500', className)}>
      <ShieldCheck size={size} strokeWidth={2.4} />
      <span className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-1.5 -translate-x-1/2 scale-90 rounded-lg bg-leaf-700 px-2 py-1 text-[11px] font-bold whitespace-nowrap text-white opacity-0 shadow-soft transition group-hover/verified:scale-100 group-hover/verified:opacity-100">
        Verified prosumer
      </span>
	    </span>
  )
}
