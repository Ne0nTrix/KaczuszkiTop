import { motion } from 'framer-motion'
import { Minus, TrendingDown, TrendingUp } from 'lucide-react'


export type BalanceStatus = 'surplus' | 'balanced' | 'deficit'

export function balanceStatus(balance: number, consumption: number): BalanceStatus {
  const ratio = consumption > 0 ? balance / consumption : 1
  return ratio > 0.08 ? 'surplus' : ratio < -0.08 ? 'deficit' : 'balanced'
}

const STATUS = {
	  surplus: { label: 'Surplus', color: '#5FAE4B', icon: TrendingUp, cls: 'bg-leaf-100 text-leaf-700' },
  balanced: { label: 'Balanced', color: '#F6C945', icon: Minus, cls: 'bg-sun-100 text-sun-700' },
  deficit: { label: 'Deficit', color: '#F28C28', icon: TrendingDown, cls: 'bg-orange-100 text-orange-500' },
}



function arc(startDeg: number, endDeg: number, r: number) {
  const toXY = (deg: number) => {
    const rad = ((deg - 180) * Math.PI) / 180
    return [100 + r * Math.cos(rad), 100 + r * Math.sin(rad)]
  }
  const [x1, y1] = toXY(startDeg)   
  const [x2, y2] = toXY(endDeg)
  return `M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`
}

export function BalanceGauge({ balance, production, consumption }: { balance: number; production: number; consumption: number }) {
  const status = balanceStatus(balance, consumption)
  const s = STATUS[status]
  const ratio = Math.max(-1, Math.min(1, balance / Math.max(1, Math.max(production, consumption))))
  const angle = ratio * 90
  const Icon = s.icon

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 118" className="w-full max-w-[300px]">
        <path d={arc(0, 180, 80)} stroke="var(--color-line-soft)" strokeWidth="22" fill="none" strokeLinecap="round" />
        <path d={arc(2, 75, 80)} stroke="#F28C28" strokeWidth="16" fill="none" strokeLinecap="round" opacity="0.9" />
        <path d={arc(80, 100, 80)} stroke="#F6C945" strokeWidth="16" fill="none" opacity="0.95" />
        <path d={arc(105, 178, 80)} stroke="#5FAE4B" strokeWidth="16" fill="none" strokeLinecap="round" opacity="0.9" />
        <motion.g initial={{ rotate: -90 }} animate={{ rotate: angle }} transition={{ type: 'spring', stiffness: 60, damping: 12 }} style={{ originX: 0.5, originY: 1 }}>
          <path d="M 97 100 L 100 30 L 103 100 Z" fill="var(--color-ink)" />
        </motion.g>   
        <circle cx="100" cy="100" r="9" fill="var(--color-ink)" />
        <circle cx="100" cy="100" r="4" fill={s.color} />
        <text x="22" y="116" fontSize="9" fontWeight="800" fill="var(--color-ink-muted)">Deficit</text>
        <text x="178" y="116" fontSize="9" fontWeight="800" fill="var(--color-ink-muted)" textAnchor="end">Surplus</text>
      </svg>
      <span className={`mt-1 flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-black ${s.cls}`}>
				<Icon size={15} /> {s.label} {balance >= 0 ? '+' : ''}
        {balance.toFixed(1)} kWh
      </span>
    </div>
  )
}
 