import { AnimatePresence, motion } from 'framer-motion';
import {
  Award,
  BadgeCheck,
  BatteryCharging,
  Coins,
  Crown,
  Flame,
  Gift,
  Globe2,
  HeartHandshake,
  Leaf,
  Lock,
  MapPin,
  Medal,
  Moon,
  Share2,
  Sprout,
  Star,
  Sun,
  Sunrise,
  Target,
	TreePine,
  Trophy,
  UserPlus,
  Users,
  Zap,
} from "lucide-react";
import type { ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom'
import { LogoMark } from '../components/layout/Logo'
import { ChallengeCard } from '../components/rewards/ChallengeCard'
import { InvitePanel } from '../components/rewards/InvitePanel'
import { SharePanel } from '../components/rewards/SharePanel';
import type { ShareVariant } from "../components/rewards/shareCardSvg";
import { AnimatedNumber } from '../components/ui/AnimatedNumber';	
import { Avatar } from '../components/ui/Avatar'
import { Button } from '../components/ui/Button';
import { Card, CardTitle, Stagger } from '../components/ui/Card';
import { PageHeader } from '../components/ui/PageHeader';  
import { Segmented } from '../components/ui/Segmented';
import { PageSkeleton } from '../components/ui/Skeleton';
import { CO2_KG_PER_KWH, LEVELS, REDEEM_COST, REDEEM_DISCOUNT_PCT, TREE_KG_CO2_PER_YEAR } from '../data/constants';
import { badgesFor, countryRanking, leaderboard, levelFor } from '../data/rewards';
import { cn } from '../lib/cn';
import { num } from '../lib/format';
import { usePageLoading } from '../lib/useFakeQuery'
import { useApp } from '../state/AppStateProvider';

type Tab = 'overview' | 'challenges' | 'invite' | 'share'

const BADGE_ICONS: Record<string, ReactNode> = {
  'first-trade': <HeartHandshake size={24} />,
  'local-hero': <MapPin size={24} />,
  'sunny-streak': <Flame size={24} />,
  'solar-leader': <Crown size={24} />,
  'community-builder': <Users size={24} />,
  'green-certified': <BadgeCheck size={24} />,
  'five-star': <Star size={24} />,
  megawatt: <Zap size={24} />,
  'early-bird': <Sunrise size={24} />,
  'peak-saver': <Target size={24} />,
  'cross-border': <Globe2 size={24} />,
  'night-owl': <Moon size={24} />,
};


const LEVEL_ICONS = [Sprout, Leaf, TreePine, Sun];

function GrowingTree() {	
  return (
    <svg viewBox="0 0 120 140" className="h-40 w-36" aria-hidden="true">
      <ellipse cx="60" cy="132" rx="40" ry="6" fill="var(--color-leaf-200)" />
      <motion.rect x="55" y="80" width="10" height="52" rx="4" fill="#8B6A3E" initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ duration: 0.8 }} style={{ originY: 1, originX: 0.5 }} />
      {[
        { cx: 60, cy: 62, r: 34, d: 0.6, c: '#5FAE4B' },
        { cx: 38, cy: 78, r: 22, d: 0.8, c: '#4C963B' },
        { cx: 82, cy: 78, r: 22, d: 0.9, c: '#4C963B' },
        { cx: 60, cy: 38, r: 22, d: 1.0, c: '#8CCB6E' },
      ].map((b) => (
        <motion.circle key={`${b.cx}-${b.cy}`} cx={b.cx} cy={b.cy} r={b.r} fill={b.c} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: b.d, type: 'spring', stiffness: 120, damping: 10 }} style={{ originX: 0.5, originY: 0.5 }} />
      ))}
      <motion.circle cx="95" cy="22" r="10" fill="#F6C945" animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 3, repeat: Infinity }} />
    </svg>
  );
}

