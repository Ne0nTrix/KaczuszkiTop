import { AnimatePresence, motion } from 'framer-motion'   
import { ArrowLeft, BarChart3, BatteryCharging, CalendarDays, Clock, Coins, Cpu, Gauge, History, MapPin, MessageCircle, MessageSquareText, Send, ShoppingBasket, Star, Sun, Tag, Trophy, Zap } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { AXIS, ChartTooltipCard, SERIES } from '../components/charts/chartTheme';
import { seededRandom } from '../lib/random'
import { BuyEnergyModal } from "../components/trade/BuyEnergyModal"
import { AnimatedNumber } from '../components/ui/AnimatedNumber';
import { Avatar } from '../components/ui/Avatar';
import { Badge } from "../components/ui/Badge";
import { Button } from '../components/ui/Button';
import { Card, CardTitle, Stagger } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState';
import { Segmented } from '../components/ui/Segmented'
import { PageSkeleton } from "../components/ui/Skeleton"
import { StarInput, Stars } from '../components/ui/Stars';
import { VerifiedBadge } from '../components/ui/VerifiedBadge'
import { levelFor } from '../data/rewards';
import { cn } from '../lib/cn';
import { distanceKm } from '../lib/geo';
import { dateLong, dateShort, eur, hourLabel, km, kwh, relativeTime } from '../lib/format';
import { usePageLoading } from '../lib/useFakeQuery';
import { useApp } from '../state/AppStateProvider';
import { useToast } from "../state/ToastProvider";

const RATING_LABELS = ['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'];

function HeaderStat({ icon, label, value }: { icon: ReactNode; label: string; value: ReactNode }) {
  return (
    <div className="rounded-2xl border border-line-soft bg-surface/80 px-4 py-3">
      <p className="flex items-center gap-1.5 text-[11px] font-extrabold tracking-wide text-ink-muted uppercase">
        {icon}
        {label}
      </p>
      <p className="mt-0.5 text-lg font-black text-ink">{value}</p>
    </div>
  );
}

