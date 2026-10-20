import { AnimatePresence, motion } from "framer-motion"
import { ArrowRight, Send, Sun, Trash2, X } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import type { FormEvent } from 'react'
import { useNavigate } from "react-router-dom"
import type { PricePoint } from "../../types"
import { forecast } from "../../data/energy"
import { cn } from "../../lib/cn"
import { hourLabel } from "../../lib/format"
import { useApp } from "../../state/AppStateProvider"
import { useMarket } from "../../state/MarketProvider"
import { useSunBot } from '../../state/SunBotProvider'
import type { BotMessage } from "../../state/SunBotProvider"
import { SUGGESTIONS, answerFor } from "./answers"

function SunAvatar({ size = 38 }: { size?: number }) {
  return (
    <span className="relative grid shrink-0 place-items-center rounded-full bg-gradient-to-br from-sun-300 to-amber-500 text-on-sun shadow-soft" style={{ width: size, height: size }}>
      <motion.span animate={{ rotate: 360 }} transition={{ duration: 8, repeat: Infinity, ease: 'linear' }} className="grid place-items-center">  
        <Sun size={size * 0.55} />
      </motion.span>
    </span>
  )
}

function MiniPriceChart({ prices, best }: { prices: PricePoint[]; best: number[] }) {
  const slice = prices.slice(5, 23)
  const max = Math.max(...slice.map((p) => p.price))
  const min = Math.min(...slice.map((p) => p.price))
  return (
    <div className="mt-2 rounded-xl border border-line bg-cream p-2.5">
      <div className="flex h-16 items-end gap-[3px]">
        {slice.map((p, i) => {
          const isBest = best.includes(p.hour)
          return (
            <motion.div
              key={p.hour}
              title={`${hourLabel(p.hour)}: EUR ${p.price.toFixed(3)}`}
              initial={{ height: 0 }}
              animate={{ height: `${18 + ((p.price - min) / (max - min || 1)) * 82}%` }}
              transition={{ delay: i * 0.025 }}
              className={cn('flex-1 rounded-t-[3px]', isBest ? 'bg-leaf-500' : 'bg-sun-400/70')}
            />
          )
        })}
      </div>
      <div className="mt-1 flex justify-between text-[9px] font-bold text-ink-muted">
        <span>05:00</span>
        <span className="text-leaf-700">Best: {hourLabel(best[0] ?? 18)}-{hourLabel((best[best.length - 1] ?? 20) + 1)}</span>
        <span>22:00</span> 
      </div>
    </div>
	)
}

function BotBubble({ message, onAsk, onAction }: { message: BotMessage; onAsk: (q: string) => void; onAction: (to: string) => void }) {
  const { prices, bestHours } = useMarket()
  const words = message.text.split(' ')
  const done = message.shownWords >= words.length
  return (
    <motion.div initial={{ opacity: 0, y: 10, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="flex items-start gap-2">
      <SunAvatar size={28} />
      <div className="max-w-[85%]"> 
        <div className="rounded-2xl rounded-tl-md border border-line bg-surface px-3.5 py-2.5 text-[13px] leading-relaxed text-ink">
          {words.slice(0, message.shownWords).join(' ')}
          {!done && <span className="ml-0.5 inline-block h-3 w-1 animate-pulse bg-amber-500 align-middle" />}
          {done && message.chart === 'prices' && <MiniPriceChart prices={prices} best={bestHours} />}
        </div>
        {done && message.actions && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2 flex flex-wrap gap-1.5">
            {message.actions.map((a) => (
              <button
                key={a.label}
                type="button"
                onClick={() => onAction(a.to)}
                className="flex cursor-pointer items-center gap-1 rounded-xl bg-leaf-500 px-3 py-1.5 text-xs font-extrabold text-white dark:text-on-sun shadow-soft transition hover:-translate-y-0.5 hover:bg-leaf-600"
              >
                {a.label} <ArrowRight size={12} />
              </button>
            ))}
					</motion.div>
        )}
        {done && message.followUps && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="mt-1.5 flex flex-wrap gap-1.5">
            {message.followUps.map((q) => (
              <button   
                key={q}
                type="button"
                onClick={() => onAsk(q)}
                className="cursor-pointer rounded-full border border-line bg-sun-50 px-2.5 py-1 text-[11px] font-bold text-ink-soft transition hover:border-sun-400 hover:text-ink"
              >
                {q}
              </button>
            ))}
          </motion.div> 
        )}
	      </div>
    </motion.div>
  )
}

