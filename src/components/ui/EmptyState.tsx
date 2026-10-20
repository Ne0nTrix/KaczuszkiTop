import { Sun } from 'lucide-react';
import type { ReactNode } from 'react';

export function EmptyState({ title, text, action, icon }: { title: string; text: string; action?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-sun-50/60 px-6 py-10 text-center">
      <span className="mb-3 grid size-14 place-items-center rounded-full bg-sun-100 text-amber-500">{icon ?? <Sun size={26} />}</span>
      <p className="font-extrabold text-ink">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-ink-soft">{text}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
    
}
