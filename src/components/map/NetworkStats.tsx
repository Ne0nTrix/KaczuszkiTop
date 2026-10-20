import { AnimatePresence, motion } from "framer-motion"
import { Activity, ChevronDown, Euro, Sun, Trophy, Users, Zap } from "lucide-react"   
import { useMemo, useState } from 'react'
import type { ReactNode } from "react"
import type { User } from '../../types'
import { PLATFORM_SCALE } from "../../data/constants"
import { countryRanking } from '../../data/rewards'
import { num } from "../../lib/format"
import { productionAt, sunShape } from "../../lib/solar"
import { useMarket } from "../../state/MarketProvider"
import { AnimatedNumber } from '../ui/AnimatedNumber'

function Stat({ icon, label, value }: { icon: ReactNode; label: string; value: ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-sun-100 text-amber-500">{icon}</span>
      <div className="min-w-0">
        <p className="text-[10px] font-extrabold tracking-wide whitespace-nowrap text-ink-muted uppercase">{label}</p>
        <p className="text-sm leading-tight font-black whitespace-nowrap text-ink tabular-nums">{value}</p>
      </div>
    </div>
  )
}

export function NetworkStats({ users }: { users: User[] }) {
  const { simHour } = useMarket()
  const [open, setOpen] = useState(true)
  const [countriesOpen, setCountriesOpen] = useState(false)
  const sellers = users.filter((u) => u.role === 'seller')
  const producingMwh = (sellers.reduce((s, u) => s + productionAt(u, simHour), 0) * PLATFORM_SCALE) / 1000	
  const surplusMwh = (sellers.reduce((s, u) => s + u.surplusKwh, 0) * PLATFORM_SCALE) / 1000   
  const active = Math.round(sellers.filter((u) => u.surplusKwh >= 0.3).length * PLATFORM_SCALE + users.filter((u) => u.role === 'buyer').length * PLATFORM_SCALE * 0.6)
  const avgPrice = sellers.reduce((s, u) => s + u.pricePerKwh, 0) / Math.max(1, sellers.length)
  const tradesToday = useMemo(() => {
    let area = 0
    for (let h = 5; h <= simHour; h++) area += 0.25 + sunShape(h)
    return Math.round(area * 1450)
  }, [simHour])
  const ranking = useMemo(() => countryRanking(users).slice(0, 5), [users])
  const maxKwh = ranking[0]?.tradedKwh ?? 1 

  return (
    <div className="pointer-events-auto w-[268px] overflow-hidden rounded-2xl border border-line bg-surface/95 shadow-lift backdrop-blur">
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex w-full cursor-pointer items-center gap-2 px-3.5 py-2.5">
        <span className="relative flex size-2">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-leaf-500 opacity-60" />
          <span className="relative inline-flex size-2 rounded-full bg-leaf-500" />
        </span>	
        <span className="flex-1 text-left text-xs font-black tracking-wide text-ink uppercase">EU network live</span>
				<motion.span animate={{ rotate: open ? 180 : 0 }}>
	          <ChevronDown size={15} className="text-ink-muted" />
        </motion.span>
      </button>   
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="grid grid-cols-2 gap-x-2 gap-y-2.5 px-3.5 pb-3">
              <Stat icon={<Sun size={14} />} label="Producing" value={<AnimatedNumber value={producingMwh} format={(v) => `${v.toFixed(1)} MWh`} duration={0.7} />} />
              <Stat icon={<Zap size={14} />} label="EU surplus" value={<AnimatedNumber value={surplusMwh} format={(v) => `${v.toFixed(1)} MWh`} duration={0.7} />} />
              <Stat icon={<Users size={14} />} label="Traders" value={<AnimatedNumber value={active} format={(v) => num(v)} duration={0.7} />} />
              <Stat icon={<Euro size={14} />} label="Avg price" value={`EUR ${avgPrice.toFixed(3)}`} />
              <Stat icon={<Activity size={14} />} label="Trades today" value={<AnimatedNumber value={tradesToday} format={(v) => num(v)} duration={0.7} />} />
            </div>
						<div className="border-t border-line-soft">
              <button type="button" onClick={() => setCountriesOpen((o) => !o)} className="flex w-full cursor-pointer items-center gap-2 px-3.5 py-2">
                <Trophy size={13} className="text-amber-500" />
                <span className="flex-1 text-left text-[11px] font-black tracking-wide text-ink-soft uppercase">Top countries</span>
                <motion.span animate={{ rotate: countriesOpen ? 180 : 0 }}>
                  <ChevronDown size={14} className="text-ink-muted" />
                </motion.span>
              </button>
              <AnimatePresence initial={false}>
                {countriesOpen && (
                  <motion.ol initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="space-y-1.5 overflow-hidden px-3.5 pb-3">
                    {ranking.map((c, i) => (
                      <li key={c.code} className="flex items-center gap-2 text-xs">   
                        <span className="w-3 font-black text-ink-muted">{i + 1}</span>
                        <span className="w-7 rounded bg-sun-100 text-center font-black text-ink">{c.code}</span>
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line-soft">
                          <motion.div className="h-full rounded-full bg-leaf-500" initial={{ width: 0 }} animate={{ width: `${(c.tradedKwh / maxKwh) * 100}%` }} />
                        </div>
                        <span className="w-16 text-right font-bold text-ink-soft tabular-nums">{(c.tradedKwh / 1000).toFixed(1)} MWh</span>
                      </li>
                    ))}
                  </motion.ol>
                )}
              </AnimatePresence>
            </div>   
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
