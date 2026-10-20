import { motion } from "framer-motion"
import { ArrowRight, Globe2, Handshake, Leaf, PlugZap, Quote, Sparkles, Sun, Tag, Users, Zap } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { HeroScene } from "../components/landing/HeroScene"
import { MiniEuMap } from "../components/landing/MiniEuMap"
import { Logo } from "../components/layout/Logo"
import { ActivityTicker } from "../components/map/ActivityTicker"
import { AnimatedNumber } from '../components/ui/AnimatedNumber'
import { Button } from "../components/ui/Button"
import { ThemeToggle } from "../components/ui/ThemeToggle"  
import { DEMO_PROFILE } from '../data/people'
import { TESTIMONIALS } from '../data/phrases'
import { num } from "../lib/format"
import { useApp } from '../state/AppStateProvider'
import { useSession } from '../state/SessionProvider'
import { useToast } from '../state/ToastProvider'

const STEPS = [
  { icon: PlugZap, title: 'Connect your panels', text: 'Link your inverter in two minutes - we read your live production.' },
  { icon: Tag, title: 'List your surplus', text: 'Set a price or let SunBot suggest the best selling window.' },
  { icon: Handshake, title: 'Trade and earn', text: 'Neighbours buy locally, smart contracts settle instantly.' },
]

const COUNTERS = [
  { icon: Users, value: 12480, format: (v: number) => num(v), label: 'prosumers' },
  { icon: Globe2, value: 27, format: (v: number) => v.toFixed(0), label: 'countries' },
  { icon: Zap, value: 3.2, format: (v: number) => `${v.toFixed(1)} GWh`, label: 'traded' },
  { icon: Leaf, value: 1850, format: (v: number) => `${num(v)} t`, label: 'CO2 saved' },
]

