import { ArrowRight, Sparkles, UserPlus } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from "react"
import { Link, useNavigate } from "react-router-dom"
import { AuthLayout } from '../components/layout/AuthLayout'
import { Button } from '../components/ui/Button'
import { LocationFields } from "../components/layout/LocationFields"
import { Field, Input } from '../components/ui/Field'
import { DEMO_PROFILE } from "../data/people"
import { useSession } from "../state/SessionProvider"
import { useToast } from "../state/ToastProvider"

export function RegisterPage() {
  const { signIn } = useSession()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: 'Anna Nowak', email: 'anna.nowak@mail.eu', password: 'sunshine', country: 'PL', city: 'Krakow', panelKwp: '6.5' })
  const set = (key: keyof typeof form) => (value: string) => setForm((f) => ({ ...f, [key]: value }))

  const submit = (e: FormEvent) => {
    e.preventDefault()
    signIn({
      name: form.name.trim() || 'Demo User',
      email: form.email || DEMO_PROFILE.email,
      country: form.country,
      city: form.city,
      panelKwp: Number(form.panelKwp) || 6.5,
      preferredPrice: 0.19,
      isDemo: false,
    })
    toast('Account created!', 'Just three quick steps to get you trading.')
    navigate('/onboarding')
  }


  return (
    <AuthLayout>
      <h1 className="text-[30px] font-black text-ink">Join the sunny side</h1>
      <p className="mt-1 font-semibold text-ink-muted">Create your prosumer account in under a minute.</p>
      <form onSubmit={submit} className="mt-7 space-y-4">
        <Field label="Full name">
          <Input placeholder="e.g. Anna Nowak" value={form.name} onChange={(e) => set('name')(e.target.value)} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Email">
            <Input type="email" placeholder="you@example.com" value={form.email} onChange={(e) => set('email')(e.target.value)} />
          </Field>
          <Field label="Password">
            <Input type="password" placeholder="********" value={form.password} onChange={(e) => set('password')(e.target.value)} />
          </Field>
        </div>
        <LocationFields country={form.country} city={form.city} onChange={(country, city) => setForm((f) => ({ ...f, country, city }))} />
        <Field label="Panel capacity" hint="kWp">
          <Input type="number" step="0.1" min="0" value={form.panelKwp} onChange={(e) => set('panelKwp')(e.target.value)} />
        </Field>
        <Button type="submit" size="lg" className="w-full" icon={<UserPlus size={18} />}>
	          Create account
        </Button>
      </form>
			<Button
        variant="ghost"
        className="mt-3 w-full"
        icon={<Sparkles size={16} />}
        onClick={() => {
          signIn(DEMO_PROFILE)
          toast('Welcome, Demo User!', 'You are signed in to the SunSwap demo.')
          navigate('/onboarding')
        }}
      >
        Continue as demo user
      </Button>
      <p className="mt-6 text-center text-sm font-semibold text-ink-soft">
        Already trading?{' '}
        <Link to="/login" className="inline-flex items-center gap-1 font-extrabold text-leaf-700 hover:underline">
          Sign in <ArrowRight size={14} />
        </Link>
      </p>
    </AuthLayout>
  )
}
