import { AnimatePresence, motion } from 'framer-motion'
import { Coins, LogOut, Search, TrendingDown, TrendingUp, User as UserIcon, Wallet } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from 'react-router-dom'
import { eur, num } from '../../lib/format'
import { useApp } from "../../state/AppStateProvider"
import { useMarket } from '../../state/MarketProvider'
import { useSession } from '../../state/SessionProvider'
import { useToast } from '../../state/ToastProvider'
import { AnimatedNumber } from '../ui/AnimatedNumber'
import { Avatar } from '../ui/Avatar'
import { VerifiedBadge } from "../ui/VerifiedBadge"
import { ThemeToggle } from '../ui/ThemeToggle'
import { NotificationBell } from "./NotificationBell"


function SearchBox() {
	const { world } = useApp()
	const navigate = useNavigate()
  const [query, setQuery] = useState('')
    
	const [focused, setFocused] = useState(false)
	const results = useMemo(() => {
    const q = query.trim().toLowerCase()
		if (!q) return []
		return world.users.filter((u) => u.name.toLowerCase().includes(q) || u.city.toLowerCase().includes(q)).slice(0, 6)
  }, [query, world.users])

  return (
    <div className="relative w-[300px] 2xl:w-[360px]">
      <Search size={17} className="absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-muted" />
      <input
        value={query}
				onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 150)}
        placeholder="Search neighbours or cities..."
        className="h-10 w-full rounded-xl border border-line bg-surface pr-3 pl-10 text-sm font-semibold text-ink outline-none transition placeholder:text-ink-muted/80 focus:border-sun-400 focus:ring-4 focus:ring-sun-200/60"
      />
      <AnimatePresence>
        {focused && query.trim() && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -6 }}
            className="absolute top-12 left-0 z-[1000] w-full overflow-hidden rounded-2xl border border-line bg-surface shadow-lift"
          >
            {results.length === 0 ? (
							<p className="px-4 py-4 text-sm text-ink-muted">No neighbours match "{query}".</p>
            ) : (
							results.map((u) => (
                <button
                  key={u.id}
                  type="button"
									onMouseDown={() => {
										navigate(`/users/${u.id}`)
                    setQuery('')
									}}
                  className="flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-left hover:bg-sun-50"
                >
                  <Avatar initials={u.initials} color={u.avatarColor} size={32} />
									<span className="flex-1">
                    <span className="flex items-center gap-1 text-sm font-bold text-ink">
											{u.name} {u.verified && <VerifiedBadge size={13} />}
                    </span>
                    <span className="text-xs text-ink-muted">
                      {u.city}, {u.country} - {u.role === 'seller' ? 'Seller' : 'Buyer'}
										</span>
                  </span>
								</button>
              ))
            )}
    
					</motion.div>
        )}
      </AnimatePresence>
    </div>
	)
}

function LivePrice() {
  const { currentPrice, trend, priceCountry } = useMarket()
  return (
    <div className="flex items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2 text-sm">
      <span className="relative flex size-2">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-leaf-500 opacity-60" />
				<span className="relative inline-flex size-2 rounded-full bg-leaf-500" />
      </span>
      <span className="font-bold text-ink-muted">Grid {priceCountry}</span>
      <motion.span key={currentPrice} initial={{ y: trend > 0 ? 6 : -6, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="font-black text-ink tabular-nums">
        {eur(currentPrice, 3)}
      </motion.span>
      {trend > 0 ? <TrendingUp size={15} className="text-orange-500" /> : <TrendingDown size={15} className="text-leaf-500" />}
		</div>
  )
}

function UserMenu() {
  const { me } = useApp()
  const { signOut } = useSession()
  const { toast } = useToast()
  const navigate = useNavigate()
	const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if(!open) return
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
		document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  return (
		<div ref={ref} className="relative">
			<motion.button whileTap={{ scale: 0.92 }} type="button" onClick={() => setOpen((o) => !o)} className="cursor-pointer rounded-full">  
        <Avatar initials={me.initials} color={me.avatarColor} size={40} ring />
      </motion.button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
						animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="absolute top-13 right-0 z-[1000] w-56 overflow-hidden rounded-2xl border border-line bg-surface p-1.5 shadow-lift"
          >
						<div className="px-3 py-2">
							<p className="text-sm font-extrabold text-ink">{me.name}</p>
              <p className="text-xs text-ink-muted">{me.city} - {me.panelKwp} kWp</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setOpen(false)  
                navigate('/users/me')
							}}
              className="flex w-full cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-ink-soft hover:bg-sun-50 hover:text-ink"
            >
							<UserIcon size={16} /> My profile
            </button>
						<button
							type="button"
              onClick={() => {
                signOut()
								toast('Signed out', 'See you soon, neighbour!', 'info')
                navigate('/login')
              }}
							className="flex w-full cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-ink-soft hover:bg-sun-50 hover:text-ink"
            >
							<LogOut size={16} /> Sign out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
	)
}

export function TopBar() {
	const { world } = useApp()
  const navigate = useNavigate()
  return (
		<header className="no-print relative z-[900] flex h-16 shrink-0 items-center justify-between gap-4 border-b border-line bg-surface/80 px-6 backdrop-blur">
      <SearchBox />
	      <div className="flex items-center gap-2.5">
        <LivePrice /> 
				<ThemeToggle />
        <NotificationBell />
        <motion.button
          type="button"
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => navigate('/rewards')}
          className="flex cursor-pointer items-center gap-1.5 rounded-xl border border-line bg-sun-50 px-3 py-2 text-sm font-black text-ink"
					title="EcoTokens" 
        >
          <Coins size={16} className="text-amber-500" />
					<AnimatedNumber value={world.ecoTokens} format={(v) => num(v)} />
        </motion.button>
				<motion.button
          type="button"
          whileHover={{ y: -1 }}
					whileTap={{ scale: 0.96 }}
          onClick={() => navigate('/wallet')}
          className="flex cursor-pointer items-center gap-2 rounded-xl bg-leaf-500 px-3.5 py-2 text-sm font-black text-white dark:text-on-sun shadow-soft"
				>
					<Wallet size={16} />
          <AnimatedNumber value={world.balance} format={(v) => eur(v)} />
				</motion.button>
				<UserMenu />
			</div>
		</header>
  )
}
