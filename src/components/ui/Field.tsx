import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

export const inputClass =
  'h-11 w-full rounded-xl border border-line bg-surface px-3.5 text-sm font-semibold text-ink outline-none transition placeholder:font-medium placeholder:text-ink-muted/70 focus:border-sun-400 focus:ring-4 focus:ring-sun-200/60'

export function Field({ label, hint, children, className }: { label: string; hint?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <label className={cn('block', className)}>
      <span className="mb-1.5 flex items-center justify-between text-xs font-extrabold tracking-wide text-ink-soft uppercase">
        {label}
        {hint && <span className="font-bold tracking-normal normal-case text-ink-muted">{hint}</span>}
      </span>
      {children}
    </label>
  )
}

export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(inputClass, className)} {...rest} />
}
  
export function Select({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(inputClass, 'cursor-pointer appearance-none bg-[length:16px] bg-[right_12px_center] bg-no-repeat pr-9', className)} style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%238b8567' stroke-width='2.5'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")" }} {...rest}>
      {children}
    </select>
  )
}

interface SliderProps {
  value: number
  min: number
  max: number
  step: number
  onChange: (value: number) => void
  className?: string
}

export function Slider({ value, min, max, step, onChange, className }: SliderProps) {
  const pct = ((value - min) / (max - min)) * 100
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className={cn('h-2 w-full cursor-pointer appearance-none rounded-full', className)}
      style={{ background: `linear-gradient(90deg, #5FAE4B ${pct}%, #F3ECC8 ${pct}%)` }}
    />
  )
}

export function Toggle({ checked, onChange, label, color = 'leaf' }: { checked: boolean; onChange: (v: boolean) => void; label: ReactNode; color?: 'leaf' | 'sky' }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className="flex cursor-pointer items-center gap-2 text-sm font-bold text-ink-soft">
	      <span className={cn('relative h-5.5 w-10 rounded-full transition-colors', checked ? (color === 'sky' ? 'bg-sky-500' : 'bg-leaf-500') : 'bg-line')}>
        <span className={cn('absolute top-0.5 size-4.5 rounded-full bg-surface shadow transition-all', checked ? 'left-5' : 'left-0.5')} />
      </span>
      {label}
    </button>
  )
}