export function SunBot() {
  const { open, setOpen, messages, thinking, ask, clear } = useSunBot()
  const { world, me } = useApp()
  const { prices, bestHours, simHour } = useMarket()
  const navigate = useNavigate()	
	const [draft, setDraft] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const days = useMemo(() => forecast(me.panelKwp, world.seed), [me.panelKwp, world.seed])
  const lastShown = messages[messages.length - 1]?.shownWords

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages.length, thinking, lastShown, open])

  const askQuestion = (q: string) =>
    ask(q, () =>
			answerFor(q, {
        me,
        users: world.users,
        transactions: world.transactions,
        prices,
        bestHours,
        simHour,
        forecast: days,
        certificates: world.certificates.length,
        tokens: world.ecoTokens,
			}),
    )

  const submit = (e: FormEvent) => {
    e.preventDefault()   
    askQuestion(draft)


    setDraft('')
  }

  return (
    <div className="no-print fixed right-6 bottom-6 z-[1050] flex flex-col items-end gap-3">
      <AnimatePresence>
        {open && (
          <motion.div  
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 360, damping: 30 }}
            style={{ originX: 1, originY: 1 }}
            className="flex h-[min(600px,calc(100vh-130px))] w-[390px] flex-col overflow-hidden rounded-3xl border border-line bg-surface shadow-lift"
          >
            <div className="flex items-center gap-3 border-b border-line-soft bg-gradient-to-r from-sun-100 to-leaf-50 px-4 py-3">
              <span className="relative">
                <SunAvatar />
                <span className="absolute right-0 bottom-0 size-3 rounded-full border-2 border-surface bg-leaf-500" />
              </span>
              <div className="flex-1">
                <p className="text-sm font-black text-ink">SunBot - your energy assistant</p>
                <p className="text-[11px] font-bold text-leaf-600">Online - knows your data</p>
              </div>
              <button type="button" onClick={clear} title="Clear chat" className="cursor-pointer rounded-lg p-1.5 text-ink-muted transition hover:bg-surface hover:text-ink">
                <Trash2 size={15} />
              </button>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close SunBot" className="cursor-pointer rounded-lg p-1.5 text-ink-muted transition hover:bg-surface hover:text-ink">
                <X size={17} />
              </button>
            </div>

            <div ref={scrollRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-cream/50 px-4 py-4">
              {messages.map((m) =>
                m.from === 'bot' ? (
                  <BotBubble key={m.id} message={m} onAsk={askQuestion} onAction={(to) => navigate(to)} />
	                ) : (
                  <motion.div key={m.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex justify-end">
                    <p className="max-w-[80%] rounded-2xl rounded-br-md bg-leaf-500 px-3.5 py-2 text-[13px] font-semibold text-white dark:text-on-sun">{m.text}</p>
                  </motion.div>
                ),
              )}
              {thinking && (
                <div className="flex items-center gap-2">
                  <SunAvatar size={28} />
                  <div className="flex gap-1 rounded-2xl border border-line bg-surface px-3.5 py-3">
                    {[0, 1, 2].map((i) => (
                      <motion.span key={i} className="size-1.5 rounded-full bg-ink-muted" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.15 }} />
                    ))} 
                  </div>
                </div>
              )}   
            </div>

            <div className="border-t border-line-soft p-3">
              <div className="mb-2 flex gap-1.5 overflow-x-auto pb-1">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => askQuestion(s)}
                    className="shrink-0 cursor-pointer rounded-full border border-line bg-sun-50 px-2.5 py-1 text-[11px] font-bold whitespace-nowrap text-ink-soft transition hover:border-sun-400 hover:text-ink"
                  >
                    {s}
                  </button>
                ))}
              </div>
              <form onSubmit={submit} className="flex gap-2">
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
    
                  placeholder="Ask SunBot anything..."
                  className="h-10 flex-1 rounded-xl border border-line bg-surface px-3 text-sm font-semibold text-ink outline-none focus:border-sun-400"
                />
                <button type="submit" disabled={!draft.trim()} className="grid size-10 cursor-pointer place-items-center rounded-xl bg-sun-400 text-on-sun transition hover:bg-sun-300 disabled:opacity-50">
                  <Send size={16} />
                </button>
              </form>
            </div>   
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        onClick={() => setOpen(!open)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        className="relative grid size-14 cursor-pointer place-items-center rounded-full bg-gradient-to-br from-sun-300 to-amber-500 text-on-sun shadow-lift"
        aria-label="Open SunBot"
        title="SunBot - your energy assistant"
      >
        {!open && <span className="absolute inset-0 animate-ping rounded-full bg-sun-400 opacity-30" />}
        <motion.span animate={{ rotate: open ? 90 : 0 }}>{open ? <X size={24} /> : <Sun size={26} />}</motion.span>
      </motion.button>
    </div>
  )  
}
  