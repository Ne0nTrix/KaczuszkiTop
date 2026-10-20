import { motion } from "framer-motion"

function House({ x, y, scale = 1, panels = true }: { x: number; y: number; scale?: number; panels?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <rect x="0" y="40" width="92" height="64" rx="7" fill="var(--color-surface)" stroke="var(--color-line)" strokeWidth="2" />
      <path d="M-10 46 46 0l56 46z" fill="#F4A300" />
      {panels && (
        <g transform="rotate(-39.4 46 23)">
          {[0, 1, 2].map((i) => (
            <rect key={i} x={19 + i * 18} y="16" width="16" height="10" rx="1.5" fill="#2F6B3A" stroke="#fff" strokeWidth="1" />
          ))}
        </g>
      )}
      <rect x="36" y="70" width="20" height="34" rx="3" fill="#FFE07A" />
      <rect x="10" y="54" width="16" height="13" rx="2" fill="#E2F1F8" />
      <rect x="66" y="54" width="16" height="13" rx="2" fill="#E2F1F8" />
    </g>
  )
}

export function HeroScene() {
  return (
    <svg viewBox="0 0 560 440" className="w-full [mask-image:linear-gradient(to_bottom,black_80%,transparent)]" aria-hidden="true">
      <defs>
        <radialGradient id="hero-sun" cx="40%" cy="38%" r="65%">
          <stop offset="0%" stopColor="#FFF4B8" />
          <stop offset="55%" stopColor="#F6C945" />
          <stop offset="100%" stopColor="#F4A300" />
        </radialGradient>
        <radialGradient id="hero-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFE07A" stopOpacity="0.75" />
          <stop offset="100%" stopColor="#FFE07A" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="hill-back" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" style={{ stopColor: 'var(--hill-back-a)' }} />
          <stop offset="100%" style={{ stopColor: 'var(--hill-back-b)' }} />
        </linearGradient>
        <linearGradient id="hill-front" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" style={{ stopColor: 'var(--hill-front-a)' }} />
          <stop offset="100%" style={{ stopColor: 'var(--hill-front-b)' }} />
        </linearGradient>
      </defs>

      <motion.circle cx="290" cy="150" r="150" fill="url(#hero-glow)" animate={{ scale: [1, 1.12, 1], opacity: [0.8, 1, 0.8] }} transition={{ duration: 5, repeat: Infinity }} style={{ originX: 0.5, originY: 0.5 }} />
      <motion.g animate={{ rotate: 360 }} transition={{ duration: 70, repeat: Infinity, ease: 'linear' }} style={{ originX: 0.5, originY: 0.5 }}>
        {Array.from({ length: 16 }, (_, i) => (
          <rect key={i} x="285" y={i % 2 ? 22 : 12} width="10" height={i % 2 ? 30 : 40} rx="5" fill="#F6C945" opacity={i % 2 ? 0.55 : 0.8} transform={`rotate(${i * 22.5} 290 150)`} />
        ))}
      </motion.g>
      <motion.circle cx="290" cy="150" r="72" fill="url(#hero-sun)" animate={{ r: [72, 77, 72] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }} />
      <circle cx="268" cy="128" r="24" fill="#FFF8D6" opacity="0.65" />

      <motion.path d="M0 340 Q140 280 300 318 T560 300 V440 H0z" fill="url(#hill-back)" initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.9 }} />
      <House x={70} y={236} scale={0.9} />
      <House x={238} y={250} scale={0.95} panels={false} />
      <House x={400} y={232} scale={0.9} />
      {['M152 268 Q195 228 238 268', 'M330 272 Q368 230 405 266'].map((d) => (
        <path key={d} d={d} fill="none" stroke="#5FAE4B" strokeWidth="4" strokeDasharray="6 8" strokeLinecap="round" className="flow-line" />
      ))}
      <motion.path d="M0 380 Q160 344 320 372 T560 360 V440 H0z" fill="url(#hill-front)" opacity="0.85" initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 0.85 }} transition={{ duration: 1, delay: 0.1 }} />
      {[[60, 392], [180, 404], [470, 390], [520, 410]].map(([x, y], i) => (
        <motion.g key={i} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.6 + i * 0.1, type: 'spring' }} style={{ originX: 0.5, originY: 1 }}>
          <rect x={x - 2} y={y - 6} width="4" height="14" fill="#8B6A3E" />
          <circle cx={x} cy={y - 14} r="13" fill="#4C963B" />
        </motion.g>
      ))}
		</svg>
  )
}
