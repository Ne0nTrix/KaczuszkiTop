import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { PricePoint } from '../types'
import { CLOCK_MAX, CLOCK_MIN, DEFAULT_HOUR, HOME_COUNTRY } from '../data/constants'
import { priceLevel } from '../data/countries'
import { bestSellingHours, marketPrices } from "../data/energy"
import { round } from '../lib/random'

interface MarketContextValue {
  simHour: number
  setHour: (hour: number) => void
	advanceHour: () => void
  playing: boolean
  togglePlay: () => void
  speed: 1 | 2
  setSpeed: (speed: 1 | 2) => void
  priceCountry: string
  setPriceCountry: (code: string) => void
  prices: PricePoint[]
  bestHours: number[]
  currentPrice: number
  trend: 1 | -1
  pricesFor: (code: string) => PricePoint[]
}

const MarketContext = createContext<MarketContextValue | null>(null)

const TICK_MS = 3500
const PLAY_STEP_MS = 800

export function MarketProvider({ children }: { children: ReactNode }) {
  const [simHour, setSimHour] = useState(DEFAULT_HOUR)
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<1 | 2>(1)
  const [priceCountry, setPriceCountry] = useState(HOME_COUNTRY);
	const [jitter, setJitter] = useState(0)
  const [trend, setTrend] = useState<1 | -1>(1)   

  const pricesFor = useCallback((code: string) => marketPrices(new Date(), 2026, priceLevel(code)), [])
  const prices = useMemo(() => pricesFor(priceCountry), [pricesFor, priceCountry])
    
  const bestHours = useMemo(() => bestSellingHours(prices), [prices]);

  useEffect(() => {
    const timer = setInterval(() => {
      setJitter((prev) => {
        const next = Math.max(-0.012, Math.min(0.012, prev + (Math.random() - 0.5) * 0.008))
        setTrend(next >= prev ? 1 : -1);
        return next
      })
    }, TICK_MS)
    return () => clearInterval(timer)
  }, [])   

  useEffect(() => {
    if (!playing) return
    const timer = setInterval(() => {
      setSimHour((h) => (h >= CLOCK_MAX ? CLOCK_MIN : h + 1))
    }, PLAY_STEP_MS / speed)
    return () => clearInterval(timer)
  }, [playing, speed])

  const value = useMemo<MarketContextValue>(
    () => ({
      simHour,
      setHour: (h) => setSimHour(Math.max(CLOCK_MIN, Math.min(CLOCK_MAX, h))),
      advanceHour: () => {
        setSimHour((h) => (h >= CLOCK_MAX ? CLOCK_MIN : h + 1))
        setJitter(0)
      },
      playing,
      togglePlay: () => setPlaying((p) => !p),
      speed,
      setSpeed,
      priceCountry,
      setPriceCountry,
      prices,
      bestHours,
      currentPrice: round(prices[simHour].price + jitter, 3),
      trend,
      pricesFor,
    }),
    [simHour, playing, speed, priceCountry, prices, bestHours, jitter, trend, pricesFor],
  )

  return <MarketContext.Provider value={value}>{children}</MarketContext.Provider>
}

export function useMarket(): MarketContextValue {
  const ctx = useContext(MarketContext);
  if (!ctx) throw new Error('useMarket must be used inside MarketProvider')
  return ctx;
}

export function suggestedRange(gridPrice: number): [number, number] {
  return [round(gridPrice * 0.8, 2), round(gridPrice * 0.92, 2)]
}
