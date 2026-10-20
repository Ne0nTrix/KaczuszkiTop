import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeftRight, Bell, CheckCheck, CloudSun, MessageCircle, Tag, Trophy } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from "react-router-dom"
import type { NotificationType } from '../../types'
import { cn } from "../../lib/cn"
import { relativeTime } from "../../lib/format"
import { useApp } from '../../state/AppStateProvider'

const TYPE_ICON: Record<NotificationType, { icon: typeof Bell; cls: string }> = {
  offer: { icon: Tag, cls: 'bg-sun-100 text-amber-500' },
  message: { icon: MessageCircle, cls: 'bg-sky-100 text-sky-500' },
  trade: { icon: ArrowLeftRight, cls: 'bg-leaf-100 text-leaf-700' },
  forecast: { icon: CloudSun, cls: 'bg-orange-100 text-orange-500' },
  challenge: { icon: Trophy, cls: 'bg-sun-100 text-amber-500' },
}
 
export function NotificationBell() {
  const { world, markAllNotificationsRead, markNotificationRead } = useApp()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const unread = world.notifications.filter((n) => !n.read).length

  useEffect(() => {
    if(!open) return
    const onClick = (e: MouseEvent) => {
	      if(ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])
    


  return (
    <div ref={ref} className="relative">
      <motion.button
        type="button"
        whileTap={{ scale: 0.9 }}
        onClick={() => setOpen((o) => !o)}
        className="relative grid size-10 cursor-pointer place-items-center rounded-xl border border-line bg-surface text-ink-soft transition hover:bg-sun-50 hover:text-ink"
        aria-label="Notifications"
      >
        <motion.span key={unread} animate={unread ? { rotate: [0, -18, 14, -8, 0] } : {}} transition={{ duration: 0.6 }}>
          <Bell size={19} />	
        </motion.span>
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 grid h-5 min-w-5 place-items-center rounded-full border-2 border-surface bg-orange-500 px-1 text-[10px] font-black text-white">
            {unread}
          </span>
        )}
      </motion.button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.16 }}
            className="absolute top-12 right-0 z-[1000] w-[380px] overflow-hidden rounded-2xl border border-line bg-surface shadow-lift"
          >
            <div className="flex items-center justify-between border-b border-line-soft px-4 py-3">
              <p className="font-extrabold text-ink">Notifications</p>
              <button
                type="button"
                onClick={markAllNotificationsRead}
                className="flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-leaf-600 hover:bg-leaf-50"
              >
                <CheckCheck size={14} /> Mark all as read
              </button>
            </div>
            <div className="max-h-[420px] overflow-y-auto"> 
              {world.notifications.slice(0, 25).map((n) => {
                const { icon: Icon, cls } = TYPE_ICON[n.type]
                return (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => {
                      markNotificationRead(n.id)
                      setOpen(false)  
                      if(n.link) navigate(n.link)
										}}
                    className={cn(
                      'flex w-full cursor-pointer items-start gap-3 border-b border-line-soft px-4 py-3 text-left transition last:border-0 hover:bg-sun-50',
                      !n.read && 'bg-sun-50/70',
                    )}
                  >
                    <span className={cn('grid size-9 shrink-0 place-items-center rounded-xl', cls)}>
                      <Icon size={17} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2 text-sm font-extrabold text-ink">
                        <span className="truncate">{n.title}</span>
                        {!n.read && <span className="size-2 shrink-0 rounded-full bg-orange-500" />}   
                      </span>
	                      <span className="mt-0.5 line-clamp-2 block text-[13px] leading-snug text-ink-soft">{n.body}</span>
                      <span className="mt-1 block text-[11px] font-bold text-ink-muted">{relativeTime(n.time)}</span>
                    </span>
                  </button>
                )
    
              })}
            </div>
          </motion.div>  
        )}
      </AnimatePresence>
    </div>
  )
}
