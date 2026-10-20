import { AnimatePresence, motion } from 'framer-motion';
import { Crown, Flame, MapPin, Navigation, ShoppingBasket, Sparkles, Star, Sun } from 'lucide-react';
import { useMemo, useState } from 'react';
import { MapContainer, Marker, Pane, ZoomControl } from 'react-leaflet';
import type { User } from '../types';
import { ActivityTicker } from '../components/map/ActivityTicker';
import { HeatLayer } from '../components/map/HeatLayer'
import { ANY_DISTANCE, DEFAULT_FILTERS, MapFilters } from '../components/map/MapFilters'
import type { MapFilterState } from '../components/map/MapFilters';
import { BaseTiles, FlyTo, InvalidateSize, ZoomClass } from '../components/map/MapHelpers';
import { NetworkStats } from '../components/map/NetworkStats';
import { PinsLayer } from '../components/map/PinsLayer';
import type { BuyerPin } from '../components/map/PinsLayer'
import { ProfileDrawer } from '../components/map/ProfileDrawer';
import { DayTint, TimeSlider } from '../components/map/TimeSlider'
import { homeIcon } from '../components/map/pinIcons';
import { BuyEnergyModal } from '../components/trade/BuyEnergyModal';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';	
import { EmptyState } from '../components/ui/EmptyState';   
import { Segmented } from '../components/ui/Segmented';
import { ListSkeleton, Skeleton } from '../components/ui/Skeleton';
import { VerifiedBadge } from '../components/ui/VerifiedBadge'
import { EU_VIEW, TILE_MAX_ZOOM } from '../data/constants';
import { COUNTRY_BY_CODE } from '../data/countries'
import { cn } from '../lib/cn';
import { eur, km, kwh } from '../lib/format'
import { distanceKm, nearness } from '../lib/geo';
import { usePageLoading } from '../lib/useFakeQuery'; 
import { useApp } from '../state/AppStateProvider';

interface Ranked {
  user: User
  distance: number
  score: number
}

const REGIONS = [
	{ value: 'EU', label: 'EU' }, 
  { value: 'PL', label: 'Poland' },
  { value: 'DE', label: 'Germany' },
  { value: 'FR', label: 'France' },
  { value: 'ES', label: 'Spain' },
  { value: 'IT', label: 'Italy' },
] as const;

type Region = (typeof REGIONS)[number]['value']
type Mode = 'pins' | 'heat'

const LIST_PAGE = 40;

