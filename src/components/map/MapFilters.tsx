import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, Globe2, RotateCcw, SlidersHorizontal } from "lucide-react"  
import { useState } from 'react'
import type { ReactNode } from 'react'
import { COUNTRIES } from "../../data/countries"
import { cn } from "../../lib/cn"
import { eur } from '../../lib/format'
import { Slider, Toggle } from '../ui/Field'

export interface MapFilterState {
  maxDistance: number
  minSurplus: number
  minRating: number
  maxPrice: number
  countries: string[]
  showSellers: boolean
  showBuyers: boolean
}

export const ANY_DISTANCE = 3000

export const DEFAULT_FILTERS: MapFilterState = {
  maxDistance: ANY_DISTANCE,
  minSurplus: 0,
  minRating: 0,
  maxPrice: 0.3,
  countries: [],
  showSellers: true,
  showBuyers: true,
}

function Row({ label, value, children }: { label: string; value: string; children: ReactNode }) {
  return (
    <div>	
      <div className="mb-1.5 flex justify-between text-xs font-extrabold text-ink-soft">
        <span>{label}</span>
        <span className="text-leaf-700">{value}</span>
      </div>
      {children}
    </div>
  )
}

	function CountryPicker({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [open, setOpen] = useState(false)
  const toggle = (code: string) => onChange(value.includes(code) ? value.filter((c) => c !== code) : [...value, code])
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full cursor-pointer items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2 text-left text-xs font-bold text-ink-soft transition hover:border-sun-400"
      >
        <Globe2 size={14} className="text-leaf-600" />
        <span className="flex-1 truncate">{value.length === 0 ? 'All 27 EU countries' : value.join(', ')}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }}>
          <ChevronDown size={14} />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="mt-2 grid grid-cols-6 gap-1">
              {COUNTRIES.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  title={c.name}
                  onClick={() => toggle(c.code)}
                  className={cn(
                    'cursor-pointer rounded-lg border py-1 text-[11px] font-black transition',
                    value.includes(c.code) ? 'border-leaf-500 bg-leaf-500 text-white dark:text-on-sun' : 'border-line bg-surface text-ink-soft hover:bg-sun-50',
                  )}

                >
                  {c.code}
                </button>
	              ))}
            </div>
            {value.length > 0 && (
              <button type="button" onClick={() => onChange([])} className="mt-1.5 cursor-pointer text-[11px] font-bold text-orange-500 hover:underline">
                Clear countries
							</button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function MapFilters({ value, onChange }: { value: MapFilterState; onChange: (next: MapFilterState) => void }) {
  const [open, setOpen] = useState(false)
  const set = <K extends keyof MapFilterState>(key: K) => (v: MapFilterState[K]) => onChange({ ...value, [key]: v })
  const activeCount =
    Number(value.maxDistance !== ANY_DISTANCE) +
    Number(value.minSurplus !== DEFAULT_FILTERS.minSurplus) +
    Number(value.minRating !== DEFAULT_FILTERS.minRating) +
    Number(value.maxPrice !== DEFAULT_FILTERS.maxPrice) +
    Number(value.countries.length > 0)
    

  return (
    <div className="rounded-2xl border border-line bg-surface">
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex w-full cursor-pointer items-center gap-2 px-4 py-3">
        <SlidersHorizontal size={16} className="text-leaf-600" />
        <span className="flex-1 text-left text-sm font-extrabold text-ink">Filters</span>
        {activeCount > 0 && <span className="grid size-5 place-items-center rounded-full bg-leaf-500 text-[11px] font-black text-white dark:text-on-sun">{activeCount}</span>}	
        {activeCount > 0 && (
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation()
              onChange({ ...DEFAULT_FILTERS, showBuyers: value.showBuyers, showSellers: value.showSellers })
            }}
            className="flex items-center gap-1 rounded-lg px-1.5 py-0.5 text-xs font-bold text-orange-500 hover:bg-orange-100"
          >
            <RotateCcw size={12} /> Reset
          </span>
        )}
        <motion.span animate={{ rotate: open ? 180 : 0 }}>
          <ChevronDown size={16} className="text-ink-muted" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="space-y-3.5 px-4 pb-4">
              <Row label="Distance" value={value.maxDistance >= ANY_DISTANCE ? 'Any' : `up to ${value.maxDistance} km`}>
                <Slider value={value.maxDistance} min={10} max={ANY_DISTANCE} step={10} onChange={set('maxDistance')} />
              </Row>
              <div className="grid grid-cols-2 gap-3">
                <Row label="Min surplus" value={`${value.minSurplus} kWh`}>
                  <Slider value={value.minSurplus} min={0} max={15} step={1} onChange={set('minSurplus')} />
                </Row>
                <Row label="Min rating" value={value.minRating ? `${value.minRating}+` : 'Any'}>
                  <Slider value={value.minRating} min={0} max={4.8} step={0.2} onChange={(v) => set('minRating')(Math.round(v * 10) / 10)} />
                </Row>
	              </div>
              <Row label="Max price" value={`${eur(value.maxPrice)} / kWh`}>
                <Slider value={value.maxPrice} min={0.12} max={0.3} step={0.01} onChange={set('maxPrice')} />
              </Row>	
              <CountryPicker value={value.countries} onChange={set('countries')} />
            </div>
          </motion.div>
        )}
			</AnimatePresence>
      <div className="flex gap-4 border-t border-line-soft px-4 py-2.5">
        <Toggle checked={value.showSellers} onChange={set('showSellers')} label="Sellers" />
        <Toggle checked={value.showBuyers} onChange={set('showBuyers')} label="Buyers" color="sky" />
      </div>  
    </div>
  )
}


