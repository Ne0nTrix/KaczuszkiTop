import { AnimatePresence, motion } from 'framer-motion'
import { BatteryCharging, ChevronDown, Cloud, CloudRain, CloudSun, Factory, Home, Hourglass, Network, Search, Sun, Tag, TrendingUp, Users, Zap } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Microgrid, Weather } from '../types';
import { BalanceGauge } from '../components/microgrid/BalanceGauge';
import { MicrogridMap } from '../components/microgrid/MicrogridMap';
import type { Flow, MemberBalance } from '../components/microgrid/MicrogridMap'
import { AnimatedNumber } from '../components/ui/AnimatedNumber';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { Card, CardTitle, Stagger } from '../components/ui/Card';
import { PageHeader } from '../components/ui/PageHeader';
import { PageSkeleton } from '../components/ui/Skeleton';
import { MICROGRIDS } from '../data/constants';
import { countryName } from '../data/countries'
import { forecast } from '../data/energy';
import { cn } from '../lib/cn'
import { eur, hourLabel, kwh } from '../lib/format'
import { distanceKm } from '../lib/geo';
import { hashString, round, seededRandom } from '../lib/random';
import { consumptionShape, productionAt, sunShape } from '../lib/solar';
import { usePageLoading } from '../lib/useFakeQuery';


import { useApp } from '../state/AppStateProvider';
import { useMarket } from '../state/MarketProvider';


const WEATHER: Record<Weather, { icon: typeof Sun; label: string; cls: string }> = {
  sunny: { icon: Sun, label: 'Sunny', cls: 'text-amber-500 bg-sun-100' },
  partly: { icon: CloudSun, label: 'Partly cloudy', cls: 'text-amber-500 bg-sun-50' },
  cloudy: { icon: Cloud, label: 'Cloudy', cls: 'text-ink-muted bg-line-soft' },
  rain: { icon: CloudRain, label: 'Rain', cls: 'text-sky-500 bg-sky-100' },
};

function computeFlows(members: MemberBalance[], battery: [number, number]): Flow[] {
  const sources = members.filter((m) => m.balance > 0).map((m) => ({ ...m, left: m.balance }));
  const sinks = members.filter((m) => m.balance < 0).map((m) => ({ ...m, need: -m.balance }))

	  const first = (name: string) => name.split(' ')[0];
  const flows: Flow[] = [];
  for (const sink of sinks) { 
    const ordered = [...sources].sort((a, b) => distanceKm(a.user, sink.user) - distanceKm(b.user, sink.user))
    for (const src of ordered) {
      if(sink.need <= 0.05) break
      if(src.left <= 0.05) continue
      const amount = Math.min(src.left, sink.need);
      src.left -= amount;
      sink.need -= amount
      flows.push({ from: [src.user.lat, src.user.lng], to: [sink.user.lat, sink.user.lng], kwh: amount, label: `${first(src.user.name)} -> ${first(sink.user.name)}: ${amount.toFixed(1)} kWh`, fromBattery: false });
    }


    if(sink.need > 0.2) {
      flows.push({ from: battery, to: [sink.user.lat, sink.user.lng], kwh: sink.need, label: `Battery -> ${first(sink.user.name)}: ${sink.need.toFixed(1)} kWh`, fromBattery: true })
    }
  }
  for (const src of sources) {
	    if (src.left > 0.3) flows.push({ from: [src.user.lat, src.user.lng], to: battery, kwh: src.left, label: `${first(src.user.name)} -> battery: ${src.left.toFixed(1)} kWh`, fromBattery: false });
  }
    
  return flows;
}

function Total({ icon, label, value, tone }: { icon: ReactNode; label: string; value: ReactNode; tone: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-2xl border border-line-soft bg-surface p-3">  
      <span className={cn('grid size-9 shrink-0 place-items-center rounded-xl', tone)}>{icon}</span>
      <div className="min-w-0">
        <p className="text-[11px] font-extrabold tracking-wide text-ink-muted uppercase">{label}</p>
        <p className="text-base leading-tight font-black whitespace-nowrap text-ink">{value}</p>
      </div>
    </div>
  );
}