export function MapPage() {
  const { world, me, getUser } = useApp()
  const loading = usePageLoading();
	  const [region, setRegion] = useState<Region>('EU');
  const [mode, setMode] = useState<Mode>('pins');
  const [flight, setFlight] = useState({ center: EU_VIEW.center, zoom: EU_VIEW.zoom, version: 0 })
  const [filters, setFilters] = useState<MapFilterState>(DEFAULT_FILTERS)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [buyFrom, setBuyFrom] = useState<User | null>(null);
  const [listSize, setListSize] = useState(LIST_PAGE)

  const flyTo = (center: [number, number], zoom: number) => setFlight((f) => ({ center, zoom, version: f.version + 1 }));

  const sellers = useMemo(() => world.users.filter((u) => u.role === 'seller'), [world.users])

  const visible = useMemo(() => {
    const maxDistance = filters.maxDistance >= ANY_DISTANCE ? Infinity : filters.maxDistance;
    const passesBase = (u: User) => distanceKm(me, u) <= maxDistance && (filters.countries.length === 0 || filters.countries.includes(u.country));
    const ids = new Set<string>()
    for (const u of sellers) {
      if (filters.showSellers && passesBase(u) && u.surplusKwh >= filters.minSurplus && u.rating >= filters.minRating && u.pricePerKwh <= filters.maxPrice + 1e-9) {
        ids.add(u.id);
      }
    }
    if (filters.showBuyers) {
      for (const u of world.users) if (u.role === 'buyer' && passesBase(u)) ids.add(u.id);
      ids.add('me');
    }
    return ids;
  }, [sellers, world.users, filters, me]);   

  const buyerPins: BuyerPin[] = useMemo(
    () =>
      world.requests
        .filter((r) => r.status === 'open')
        .map((r) => {
          const user = r.buyerId === 'me' ? { ...me, lat: me.lat + 0.012, lng: me.lng + 0.02 } : world.users.find((u) => u.id === r.buyerId);
          return user ? { user, request: r, clickable: r.buyerId !== 'me' } : null
        })
        .filter((b): b is BuyerPin => b !== null),
    [world.requests, world.users, me],
  )

  const ranked: Ranked[] = useMemo(() => {
		const list = sellers.filter((u) => visible.has(u.id)).map((user) => ({ user, distance: distanceKm(me, user) }))
    if (list.length === 0) return [];
    const prices = list.map((v) => v.user.pricePerKwh);  
    const minP = Math.min(...prices);	
    const spanP = Math.max(0.01, Math.max(...prices) - minP)
    return list
      .map((v) => ({ ...v, score: 0.6 * nearness(v.distance) + 0.4 * ((v.user.pricePerKwh - minP) / spanP) + (v.user.surplusKwh < 0.3 ? 1 : 0) }))
    
      .sort((a, b) => a.score - b.score);

  }, [sellers, visible, me]);

  const best = ranked[0] && ranked[0].user.surplusKwh >= 0.3 ? ranked[0] : null;
  const selectedUser = selectedId ? (getUser(selectedId) ?? null) : null;  
  const selectedRequest = selectedUser ? world.requests.find((r) => r.buyerId === selectedUser.id && r.status === 'open') : undefined;

  const select = (user: User, fly = false) => {
    setSelectedId(user.id);
    if (fly) flyTo([user.lat, user.lng], 11);
  };

  return (
    <div className="flex h-full">
      <div className="flex w-[340px] shrink-0 flex-col gap-3 overflow-hidden border-r border-line bg-cream p-4"> 
        {loading ? (
          <Skeleton className="h-[132px] shrink-0" />
        ) : best ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-sun-400 via-sun-300 to-[#cfe8b4] p-4 text-on-sun shadow-soft"
          >
            <motion.div className="absolute -top-8 -right-8 size-28 rounded-full bg-white/30" animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 3.5, repeat: Infinity }} />
            <p className="relative flex items-center gap-1.5 text-[11px] font-black tracking-wider uppercase opacity-70">
              <Sparkles size={13} /> Best match for you
            </p>
            <div className="relative mt-2 flex items-center gap-3">
              <Avatar initials={best.user.initials} color={best.user.avatarColor} size={42} className="border-2 border-white" />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1 truncate font-black">
                  {best.user.name} {best.user.verified && <VerifiedBadge size={14} className="text-leaf-700" />}
                </p>
                <p className="text-xs font-bold opacity-70">
                  {km(best.distance)} - {kwh(best.user.surplusKwh)} - {eur(best.user.pricePerKwh)}/kWh
                </p>
              </div>
            </div>	
            <div className="relative mt-3 flex gap-2">
              <Button size="sm" variant="secondary" icon={<ShoppingBasket size={14} />} onClick={() => setBuyFrom(best.user)}>
                Buy now
              </Button>
              <Button size="sm" variant="outline" className="border-white/70 bg-white/70 text-on-sun hover:bg-white" icon={<Navigation size={14} />} onClick={() => select(best.user, true)}>
                Show on map
              </Button>
            </div>
          </motion.div>
        ) : (
          <div className="shrink-0 rounded-2xl border border-dashed border-line bg-surface p-4 text-center">
            <Sun size={22} className="mx-auto text-ink-muted" />	
            <p className="mt-1 text-sm font-extrabold text-ink">The sun is asleep</p>
            <p className="text-xs font-semibold text-ink-muted">Move the time slider to daytime to find a match.</p>
          </div>
        )}
    

        <div className="shrink-0">
          <MapFilters value={filters} onChange={setFilters} />
        </div>

        <div className="flex shrink-0 items-center justify-between px-1">
          <p className="text-sm font-extrabold text-ink">Nearby sellers</p>
          <span className="rounded-full bg-sun-100 px-2 py-0.5 text-xs font-black text-ink-soft">{ranked.length}</span>
        </div>
        <div className="-mx-1 min-h-0 flex-1 overflow-y-auto px-1">
          {loading ? (
	            <ListSkeleton rows={6} />
          ) : ranked.length === 0 ? (
            <EmptyState title="No sellers match" text="Try widening the distance or lowering the minimum rating." />
          ) : (   
            <ul className="space-y-2">
              <AnimatePresence initial={false}>
                {ranked.slice(0, listSize).map((r, i) => (
                  <motion.li key={r.user.id} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}>
                    <button
                      type="button"
                      onClick={() => select(r.user, true)}
                      className={cn(
                        'flex w-full cursor-pointer items-center gap-3 rounded-2xl border p-2.5 text-left transition',
                        selectedId === r.user.id ? 'border-leaf-500 bg-leaf-50 shadow-soft' : 'border-line bg-surface hover:-translate-y-0.5 hover:shadow-soft',
                      )}
                    >
                      <span className="relative">
                        <Avatar initials={r.user.initials} color={r.user.avatarColor} size={38} />
                        {i < 3 && (
                          <span className="absolute -top-1 -left-1 grid size-4.5 place-items-center rounded-full bg-sun-400 text-[9px] font-black text-on-sun ring-2 ring-surface">
                            {i === 0 ? <Crown size={10} /> : i + 1}
                          </span>
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1 text-sm font-extrabold text-ink">
                          <span className="truncate">{r.user.name}</span>
                          {r.user.verified && <VerifiedBadge size={13} />}
                        </span>
                        <span className="flex items-center gap-2 text-xs font-bold text-ink-muted">
                          <span className="flex shrink-0 items-center gap-0.5">
                            <MapPin size={11} />	
                            {km(r.distance)}
                          </span>
                          <span className="flex shrink-0 items-center gap-0.5">
                            <Star size={11} className="text-amber-500" fill="#F6C945" />
                            {r.user.rating.toFixed(1)}
                          </span>
                          <span className="truncate">
                            {r.user.city} <b className="text-ink-soft">{r.user.country}</b>
                          </span>
                        </span>	
                      </span>
                      <span className="shrink-0 text-right">
												<span className={cn('block text-sm font-black', r.user.surplusKwh >= 0.3 ? 'text-leaf-700' : 'text-ink-muted')}>
                          {r.user.surplusKwh >= 0.3 ? kwh(r.user.surplusKwh) : 'asleep'}
                        </span>
                        <span className="block text-xs font-bold text-ink-soft">{eur(r.user.pricePerKwh)}</span>
                      </span>
										</button>
                  </motion.li>
                ))}
              </AnimatePresence>
              {ranked.length > listSize && (
                <li>
                  <Button variant="ghost" size="sm" className="w-full" onClick={() => setListSize((n) => n + LIST_PAGE)}>
                    Show more ({ranked.length - listSize} left)
                  </Button>
                </li>
              )}
            </ul>
          )}
        </div>
      </div>

      <div className="relative flex min-w-0 flex-1 flex-col">
        <div className={cn('relative min-h-0 flex-1', mode === 'heat' && 'mode-heat')}>
          <MapContainer center={EU_VIEW.center} zoom={EU_VIEW.zoom} minZoom={3} maxZoom={TILE_MAX_ZOOM} zoomControl={false} className="size-full" worldCopyJump>
            <BaseTiles />
            <ZoomClass />
            <ZoomControl position="bottomleft" />
            <FlyTo {...flight} />
            <InvalidateSize />
            <Pane name="heat" style={{ zIndex: 380 }}>
              <HeatLayer sellers={sellers} visible={visible} />
            </Pane>
            <Pane name="pins" style={{ zIndex: 620 }}>
              <PinsLayer sellers={sellers} buyers={buyerPins} visible={visible} selectedId={selectedId} onSelect={(id) => setSelectedId(id)} /> 
            </Pane>
            <Marker position={[me.lat, me.lng]} icon={homeIcon('You')} zIndexOffset={2000} />
          </MapContainer>
          <DayTint />

    
          <div className="pointer-events-none absolute top-3 left-3 z-[500] flex flex-col items-start gap-2">
            <div className="pointer-events-auto">
              <Segmented
                size="sm"
                layoutId="region-toggle"
								value={region}
    
                onChange={(v) => {
                  setRegion(v)
                  const view = v === 'EU' ? EU_VIEW : COUNTRY_BY_CODE[v].view;
                  flyTo(view.center, view.zoom)
                }}	
								options={REGIONS.map((r) => ({ value: r.value, label: r.label }))}	
              />
            </div>
            <div className="pointer-events-auto">
              <Segmented
                size="sm"
                layoutId="map-mode"
                value={mode}
                onChange={setMode}
                options={[
                  { value: 'pins', label: 'Pins', icon: <MapPin size={13} /> },	
                  { value: 'heat', label: 'Heatmap', icon: <Flame size={13} /> },
                ]}
              />
            </div>
					</div>

          <div className={cn('absolute top-3 right-3 z-[500] transition-opacity', selectedUser && 'pointer-events-none opacity-0')}>
            <NetworkStats users={world.users} />
          </div>

          <div className="pointer-events-none absolute inset-x-0 bottom-4 z-[500] flex justify-center">
            <TimeSlider />
          </div>

          <ProfileDrawer user={selectedUser} request={selectedRequest} onClose={() => setSelectedId(null)} onBuy={(u) => setBuyFrom(u)} />
        </div>
        <div className="shrink-0 border-t border-line bg-surface px-4">
          <ActivityTicker items={world.activity} />
        </div>
        <BuyEnergyModal seller={buyFrom} open={!!buyFrom} onClose={() => setBuyFrom(null)} />
      </div>
    </div>
  )
}
