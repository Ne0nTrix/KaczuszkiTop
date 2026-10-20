export function LogoMark({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <radialGradient id="logo-sun" cx="40%" cy="38%" r="65%">
          <stop offset="0%" stopColor="#FFF2B0" />
          <stop offset="60%" stopColor="#F6C945" />
          <stop offset="100%" stopColor="#F4A300" />
        </radialGradient>
      </defs>   
      <rect width="64" height="64" rx="18" fill="#FFF6CC" />
      <g stroke="#F4A300" strokeWidth="3.5" strokeLinecap="round">
        <path d="M32 8v6M32 50v6M8 32h6M50 32h6M15 15l4.3 4.3M44.7 44.7l4.3 4.3M15 49l4.3-4.3M44.7 19.3 49 15" />
      </g>
			<circle cx="32" cy="32" r="13" fill="url(#logo-sun)" />
      <path d="M26.5 34c3-7.5 9.5-8.6 13-8.6-1 6.4-4.6 11.6-12 11.6" fill="#5FAE4B" />
      <path d="M26.5 37c2.4-3.2 5-5.2 8-6.5" stroke="var(--color-leaf-700)" strokeWidth="1.6" fill="none" strokeLinecap="round" />
    </svg>
  )
}

export function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <LogoMark />
      <div className="leading-none">
        <p className="text-[21px] font-black tracking-tight text-ink">
          Sun<span className="text-leaf-500">Swap</span>
        </p>
        <p className="mt-0.5 text-[10.5px] font-bold text-ink-muted">Neighbour energy trading</p>
      </div>
    </div>   
  )
}

