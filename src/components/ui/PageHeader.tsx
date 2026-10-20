import type { ReactNode } from 'react'

export function PageHeader({ title, subtitle, actions, icon }: { title: string; subtitle?: string; actions?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div className="flex items-center gap-3">
				{icon && <span className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-sun-300 to-sun-400 text-ink shadow-soft">{icon}</span>}
        <div>
          <h1 className="text-[26px] leading-tight font-black text-ink">{title}</h1>
          {subtitle && <p className="text-sm font-semibold text-ink-muted">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}