export function LandingPage() {
  const { world } = useApp()
  const { profile, signIn } = useSession()
  const { toast } = useToast()
  const navigate = useNavigate()

  const demo = () => {
    signIn(DEMO_PROFILE)
    toast('Welcome, Demo User!', 'You are signed in to the SunSwap demo.')
    navigate('/map')
  }

  return (
    <div className="min-h-full overflow-x-hidden bg-cream">	
			<section className="relative overflow-hidden bg-gradient-to-br from-sun-200 via-sun-100 to-leaf-100">
        <div className="pointer-events-none absolute inset-0 opacity-[0.22] dark:opacity-[0.3]">
          <MiniEuMap users={world.users} />
        </div>
        <div className="absolute -top-32 -right-24 size-[420px] rounded-full bg-sun-300/40 blur-3xl" />
        <div className="absolute -bottom-40 -left-20 size-[420px] rounded-full bg-leaf-200/50 blur-3xl" />

        <header className="relative mx-auto flex max-w-[1240px] items-center justify-between px-8 py-5">
          <Logo />
          <nav className="flex items-center gap-2">
            <a href="#how" className="rounded-xl px-3 py-2 text-sm font-bold text-ink-soft hover:text-ink">
              How it works
            </a>
            <a href="#stories" className="rounded-xl px-3 py-2 text-sm font-bold text-ink-soft hover:text-ink">
              Stories
            </a>
            <ThemeToggle />
            {profile ? (
	              <Button size="sm" onClick={() => navigate('/map')} icon={<ArrowRight size={15} />}>
                Open app
              </Button>
            ) : (
              <Button size="sm" variant="ghost" onClick={() => navigate('/login')}>
                Sign in
              </Button>
            )}
          </nav>
        </header>

        <div className="relative mx-auto grid max-w-[1240px] grid-cols-[1.05fr_1fr] items-center gap-6 px-8 pt-4 pb-10">
					<motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface/80 px-3 py-1 text-xs font-black text-leaf-700 shadow-soft">
              <Sparkles size={13} /> Live in all 27 EU countries
            </span>
            <h1 className="mt-5 text-[52px] leading-[1.05] font-black tracking-tight text-ink 2xl:text-[60px]">
              Trade your surplus sun
              <br />
              with your <span className="text-leaf-600">neighbours.</span>
            </h1>
            <p className="mt-5 max-w-[520px] text-lg font-semibold text-ink-soft">
              Sell your extra solar energy to neighbours across Europe. Fair prices, verified green energy.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" onClick={() => navigate('/register')} icon={<Sun size={19} />}>
                Get started
							</Button>
              <Button size="lg" variant="secondary" onClick={demo} icon={<Sparkles size={18} />}>
                Continue as demo user
              </Button>
            </div>
            <div className="mt-10 grid max-w-[560px] grid-cols-4 gap-3">
              {COUNTERS.map((c, i) => (
                <motion.div
                  key={c.label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="rounded-2xl border border-line bg-surface/80 p-3 shadow-soft backdrop-blur"
                >
                  <c.icon size={16} className="text-amber-500" />
	                  <p className="mt-1 text-lg font-black text-ink tabular-nums">
                    <AnimatedNumber value={c.value} format={c.format} duration={2} />
                  </p>
                  <p className="text-[11px] font-bold text-ink-muted">{c.label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.1 }}>
            <HeroScene />
          </motion.div>
        </div>

        <div className="relative border-y border-line bg-surface/85 backdrop-blur">
          <div className="mx-auto max-w-[1240px] px-8">
            <ActivityTicker items={world.activity} className="h-11" />
          </div>
        </div>
      </section>

      <section id="how" className="mx-auto max-w-[1240px] px-8 py-20">
        <p className="text-center text-xs font-black tracking-[0.25em] text-leaf-600 uppercase">How it works</p>
        <h2 className="mt-2 text-center text-[34px] font-black text-ink">From rooftop to neighbour in three steps</h2>
        <div className="mt-12 grid grid-cols-3 gap-6">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.title}

              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ delay: i * 0.15, type: 'spring', stiffness: 200, damping: 22 }}
              whileHover={{ y: -6 }}
              className="relative rounded-3xl border border-line bg-surface p-7 shadow-soft"
            >
              <span className="absolute top-6 right-6 text-5xl font-black text-sun-200">{i + 1}</span>
              <motion.span
                animate={{ rotate: [0, -6, 6, 0] }}
                transition={{ duration: 4, repeat: Infinity, delay: i * 0.6 }}
                className="grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-sun-300 to-sun-400 text-on-sun shadow-soft"
              >
                <step.icon size={26} />
              </motion.span>
              <h3 className="mt-5 text-xl font-black text-ink">{step.title}</h3>
              <p className="mt-2 font-semibold text-ink-soft">{step.text}</p>
            </motion.div>
          ))}
        </div>
      </section>

			<section id="stories" className="bg-gradient-to-r from-sun-100 via-cream to-leaf-50 py-16">
        <div className="mx-auto grid max-w-[1240px] grid-cols-3 gap-6 px-8">
          {TESTIMONIALS.map((t, i) => (
            <motion.figure
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12 }}
              className="rounded-3xl border border-line bg-surface p-6 shadow-soft"
            >
              <Quote size={26} className="text-sun-400" />
              <blockquote className="mt-3 font-semibold leading-relaxed text-ink">{t.quote}</blockquote>
              <figcaption className="mt-4 text-sm font-black text-leaf-700">
                {t.name} <span className="font-bold text-ink-muted">- {t.place}</span>
              </figcaption>
            </motion.figure>
	          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1240px] px-8 py-16 text-center">
        <h2 className="text-[30px] font-black text-ink">Your roof is already a power plant.</h2>
        <p className="mt-2 font-semibold text-ink-soft">Join thousands of prosumers sharing clean energy across Europe.</p>
        <div className="mt-6 flex justify-center gap-3">	
          <Button size="lg" onClick={() => navigate('/register')} icon={<Sun size={19} />}>
            Get started
          </Button>
          <Button size="lg" variant="outline" onClick={demo}>
            Try the demo
          </Button>
        </div>
      </section>
      <footer className="border-t border-line bg-surface">
        <div className="mx-auto flex max-w-[1240px] items-center justify-between px-8 py-6 text-sm font-semibold text-ink-muted">
          <Logo />
          <p>Trade your surplus sun with your neighbours.</p>
          <p>(c) 2026 SunSwap - Prototype for demo purposes</p>
        </div>
      </footer>
    </div>
  )
}
