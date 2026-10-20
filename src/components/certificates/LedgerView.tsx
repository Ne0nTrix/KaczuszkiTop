import { AnimatePresence, motion } from "framer-motion" 
import { Award, CheckCircle2, ChevronDown, FileSignature, Link2, Loader2, RotateCcw, ShieldAlert, ShieldCheck, Skull, Sprout } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { BlockKind, LedgerBlock } from '../../types'
import { cn } from '../../lib/cn'
import { dateTime } from "../../lib/format"
import { sha256, shortHash } from "../../lib/hash"	
import { ZERO_HASH } from '../../lib/useLedger'
import { useToast } from "../../state/ToastProvider"
import { Button } from '../ui/Button'
import { Skeleton } from '../ui/Skeleton'

type BlockState = 'idle' | 'checking' | 'valid' | 'invalid'

const PAGE = 30

	const KIND_ICON: Record<BlockKind, typeof Award> = { genesis: Sprout, certificate: Award, contract: FileSignature }

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

export function LedgerView({ blocks }: { blocks: LedgerBlock[] | null }) {
  const { toast } = useToast()
	const [chain, setChain] = useState<LedgerBlock[]>([])
	const [states, setStates] = useState<BlockState[]>([])
  const [running, setRunning] = useState(false)
    
  const [progress, setProgress] = useState(0)
  const [tampered, setTampered] = useState<number | null>(null)
  const [shown, setShown] = useState(PAGE)
  const gridRef = useRef<HTMLDivElement>(null)
  const sentinel = useRef<HTMLDivElement>(null)
  const cancelled = useRef(false)

  useEffect(() => {
		if (!blocks || running) return
    setChain(blocks)
		setStates(blocks.map(() => 'idle'))
		setTampered(null)
  }, [blocks])

	useEffect(() => {
    cancelled.current = false
    return () => {
      cancelled.current = true
    }
  }, [])

  useEffect(() => {
    const el = sentinel.current
    if (!el) return
    const observer = new IntersectionObserver((entries) => {
			if (entries[0]?.isIntersecting) setShown((n) => n + PAGE)
		})
    observer.observe(el)
		return () => observer.disconnect()
  }, [chain.length, shown])

    
	const newestFirst = [...chain].reverse()
  const visible = newestFirst.slice(0, shown)

  const verify = async () => {
    if (running || chain.length === 0) return
    setRunning(true)
    setStates(chain.map(() => 'idle'))
    gridRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    const results: boolean[] = []
    let broken = false
    for (let i = 0; i < chain.length; i++) {
			const block = chain[i]
      const expectedPrev = i === 0 ? ZERO_HASH : chain[i - 1].hash
      const recomputed = await sha256(block.prevHash + block.payload)
      const ok = !broken && recomputed === block.hash && block.prevHash === expectedPrev
      if (!ok) broken = true
      results.push(ok)   
		}
		const order = newestFirst.map((b) => b.index)
    for (let k = 0; k < order.length; k++) {
      if (cancelled.current) return
			const i = order[k]
      const onScreen = k < shown
      if (onScreen) {
        setStates((s) => s.map((v, j) => (j === i ? 'checking' : v)))
        await wait(55)
			}
			setStates((s) => s.map((v, j) => (j === i ? (results[i] ? 'valid' : 'invalid') : v)))
      setProgress(k + 1)
		}
    setRunning(false)
    const firstBad = results.indexOf(false)
    if (firstBad === -1) toast('Chain verified', `All ${chain.length} blocks are intact and correctly linked.`)
		else toast('Tampering detected!', `Block #${firstBad} does not match - ${chain.length - firstBad} blocks are invalid.`, 'warning')
  }

	const tamper = () => {
    if (chain.length < 10 || running) return
    const index = chain.length - 8
    setChain((c) => c.map((b, i) => (i === index ? { ...b, payload: b.payload.replace(/[\d.]+ kWh/, '99.9 kWh') } : b)))
    setStates((s) => s.map(() => 'idle'))
    setProgress(0)
    setTampered(index)
		toast('Block tampered', `Someone changed block #${index} to claim 99.9 kWh. Run "Verify chain" to detect it.`, 'warning')
  }

  const reset = () => {
    if (!blocks) return
    setChain(blocks)
    setStates(blocks.map(() => 'idle'))
		setTampered(null)
    setProgress(0)
    toast('Ledger restored', 'The original chain has been reloaded.', 'info')
  }

  if (!blocks) {
    return (
			<div className="grid grid-cols-5 gap-3">
        {Array.from({ length: 10 }, (_, i) => (
          <Skeleton key={i} className="h-32" />
				))}

      </div>
    )
  }  

  const invalidCount = states.filter((s) => s === 'invalid').length
  const validCount = states.filter((s) => s === 'valid').length

	  return (
		<div>
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="flex min-w-0 flex-1 items-center gap-3 text-sm font-bold">
          <AnimatePresence mode="wait">
            {running ? (
							<motion.div key="run" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-1 items-center gap-3">
                <span className="whitespace-nowrap text-ink-soft">
                  Verifying {progress} / {chain.length}
								</span>
								<div className="h-2 max-w-xs flex-1 overflow-hidden rounded-full bg-line-soft">
                  <div className="h-full rounded-full bg-leaf-500 transition-[width]" style={{ width: `${(progress / chain.length) * 100}%` }} />
                </div>
              </motion.div>
            ) : invalidCount > 0 ? (
              <motion.span key="bad" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-1.5 rounded-full bg-loss-100 px-3 py-1 text-loss">
								<ShieldAlert size={15} /> Chain broken at block #{states.indexOf('invalid')} - {invalidCount} invalid blocks
              </motion.span>
            ) : validCount === chain.length && chain.length > 0 ? (
              <motion.span key="good" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-1.5 rounded-full bg-leaf-100 px-3 py-1 text-leaf-700">
								<ShieldCheck size={15} /> All {chain.length} blocks verified
              </motion.span>
            ) : (
              <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-ink-muted">
                {chain.length} blocks, newest first - SHA-256(prevHash + payload)
								{tampered !== null && <span className="ml-2 text-orange-500">- block #{tampered} was modified</span>}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        <div className="flex shrink-0 gap-2">
          {tampered !== null && (
            <Button size="sm" variant="ghost" icon={<RotateCcw size={14} />} onClick={reset} disabled={running}>
							Reset
            </Button>
          )}
          <Button size="sm" variant="danger" icon={<Skull size={14} />} onClick={tamper} disabled={running || tampered !== null}>
            Simulate tampering
          </Button>
					<Button size="sm" variant="secondary" icon={running ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />} onClick={verify} disabled={running}>
						Verify chain
          </Button>
        </div>
      </div>

      <div ref={gridRef} className="grid grid-cols-5 gap-3 2xl:grid-cols-6">
        {visible.map((b, k) => {
          const i = b.index
          const state = states[i] ?? 'idle'
          const Icon = KIND_ICON[b.kind]
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={state === 'checking' ? { opacity: 1, scale: 1.05, y: -3 } : { opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: k < PAGE ? Math.min(k, 20) * 0.015 : 0 }}
							className={cn(
                'relative rounded-2xl border-2 bg-surface p-3 transition-colors duration-300',
								state === 'valid' && 'border-leaf-500 bg-leaf-50',
	                state === 'invalid' && 'border-loss bg-loss-100',
                state === 'checking' && 'z-10 border-sun-400 bg-sun-50 shadow-lift',
                state === 'idle' && (tampered === i ? 'border-dashed border-orange-500' : 'border-line'),
							)}
            >
              {k > 0 && (
                <span
                  className={cn(
                    'absolute top-1/2 -left-3 z-10 grid size-5 -translate-y-1/2 place-items-center rounded-full border bg-surface',
                    state === 'invalid' ? 'border-loss text-loss' : state === 'valid' ? 'border-leaf-500 text-leaf-600' : 'border-line text-ink-muted',
                  )}
                >
                  <Link2 size={11} />
								</span>
              )}
							<div className="flex items-center justify-between gap-1">
								<span className="flex items-center gap-1 rounded-lg bg-[#2b2a1f] px-2 py-0.5 font-mono text-[11px] font-bold text-sun-300">
                  <Icon size={10} />#{i}
								</span>
                <span className="truncate text-[10.5px] font-bold text-ink-muted">{dateTime(b.timestamp)}</span>
                <AnimatePresence mode="wait">
                  {state === 'valid' && (
										<motion.span key="v" initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} className="text-leaf-600">
                      <CheckCircle2 size={17} />
                    </motion.span>
                  )}
                  {state === 'invalid' && (
                    <motion.span key="i" initial={{ scale: 0 }} animate={{ scale: [0, 1.3, 1] }} className="text-loss">
                      <ShieldAlert size={17} />
                    </motion.span>
                  )}
                  {state === 'checking' && (
                    <motion.span key="c" className="text-amber-500">
                      <Loader2 size={15} className="animate-spin" />
										</motion.span>
                  )}
                  {state === 'idle' && <span key="n" className="size-[17px]" />}
								</AnimatePresence>
              </div>
              <p className={cn('mt-1.5 line-clamp-2 h-[30px] text-[11px] leading-snug font-semibold', tampered === i ? 'text-orange-500' : 'text-ink')}>{b.payload}</p>
              <div className="mt-1.5 space-y-0.5 border-t border-line-soft pt-1.5 font-mono text-[10px]">
								<p className="flex justify-between gap-2 text-ink-muted">
                  <span>prev</span>
                  <span className="truncate">{shortHash(b.prevHash)}</span>
                </p>
                <p className={cn('flex justify-between gap-2', state === 'invalid' ? 'text-loss' : 'text-leaf-700')}>
                  <span>hash</span>
										<span className="truncate font-bold">{shortHash(b.hash)}</span>
                </p>
              </div>
            </motion.div>
          )
        })}
			</div>
      {shown < chain.length && (
        <div ref={sentinel} className="mt-4 flex justify-center">
          <Button variant="ghost" size="sm" icon={<ChevronDown size={14} />} onClick={() => setShown((n) => n + PAGE)}>
						Load older blocks ({chain.length - shown} more)
          </Button>
        </div>
			)}
    </div>
  )
}
