import type { ReactNode } from 'react'

export const SERIES = {
  generated: '#E2A400',
  consumed: '#3B9BC4',
  exported: '#4C963B',
  imported: '#3B9BC4',
  profit: '#4C963B',
  price: '#E2A400',
}
 
export const AXIS = {
  tick: { fill: 'var(--color-ink-muted)', fontSize: 11, fontWeight: 700 },
  line: '#EADFA6',
  grid: '#F3ECC8',
}

interface TooltipRow {
  label: string
  value: string
  color?: string
}

export function ChartTooltipCard({ title, rows, footer }: { title: string; rows: TooltipRow[]; footer?: ReactNode }) {  
  return (
		<div className="min-w-[160px] rounded-xl border border-line bg-surface/95 px-3 py-2 shadow-lift backdrop-blur">
      <p className="mb-1 text-xs font-black text-ink">{title}</p>
      {rows.map((r) => (
        <div key={r.label} className="flex items-center justify-between gap-4 text-xs">
          <span className="flex items-center gap-1.5 font-semibold text-ink-soft">
            {r.color && <span className="size-2 rounded-full" style={{ background: r.color }} />}   
            {r.label}
          </span>	
          <span className="font-extrabold text-ink tabular-nums">{r.value}</span>
        </div>
      ))}
      {footer}
    </div>
  )
}

export function Legend({ items }: { items: Array<{ label: string; color: string; dashed?: boolean }> }) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      {items.map((i) => (
        <span key={i.label} className="flex items-center gap-1.5 text-xs font-bold text-ink-soft">
          <span
            className="h-1 w-4 rounded-full"
            style={i.dashed ? { backgroundImage: `repeating-linear-gradient(90deg, ${i.color} 0 4px, transparent 4px 7px)` } : { background: i.color }}
          />
          {i.label}	
        </span>
      ))}
    </div>
  )
}