function GroupPicker({ value, onChange, counts, mine }: { value: Microgrid; onChange: (id: string) => void; counts: Record<string, number>; mine: string | null }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
	  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close);
  }, [open])


  const q = query.trim().toLowerCase();
  const list = MICROGRIDS.filter((g) => !q || g.name.toLowerCase().includes(q) || g.city.toLowerCase().includes(q) || g.country.toLowerCase() === q || countryName(g.country).toLowerCase().includes(q));
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-[330px] cursor-pointer items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-2.5 text-left shadow-soft transition hover:border-sun-400"
      >
        <Network size={18} className="text-leaf-600" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-black text-ink">{value.name}</span>
          <span className="block text-xs font-bold text-ink-muted">
            {value.city}, {value.country} - {counts[value.id] ?? 0} members{value.id === mine ? ' - your group' : ''}
          </span>
        </span>
        <motion.span animate={{ rotate: open ? 180 : 0 }}>
          <ChevronDown size={16} className="text-ink-muted" />
        </motion.span>
      </button>
      <AnimatePresence>
        {open && (  
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="absolute top-16 right-0 z-[600] w-[360px] overflow-hidden rounded-2xl border border-line bg-surface shadow-lift"	
	          >
            <div className="relative border-b border-line-soft p-2.5">
              <Search size={15} className="absolute top-1/2 left-5 -translate-y-1/2 text-ink-muted" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search 24 groups, cities or countries"
	                className="h-9 w-full rounded-xl border border-line bg-cream pr-3 pl-9 text-sm font-semibold text-ink outline-none focus:border-sun-400"
              />
            </div>
            <ul className="max-h-[360px] overflow-y-auto p-1.5">
              {list.map((g) => (
                <li key={g.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(g.id);
                      setOpen(false);
                      setQuery('');
                    }}
                    className={cn('flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-left transition hover:bg-sun-50', g.id === value.id && 'bg-leaf-50')}
                  >
                    <span className="w-8 rounded-md bg-sun-100 py-0.5 text-center text-[11px] font-black text-ink-soft">{g.country}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-extrabold text-ink">{g.name}</span>
                      <span className="block text-xs font-bold text-ink-muted">
                        {g.city} - {counts[g.id] ?? 0} members
                      </span>
                    </span>
                    {g.id === mine && <span className="rounded-full bg-leaf-500 px-2 py-0.5 text-[10px] font-black text-white dark:text-on-sun">Yours</span>}
                  </button>
                </li>
              ))}
              {list.length === 0 && <li className="px-3 py-4 text-sm text-ink-muted">No group matches "{query}".</li>}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>  
    </div>
  )
}


