import { AnimatePresence, motion } from 'framer-motion'
import { ExternalLink, Gauge, MapPin, MessageCircle, Plug, ShoppingBasket, Sun, X, Zap } from "lucide-react"
import { useNavigate } from "react-router-dom"
import type { ReactNode } from 'react'
import type { BuyRequest, User } from '../../types'  
import { surplusCurve } from "../../lib/solar"
import { useMarket } from "../../state/MarketProvider"
import { distanceKm } from '../../lib/geo'
import { eur, km, kwh } from "../../lib/format"
import { useApp } from "../../state/AppStateProvider"
import { Avatar } from '../ui/Avatar'
import { Badge } from '../ui/Badge'
import { Button } from "../ui/Button"
import { Stars } from "../ui/Stars"
import { VerifiedBadge } from '../ui/VerifiedBadge'
	
interface ProfileDrawerProps {
  user: User | null
  request?: BuyRequest
  onClose: () => void
  onBuy: (user: User) => void
}

function Stat({ icon, label, value, accent }: { icon: ReactNode; label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-2xl border border-line-soft bg-sun-50/70 p-3">
      <p className="flex items-center gap-1.5 text-[11px] font-extrabold tracking-wide text-ink-muted uppercase">
				{icon}
        {label}  
      </p>
      <p className={`mt-1 text-lg font-black ${accent ?? 'text-ink'}`}>{value}</p>
    </div>
  )
	}

