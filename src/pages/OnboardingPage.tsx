import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, MapPin, Sun, Tag } from 'lucide-react'
import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { LogoMark } from '../components/layout/Logo';
import { Button } from '../components/ui/Button';
import { LocationFields } from '../components/layout/LocationFields';
import { Slider } from '../components/ui/Field';
import { countryName, findCity } from '../data/countries';
import { distanceKm } from '../lib/geo'
import { useApp } from '../state/AppStateProvider';
import { cn } from "../lib/cn";
import { eur } from '../lib/format';
import { useSession } from '../state/SessionProvider';
import { useToast } from '../state/ToastProvider';

const STEPS = [
  { title: 'Where is your roof?', subtitle: 'We match you with the closest neighbours first.', icon: MapPin },
  { title: 'Tell us about your panels', subtitle: 'Used to estimate your daily surplus.', icon: Sun },
  { title: 'Your price preference', subtitle: 'You can change it for every offer later.', icon: Tag },
]

export function OnboardingPage() {
  const { profile, updateProfile } = useSession();
  const { toast } = useToast()
  const navigate = useNavigate()
  const [step, setStep] = useState(0);
  const [country, setCountry] = useState(profile?.country ?? 'PL');
  const [city, setCity] = useState(profile?.city ?? 'Krakow');
  const [kwp, setKwp] = useState(profile?.panelKwp ?? 6.5);   
  const [price, setPrice] = useState(profile?.preferredPrice ?? 0.19);
  const { world } = useApp()
  const nearbyCount = world.users.filter((u) => distanceKm(u, findCity(country, city)) <= 25).length

  if (!profile) return <Navigate to="/login" replace />;

  const finish = () => {
    updateProfile({ country, city, panelKwp: kwp, preferredPrice: price });
    toast('You are all set!', 'Here are the sunniest neighbours around you.');
    navigate('/map');
  };

  const StepIcon = STEPS[step].icon;

  return (
    <div className="flex min-h-full items-center justify-center bg-gradient-to-br from-sun-100 via-cream to-leaf-50 p-10">
      <div className="w-full max-w-[560px]">
        <div className="mb-6 flex items-center justify-center gap-2">
          <LogoMark size={36} />
          <p className="text-xl font-black text-ink">
            Sun<span className="text-leaf-500">Swap</span>
          </p>
        </div>
        <div className="mb-6 flex items-center justify-center gap-2">
          {STEPS.map((s, i) => (
            <div key={s.title} className="flex items-center gap-2">
              <motion.span
                animate={{ scale: i === step ? 1.1 : 1 }}
                className={cn(
                  'grid size-8 place-items-center rounded-full text-sm font-black',
                  i < step ? 'bg-leaf-500 text-white dark:text-on-sun' : i === step ? 'bg-sun-400 text-ink' : 'bg-surface text-ink-muted border border-line',  
                )}
              >
                {i < step ? <Check size={16} /> : i + 1}
              </motion.span>
              {i < STEPS.length - 1 && <span className={cn('h-1 w-14 rounded-full', i < step ? 'bg-leaf-500' : 'bg-line')} />}
            </div>
          ))}
        </div>
        <div className="overflow-hidden rounded-3xl border border-line bg-surface p-8 shadow-lift">
          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.28 }}>
              <span className="grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-sun-300 to-sun-400 shadow-soft">
                <StepIcon size={26} />
              </span>
              <h1 className="mt-4 text-2xl font-black text-ink">{STEPS[step].title}</h1>
              <p className="text-sm font-semibold text-ink-muted">{STEPS[step].subtitle}</p>

              <div className="mt-6 min-h-[150px]">
                {step === 0 && (
                  <div className="space-y-4">
                    <LocationFields
                      country={country}
                      city={city}
                      onChange={(nextCountry, nextCity) => {
                        setCountry(nextCountry);
                        setCity(nextCity)
                      }}
                    />
                    <div className="flex items-center gap-3 rounded-2xl bg-leaf-50 p-4 text-sm font-semibold text-leaf-700">
                      <MapPin size={18} className="shrink-0" />
                      <span> 
                        We found <b>{nearbyCount} active prosumers</b> within 25 km of {city}, {countryName(country)}.
                      </span>
										</div>
                  </div>
                )}
                {step === 1 && (
                  <div className="space-y-5">
                    <div className="flex items-end justify-between">
                      <span className="text-sm font-bold text-ink-soft">System size</span>
                      <span className="text-3xl font-black text-ink">{kwp.toFixed(1)} <span className="text-base text-ink-muted">kWp</span></span>
                    </div>
                    <Slider value={kwp} min={1} max={20} step={0.5} onChange={setKwp} />
                    <div className="grid grid-cols-3 gap-3 text-center">
                      {[
                        ['Panels', Math.round(kwp / 0.42)],
                        ['Daily yield', `${(kwp * 3.1).toFixed(0)} kWh`],
                        ['Typical surplus', `${(kwp * 1.3).toFixed(1)} kWh`],
                      ].map(([label, value]) => (
                        <div key={label} className="rounded-2xl bg-sun-50 p-3">
                          <p className="text-lg font-black text-ink">{value}</p>
                          <p className="text-xs font-bold text-ink-muted">{label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {step === 2 && (
                  <div className="space-y-5">
                    <div className="flex items-end justify-between">
                      <span className="text-sm font-bold text-ink-soft">Preferred selling price</span>
                      <span className="text-3xl font-black text-ink">{eur(price)} <span className="text-base text-ink-muted">/ kWh</span></span>
                    </div>
                    <Slider value={price} min={0.12} max={0.28} step={0.01} onChange={setPrice} />
                    <div className="grid grid-cols-3 gap-2">
                      {[
	                        ['Quick sale', 0.16],
                        ['Balanced', 0.19],
                        ['Premium', 0.23],
                      ].map(([label, value]) => (
                        <button
                          key={label}
                          type="button"
                          onClick={() => setPrice(value as number)}
                          className={cn(
                            'cursor-pointer rounded-2xl border p-3 text-left transition', 
                            price === value ? 'border-leaf-500 bg-leaf-50' : 'border-line hover:bg-sun-50',
	                          )}
                        >
                          <p className="text-sm font-extrabold text-ink">{label}</p>
                          <p className="text-xs font-bold text-ink-muted">{eur(value as number)} / kWh</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
          <div className="mt-6 flex items-center justify-between">
            <Button variant="ghost" icon={<ArrowLeft size={16} />} disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
              Back
            </Button>
            {step < STEPS.length - 1 ? (
              <Button onClick={() => setStep((s) => s + 1)}>
                Next <ArrowRight size={16} />
              </Button>
            ) : (
              <Button variant="secondary" onClick={finish} icon={<Sun size={16} />}>
                Show me the map
              </Button>
            )}
          </div>
        </div>
      </div>
    </div> 
  );  
}