export function MicrogridPage() {
  const { world, me } = useApp();
  const { prices, simHour, currentPrice } = useMarket()
  const navigate = useNavigate();
  const loading = usePageLoading();
  const [groupId, setGroupId] = useState(me.microgridId ?? MICROGRIDS[0].id);
  const group = MICROGRIDS.find((g) => g.id === groupId) ?? MICROGRIDS[0];

  const counts = useMemo(() => {
    const result: Record<string, number> = {};
    for (const u of world.users) if(u.microgridId) result[u.microgridId] = (result[u.microgridId] ?? 0) + 1;
    if(me.microgridId) result[me.microgridId] = (result[me.microgridId] ?? 0) + 1;
    return result;
  }, [world.users, me.microgridId]);

	  const members: MemberBalance[] = useMemo(() => {
    const list = world.users.filter((u) => u.microgridId === group.id);
    if (me.microgridId === group.id) list.unshift(me)
    return list.map((user) => {
      const rand = seededRandom('mg', user.id, world.seed)
      const consumption = round((0.5 + rand() * 0.8) * (0.6 + consumptionShape(simHour) * 1.8) + (user.role === 'buyer' ? 0.4 : 0), 1);
      const production = user.role === 'buyer' ? 0 : round(productionAt(user, simHour) * 0.85, 1)
      return { user, production, consumption, balance: round(production - consumption, 1) };

    });

  }, [world.users, world.seed, me, group.id, simHour]);

  const battery = useMemo<[number, number]>(() => {
    const candidates = Array.from({ length: 12 }, (_, i) => {
      const angle = (i / 12) * 2 * Math.PI;
      return [group.lat + 0.035 * Math.sin(angle), group.lng + 0.055 * Math.cos(angle)] as [number, number]
    })
    const clearance = (p: [number, number]) => Math.min(...members.map((m) => distanceKm({ lat: p[0], lng: p[1] }, m.user)));
    return candidates.reduce((best, c) => (clearance(c) > clearance(best) ? c : best))
  }, [members, group.lat, group.lng]);

	const flows = useMemo(() => computeFlows(members, battery), [members, battery]);


  const production = round(members.reduce((s, m) => s + m.production, 0), 1)
  const consumption = round(members.reduce((s, m) => s + m.consumption, 0), 1)
  const balance = round(production - consumption, 1)
  const batteryLevel = Math.round(Math.min(98, Math.max(18, 28 + 66 * sunShape(simHour - 2) + (simHour > 17 ? -12 * (simHour - 17) : 0))))

  const groupKwp = members.reduce((s, m) => s + m.user.panelKwp, 0)
	  const groupDays = useMemo(() => forecast(Math.max(groupKwp, 5), world.seed + (hashString(group.id) % 1000)), [groupKwp, world.seed, group.id]);
  const myDays = useMemo(() => forecast(Math.max(me.panelKwp, 1), world.seed), [me.panelKwp, world.seed])
  const tomorrow = myDays[0];

  const later = prices.filter((p) => p.hour > simHour);
  const peak = later.length ? later.reduce((a, b) => (b.price > a.price ? b : a)) : null
	const holdGain = peak ? (peak.price - currentPrice) / currentPrice : 0;
  const holdForPeak = !!peak && holdGain > 0.12

  if(loading) return <PageSkeleton />;
  const maxContribution = Math.max(1, ...members.map((m) => Math.abs(m.balance)))

  return (
    <div>
      <PageHeader
        icon={<Network size={24} />}
        title="Microgrid"
				subtitle={`24 neighbourhood groups across the EU - live at ${hourLabel(simHour)}`}
        actions={<GroupPicker value={group} onChange={setGroupId} counts={counts} mine={me.microgridId} />}
      />

      <Stagger key={groupId} className="space-y-5">
        <div className="grid grid-cols-[1fr_330px] gap-5">
          <Card padded={false} className="flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-5 pt-4 pb-3">
              <div>
                <h3 className="text-[15px] font-extrabold text-ink">
                  {group.name} <span className="text-ink-muted">- {group.city}, {countryName(group.country)}</span>
                </h3>
                <p className="text-xs font-semibold text-ink-muted">Who sends energy to whom at {hourLabel(simHour)} - hover a line for details</p>
              </div>	
              <div className="flex items-center gap-3 text-xs font-bold text-ink-soft">
                <span className="flex items-center gap-1.5">
                  <span className="h-1 w-5 rounded-full bg-leaf-500" /> Neighbour flow
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-1 w-5 rounded-full bg-amber-500" /> From battery
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-3 rounded-full bg-sky-500" /> Deficit
								</span>
              </div>
            </div>
            <div className="min-h-[380px] flex-1 px-3 pb-3">
              <MicrogridMap key={groupId} members={members} flows={flows} battery={battery} />
            </div>
          </Card>

          <Card>
            <CardTitle icon={<Zap size={18} />} title="Group balance" subtitle="Production minus consumption this hour" />
            <BalanceGauge balance={balance} production={production} consumption={consumption} />
            <div className="mt-4 grid grid-cols-2 gap-2.5">
              <Total icon={<Sun size={18} />} tone="bg-sun-100 text-amber-500" label="Production" value={<AnimatedNumber value={production} format={(v) => kwh(v)} />} />
              <Total icon={<Factory size={18} />} tone="bg-sky-100 text-sky-500" label="Consumption" value={<AnimatedNumber value={consumption} format={(v) => kwh(v)} />} />
              <Total icon={<Users size={18} />} tone="bg-leaf-100 text-leaf-700" label="Members" value={members.length} />
              <Total
								icon={<BatteryCharging size={18} />}
                tone="bg-sun-100 text-amber-500"
                label="Shared battery"
                value={	
                  <span className="flex items-center gap-2">
                    {batteryLevel}%
                    <span className="h-2 w-10 overflow-hidden rounded-full bg-line-soft">
                      <span className="block h-full rounded-full bg-leaf-500 transition-all" style={{ width: `${batteryLevel}%` }} />
                    </span>
                  </span>
                }
              />
            </div>
          </Card>   
        </div>

        <div className="grid grid-cols-[1fr_1fr_1.2fr] gap-5">
          <Card className="relative overflow-hidden border-sun-300 bg-gradient-to-br from-[#ffe07a] via-[#ffeda3] to-[#fff6cc] text-on-sun">
            <motion.div className="absolute -top-10 -right-10" animate={{ rotate: 360 }} transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}>
              <Sun size={140} className="text-white/50" />
            </motion.div>
            <p className="relative text-[11px] font-black tracking-wider uppercase opacity-60">Forecast alert</p> 
            <p className="relative mt-2 text-2xl leading-tight font-black">Tomorrow will be sunny - list an offer</p>
            <p className="relative mt-2 text-sm font-bold opacity-75">
              Expected production {kwh(tomorrow.expectedKwh)}. About {kwh(Math.max(1, tomorrow.expectedKwh * 0.45))} could be surplus.
            </p>
            <Button
              className="relative mt-4"
              variant="secondary"
              icon={<Tag size={16} />}
              onClick={() => navigate(`/trade?tab=mine&prefill=1&kwh=${Math.max(1, Math.round(tomorrow.expectedKwh * 0.45))}&date=${tomorrow.date}`)}
            >
              List an offer for tomorrow
            </Button>	
          </Card>

          <Card>
            <CardTitle icon={holdForPeak ? <Hourglass size={18} /> : <TrendingUp size={18} />} title="Recommendation" subtitle="Based on the price curve and forecast" />
            <motion.div key={String(holdForPeak)} initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={cn('rounded-2xl p-4', holdForPeak ? 'bg-orange-100/70' : 'bg-leaf-100')}>
              <p className={cn('text-2xl font-black', holdForPeak ? 'text-orange-500' : 'text-leaf-700')}>{holdForPeak ? 'Hold for evening peak' : 'Sell now'}</p>
              <p className="mt-1 text-sm font-semibold text-ink-soft">
                {holdForPeak && peak
                  ? `Price is expected to reach ${eur(peak.price)} at ${hourLabel(peak.hour)} - ${Math.round(holdGain * 100)}% more than now (${eur(currentPrice)}).`
                  : `Current price ${eur(currentPrice)} is close to today's best. Selling now earns the most.`}
              </p>
            </motion.div>
            <Button
              className="mt-4 w-full"
              variant={holdForPeak ? 'outline' : 'primary'}
              onClick={() => navigate(holdForPeak && peak ? `/trade?tab=mine&prefill=1&kwh=3&from=${peak.hour}&to=${Math.min(23, peak.hour + 2)}` : '/trade?tab=mine')}
            >
              {holdForPeak ? 'Schedule an evening offer' : 'Sell surplus now'}
            </Button>
          </Card>

          <Card>
            <CardTitle icon={<CloudSun size={18} />} title="7-day PV forecast" subtitle={`${group.name} - ${round(groupKwp, 0)} kWp installed`} />
            <div className="grid grid-cols-7 gap-1.5">
              {groupDays.map((d, i) => {
                const w = WEATHER[d.weather];
                const Icon = w.icon
                const max = Math.max(...groupDays.map((x) => x.expectedKwh));
                return (
                  <motion.div
                    key={d.date}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
    

                    transition={{ delay: i * 0.05 }}
                    title={`${w.label}, ${d.tempC} C`}
                    className={cn('flex flex-col items-center rounded-xl border p-1.5 text-center', i === 0 ? 'border-sun-400 bg-sun-50' : 'border-line-soft')}
                  >
                    <p className="text-[11px] font-black text-ink-soft">{i === 0 ? 'Tmrw' : new Date(d.date).toLocaleDateString('en-GB', { weekday: 'short' })}</p>
                    <span className={cn('my-1 grid size-8 place-items-center rounded-full', w.cls)}>
                      <Icon size={17} />
                    </span>
                    <div className="flex h-12 w-3 items-end overflow-hidden rounded-full bg-sun-50">
                      <motion.div className="w-full rounded-full bg-gradient-to-t from-amber-500 to-sun-300" initial={{ height: 0 }} animate={{ height: `${(d.expectedKwh / max) * 100}%` }} transition={{ delay: 0.2 + i * 0.05 }} />
                    </div>
                    <p className="mt-1 text-[11px] font-black text-ink">{d.expectedKwh >= 100 ? Math.round(d.expectedKwh) : d.expectedKwh.toFixed(0)}</p>
                    <p className="text-[9px] font-bold text-ink-muted">kWh</p>
                  </motion.div>
                );
              })}
            </div>
          </Card>
        </div>

        <Card>
          <CardTitle icon={<Users size={18} />} title="Members" subtitle={`${members.length} households - contribution this hour`} />
          <table className="w-full text-sm">
            <thead>
	              <tr className="border-b border-line text-left text-[11px] font-black tracking-wider text-ink-muted uppercase">
                <th className="py-2.5 pl-2">Household</th>
                <th>Role</th>
                <th className="text-right">Panels</th>
								<th className="text-right">Production</th>
                <th className="text-right">Consumption</th>
                <th className="w-[30%] pl-6">Contribution</th>
                <th className="pr-2 text-right">Balance</th>  
              </tr>
            </thead>
            <tbody>
              {[...members]
                .sort((a, b) => b.balance - a.balance)
                .map((m) => (
                  <tr key={m.user.id} onClick={() => navigate(`/users/${m.user.id}`)} className="cursor-pointer border-b border-line-soft last:border-0 hover:bg-sun-50">
                    <td className="py-2.5 pl-2">
                      <span className="flex items-center gap-2.5 font-bold text-ink">
                        {m.user.id === 'me' ? (
                          <span className="grid size-8 place-items-center rounded-full bg-leaf-700 text-white">
                            <Home size={15} />   
                          </span>
                        ) : (
                          <Avatar initials={m.user.initials} color={m.user.avatarColor} size={32} />
                        )}
                        {m.user.id === 'me' ? 'You' : m.user.name}
                      </span>
                    </td>
                    <td className="font-semibold text-ink-soft">{m.user.role === 'seller' ? 'Prosumer' : 'Consumer'}</td>
                    <td className="text-right font-semibold text-ink-soft tabular-nums">{m.user.panelKwp ? `${m.user.panelKwp} kWp` : '-'}</td>
                    <td className="text-right font-semibold text-ink-soft tabular-nums">{m.production.toFixed(1)} kWh</td>
                    <td className="text-right font-semibold text-ink-soft tabular-nums">{m.consumption.toFixed(1)} kWh</td>
                    <td className="pl-6">
                      <div className="flex h-2 items-center">
                        <div className="relative h-2 w-full overflow-hidden rounded-full bg-line-soft">
                          <motion.div
                            className={cn('absolute top-0 h-full rounded-full', m.balance >= 0 ? 'left-1/2 bg-leaf-500' : 'right-1/2 bg-orange-500')}
                            initial={{ width: 0 }}
                            animate={{ width: `${(Math.abs(m.balance) / maxContribution) * 50}%` }}
                            transition={{ duration: 0.6 }}
                          />
                          <span className="absolute top-0 left-1/2 h-full w-px bg-ink-muted/40" />	
                        </div>
                      </div>
                    </td>	
                    <td className="pr-2 text-right">
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-xs font-black',
                          m.balance > 0.3 ? 'bg-leaf-100 text-leaf-700' : m.balance < -0.3 ? 'bg-orange-100 text-orange-500' : 'bg-sun-100 text-sun-700',
                        )}
                      >   
                        {m.balance >= 0 ? '+' : ''} 
                        {m.balance.toFixed(1)} kWh
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody> 
          </table>
        </Card>
      </Stagger>
    </div>
  );
}
