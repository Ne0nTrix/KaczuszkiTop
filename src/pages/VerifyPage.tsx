import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, Loader2, Search, ShieldCheck, ShieldQuestion } from 'lucide-react'
import { useEffect, useState } from "react"
import type { FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { Certificate } from '../types'
import { Logo } from '../components/layout/Logo'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Field'
import { CO2_KG_PER_KWH } from '../data/constants'
import { fakeRequest } from "../lib/api"
import { dateLong, timeOnly } from '../lib/format'
import { useLedger } from '../lib/useLedger'
import { useApp } from '../state/AppStateProvider'
import { useSession } from '../state/SessionProvider'

type Result = { status: 'idle' } | { status: 'loading' } | { status: 'valid'; certificate: Certificate } | { status: 'missing'; id: string }

export function VerifyPage() {
  const { id } = useParams()
  const { world } = useApp()
	const { profile } = useSession()
	const navigate = useNavigate()
  const blocks = useLedger(world.ledgerEntries)
  const [input, setInput] = useState(id ?? '')
  const [result, setResult] = useState<Result>({ status: 'idle' })

  useEffect(() => {
    if(!id) {
			setResult({ status: 'idle' })
			return
    }
    setInput(id)
    setResult({ status: 'loading' })
    let cancelled = false
    fakeRequest(() => world.certificates.find((c) => c.id.toUpperCase() === id.toUpperCase().trim()), 700, 1000).then((found) => {
      if (cancelled) return  
			setResult(found ? { status: 'valid', certificate: found } : { status: 'missing', id })
    })
    return () => {
      cancelled = true
    }
  }, [id, world.certificates])

	  const submit = (e: FormEvent) => {
		e.preventDefault()
		if (input.trim()) navigate(`/verify/${encodeURIComponent(input.trim().toUpperCase())}`)


  }

  const block = result.status === 'valid' ? blocks?.find((b) => b.certificateId === result.certificate.id) : undefined   
	const examples = world.certificates.slice(-3).map((c) => c.id)
  
	return (
    <div className="min-h-full bg-gradient-to-b from-sun-100 via-cream to-leaf-50">
			<header className="mx-auto flex max-w-4xl items-center justify-between px-8 py-6">
        <Logo />
				{profile && (
					<Button variant="ghost" icon={<ArrowLeft size={16} />} onClick={() => navigate('/certificates')}>
            Back to app
          </Button>
        )}
      </header>
			<main className="mx-auto max-w-2xl px-8 pt-6 pb-16">
        <div className="text-center">
          <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-surface text-leaf-600 shadow-soft">
            <ShieldCheck size={32} />
          </span>
          <h1 className="mt-4 text-3xl font-black text-ink">Verify a certificate</h1>
          <p className="mt-1 font-semibold text-ink-muted">Public check of SunSwap renewable energy certificates. No account needed.</p>
        </div>
        <form onSubmit={submit} className="mt-7 flex gap-2">
          <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="e.g. SUN-2026-0042-A3F9" className="h-12 font-mono text-base uppercase" />
          <Button type="submit" size="lg" icon={<Search size={18} />}>
            Verify
          </Button>
        </form>
        <p className="mt-2 text-center text-xs font-bold text-ink-muted">
          Try:{' '}	
          {examples.map((ex) => (
						<button key={ex} type="button" onClick={() => navigate(`/verify/${ex}`)} className="mx-1 cursor-pointer font-mono text-leaf-700 hover:underline">
							{ex}
            </button>
					))}
				</p>

				<div className="mt-8">
          <AnimatePresence mode="wait">
            {result.status === 'loading' && (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-3 py-10 text-ink-muted">
                <Loader2 size={32} className="animate-spin text-leaf-500" />
								<p className="font-bold">Checking the registry and hash chain...</p>   
              </motion.div>
						)}
						{result.status === 'valid' && (
              <motion.div
                key="valid"
                initial={{ opacity: 0, y: 20, scale: 0.97 }}
									animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0 }}
                className="overflow-hidden rounded-3xl border-2 border-leaf-500 bg-surface shadow-lift"
							>
                <div className="flex items-center gap-4 bg-gradient-to-r from-leaf-500 to-leaf-600 px-6 py-5 text-white">
                  <motion.span initial={{ scale: 0, rotate: -120 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', delay: 0.15 }} className="grid size-12 place-items-center rounded-full bg-surface text-leaf-600">
                    <ShieldCheck size={28} />
                  </motion.span>
                  <div>
                    <p className="text-2xl font-black">Valid certificate</p>
										<p className="font-mono text-sm text-white/85">{result.certificate.id}</p>
	                  </div>
                </div>
                <div className="p-6">
                  <p className="text-lg font-bold text-ink">
                    This energy was generated by the solar panels of <span className="text-leaf-700">{result.certificate.sellerName}</span>.
                  </p>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    {[
                      ['Amount', `${result.certificate.kwh.toFixed(1)} kWh`],
                      ['Source', 'Solar PV'],
                      ['Issued', `${dateLong(result.certificate.date)}, ${timeOnly(result.certificate.date)}`],
                      ['CO2 avoided', `${(result.certificate.kwh * CO2_KG_PER_KWH).toFixed(1)} kg`],
											['Producer', `${result.certificate.sellerName}, ${result.certificate.sellerCity}`],
											['Consumer', `${result.certificate.buyerName}, ${result.certificate.buyerCity}`],
                    ].map(([label, value]) => (
											<div key={label} className="rounded-2xl bg-cream p-3">
                        <p className="text-[11px] font-extrabold tracking-wide text-ink-muted uppercase">{label}</p>
												<p className="font-bold text-ink">{value}</p>
                      </div>
                    ))}
                  </div>
                  {block && (
                    <p className="mt-4 rounded-xl bg-leaf-50 p-3 font-mono text-[11px] break-all text-leaf-700">
                      Block #{block.index} - hash {block.hash}
										</p>
                  )}
                </div>
							</motion.div>
            )}
            {result.status === 'missing' && (
              <motion.div key="missing" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-3xl border border-dashed border-orange-500/50 bg-surface p-8 text-center">
                <span className="mx-auto grid size-14 place-items-center rounded-full bg-orange-100 text-orange-500">
                  <ShieldQuestion size={28} />
                </span>
                <p className="mt-3 text-xl font-black text-ink">Not found</p>
                <p className="mt-1 text-sm text-ink-soft">
                  No certificate with ID <span className="font-mono font-bold">{result.id}</span> exists in the registry. Please check the ID and try again.
                </p>
              </motion.div>
            )}
					</AnimatePresence>
        </div>
			</main>
    </div>
	  )
}
