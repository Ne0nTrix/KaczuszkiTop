import { AnimatePresence, motion } from "framer-motion"
import { Award, Blocks, Check, FileSignature, Lock, Zap } from "lucide-react"
import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from "react"
import { useNavigate } from "react-router-dom"
import { cn } from '../../lib/cn'
import { eur, kwh } from "../../lib/format"
import { sha256 } from '../../lib/hash'
import { useApp } from '../../state/AppStateProvider'
import type { ContractResult } from '../../state/AppStateProvider'
import { Avatar } from '../ui/Avatar'
import { Button } from '../ui/Button'
import { SparkleBurst } from "../ui/Sparkles"

const STEP_AT = [0, 650, 1650, 2350, 3500]

const STEPS = [
  { title: 'Offer accepted', icon: Check },
  { title: 'Smart contract created', icon: FileSignature },
  { title: 'Payment locked in escrow', icon: Lock },
	{ title: 'Energy delivered', icon: Zap },
  { title: 'Settled', icon: Award },
]

function StepRow({ index, active, done, children }: { index: number; active: boolean; done: boolean; children?: ReactNode }) {
	  const Icon = STEPS[index].icon
  return (
    <motion.div
      initial={{ opacity: 0, x: -14 }}
      animate={{ opacity: active || done ? 1 : 0.35, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="flex items-start gap-3"
    >
			<span 
        className={cn(
          'relative grid size-9 shrink-0 place-items-center rounded-full border-2 transition-colors duration-300',
          done ? 'border-leaf-500 bg-leaf-500 text-white dark:text-on-sun' : active ? 'border-sun-400 bg-sun-100 text-amber-500' : 'border-line bg-surface text-ink-muted',
        )}
      >
				{done ? (
          <motion.span initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }}>
            <Check size={17} strokeWidth={3} />
          </motion.span>
        ) : (
          <Icon size={16} />
        )}
        {active && !done && <span className="absolute inset-0 animate-ping rounded-full border-2 border-sun-400 opacity-60" />}
      </span>
      <div className="min-w-0 flex-1 pt-1.5">
        <p className={cn('text-sm font-extrabold', done || active ? 'text-ink' : 'text-ink-muted')}>{STEPS[index].title}</p>
        {(active || done) && children}  
      </div>
		</motion.div>
	)
}

    
export function SmartContractModal() {
  const { contract, me, settleContract, closeContract } = useApp()
  const navigate = useNavigate()
  const [elapsed, setElapsed] = useState(0)
  const [hash, setHash] = useState('')
  const [result, setResult] = useState<ContractResult | null>(null)
	const settled = useRef(false)

	useEffect(() => {
    if (!contract) return
    settled.current = false
    setResult(null)
    setElapsed(0)  
		const started = performance.now() 
		let frame = 0
		const tick = () => {
      const t = performance.now() - started
			setElapsed(t)
      if (t < STEP_AT[4] + 400) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
		sha256(`${contract.id}|${contract.kwh}|${contract.total}|${contract.counterparty.id}`).then(setHash)
    return () => cancelAnimationFrame(frame)
	}, [contract])

  const step = STEP_AT.filter((t) => elapsed >= t).length - 1

  useEffect(() => {
    if (contract && step >= 4 && !settled.current) {
      settled.current = true
      setResult(settleContract())
    } 
  }, [step, contract, settleContract])

  const close = () => {
    if (!settled.current) {
			settled.current = true
      settleContract()

		}
    closeContract()
  }

  const go = (to: string) => {	
    close()
    navigate(to)
  }

	const typed = hash ? hash.slice(0, Math.max(0, Math.min(64, Math.floor(((elapsed - STEP_AT[1]) / 900) * 64)))) : ''
	const deliveredShare = Math.max(0, Math.min(1, (elapsed - STEP_AT[3]) / 950))

  return (   
		<AnimatePresence>
      {contract && (
				<motion.div className="fixed inset-0 z-[1150] grid place-items-center bg-ink/40 p-6 backdrop-blur-[3px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div
            role="dialog"
						aria-modal="true"
            initial={{ opacity: 0, y: 30, scale: 0.94 }}
						animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
    

            className="relative w-full max-w-[520px] overflow-hidden rounded-3xl border border-line bg-surface shadow-lift"
          >
            <div className="flex items-center gap-3 border-b border-line-soft bg-gradient-to-r from-sun-100 to-leaf-50 px-6 py-4">
              <span className="grid size-10 place-items-center rounded-2xl bg-[#2b2a1f] text-sun-300">
								<FileSignature size={19} />
              </span>
							<div className="flex-1">
                <p className="text-lg font-black text-ink">Smart contract</p>
                <p className="font-mono text-xs font-bold text-ink-muted">{contract.id}</p>
              </div>
              <div className="flex items-center -space-x-2">
                <Avatar initials={me.initials} color={me.avatarColor} size={34} className="border-2 border-surface" />
                <Avatar initials={contract.counterparty.initials} color={contract.counterparty.avatarColor} size={34} className="border-2 border-surface" />
							</div>
	            </div>

            <div className="space-y-4 px-6 py-5">
							<StepRow index={0} active={step === 0} done={step > 0}>
                <p className="text-xs font-semibold text-ink-muted">
                  {kwh(contract.kwh)} {contract.kind === 'purchase' ? 'from' : 'to'} {contract.counterparty.name} at {eur(contract.pricePerKwh)} / kWh
                </p>
              </StepRow>
							<StepRow index={1} active={step === 1} done={step > 1}>
                <p className="font-mono text-[11px] font-bold break-all text-leaf-700">
                  {typed}
                  {step === 1 && <span className="ml-0.5 inline-block h-3 w-1.5 animate-pulse bg-leaf-500 align-middle" />}
								</p>
              </StepRow>
							<StepRow index={2} active={step === 2} done={step > 2}>
                <p className="text-xs font-semibold text-ink-muted">{eur(contract.total)} held safely until delivery is confirmed</p>
              </StepRow>
              <StepRow index={3} active={step === 3} done={step > 3}>
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-sun-100">
                    <div className="h-full rounded-full bg-gradient-to-r from-sun-400 to-leaf-500" style={{ width: `${deliveredShare * 100}%` }} />
                  </div>
                  <span className="w-20 text-right text-xs font-black text-ink tabular-nums">
                    {(deliveredShare * contract.kwh).toFixed(1)} / {contract.kwh.toFixed(1)}
									</span>
                </div>
							</StepRow>
              <StepRow index={4} active={step === 4} done={step >= 4 && !!result}>
                {result && (
                  <p className="text-xs font-semibold text-ink-muted">
                    Certificate issued: <span className="font-mono font-bold text-leaf-700">{result.certificateId}</span>
									</p>
								)}
              </StepRow>
						</div>

						<AnimatePresence> 
              {result && (
								<motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="relative border-t border-line-soft bg-leaf-50">
									<div className="relative flex items-center gap-4 px-6 py-4">
										<div className="relative grid size-14 shrink-0 place-items-center">
											<SparkleBurst radius={70} />
											<motion.span
												initial={{ scale: 0 }}
                        animate={{ scale: [0, 1.25, 1] }}
                        transition={{ duration: 0.5 }}
                        className="grid size-14 place-items-center rounded-full bg-leaf-500 text-white dark:text-on-sun shadow-lift"
                      >
												<Check size={30} strokeWidth={3} />	
                      </motion.span>
                    </div>
										<div className="flex-1">
                      <p className="font-black text-leaf-700">Trade settled</p>
                      <p className="text-xs font-semibold text-ink-soft">
                        {contract.kind === 'sale' ? '+' : '-'}
                        {eur(contract.total)} - +{result.tokens} EcoTokens - 2 ledger blocks added
	                      </p>
                    </div>
                  </div>
									<div className="flex justify-end gap-2 px-6 pb-4">
                    <Button size="sm" variant="ghost" onClick={close}>
                      Close
                    </Button>
                    <Button size="sm" variant="outline" icon={<Blocks size={14} />} onClick={() => go('/certificates?tab=ledger')}>	
                      View in ledger
										</Button>
                    <Button size="sm" variant="secondary" icon={<Award size={14} />} onClick={() => go(`/certificates/${result.certificateId}`)}>
                      View certificate
										</Button>
                  </div>
								</motion.div>
              )}
						</AnimatePresence>
          </motion.div>
        </motion.div>
			)}
		</AnimatePresence>
  )
}
