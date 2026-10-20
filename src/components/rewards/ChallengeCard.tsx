import { motion } from 'framer-motion'
import { CheckCircle2, Clock, Coins, Gift } from 'lucide-react'
import { useState } from 'react'
import type { Challenge } from '../../types'
import { cn } from '../../lib/cn'
import { Button } from '../ui/Button'
import { SparkleBurst } from '../ui/Sparkles'

export function ChallengeCard({ challenge, onClaim, index }: { challenge: Challenge; onClaim: () => void; index: number }) {
  const [burst, setBurst] = useState(0)
  const ready = challenge.progress >= challenge.target && !challenge.claimed
  const pct = Math.min(1, challenge.progress / challenge.target)
  const fmt = (v: number) => v.toFixed(challenge.decimals)

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        'relative overflow-hidden rounded-2xl border p-4',
        ready ? 'border-sun-400 bg-gradient-to-br from-sun-100 to-surface shadow-soft' : challenge.claimed ? 'border-leaf-200 bg-leaf-50' : 'border-line bg-surface',
      )}
    >
      {burst > 0 && <SparkleBurst key={burst} count={20} radius={120} />}
      <div className="flex items-start justify-between gap-2">
        <p className="font-extrabold text-ink">{challenge.title}</p>
        <span className="flex shrink-0 items-center gap-1 rounded-full bg-sun-100 px-2 py-0.5 text-xs font-black text-sun-700">
          <Coins size={12} /> +{challenge.reward}
        </span>
      </div>
      <div className="mt-3 flex items-center justify-between text-xs font-bold text-ink-muted">
        <span>
          {fmt(Math.min(challenge.progress, challenge.target))} / {fmt(challenge.target)}
        </span>
        <span className="flex items-center gap-1">
          <Clock size={12} /> {challenge.daysLeft === 0 ? 'Completed' : `${challenge.daysLeft} day${challenge.daysLeft > 1 ? 's' : ''} left`}
        </span>
      </div>
      <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-line-soft">
        <motion.div
          className={cn('h-full rounded-full', challenge.claimed ? 'bg-leaf-500' : 'bg-gradient-to-r from-sun-400 to-leaf-500')}
          initial={{ width: 0 }}
          animate={{ width: `${pct * 100}%` }}
          transition={{ duration: 1, delay: 0.1 + index * 0.05 }}
        />
      </div>
      <div className="mt-3 flex justify-end">
        {challenge.claimed ? (
          <span className="flex items-center gap-1 text-sm font-black text-leaf-700">
            <CheckCircle2 size={16} /> Reward claimed
          </span>
        ) : ready ? (
	          <Button
            size="sm"
            icon={<Gift size={14} />}
            onClick={() => {
              setBurst((b) => b + 1)
              onClaim()
            }}
          >
            Claim reward
          </Button>
        ) : (
          <span className="text-xs font-bold text-ink-muted">{Math.round(pct * 100)}% done</span>   
        )}
      </div>
    </motion.div>
  )
}
