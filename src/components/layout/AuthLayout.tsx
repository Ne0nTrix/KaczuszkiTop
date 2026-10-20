import { motion } from 'framer-motion'
import { Leaf, ShieldCheck, Users } from 'lucide-react'
import type { ReactNode } from 'react';
import { Logo } from './Logo'

function House({ x, panels }: { x: number; panels: boolean }) {
  return (
    <g transform={`translate(${x} 0)`}>
      <rect x="0" y="232" width="92" height="70" rx="6" fill="#FFFFFF" stroke="#EADFA6" strokeWidth="2" />
      <path d="M-10 238 46 190l56 48z" fill="#F4A300" opacity="0.85" />
      {panels && (
        <g transform="rotate(-40 46 214)">
          {[0, 1, 2].map((i) => (
            <rect key={i} x={20 + i * 18} y="206" width="16" height="10" rx="1.5" fill="#2F6B3A" stroke="#fff" strokeWidth="1" />
          ))}
        </g>
      )}
      <rect x="36" y="268" width="20" height="34" rx="3" fill="#FFE07A" />
      <rect x="10" y="250" width="16" height="14" rx="2" fill="#E2F1F8" />
      <rect x="66" y="250" width="16" height="14" rx="2" fill="#E2F1F8" />
    </g>
  )
}

export function SunnyIllustration() {
  return (
    <svg viewBox="0 0 480 330" className="w-full max-w-[520px]">
      <motion.g animate={{ rotate: 360 }} transition={{ duration: 60, repeat: Infinity, ease: 'linear' }} style={{ originX: 0.5, originY: 0.5 }}>
        {Array.from({ length: 12 }, (_, i) => (
          <rect key={i} x="237" y="10" width="6" height="22" rx="3" fill="#F6C945" opacity="0.7" transform={`rotate(${i * 30} 240 90)`} />
        ))}
      </motion.g>
      <motion.circle cx="240" cy="90" r="46" fill="#F6C945" animate={{ r: [46, 50, 46] }} transition={{ duration: 4, repeat: Infinity }} />
      <circle cx="226" cy="76" r="18" fill="#FFF2B0" opacity="0.7" />
			<path d="M0 300 Q120 280 240 296 T480 292 V330 H0z" fill="#C4E3B6" />
      <path d="M0 312 Q140 300 260 314 T480 306 V330 H0z" fill="#5FAE4B" opacity="0.6" />
      <House x={40} panels />
      <House x={194} panels={false} />
      <House x={348} panels />
      {[
        'M132 230 Q163 200 194 230',
        'M286 230 Q317 200 348 230',
      ].map((d) => (
        <path key={d} d={d} fill="none" stroke="#5FAE4B" strokeWidth="4" strokeDasharray="6 8" strokeLinecap="round" className="flow-line" />
      ))}
    </svg>
  )
}

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full bg-cream">
      <div className="relative hidden w-[46%] flex-col justify-between overflow-hidden bg-gradient-to-br from-sun-200 via-sun-100 to-leaf-100 p-12 lg:flex">
        <div className="absolute -top-24 -right-24 size-80 rounded-full bg-sun-300/40 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 size-96 rounded-full bg-leaf-200/50 blur-3xl" />
        <div className="relative">
          <Logo />
        </div>
        <div className="relative flex flex-col items-center">
          <SunnyIllustration />
          <h2 className="mt-6 text-center text-[34px] leading-tight font-black text-ink">
            Trade your surplus sun
						<br />
            with your <span className="text-leaf-700">neighbours.</span>
          </h2>
          <p className="mt-3 max-w-md text-center font-semibold text-ink-soft">
            Peer-to-peer solar trading, green certificates and EcoToken rewards - all in one sunny place.
          </p>
        </div>
        <div className="relative flex justify-center gap-6 text-sm font-bold text-ink-soft">
          <span className="flex items-center gap-1.5"><Users size={16} className="text-leaf-600" /> 2,400+ prosumers</span>
          <span className="flex items-center gap-1.5"><ShieldCheck size={16} className="text-leaf-600" /> Verified certificates</span>
          <span className="flex items-center gap-1.5"><Leaf size={16} className="text-leaf-600" /> 1.2 kt CO2 saved</span>
        </div>
      </div>
      <div className="flex flex-1 items-center justify-center p-10">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="w-full max-w-[440px]">
          {children}
        </motion.div>
      </div>
    </div>
  );
}
