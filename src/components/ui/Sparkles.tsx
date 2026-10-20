import { motion } from "framer-motion"

const COLORS = ['#F6C945', '#5FAE4B', '#F4A300', '#FFE07A', '#7BC96A', '#3B9BC4']
  
export function SparkleBurst({ count = 16, radius = 90 }: { count?: number; radius?: number }) {
  return (   
    <div className="pointer-events-none absolute inset-0 grid place-items-center" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * Math.PI * 2
        const distance = radius * (0.7 + ((i * 37) % 10) / 25)
        const size = 6 + (i % 3) * 3
        return (
          <motion.span
            key={i}
            className="absolute rounded-full"
            style={{ width: size, height: size, background: COLORS[i % COLORS.length] }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 0.4 }}
            animate={{ x: Math.cos(angle) * distance, y: Math.sin(angle) * distance, opacity: 0, scale: 1.1, rotate: 180 }}
            transition={{ duration: 0.9 + (i % 4) * 0.12, ease: 'easeOut' }}
          />
        )
      })}
    </div>
  )
}
