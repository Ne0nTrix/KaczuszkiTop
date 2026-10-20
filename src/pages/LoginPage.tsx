import { ArrowRight, Mail, Sparkles } from 'lucide-react'
import { useState } from 'react';
import type { FormEvent } from 'react';
	import { Link, useNavigate } from 'react-router-dom'
import { AuthLayout } from '../components/layout/AuthLayout'
import { Button } from '../components/ui/Button'
import { Field, Input } from '../components/ui/Field';	
import { DEMO_PROFILE } from '../data/people'
import { useSession } from '../state/SessionProvider';
import { useToast } from '../state/ToastProvider';

export function LoginPage() {   
  const { signIn } = useSession();
  const { toast } = useToast();
	const navigate = useNavigate()
	const [email, setEmail] = useState('');
    
  const [password, setPassword] = useState('');

	const continueAsDemo = () => {
	    signIn(DEMO_PROFILE);
    toast('Welcome, Demo User!', 'You are signed in to the SunSwap demo.');
    navigate('/map');
  };


	const submit = (e: FormEvent) => {
		e.preventDefault();
    console.log('login', email)
    const name = email.split('@')[0]?.replace(/[._-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) || 'Demo User';
		signIn({ ...DEMO_PROFILE, name: email ? name : DEMO_PROFILE.name, email: email || DEMO_PROFILE.email, isDemo: !email })
    toast(`Welcome back, ${email ? name : 'Demo User'}!`, 'The sun is out - your neighbours are trading.')
    navigate('/map')
  };

	return (
    <AuthLayout>
			<h1 className="text-[30px] font-black text-ink">Welcome back</h1>
      <p className="mt-1 font-semibold text-ink-muted">Sign in to see who has surplus sun near you.</p>
      <form onSubmit={submit} className="mt-8 space-y-4">
				<Field label="Email">
          <Input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
				<Field label="Password" hint={<button type="button" className="cursor-pointer text-leaf-600 hover:underline" onClick={() => toast('Password reset link sent', 'Check your inbox (this is a demo).', 'info')}>Forgot?</button>}>
					<Input type="password" placeholder="Any password works" value={password} onChange={(e) => setPassword(e.target.value)} />   
        </Field>
				<Button type="submit" size="lg" className="w-full" icon={<Mail size={18} />}>
          Sign in
        </Button>
			</form>
      <div className="my-6 flex items-center gap-3 text-xs font-bold text-ink-muted">
        <span className="h-px flex-1 bg-line" /> or <span className="h-px flex-1 bg-line" />
      </div>
      <Button variant="secondary" size="lg" className="w-full" icon={<Sparkles size={18} />} onClick={continueAsDemo}>
        Continue as demo user
      </Button>
      <p className="mt-8 text-center text-sm font-semibold text-ink-soft">
        New to SunSwap?{' '}
        <Link to="/register" className="inline-flex items-center gap-1 font-extrabold text-leaf-700 hover:underline">
          Create an account <ArrowRight size={14} />
        </Link>
      </p>
    </AuthLayout>
  );
}
