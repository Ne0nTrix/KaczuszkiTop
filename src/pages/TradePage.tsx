import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeftRight,
	Check,
  Clock,
  HandCoins,
  Loader2,
  MapPin,
  Plug,
  Plus,
  Search,
	ShoppingBasket,
  Sparkles,   
  Star,
	Store,
  Tag,  
  TrendingDown,
  TrendingUp,
	X,
  Zap,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom';
import type { Offer, OfferStatus, User } from '../types';
import { Legend } from '../components/charts/chartTheme';
import { CounterOfferModal } from '../components/trade/CounterOfferModal'
import { PriceChart } from '../components/trade/PriceChart';
import { SellOfferForm } from '../components/trade/SellOfferForm';
import type { SellPrefill } from '../components/trade/SellOfferForm'
import { Avatar } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card, CardTitle, Stagger } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { Field, Input, Select } from '../components/ui/Field';
    

import { PageHeader } from '../components/ui/PageHeader'
import { Segmented } from '../components/ui/Segmented';
import { PageSkeleton } from '../components/ui/Skeleton';
import { VerifiedBadge } from '../components/ui/VerifiedBadge';
import { COUNTRIES, countryName } from '../data/countries';
import { REQUEST_WHEN } from '../data/phrases';
import { cn } from '../lib/cn';
import { dateShort, eur, hourLabel, km, kwh, relativeTime } from '../lib/format'
import { distanceKm, nearness } from '../lib/geo';
import { usePageLoading } from '../lib/useFakeQuery';
import { useApp } from '../state/AppStateProvider'
import { useMarket } from '../state/MarketProvider'	
    


type Tab = 'market' | 'mine' | 'requests'
type SortKey = 'distance' | 'price' | 'rating' | 'amount'

const PAGE = 20;

const STATUS_BADGE: Record<OfferStatus, { label: string; tone: 'leaf' | 'sun' | 'sky' | 'neutral' | 'orange' }> = {
  active: { label: 'Active', tone: 'leaf' },
	'counter-offered': { label: 'Counter-offered', tone: 'orange' },
  sold: { label: 'Sold', tone: 'sky' },
  expired: { label: 'Expired', tone: 'neutral' },
};

function windowLabel(o: Offer) {
  return `${dateShort(o.date)}, ${hourLabel(o.fromHour)}-${hourLabel(o.toHour)}`;
}

interface MarketRow {
  offer: Offer
  seller: User
	  distance: number
}

function MarketOfferRow({ row, onAccept, onCounter }: { row: MarketRow; onAccept: () => void; onCounter: () => void }) {
  const { offer, seller, distance } = row;
  const counter = offer.myCounter;
	const navigate = useNavigate();
  return (
    <motion.li
      layout="position"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}  
      exit={{ opacity: 0, x: 40 }}
      className="flex items-center gap-4 rounded-2xl border border-line bg-surface p-3.5 transition hover:shadow-soft"
    >
      <button type="button" onClick={() => navigate(`/users/${seller.id}`)} className="cursor-pointer">
        <Avatar initials={seller.initials} color={seller.avatarColor} size={44} />
			</button>
      <div className="min-w-0 flex-1">
				<p className="flex items-center gap-1.5 font-extrabold text-ink">
          <span className="truncate">{seller.name}</span> {seller.verified && <VerifiedBadge size={14} />}
          <span className="flex shrink-0 items-center gap-0.5 text-xs font-bold text-ink-muted">
            <Star size={11} className="text-amber-500" fill="#F6C945" />
            {seller.rating.toFixed(1)}
          </span>
          {Date.now() - new Date(offer.createdAt).getTime() < 60000 && <Badge tone="orange">New</Badge>}
        </p>
        <p className="flex items-center gap-3 text-xs font-bold text-ink-muted">
					<span className="flex items-center gap-1">
            <MapPin size={12} />
            {seller.city} <b className="text-ink-soft">{seller.country}</b> - {km(distance)}
          </span>
          <span className="flex items-center gap-1">
            <Clock size={12} />
						{windowLabel(offer)}
          </span>
          <span>{relativeTime(offer.createdAt)}</span>
        </p>
			</div>
      <div className="w-24 text-right">
        <p className="text-lg font-black text-leaf-700">{kwh(offer.kwh)}</p>
        <p className="text-xs font-bold text-ink-soft">{eur(offer.pricePerKwh)} / kWh</p>	
      </div>
			<div className="flex w-[250px] justify-end gap-2">
				{!counter || counter.status === 'declined' ? (
          <>
            {counter?.status === 'declined' && <Badge tone="loss">Declined</Badge>}
            <Button size="sm" variant="outline" icon={<HandCoins size={14} />} onClick={onCounter}>
							Counter offer
            </Button>
            <Button size="sm" icon={<Check size={14} />} onClick={onAccept}>
              Accept
            </Button>
          </>
        ) : counter.status === 'pending' ? (
          <Badge tone="sun" icon={<Loader2 size={12} className="animate-spin" />} className="py-1.5">
            Counter offer sent - {eur(counter.pricePerKwh)}
          </Badge>
        ) : (
          <Button size="sm" variant="secondary" icon={<ShoppingBasket size={14} />} onClick={onAccept}>
            Buy at {eur(counter.pricePerKwh)}
          </Button>
        )}
      </div>
    </motion.li>
  );
}