const STREAK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function RewardsPage() {
  const { world, me, redeemTokens, discountPct, claimChallenge } = useApp()
  const loading = usePageLoading();
  const [params, setParams] = useSearchParams();
  const tab = (params.get('tab') as Tab) || 'overview'
	const setTab = (next: Tab) => setParams(next === 'overview' ? {} : { tab: next });

    

  const tokens = world.ecoTokens;
  const level = levelFor(tokens);
  const sales = world.transactions.filter((t) => t.type === 'sale');
  const kwhSold = sales.reduce((s, t) => s + t.kwh, 0);
  const joined = world.invites.filter((i) => i.status === 'joined').length
  const badges = badgesFor({
    trades: me.tradesCompleted,
    localTrades: 6,
    tokens,
    streakDays: 4,
    invitedJoined: joined,
    certificates: world.certificates.filter((c) => c.sellerId === 'me' || c.buyerId === 'me').length,
    rating: me.rating,
    kwhSold,
    countriesTraded: new Set(world.transactions.map((t) => t.country)).size,
  });
  const board = leaderboard(world.users, me, tokens);
  const top = board.slice(0, 50);
  const myRank = board.findIndex((e) => e.isMe) + 1
  const countries = countryRanking(world.users).slice(0, 10);
  const maxCountry = countries[0]?.tradedKwh ?? 1;

  const yearsActive = Math.max(0.5, (Date.now() - new Date(me.joinedAt).getTime()) / (365 * 86400000));
  const lifetimeKwh = me.panelKwp * 950 * yearsActive
  const co2Kg = lifetimeKwh * CO2_KG_PER_KWH;
  const trees = co2Kg / TREE_KG_CO2_PER_YEAR;
  const treeIcons = Math.min(48, Math.round(trees / 10));
  const ready = world.challenges.filter((c) => !c.claimed && c.progress >= c.target).length

  const since = new Date(Date.now() - 90 * 86400000).toISOString();
  const recentKwh = sales.filter((t) => t.date >= since).reduce((s, t) => s + t.kwh, 0);
  const sharedCo2 = Number(params.get('co2')) || recentKwh * CO2_KG_PER_KWH;
  const money = sales.reduce((s, t) => s + t.total, 0);

  if (loading) return <PageSkeleton />;

  return (  
    <div>
      <PageHeader
        icon={<Gift size={24} />}
        title="Rewards"
        subtitle="Earn EcoTokens for every clean kWh you share - more for local trades"
        actions={
          <Segmented
            layoutId="rewards-tabs"
            value={tab}
            onChange={setTab}
            options={[
              { value: 'overview', label: 'Overview', icon: <Trophy size={14} /> },
              { value: 'challenges', label: 'Challenges', icon: <Target size={14} />, badge: ready },
              { value: 'invite', label: 'Invite', icon: <UserPlus size={14} /> },
              { value: 'share', label: 'Share', icon: <Share2 size={14} /> },
            ]}
          />
        }
      />

      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.22 }}>	
	          {tab === 'overview' && (
            <Stagger className="space-y-5">
              <div className="grid grid-cols-[1.1fr_1.4fr_1fr] gap-5">
                <Card className="relative overflow-hidden border-sun-300 bg-gradient-to-br from-[#ffe07a] via-[#ffeda3] to-[#fff6cc] text-on-sun">
                  <motion.div className="absolute -right-8 -bottom-8" animate={{ rotate: 360 }} transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}>
                    <Coins size={150} className="text-white/40" />
                  </motion.div>
                  <p className="relative text-[11px] font-black tracking-wider uppercase opacity-60">EcoTokens balance</p>
                  <p className="relative mt-1 flex items-center gap-3 text-[46px] leading-none font-black">
                    <motion.span
                      animate={{ rotateY: [0, 360] }}
                      transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 3 }}
                      className="grid size-11 place-items-center rounded-full bg-gradient-to-br from-[#ffe07a] to-[#f4a300] shadow-soft"
                    >
                      <Coins size={22} />
                    </motion.span>
                    <AnimatedNumber value={tokens} format={(v) => num(v)} duration={1.8} />
                  </p>
                  <p className="relative mt-3 text-sm font-bold opacity-75">+3 tokens per kWh sold, +15 bonus for trades under 25 km</p>
                </Card>

                <Card>
                  <CardTitle icon={<Trophy size={18} />} title={`Level: ${level.name}`} subtitle={level.next ? `${num(level.next.min - tokens)} tokens to ${level.next.name}` : 'Top level reached!'} />
                  <div className="relative mt-2 mb-4 flex items-center justify-between">
                    <div className="absolute top-5 right-5 left-5 h-2 rounded-full bg-sun-100" />
                    <motion.div
                      className="absolute top-5 left-5 h-2 rounded-full bg-gradient-to-r from-leaf-500 to-sun-400"
                      initial={{ width: 0 }}
                      animate={{ width: `calc((100% - 40px) * ${(level.index + level.progress) / (LEVELS.length - 1)})` }}
                      transition={{ duration: 1.4, ease: 'easeOut' }}
                    />   
                    {LEVELS.map((l, i) => {
                      const Icon = LEVEL_ICONS[i];

                      const reached = i <= level.index;
                      return (
                        <div key={l.name} className="relative flex w-20 flex-col items-center"> 
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: i === level.index ? [1, 1.12, 1] : 1 }}
                            transition={i === level.index ? { duration: 2, repeat: Infinity } : { delay: i * 0.1 }}
                            className={cn('grid size-12 place-items-center rounded-full border-4 border-surface shadow-soft', reached ? 'bg-leaf-500 text-white dark:text-on-sun' : 'bg-line-soft text-ink-muted')}
                          >
                            <Icon size={20} />
                          </motion.span>
                          <p className={cn('mt-1.5 text-center text-xs font-black', reached ? 'text-ink' : 'text-ink-muted')}>{l.name}</p>
                          <p className="text-[10px] font-bold text-ink-muted">{num(l.min)}</p>
                        </div>
                      );
                    })}
                  </div>
                </Card>

                <Card className="flex flex-col">
                  <CardTitle icon={<Gift size={18} />} title="Redeem tokens" subtitle="Simulated discount on your next trade" />
                  <div className="flex-1 rounded-2xl border border-dashed border-leaf-500/50 bg-leaf-50 p-4 text-center">
                    <p className="text-3xl font-black text-leaf-700">-{REDEEM_DISCOUNT_PCT}%</p>
                    <p className="text-sm font-bold text-ink-soft">on your next energy purchase</p>
										<p className="mt-1 text-xs font-bold text-ink-muted">Costs {REDEEM_COST} EcoTokens</p>
                  </div>
                  {discountPct > 0 ? (
                    <p className="mt-3 rounded-xl bg-sun-100 py-2.5 text-center text-sm font-black text-ink">Discount active - applied at checkout</p>
									) : (
                    <Button className="mt-3 w-full" icon={<Coins size={16} />} onClick={redeemTokens}>
	                      Redeem {REDEEM_COST} tokens
                    </Button>
                  )}
								</Card>
              </div>

              <Card>
                <CardTitle icon={<Medal size={18} />} title="Badges" subtitle={`${badges.filter((b) => b.unlocked).length} of ${badges.length} unlocked`} />
                <div className="grid grid-cols-6 gap-3">
                  {badges.map((b, i) => (
                    <motion.div
                      key={b.id}
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      whileHover={b.unlocked ? { y: -4, rotate: -2 } : undefined}
                      className={cn('relative rounded-2xl border p-3 text-center', b.unlocked ? 'border-sun-300 bg-gradient-to-b from-sun-50 to-surface' : 'border-line-soft bg-cream/60')}
                    >
                      <span
                        className={cn(
                          'mx-auto grid size-14 place-items-center rounded-full',
                          b.unlocked ? 'bg-gradient-to-br from-[#ffe07a] to-[#f4a300] text-on-sun shadow-soft' : 'bg-line-soft text-ink-muted grayscale',
                        )}   
                      >
                        {BADGE_ICONS[b.id] ?? <Award size={24} />}
                      </span>
                      {!b.unlocked && (   
                        <span className="absolute top-2.5 right-2.5 grid size-5 place-items-center rounded-full bg-surface text-ink-muted shadow-sm">
                          <Lock size={11} />
                        </span>
                      )}
                      <p className={cn('mt-2 text-sm leading-tight font-black', b.unlocked ? 'text-ink' : 'text-ink-muted')}>{b.name}</p>
                      <p className="mt-0.5 text-[11px] leading-snug font-semibold text-ink-muted">{b.description}</p>
                      {!b.unlocked && (
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line-soft">
                          <motion.div className="h-full rounded-full bg-ink-muted/50" initial={{ width: 0 }} animate={{ width: `${b.progress * 100}%` }} transition={{ duration: 1 }} />
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </Card>	

              <div className="grid grid-cols-[1.3fr_1fr] gap-5">
                <Card>
                  <CardTitle icon={<Trophy size={18} />} title="Monthly leaderboard" subtitle={`Top 50 prosumers this month - you are #${myRank}`} />
                  <ol className="max-h-[460px] space-y-1 overflow-y-auto pr-1">
                    {top.map((e, i) => (
                      <motion.li
                        key={e.userId}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: Math.min(i, 15) * 0.03 }}
                        className={cn('flex items-center gap-3 rounded-xl px-3 py-1.5', e.isMe ? 'sticky top-0 bottom-0 z-10 border-2 border-leaf-500 bg-leaf-50' : 'hover:bg-sun-50')}
	                      >	
                        <span
                          className={cn(
                            'grid size-7 shrink-0 place-items-center rounded-full text-xs font-black',
                            i === 0 ? 'bg-sun-400 text-on-sun' : i === 1 ? 'bg-line text-ink' : i === 2 ? 'bg-amber-500/70 text-white' : 'bg-cream text-ink-muted',
                          )}
                        >
                          {i + 1}
                        </span>
                        <Avatar initials={e.initials} color={e.avatarColor} size={30} />
                        <span className="min-w-0 flex-1 truncate text-sm font-extrabold text-ink">
                          {e.isMe ? `${e.name} (you)` : e.name}
                          <span className="ml-2 text-xs font-bold text-ink-muted">
                            {e.city} {e.country}
                          </span>
												</span>
                        <span className="flex items-center gap-1 text-sm font-black text-ink tabular-nums">
                          <Coins size={14} className="text-amber-500" /> {num(e.tokens)}
                        </span>
                      </motion.li>
                    ))}
                  </ol>
                </Card>

                <div className="space-y-5">
                  <Card>
                    <CardTitle icon={<Globe2 size={18} />} title="Country ranking" subtitle="Traded kWh this month" />
                    <ol className="space-y-2">
                      {countries.map((c, i) => (
                        <li key={c.code} className="flex items-center gap-2.5 text-sm">
                          <span className="w-4 text-xs font-black text-ink-muted">{i + 1}</span>
                          <span className="w-9 rounded-md bg-sun-100 py-0.5 text-center text-xs font-black text-ink">{c.code}</span>
                          <span className="w-24 truncate font-bold text-ink-soft">{c.name}</span>
                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-line-soft">
                            <motion.div className="h-full rounded-full bg-leaf-500" initial={{ width: 0 }} animate={{ width: `${(c.tradedKwh / maxCountry) * 100}%` }} transition={{ duration: 0.9, delay: i * 0.05 }} />
                          </div>
                          <span className="w-20 text-right text-xs font-black text-ink tabular-nums">{(c.tradedKwh / 1000).toFixed(1)} MWh</span>
                        </li>
                      ))}
                    </ol>
                  </Card>
                  <Card className="flex flex-col">
                    <CardTitle icon={<TreePine size={18} />} title="Your climate impact" subtitle={`${num(lifetimeKwh)} kWh of clean energy since you joined`} />
                    <div className="flex items-center gap-4">
                      <GrowingTree />
                      <div>
                        <p className="text-xs font-extrabold tracking-wide text-ink-muted uppercase">CO2 saved</p>
                        <p className="text-3xl font-black text-leaf-700">
                          <AnimatedNumber value={co2Kg / 1000} format={(v) => `${v.toFixed(2)} t`} duration={2} />
                        </p>
                        <p className="mt-2 text-xs font-extrabold tracking-wide text-ink-muted uppercase">Equals trees planted</p>
                        <p className="text-3xl font-black text-ink">
                          <AnimatedNumber value={trees} format={(v) => num(v)} duration={2} />
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1">
                      {Array.from({ length: treeIcons }, (_, i) => (
                        <motion.span key={i} initial={{ scale: 0, y: 6 }} animate={{ scale: 1, y: 0 }} transition={{ delay: 0.8 + i * 0.03, type: 'spring' }}>
                          <TreePine size={16} className={i % 3 === 0 ? 'text-leaf-700' : 'text-leaf-500'} />
                        </motion.span>
                      ))}
                    </div>
                    <p className="mt-2 text-[11px] font-bold text-ink-muted">
                      Each icon = 10 trees. One tree absorbs about {TREE_KG_CO2_PER_YEAR} kg CO2 per year.
										</p>
                  </Card>
                </div>
              </div> 
            </Stagger>
          )}

          {tab === 'challenges' && (
            <div className="space-y-5">
              <Card className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                  <motion.span animate={{ scale: [1, 1.12, 1] }} transition={{ duration: 1.6, repeat: Infinity }} className="grid size-14 place-items-center rounded-2xl bg-orange-100 text-orange-500">
                    <Flame size={28} />
                  </motion.span>
                  <div>
                    <p className="text-2xl font-black text-ink">4-day streak</p>
                    <p className="text-sm font-bold text-ink-muted">Sell surplus 3 more days to unlock Sunny Streak</p>
                  </div>
								</div>
                <div className="ml-auto flex gap-2">
                  {STREAK_DAYS.map((d, i) => (
                    <div key={d} className="flex flex-col items-center gap-1">  
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: i * 0.06 }}
                        className={cn('grid size-10 place-items-center rounded-full border-2', i < 4 ? 'border-orange-500 bg-orange-500 text-white' : 'border-line bg-surface text-ink-muted')} 
                      > 
                        {i < 4 ? <Flame size={16} /> : <Sun size={15} />}
                      </motion.span>
                      <span className="text-[11px] font-bold text-ink-muted">{d}</span>
                    </div>
                  ))}
                </div>
              </Card>
              <div className="grid grid-cols-4 gap-4">
                {world.challenges.map((c, i) => ( 
                  <ChallengeCard key={c.id} challenge={c} index={i} onClaim={() => claimChallenge(c.id)} />
                ))}
              </div>
              <Card className="flex items-center gap-4 bg-gradient-to-r from-sun-100 to-leaf-50">
                <BatteryCharging size={26} className="text-leaf-600" />
                <p className="flex-1 text-sm font-semibold text-ink-soft">New challenges arrive every Monday. Finished ones pay out instantly in EcoTokens - redeem them for discounts on your next trade.</p>
                <Button variant="outline" onClick={() => setTab('overview')}>
									See my tokens
                </Button>
              </Card>
            </div>
          )}

          {tab === 'invite' && <InvitePanel />}

          {tab === 'share' && (
            <SharePanel values={{ co2Kg: sharedCo2, kwhSold, trees: sharedCo2 / TREE_KG_CO2_PER_YEAR, money }} initial={(params.get('variant') as ShareVariant) || 'co2'} />
          )}
        </motion.div>
      </AnimatePresence>

      <Card className="relative mt-5 overflow-hidden border-none bg-gradient-to-r from-[#f6c945] via-[#ffe07a] to-[#5fae4b] py-10 text-center text-on-sun">
        <motion.div className="absolute -top-16 left-1/2 size-64 -translate-x-1/2 rounded-full bg-white/30 blur-2xl" animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 4, repeat: Infinity }} />
        <div className="relative flex flex-col items-center">
          <LogoMark size={56} />
          <p className="mt-3 text-[34px] font-black">Trade your surplus sun with your neighbours.</p>
          <p className="mt-1 font-bold opacity-70">SunSwap - local, clean and rewarding energy for everyone.</p>
        </div>
      </Card>
    </div>
  );
}
