import { Star } from 'lucide-react'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '../../lib/cn'

export function Stars({ value, size = 14, className }: { value: number; size?: number; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-0.5', className)}>
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = Math.max(0, Math.min(1, value - (i - 1)))
        return (
					<span key={i} className="relative inline-block" style={{ width: size, height: size }}>
            <Star size={size} className="absolute inset-0 text-line" fill="currentColor" strokeWidth={0} />
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <Star size={size} className="text-amber-500" fill="currentColor" strokeWidth={0} />
            </span>
          </span>
        )
      })}
    </span>
  )
}

export function StarInput({ value, onChange, size = 28 }: { value: number; onChange: (v: number) => void; size?: number }) {
  const [hover, setHover] = useState(0)
  const shown = hover || value
  return (
    <div className="inline-flex items-center gap-1" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((i) => (
        <motion.button
          key={i}
          type="button"
          whileHover={{ scale: 1.2, rotate: -8 }}
          whileTap={{ scale: 0.85 }}
          onMouseEnter={() => setHover(i)}
          onClick={() => onChange(i)}
          className="cursor-pointer"   
          aria-label={`${i} star${i > 1 ? 's' : ''}`}
        >
          <Star
            size={size}
            strokeWidth={1.6}
            className={cn('transition-colors', i <= shown ? 'text-amber-500' : 'text-line')}
            fill={i <= shown ? '#F6C945' : 'transparent'}
          />
        </motion.button>
      ))}   
    </div>
  )
}  