function MyOfferCard({ offer }: { offer: Offer }) { 
	const { getUser, acceptIncomingCounter, declineIncomingCounter, cancelOffer } = useApp();
  const counterUser = offer.incomingCounter ? getUser(offer.incomingCounter.fromUserId) : undefined;
  const badge = STATUS_BADGE[offer.status];
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: -12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
			className={cn(
				'rounded-2xl border p-4',
				offer.status === 'counter-offered' ? 'border-orange-500/40 bg-orange-100/40 shadow-soft' : 'border-line bg-surface',
				(offer.status === 'expired' || offer.status === 'sold') && 'opacity-75',
			)}
    >
      <div className="flex items-center gap-3">
				<span className="grid size-10 place-items-center rounded-xl bg-sun-100 text-amber-500">
					<Zap size={18} />
        </span>
        <div className="flex-1">
          <p className="font-extrabold text-ink">
            {kwh(offer.kwh)} at {eur(offer.pricePerKwh)} / kWh
          </p>
					<p className="text-xs font-bold text-ink-muted">
            {windowLabel(offer)} - total {eur(offer.kwh * offer.pricePerKwh)}
					</p>
        </div>
        <Badge tone={badge.tone}>{badge.label}</Badge>
        {offer.status === 'active' && (
          <Button size="sm" variant="ghost" onClick={() => cancelOffer(offer.id)}>
            Withdraw
          </Button>
        )}
      </div>
      {offer.status === 'counter-offered' && offer.incomingCounter && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-3 flex items-center gap-3 rounded-xl border border-orange-100 bg-surface p-3">
					{counterUser && <Avatar initials={counterUser.initials} color={counterUser.avatarColor} size={34} />}
          <p className="flex-1 text-sm font-semibold text-ink-soft">
						<b className="text-ink">{counterUser?.name ?? 'A neighbour'}</b> offers <b className="text-ink">{eur(offer.incomingCounter.pricePerKwh)} / kWh</b>
            <span className="block text-xs text-ink-muted">
              New total {eur(offer.incomingCounter.pricePerKwh * offer.kwh)} - {relativeTime(offer.incomingCounter.createdAt)}
            </span>
          </p>
					<Button size="sm" variant="danger" icon={<X size={14} />} onClick={() => declineIncomingCounter(offer.id)}>
            Decline
          </Button>
					<Button size="sm" variant="secondary" icon={<Check size={14} />} onClick={() => acceptIncomingCounter(offer.id)}>
            Accept
          </Button>
        </motion.div>
      )}
    </motion.li>
  )
}