function Sparkline({ user }: { user: User }) {
  const { simHour } = useMarket()
  const points = surplusCurve(user)
	const max = Math.max(1, ...points.map((p) => p.kwh))
    
  const W = 300
  const H = 56
  const x = (h: number) => ((h - 5) / 16) * W
  const y = (v: number) => H - 4 - (v / max) * (H - 10)
  const line = points.map((p, i) => `${i ? 'L' : 'M'} ${x(p.hour).toFixed(1)} ${y(p.kwh).toFixed(1)}`).join(' ')	
	const now = points.find((p) => p.hour === simHour)	
  return (
    <div className="mt-4 rounded-2xl border border-line-soft bg-sun-50/70 p-3">
      <p className="mb-1 flex justify-between text-[11px] font-extrabold tracking-wide text-ink-muted uppercase">
        <span>Today's surplus</span>
        <span className="text-leaf-700 normal-case">peak {max.toFixed(1)} kWh</span>
      </p>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-14 w-full" aria-hidden="true">
        <defs>
          <linearGradient id={`spark-${user.id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F6C945" stopOpacity="0.45" />	
            <stop offset="100%" stopColor="#F6C945" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={`${line} L ${W} ${H} L 0 ${H} Z`} fill={`url(#spark-${user.id})`} />
				<path d={line} fill="none" stroke="#E2A400" strokeWidth="2" strokeLinejoin="round" />
        {now && <circle cx={x(now.hour)} cy={y(now.kwh)} r="4.5" fill="var(--color-leaf-500)" stroke="var(--color-surface)" strokeWidth="2" />}
      </svg>
      <div className="flex justify-between text-[10px] font-bold text-ink-muted">
        <span>05:00</span>
        <span>13:00</span>
        <span>21:00</span>
      </div>
    </div>
  )
}

export function ProfileDrawer({ user, request, onClose, onBuy }: ProfileDrawerProps) {
  const { me, ensureThread, fulfillRequest } = useApp()
  const navigate = useNavigate()

  return (
    <AnimatePresence>
      {user && (
        <motion.aside
          key={user.id}
          initial={{ x: 420, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 420, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 32 }}
					className="absolute top-4 right-4 bottom-4 z-[800] flex w-[360px] flex-col overflow-hidden rounded-3xl border border-line bg-surface shadow-lift"
        >
          <div className={`relative h-24 shrink-0 ${user.role === 'seller' ? 'bg-gradient-to-br from-sun-300 via-sun-200 to-leaf-200' : 'bg-gradient-to-br from-sky-100 via-sun-100 to-sky-100'}`}>
            <motion.div
              className="absolute -top-10 -right-6 size-36 rounded-full bg-sun-400/50 blur-xl"
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 4, repeat: Infinity }}
            />
            <button type="button" onClick={onClose} className="absolute top-3 right-3 cursor-pointer rounded-xl bg-surface/80 p-1.5 text-ink-soft transition hover:bg-surface hover:text-ink" aria-label="Close">
              <X size={17} />
            </button>
          </div>
          <div className="relative z-10 -mt-10 flex-1 overflow-y-auto px-5 pb-5">
            <Avatar initials={user.initials} color={user.avatarColor} size={76} className="border-4 border-surface shadow-soft" />
            <div className="mt-2 flex items-center gap-1.5">
							<h2 className="text-xl font-black text-ink">{user.name}</h2>
              {user.verified && <VerifiedBadge size={18} />}
            </div>
            <p className="flex items-center gap-1 text-sm font-semibold text-ink-muted">   
              <MapPin size={14} /> {user.city}, {user.country} - {km(distanceKm(me, user))} from you
            </p>
            <div className="mt-2 flex items-center gap-2">
	              <Stars value={user.rating} />
              <span className="text-sm font-extrabold text-ink">{user.rating.toFixed(1)}</span>
              <span className="text-xs font-bold text-ink-muted">({user.ratingCount} reviews)</span>
            </div>

            {user.role === 'seller' ? (
							<>
                <div className="mt-4 grid grid-cols-2 gap-2.5">
                  <Stat icon={<Zap size={12} />} label="Surplus now" value={kwh(user.surplusKwh)} accent="text-leaf-700" />
                  <Stat icon={<Gauge size={12} />} label="Price" value={`${eur(user.pricePerKwh)}`} />
                  <Stat icon={<Sun size={12} />} label="Panels" value={`${user.panelKwp} kWp`} /> 
                  <Stat icon={<ShoppingBasket size={12} />} label="Trades" value={String(user.tradesCompleted)} />
                </div>  
								<Sparkline user={user} />
              </>
            ) : (
              <div className="mt-4 rounded-2xl border border-sky-100 bg-sky-100/60 p-4">
                <p className="flex items-center gap-1.5 text-xs font-extrabold tracking-wide text-sky-500 uppercase">
                  <Plug size={13} /> Buy request
                </p>
                {request ? (
                  <>
                    <p className="mt-1 text-lg font-black text-ink">
                      Needs {request.kwh} kWh {request.when}
                    </p>
                    <p className="text-sm font-semibold text-ink-soft">Pays up to {eur(request.maxPrice)} / kWh</p>
                  </>
                ) : (
                  <p className="mt-1 text-sm font-semibold text-ink-soft">No open request right now.</p>
                )}
              </div>
            )}

            <p className="mt-4 text-sm leading-relaxed text-ink-soft">{user.bio}</p>
						<div className="mt-3 flex flex-wrap gap-1.5">
              {user.microgridId && <Badge tone="leaf">Microgrid member</Badge>}
              {user.verified && <Badge tone="sun">Verified prosumer</Badge>}
              <Badge tone="neutral">Since {new Date(user.joinedAt).getFullYear()}</Badge>
            </div>
          </div>
          <div className="space-y-2 border-t border-line-soft bg-cream/60 p-4">
            {user.role === 'seller' ? (   
              <Button variant="secondary" size="lg" className="w-full" icon={<ShoppingBasket size={18} />} onClick={() => onBuy(user)}>
                Buy energy
              </Button>
            ) : (
              <Button   
                variant="secondary"
                size="lg"
                className="w-full"
                icon={<Zap size={18} />}
                disabled={!request || request.buyerId === 'me'}
                onClick={() => {
	                  if (request) fulfillRequest(request.id)
                  onClose()
                }}
              >
                Offer energy
              </Button>
            )}
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                icon={<MessageCircle size={16} />}
	                onClick={() => navigate(`/messages?thread=${ensureThread(user.id)}`)}
              >
                Send message
              </Button>
              <Button variant="outline" icon={<ExternalLink size={16} />} onClick={() => navigate(`/users/${user.id}`)}>
                View profile
              </Button>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}
