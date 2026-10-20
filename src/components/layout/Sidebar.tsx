import { motion } from "framer-motion"
import {
  ArrowLeftRight,
  Award,
  Gift,
  LayoutDashboard,
  Map,
  MessageCircle,
  Network,   
  Wallet,
} from "lucide-react"
import { NavLink, useNavigate } from 'react-router-dom'  
import { levelFor } from '../../data/rewards'
import { cn } from '../../lib/cn'
import { useApp } from "../../state/AppStateProvider"
	import { Avatar } from "../ui/Avatar"
import { VerifiedBadge } from "../ui/VerifiedBadge"
import { Logo } from './Logo'

const NAV = [
  { to: '/map', label: 'Energy map', icon: Map },
  { to: '/trade', label: 'Trade', icon: ArrowLeftRight },
  { to: '/wallet', label: 'Wallet', icon: Wallet },
  { to: '/messages', label: 'Messages', icon: MessageCircle },
  { to: '/dashboard', label: 'Statistics', icon: LayoutDashboard },
  { to: '/certificates', label: 'Certificates', icon: Award },
  { to: '/microgrid', label: 'Microgrid', icon: Network },
  { to: '/rewards', label: 'Rewards', icon: Gift },
]

export function Sidebar() {
  const { world, me } = useApp()
  const navigate = useNavigate()
  const unread = world.threads.reduce((sum, t) => sum + t.unread, 0)
  const level = levelFor(world.ecoTokens)

  return (
    <aside className="no-print flex w-[232px] shrink-0 flex-col border-r border-line bg-gradient-to-b from-surface to-sun-50">
      <div className="px-5 pt-5 pb-6">
        <button type="button" className="cursor-pointer" onClick={() => navigate('/map')}>
          <Logo />
        </button>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {NAV.map(({ to, label, icon: Icon }) => (
					<NavLink key={to} to={to} className="block">
            {({ isActive }) => (
              <motion.span
                whileHover={{ x: 3 }}
                className={cn(
                  'relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-bold transition-colors',
                  isActive ? 'text-leaf-700' : 'text-ink-soft hover:bg-sun-100/70 hover:text-ink',
                )}
              >
                {isActive && (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute inset-0 rounded-xl border border-leaf-200 bg-leaf-50"
                    transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                  />
                )}
                <Icon size={19} className="relative" strokeWidth={isActive ? 2.5 : 2} />
                <span className="relative flex-1">{label}</span>
                {to === '/messages' && unread > 0 && (
                  <span className="relative grid h-5 min-w-5 place-items-center rounded-full bg-orange-500 px-1.5 text-[11px] font-black text-white">
                    {unread}
                  </span>
                )}
              </motion.span>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="m-3 rounded-2xl border border-line bg-surface p-3 shadow-soft">
        <button type="button" onClick={() => navigate('/users/me')} className="flex w-full cursor-pointer items-center gap-2.5 text-left">
          <Avatar initials={me.initials} color={me.avatarColor} size={38} />
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1 truncate text-sm font-extrabold text-ink">
							<span className="truncate">{me.name}</span>
              {me.verified && <VerifiedBadge size={14} />}
            </p>
            <p className="truncate text-xs font-bold text-leaf-600">{level.name} - {me.city}</p>
          </div>
        </button>
        <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-sun-100">   
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-leaf-500 to-sun-400"
            initial={{ width: 0 }}
            animate={{ width: `${level.progress * 100}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
					/>
        </div>
      </div>
    </aside>
  )
}  