function RequestForm() {
  const { createRequest } = useApp()
  const [amount, setAmount] = useState('5');
  const [when, setWhen] = useState('tonight');
  const [maxPrice, setMaxPrice] = useState('0.21');
  return (
    <div className="space-y-3.5">
      <div className="rounded-2xl bg-sky-100/70 p-4 text-center">
        <p className="text-xs font-extrabold tracking-wide text-sky-500 uppercase">Preview</p>
        <p className="mt-1 text-xl font-black text-ink">
          "I need {amount || 0} kWh {when}"
        </p>
			</div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Amount" hint="kWh">
					<Input type="number" min="1" max="30" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </Field>
        <Field label="Max price" hint="EUR / kWh">
          <Input type="number" step="0.01" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
        </Field>
      </div>
      <Field label="When">
	        <Select value={when} onChange={(e) => setWhen(e.target.value)}>
					{REQUEST_WHEN.map((w) => (
            <option key={w}>{w}</option>
          ))}	
				</Select>
      </Field>
      <Button
        variant="secondary"
				size="lg"
        className="w-full"
        icon={<Plug size={18} />}
        onClick={() => createRequest({ kwh: Math.max(1, Number(amount) || 5), when, maxPrice: Number(maxPrice) || 0.21 })}
			>  
        Post buy request
      </Button>
    </div>
  );
}