export function ProfilePage() {
  const { id = '' } = useParams();
  const { world, me, getUser, rateUser, addComment, ensureThread } = useApp();

  const { toast } = useToast();
  const navigate = useNavigate()	
  const loading = usePageLoading();
  const [myRating, setMyRating] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [commentStars, setCommentStars] = useState(5);
  const [commentText, setCommentText] = useState('');
  const [buyOpen, setBuyOpen] = useState(false); 
  const [commentSort, setCommentSort] = useState<'newest' | 'highest'>('newest');

  const user = getUser(id)

  const soldByMonth = useMemo(() => {
    if (!user) return []
    const now = new Date()
    const rand = seededRandom('sold', user.id);
    return Array.from({ length: 12 }, (_, i) => {
      const month = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
      const next = new Date(now.getFullYear(), now.getMonth() - 10 + i, 1);	
      const season = 0.5 - 0.5 * Math.cos((2 * Math.PI * month.getMonth()) / 12);	
      const value =
        user.id === 'me' 
          ? world.transactions.filter((t) => t.type === 'sale' && t.date >= month.toISOString() && t.date < next.toISOString()).reduce((s, t) => s + t.kwh, 0)
          : user.role === 'seller'
            ? user.surplusPeakKwh * (6 + 22 * season) * (0.8 + rand() * 0.4)
            : 0;
      return { label: month.toLocaleDateString('en-GB', { month: 'short' }), kwh: Math.round(value * 10) / 10 };


    })
  }, [user, world.transactions]);

  const history = useMemo(() => {
    if (!user) return []
    if (user.id === 'me') return world.transactions.filter((t) => t.type !== 'reward').slice(0, 10);
    const rand = seededRandom('history', user.id);
    const partners = world.users.filter((u) => u.id !== user.id && u.country === user.country);
    return Array.from({ length: 10 }, (_, i) => {
      const partner = partners[Math.floor(rand() * partners.length)] ?? me;
      const amount = Math.round((1.5 + rand() * 8) * 10) / 10;
      return {
        id: `h-${user.id}-${i}`,
        date: new Date(Date.now() - (i * 2.7 + rand() * 2) * 86400000).toISOString(),
        type: user.role === 'seller' ? ('sale' as const) : ('purchase' as const),
        counterpartyName: partner.name,
        kwh: amount,
        total: Math.round(amount * (user.pricePerKwh || 0.19) * 100) / 100,
      };
    });
  }, [user, world.transactions, world.users, me])

  if (loading) return <PageSkeleton />;
  if (!user) {
    return (
      <EmptyState
        title="Neighbour not found"
        text="This profile does not exist or was removed."
        action={<Button onClick={() => navigate('/map')}>Back to the map</Button>}
      />   
    );
  }

  const isMe = user.id === me.id; 
  const comments = [...(world.comments[user.id] ?? [])].sort((a, b) => (commentSort === 'newest' ? b.date.localeCompare(a.date) : b.stars - a.stars || b.date.localeCompare(a.date)));
  const tokens = isMe ? world.ecoTokens : user.ecoTokens
  const level = levelFor(tokens);

  const submitRating = () => {
    if (!myRating) {
      toast('Pick a star rating first', 'Hover over the stars and click to choose.', 'warning');
      return;
    }

    rateUser(user.id, myRating)
    setSubmitted(true)
  };

  const submitComment = () => {
    if (commentText.trim().length < 3) {
      toast('Write a few words first', 'Your neighbours love detailed reviews.', 'warning');
      return
    }
    addComment(user.id, commentStars, commentText.trim());
    setCommentText('');
  }

  return (
    <div>
      <button type="button" onClick={() => navigate(-1)} className="mb-4 flex cursor-pointer items-center gap-1.5 text-sm font-bold text-ink-muted hover:text-ink">	
        <ArrowLeft size={16} /> Back
      </button>

      <Stagger className="space-y-5">
        <Card padded={false} className="overflow-hidden">   
          <div className="relative h-32 bg-gradient-to-r from-sun-300 via-sun-200 to-leaf-200">
            <motion.div className="absolute top-4 right-16 size-24 rounded-full bg-sun-400/60 blur-md" animate={{ scale: [1, 1.12, 1] }} transition={{ duration: 4, repeat: Infinity }} />
            <Sun className="absolute top-6 right-[86px] text-white/80" size={44} />
          </div>
          <div className="px-7 pb-6">
            <div className="relative z-10 -mt-12 flex items-end justify-between gap-4">
              <div className="flex items-end gap-4">
                <Avatar initials={user.initials} color={user.avatarColor} size={104} className="border-4 border-surface shadow-lift" />
                <div className="pb-1">
                  <h1 className="flex items-center gap-2 text-[28px] font-black text-ink">
                    {user.name} {user.verified && <VerifiedBadge size={22} />}
                  </h1>
                  <p className="flex items-center gap-3 text-sm font-semibold text-ink-muted">
                    <span className="flex items-center gap-1"><MapPin size={14} />{user.city}, {user.country}</span>
                    {!isMe && <span>{km(distanceKm(me, user))} from you</span>}
                    <span className="flex items-center gap-1">
											<Stars value={user.rating} /> <b className="text-ink">{user.rating.toFixed(1)}</b> ({user.ratingCount})
                    </span>
                  </p>  
                </div>
              </div>
              {!isMe && (
                <div className="flex gap-2 pb-1">
                  <Button variant="outline" icon={<MessageCircle size={16} />} onClick={() => navigate(`/messages?thread=${ensureThread(user.id)}`)}>
                    Send message
                  </Button>
                  {user.role === 'seller' && (
                    <Button variant="secondary" icon={<ShoppingBasket size={16} />} onClick={() => setBuyOpen(true)}>
                      Buy energy
                    </Button>
                  )}
                </div>
              )}
            </div>
            <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-ink-soft">{user.bio}</p>
            <div className="mt-5 grid grid-cols-5 gap-3">
              <HeaderStat icon={<Zap size={12} />} label="Surplus now" value={user.role === 'seller' ? kwh(user.surplusKwh) : '-'} />
              <HeaderStat icon={<Gauge size={12} />} label="Price" value={user.role === 'seller' ? `${eur(user.pricePerKwh)}/kWh` : '-'} />
              <HeaderStat icon={<Sun size={12} />} label="Panel size" value={user.panelKwp ? `${user.panelKwp} kWp` : 'No panels'} />
              <HeaderStat icon={<BatteryCharging size={12} />} label="Battery" value={user.hasBattery ? `${user.batteryKwh} kWh` : 'None'} />
              <HeaderStat icon={<Cpu size={12} />} label="Inverter" value={<span className="block truncate text-sm">{user.inverter}</span>} />
              <HeaderStat icon={<CalendarDays size={12} />} label="Member since" value={new Date(user.joinedAt).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })} />  
              <HeaderStat icon={<Trophy size={12} />} label="Trades" value={<AnimatedNumber value={user.tradesCompleted} />} />
              <HeaderStat icon={<Clock size={12} />} label="Responds" value={<span className="text-sm">{user.responseTime}</span>} />   
              <HeaderStat icon={<Coins size={12} />} label="EcoTokens level" value={<span className="text-base whitespace-nowrap text-leaf-700">{level.name}</span>} />
              <HeaderStat icon={<MapPin size={12} />} label="Microgrid" value={<span className="text-sm">{user.microgridId ? 'Member' : 'Not yet'}</span>} />
            </div>
          </div>
        </Card>


        <div className="grid grid-cols-[1.4fr_1fr_1fr] gap-5">
          <Card>
            <CardTitle icon={<BarChart3 size={18} />} title="Energy sold over 12 months" subtitle={`${kwh(soldByMonth.reduce((s, m) => s + m.kwh, 0), 0)} in total`} />
            <ResponsiveContainer width="100%" height={190}>
              <BarChart data={soldByMonth} margin={{ top: 4, right: 4, left: -16, bottom: 0 }} barCategoryGap="24%">
                <CartesianGrid vertical={false} stroke={AXIS.grid} />
                <XAxis dataKey="label" tick={AXIS.tick} axisLine={{ stroke: AXIS.line }} tickLine={false} interval={0} />
                <YAxis tick={AXIS.tick} axisLine={false} tickLine={false} width={44} />
                <Tooltip
                  cursor={{ fill: 'rgba(246,201,69,0.12)' }}
                  content={({ active, payload }) => {
                    const p = payload?.[0]?.payload as { label: string; kwh: number } | undefined
                    if (!active || !p) return null;
                    return <ChartTooltipCard title={p.label} rows={[{ label: 'Sold', value: kwh(p.kwh), color: SERIES.exported }]} />;
                  }}
                />
                <Bar dataKey="kwh" fill={SERIES.exported} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
          <Card>
            <CardTitle icon={<History size={18} />} title="Trade history" subtitle="Last 10 trades" />
            <ul className="max-h-[200px] space-y-2 overflow-y-auto pr-1">
              {history.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-2 text-xs">
                  <span className="min-w-0">
                    <span className="block truncate font-extrabold text-ink">
                      {t.type === 'sale' ? 'Sold to' : 'Bought from'} {t.counterpartyName}
                    </span>
                    <span className="font-bold text-ink-muted">
                      {kwh(t.kwh)} - {relativeTime(t.date)}
                    </span>
                  </span>
                  <span className={cn('shrink-0 font-black', t.type === 'sale' ? 'text-leaf-700' : 'text-ink')}>{eur(t.total)}</span>
                </li>
              ))}
            </ul>
          </Card>
          <Card>
            <CardTitle icon={<Tag size={18} />} title="Active offers" subtitle={user.role === 'seller' ? 'Available right now' : 'Buyer - no offers'} />
            {(() => {
              const offers = world.offers.filter((o) => o.sellerId === user.id && o.status === 'active').slice(0, 4);
              if (offers.length === 0) return <p className="rounded-xl bg-sun-50 p-3 text-sm font-semibold text-ink-muted">No active offers at the moment.</p>
              return (
                <ul className="space-y-2">
                  {offers.map((o) => (
                    <li key={o.id} className="flex items-center gap-2 rounded-xl border border-line-soft p-2.5">
                      <span className="grid size-8 place-items-center rounded-lg bg-sun-100 text-amber-500">
                        <Zap size={15} />
                      </span>
                      <span className="flex-1 text-xs">
                        <span className="block font-extrabold text-ink">
                          {kwh(o.kwh)} at {eur(o.pricePerKwh)}
                        </span>
                        <span className="font-bold text-ink-muted">
                          {dateShort(o.date)}, {hourLabel(o.fromHour)}-{hourLabel(o.toHour)}
                        </span>	
                      </span>
                      {!isMe && (
                        <Button size="sm" onClick={() => navigate('/trade')}>
                          View
												</Button>
                      )}
                    </li>
                  ))}
                </ul>
              );
            })()}
          </Card>
        </div>

        <div className="grid grid-cols-[1fr_2fr] gap-5">
          <div className="space-y-5">
            {!isMe && (
              <Card>
                <CardTitle icon={<Star size={18} />} title={`Rate ${user.name.split(' ')[0]}`} subtitle="How was your last trade?" />
                <AnimatePresence mode="wait">
                  {submitted ? (
                    <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="rounded-2xl bg-leaf-50 p-4 text-center">
                      <Stars value={myRating} size={22} className="justify-center" />
                      <p className="mt-2 font-extrabold text-leaf-700">Thanks for rating!</p>
                      <p className="text-sm text-ink-soft">
                        New average: <b>{user.rating.toFixed(1)}</b> from {user.ratingCount} ratings
                      </p>
                      <button type="button" onClick={() => setSubmitted(false)} className="mt-2 cursor-pointer text-xs font-bold text-leaf-600 hover:underline">
                        Rate again
                      </button>
                    </motion.div>
                  ) : (
                    <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <div className="flex flex-col items-center gap-2 rounded-2xl bg-sun-50 p-4">
                        <StarInput value={myRating} onChange={setMyRating} size={34} />
                        <p className="h-5 text-sm font-extrabold text-ink-soft">{RATING_LABELS[myRating] || 'Tap a star'}</p>
                      </div>
                      <Button className="mt-3 w-full" onClick={submitRating}>
                        Submit rating
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            )}
            <Card>
              <CardTitle icon={<Star size={18} />} title="Rating breakdown" />
              {[5, 4, 3, 2, 1].map((s) => {
                const share = s === 5 ? 0.62 : s === 4 ? 0.26 : s === 3 ? 0.08 : s === 2 ? 0.03 : 0.01;
                return (
                  <div key={s} className="mb-2 flex items-center gap-2 text-sm font-bold text-ink-soft">
                    <span className="w-3">{s}</span>
                    <Star size={13} className="text-amber-500" fill="#F6C945" />
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-sun-100">
                      <motion.div className="h-full rounded-full bg-sun-400" initial={{ width: 0 }} animate={{ width: `${share * 100}%` }} transition={{ duration: 0.8, delay: 0.1 * (5 - s) }} />
                    </div>
                    <span className="w-9 text-right text-xs">{Math.round(share * user.ratingCount)}</span>
                  </div>
                );
              })}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {user.microgridId && <Badge tone="leaf">Microgrid member</Badge>}
                {user.verified && <Badge tone="sun">Verified prosumer</Badge>}
                <Badge tone="neutral">{user.role === 'seller' ? 'Seller' : 'Buyer'}</Badge>
              </div>
            </Card>
          </div>

          <Card>
            <CardTitle
              icon={<MessageSquareText size={18} />}
              title="Comments"
              subtitle={`${comments.length} reviews from neighbours`}
              action={
                <Segmented
                  size="sm"
                  layoutId="comment-sort"
                  value={commentSort}
                  onChange={setCommentSort}
                  options={[
                    { value: 'newest', label: 'Newest' },
                    { value: 'highest', label: 'Highest' },
                  ]}
                />  
              }
            />
            {!isMe && (
              <div className="mb-5 rounded-2xl border border-line bg-sun-50/60 p-4">
                <div className="mb-2 flex items-center justify-between">	
                  <p className="text-sm font-extrabold text-ink">Add comment</p>
                  <StarInput value={commentStars} onChange={setCommentStars} size={20} />
                </div>
                <textarea	
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder={`Share your experience trading with ${user.name.split(' ')[0]}...`} 
                  rows={3}
                  className="w-full resize-none rounded-xl border border-line bg-surface p-3 text-sm font-semibold text-ink outline-none transition placeholder:font-medium placeholder:text-ink-muted/70 focus:border-sun-400 focus:ring-4 focus:ring-sun-200/60"
	                />
                <div className="mt-2 flex justify-end">
                  <Button size="sm" variant="secondary" icon={<Send size={14} />} onClick={submitComment}>
                    Post comment
                  </Button>
                </div>
              </div>
            )}
            {comments.length === 0 ? (
              <EmptyState title="No comments yet" text="Be the first to leave a review." />
            ) : (
              <ul className="space-y-3"> 
                <AnimatePresence initial={false}>
                  {comments.map((c) => {
                    const author = getUser(c.authorId)

                    return (
                      <motion.li
                        key={c.id}
                        layout
                        initial={{ opacity: 0, y: -16, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.5 }}
                        className={cn('flex gap-3 rounded-2xl border border-line-soft p-3.5', Date.now() - new Date(c.date).getTime() < 10000 && 'flash-new')}
                      >
                        <Avatar initials={author?.initials ?? '?'} color={author?.avatarColor ?? '#F6C945'} size={38} />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <button type="button" onClick={() => author && navigate(`/users/${author.id}`)} className="cursor-pointer text-sm font-extrabold text-ink hover:underline">
                              {c.authorName}
                              {c.authorId === me.id && <span className="ml-1.5 text-xs font-bold text-leaf-600">(you)</span>}
                            </button>
                            <span className="text-xs font-bold text-ink-muted">{dateLong(c.date)}</span>
                          </div>
                          <Stars value={c.stars} size={12} />
                          <p className="mt-1 text-sm text-ink-soft">{c.text}</p>
                        </div>
                      </motion.li>  
                    )
                  })}
                </AnimatePresence>
              </ul>
            )}
          </Card>   
        </div>
      </Stagger>

      <BuyEnergyModal seller={user.role === 'seller' ? user : null} open={buyOpen} onClose={() => setBuyOpen(false)} />
    </div>
  );
}