export function TradePage() {
	  const { world, me, getUser, acceptOffer, sendCounterOffer, fulfillRequest } = useApp();
	const { currentPrice, trend, bestHours, priceCountry, setPriceCountry, prices } = useMarket();
	const retailGrid = (prices.reduce((s, p) => s + p.price, 0) / prices.length) * 1.25
  const loading = usePageLoading();
	const navigate = useNavigate();
  const [params, setParams] = useSearchParams()
  const tab = (params.get('tab') as Tab) || 'market'
  const [sortBy, setSortBy] = useState<SortKey>('distance');
	const [query, setQuery] = useState('');
	const [countryFilter, setCountryFilter] = useState('all')
	const [page, setPage] = useState(PAGE);  
	const [counterOffer, setCounterOffer] = useState<Offer | null>(null);

  const prefill = useMemo<SellPrefill | undefined>(() => {
    if(!params.get('prefill')) return undefined;
    const num = (key: string) => (params.get(key) ? Number(params.get(key)) : undefined);
    return { kwh: num('kwh'), date: params.get('date') ?? undefined, fromHour: num('from') ?? 11, toHour: num('to') ?? 15 }
  }, [params]);

  const setTab = (next: Tab) => setParams(next === 'market' ? {} : { tab: next });

	const marketOffers: MarketRow[] = useMemo(
    () =>
      world.offers
				.filter((o) => o.sellerId !== 'me' && o.status === 'active')
        .map((o) => ({ offer: o, seller: world.users.find((u) => u.id === o.sellerId) }))
        .filter((x): x is { offer: Offer; seller: User } => !!x.seller)
        .map((x) => ({ ...x, distance: distanceKm(me, x.seller) })),
    [world.offers, world.users, me],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
		const list = marketOffers.filter(
      (r) => (countryFilter === 'all' || r.seller.country === countryFilter) && (!q || r.seller.name.toLowerCase().includes(q) || r.seller.city.toLowerCase().includes(q)),
		)
    const by: Record<SortKey, (a: MarketRow, b: MarketRow) => number> = {
      distance: (a, b) => a.distance - b.distance,
      price: (a, b) => a.offer.pricePerKwh - b.offer.pricePerKwh,
      rating: (a, b) => b.seller.rating - a.seller.rating,
      amount: (a, b) => b.offer.kwh - a.offer.kwh,
    }
    return list.sort(by[sortBy]);
  }, [marketOffers, query, countryFilter, sortBy]);

  const bestMatch = useMemo(() => {
    const score = (m: MarketRow) => 0.6 * nearness(m.distance) + 4 * m.offer.pricePerKwh;
    return [...marketOffers].filter((m) => !m.offer.myCounter || m.offer.myCounter.status === 'declined').sort((a, b) => score(a) - score(b))[0];


  }, [marketOffers]);

  const myOffers = world.offers
    .filter((o) => o.sellerId === 'me')
	    .sort((a, b) => {
			const rank = (s: OfferStatus) => ({ 'counter-offered': 0, active: 1, sold: 2, expired: 3 })[s];
      return rank(a.status) - rank(b.status) || b.createdAt.localeCompare(a.createdAt);
		});
	const pendingCounters = myOffers.filter((o) => o.status === 'counter-offered').length;
	const sortedRequests = useMemo(() => {
    const open = world.requests.filter((r) => r.status === 'open');   
    const dist = (id: string) => distanceKm(me, world.users.find((u) => u.id === id) ?? me)
    return open.sort((a, b) => Number(b.buyerId === 'me') - Number(a.buyerId === 'me') || dist(a.buyerId) - dist(b.buyerId));
  }, [world.requests, world.users, me]);

	if(loading) return <PageSkeleton />

  return (
    <div>
      <PageHeader
        icon={<ArrowLeftRight size={24} />}
        title="Trade energy"
        subtitle={`${marketOffers.length} live offers across the EU - buy and sell solar surplus directly`}
        actions={
          <Button icon={<Plus size={16} />} onClick={() => setTab('mine')}>
            New sell offer
					</Button>
        }
      />

			<Stagger className="space-y-5">
				<div className="grid grid-cols-[2fr_1fr] gap-5">
          <Card>
            <CardTitle
              icon={<TrendingUp size={18} />} 
              title={`Market prices today - ${countryName(priceCountry)}`}
              subtitle="Hourly grid price - shaded hours are the best selling windows"
              action={
								<div className="flex items-start gap-3"> 
                  <Select value={priceCountry} onChange={(e) => setPriceCountry(e.target.value)} className="h-9 w-[92px] text-xs" aria-label="Price country">
                    {COUNTRIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code}
                      </option>
                    ))}
                  </Select>
                  <div className="text-right">
                    <p className="flex items-center justify-end gap-1.5 text-xl font-black whitespace-nowrap text-ink tabular-nums 2xl:text-2xl">
                      {eur(currentPrice, 3)}
											{trend > 0 ? <TrendingUp size={18} className="text-orange-500" /> : <TrendingDown size={18} className="text-leaf-500" />}
										</p>
                    <p className="text-xs font-bold whitespace-nowrap text-ink-muted">live price / kWh</p>
                  </div>
                </div>
              }
            />
						<PriceChart height={230} />
            <div className="mt-2 flex items-center justify-between">
							<Legend  
                items={[ 
                  { label: 'Market price', color: '#E2A400' },
                  { label: 'Now', color: 'var(--color-leaf-700)', dashed: true },   
                ]}
							/>
							<p className="flex items-center gap-1.5 text-xs font-bold text-leaf-700">
                <span className="size-3 rounded bg-leaf-500/25" /> Best windows: {bestHours.map((h) => hourLabel(h)).join(', ')}
							</p>
						</div>
          </Card>

          <Card className="relative overflow-hidden bg-gradient-to-br from-surface to-leaf-50">
            <motion.div className="absolute -top-12 -right-12 size-40 rounded-full bg-sun-300/40 blur-2xl" animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 5, repeat: Infinity }} />
            <CardTitle icon={<Sparkles size={18} />} title="Automatic matching" subtitle="Nearest + cheapest offer for you" />	
            {bestMatch ? (
							<div className="relative">
                <p className="text-lg leading-snug font-black text-ink">We found the best offer for you</p>
                <div className="mt-3 flex items-center gap-3 rounded-2xl border border-line bg-surface p-3">
                  <Avatar initials={bestMatch.seller.initials} color={bestMatch.seller.avatarColor} size={44} />
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1 font-extrabold text-ink">
                      <span className="truncate">{bestMatch.seller.name}</span> {bestMatch.seller.verified && <VerifiedBadge size={14} />}
                    </p>
                    <p className="text-xs font-bold text-ink-muted">
											{km(bestMatch.distance)} away - {windowLabel(bestMatch.offer)}  
                    </p>   
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl bg-sun-50 p-2">
                    <p className="text-base font-black text-ink">{kwh(bestMatch.offer.kwh)}</p>
										<p className="text-[11px] font-bold text-ink-muted">amount</p>
                  </div>
									<div className="rounded-xl bg-sun-50 p-2">
                    <p className="text-base font-black text-ink">{eur(bestMatch.offer.pricePerKwh)}</p>
                    <p className="text-[11px] font-bold text-ink-muted">per kWh</p>
                  </div>
									<div className="rounded-xl bg-leaf-100 p-2">   
										<p className="text-base font-black text-leaf-700">{Math.round((bestMatch.offer.pricePerKwh / retailGrid - 1) * 100)}%</p>
                    <p className="text-[11px] font-bold text-ink-muted">vs retail grid</p>
                  </div>
                </div>
								<Button variant="secondary" size="lg" className="mt-4 w-full" icon={<Check size={18} />} onClick={() => acceptOffer(bestMatch.offer.id)}>
									Accept with one click
                </Button>
              </div>
            ) : (
              <EmptyState title="No offers right now" text="We will notify you when a neighbour lists surplus." />
            )}
          </Card>
        </div>
   
        <Card>	
          <div className="mb-4 flex items-center justify-between">  
						<Segmented	
							layoutId="trade-tabs"
              value={tab}
              onChange={setTab}
    
              options={[
                { value: 'market', label: 'Marketplace', icon: <Store size={15} /> },
								{ value: 'mine', label: 'My offers', icon: <Tag size={15} />, badge: pendingCounters },
                { value: 'requests', label: 'Buy requests', icon: <Plug size={15} /> },
              ]}  
            />
            {tab === 'market' && <p className="text-sm font-bold text-ink-muted">{filtered.length} offers</p>}
          </div>

          <AnimatePresence mode="wait">
						<motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
              {tab === 'market' && (
                <>
                  <div className="mb-4 flex flex-wrap items-center gap-3">
										<div className="relative min-w-[220px] flex-1">
                      <Search size={15} className="absolute top-1/2 left-3 -translate-y-1/2 text-ink-muted" />
                      <input
                        value={query}
                        onChange={(e) => {
                          setQuery(e.target.value);
                          setPage(PAGE);
                        }}
                        placeholder="Search seller or city"
												className="h-10 w-full rounded-xl border border-line bg-surface pr-3 pl-9 text-sm font-semibold text-ink outline-none focus:border-sun-400"
                      />
                    </div>
										<div className="w-44 shrink-0">
                      <Select
												value={countryFilter}
                        onChange={(e) => {
                          setCountryFilter(e.target.value);
                          setPage(PAGE);
                        }}
												className="h-10"
                        aria-label="Country"
                      >
                        <option value="all">All countries</option>
													{COUNTRIES.map((c) => (
													<option key={c.code} value={c.code}>
                            {c.code} - {c.name}
                          </option>
                        ))}
                      </Select>
                    </div>
										<Segmented
                      size="sm"
                      layoutId="market-sort"
                      value={sortBy}
                      onChange={setSortBy}
											options={[	
                        { value: 'distance', label: 'Distance' },
                        { value: 'price', label: 'Price' },
                        { value: 'rating', label: 'Rating' },
												{ value: 'amount', label: 'Amount' },
											]}
                    />
									</div>
                  {filtered.length === 0 ? (
										<EmptyState title="No offers match" text="Try another country or clear the search." />
                  ) : (
										<ul className="space-y-2.5">
                      <AnimatePresence initial={false}>
                        {filtered.slice(0, page).map((row) => (
                          <MarketOfferRow key={row.offer.id} row={row} onAccept={() => acceptOffer(row.offer.id)} onCounter={() => setCounterOffer(row.offer)} />
                        ))}

                      </AnimatePresence>
                    </ul>
                  )}   
									{filtered.length > page && (
                    <div className="mt-4 flex justify-center">
                      <Button variant="outline" onClick={() => setPage((p) => p + PAGE)}>
                        Show more offers ({filtered.length - page} more)
                      </Button>
                    </div>
                  )}
                </>
              )}

              {tab === 'mine' && (
                <div className="grid grid-cols-[400px_1fr] gap-6">
									<div className="rounded-2xl border border-line bg-sun-50/50 p-5">
                    <p className="mb-4 flex items-center gap-2 font-extrabold text-ink">
											<Tag size={17} className="text-amber-500" /> Create a sell offer
                    </p>
                    <SellOfferForm prefill={prefill} />
									</div>
									<div>
										<p className="mb-3 text-sm font-extrabold text-ink">Your offers ({myOffers.length})</p>
                    {myOffers.length === 0 ? (
                      <EmptyState title="No offers yet" text="List your first surplus - it takes 10 seconds." />
                    ) : (
                      <ul className="space-y-2.5">
                        {myOffers.map((o) => (
                          <MyOfferCard key={o.id} offer={o} />
                        ))}
                      </ul>
										)}
                  </div>
                </div>
              )}

              {tab === 'requests' && (
                <div className="grid grid-cols-[360px_1fr] gap-6">
                  <div className="rounded-2xl border border-line bg-sky-100/30 p-5">
                    <p className="mb-4 flex items-center gap-2 font-extrabold text-ink">
                      <Plug size={17} className="text-sky-500" /> Request energy
                    </p>
                    <RequestForm />
                  </div>
                  <div>  
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-sm font-extrabold text-ink">Open requests ({sortedRequests.length})</p>
                      <Button size="sm" variant="ghost" icon={<MapPin size={14} />} onClick={() => navigate('/map')}>
                        See on map
                      </Button>
										</div>
                    <ul className="max-h-[640px] space-y-2.5 overflow-y-auto pr-1">
                      <AnimatePresence initial={false}>
                        {sortedRequests.map((r) => {
													const buyer = getUser(r.buyerId);
                          if (!buyer) return null;
                          const mine = r.buyerId === 'me';
													return (
                            <motion.li
															key={r.id}
                              layout
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, x: 40 }}
															className={cn('flex items-center gap-3 rounded-2xl border p-3.5', mine ? 'border-sky-500/40 bg-sky-100/50' : 'border-line bg-surface')}
                            >
															<Avatar initials={buyer.initials} color={mine ? me.avatarColor : '#3B9BC4'} size={40} />
                              <div className="flex-1">
                                <p className="font-extrabold text-ink">
																	"I need {r.kwh} kWh {r.when}"
																</p>
                                <p className="text-xs font-bold text-ink-muted">
                                  {mine ? 'Your request' : buyer.name} - {buyer.city} {buyer.country}
                                  {!mine && ` - ${km(distanceKm(me, buyer))}`} - up to {eur(r.maxPrice)} / kWh - {relativeTime(r.createdAt)}
                                </p>
                              </div>
                              {mine ? (
	                                <Badge tone="sky">Waiting for sellers</Badge>
															) : (
                                <Button size="sm" variant="secondary" icon={<Zap size={14} />} onClick={() => fulfillRequest(r.id)}>
                                  Offer energy
																</Button>
																)}	
                            </motion.li>	
                          );
                        })}
                      </AnimatePresence>
                    </ul> 
									</div>
                </div>
							)}   
            </motion.div>
					</AnimatePresence>
				</Card>
			</Stagger>

      <CounterOfferModal
        offer={counterOffer}
        seller={counterOffer ? getUser(counterOffer.sellerId) : undefined}
				onClose={() => setCounterOffer(null)}
        onSubmit={(price) => {
          if (counterOffer) sendCounterOffer(counterOffer.id, price);
          setCounterOffer(null);
        }}
			/>
		</div>
	);  
}
