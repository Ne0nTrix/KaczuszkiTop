import type { ForecastDay, HourPoint, PricePoint, StatsRow, Weather } from '../types';
import { addDays, hourLabel, isoDay } from "../lib/format";
import { between, pick, round, seededRandom } from '../lib/random'

	const gauss = (x: number, mu: number, sigma: number) => Math.exp(-((x - mu) ** 2) / (2 * sigma ** 2));
  
function summerness(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0)
  const dayOfYear = (date.getTime() - start.getTime()) / 86400000;
  return 0.5 - 0.5 * Math.cos((2 * Math.PI * (dayOfYear - 10)) / 365);
}


function daylight(date: Date) {
  const s = summerness(date)
  return { rise: 7.4 - 3 * s, set: 16.6 + 4.6 * s, peakPerKwp: 0.42 + 0.42 * s }
}

function cloudFactor(day: string, seed: number): number {
  const rand = seededRandom('cloud', day, seed);
  const r = rand()
  return r < 0.18 ? between(rand, 0.22, 0.45) : r < 0.45 ? between(rand, 0.5, 0.8) : between(rand, 0.82, 1)
}

export function solarCurve(date: Date, kwp: number, seed: number): number[] {
  const day = isoDay(date)
  const { rise, set, peakPerKwp } = daylight(date);
  const clouds = cloudFactor(day, seed);
  const rand = seededRandom('solar', day, seed);
  return Array.from({ length: 24 }, (_, h) => {
    const t = h + 0.5
    if(t <= rise || t >= set) return 0;
    const shape = Math.sin((Math.PI * (t - rise)) / (set - rise));
    const noise = 1 + (rand() - 0.5) * 0.25;
    return Math.max(0, kwp * peakPerKwp * shape * clouds * noise);
  }); 
}


export function consumptionCurve(date: Date, seed: number): number[] {
  const rand = seededRandom('cons', isoDay(date), seed); 
  const weekend = date.getDay() === 0 || date.getDay() === 6;
  return Array.from({ length: 24 }, (_, h) => {
    const base = 0.32 + 0.75 * gauss(h, 7.5, 1.1) + 1.25 * gauss(h, 19.5, 1.8) + (weekend ? 0.35 * gauss(h, 13, 3) : 0)
    return base * (0.85 + rand() * 0.3);
  });
}

export function marketPrices(date: Date, seed = 2026, level = 1): PricePoint[] {
  const rand = seededRandom('price', isoDay(date), seed);
  return Array.from({ length: 24 }, (_, h) => {
    const p = 0.195 + 0.075 * gauss(h, 8, 1.2) + 0.115 * gauss(h, 19.5, 1.5) - 0.075 * gauss(h, 13, 2.3) 
    return { hour: h, label: hourLabel(h), price: round((p + (rand() - 0.5) * 0.012) * level, 3) };
  });
}

export function bestSellingHours(prices: PricePoint[], count = 3): number[] {
  return [...prices]
    .sort((a, b) => b.price - a.price)
    .slice(0, count)	
    .map((p) => p.hour)
    

    .sort((a, b) => a - b)
    
}

const SELL_SHARE = 0.85;

export function dayHours(date: Date, kwp: number, seed: number): HourPoint[] {
  const gen = solarCurve(date, kwp, seed)
  const cons = consumptionCurve(date, seed)
  const prices = marketPrices(date, seed);
  return gen.map((g, h) => {
    const exported = Math.max(0, g - cons[h]);
    const imported = Math.max(0, cons[h] - g)
    const revenue = exported * prices[h].price * SELL_SHARE;
    const cost = imported * prices[h].price;
	    return {
      hour: h,
      label: hourLabel(h),
      generated: round(g, 2),
      consumed: round(cons[h], 2),
      exported: round(exported, 2),
      imported: round(imported, 2),
      revenue: round(revenue, 2),
      cost: round(cost, 2),
      net: round(revenue - cost, 2),
    }
  });  
}   

function sumHours(hours: HourPoint[]) {
  const sum = (key: keyof HourPoint) => round(hours.reduce((acc, h) => acc + (h[key] as number), 0), 2);


  return {
    generated: sum('generated'),
    consumed: sum('consumed'),
    exported: sum('exported'),
    imported: sum('imported'),
    revenue: sum('revenue'),
    cost: sum('cost'),
    net: sum('net'),
  };   
}

function withCumulative(rows: Omit<StatsRow, 'cumulative'>[]): StatsRow[] {
  let running = 0;
  return rows.map((row) => {
    running += row.net
    return { ...row, cumulative: round(running, 2) };
  });
}

export function dayStats(date: Date, kwp: number, seed: number): StatsRow[] {
  return withCumulative(dayHours(date, kwp, seed).map(({ hour, ...rest }) => ({ ...rest, key: String(hour) })));
}


export function monthStats(year: number, month: number, kwp: number, seed: number): StatsRow[] {
  const today = new Date()
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;  
  const days = isCurrentMonth ? today.getDate() : new Date(year, month + 1, 0).getDate();	
  const rows = Array.from({ length: days }, (_, i) => {
    const date = new Date(year, month, i + 1);
    const totals = sumHours(dayHours(date, kwp, seed));
    
    return { ...totals, key: isoDay(date), label: String(i + 1) };

  });
  return withCumulative(rows)
}
  
export function yearStats(end: Date, kwp: number, seed: number): StatsRow[] {
  const rows = Array.from({ length: 12 }, (_, i) => {
    const month = new Date(end.getFullYear(), end.getMonth() - 11 + i, 1);
    const totals = totalsOf(monthStats(month.getFullYear(), month.getMonth(), kwp, seed));
    return {
      ...totals,
      key: isoDay(month),
      label: month.toLocaleDateString('en-GB', { month: 'short' }),
    }; 
  })
  return withCumulative(rows);
}

export function totalsOf(rows: StatsRow[]) {
  const sum = (key: 'generated' | 'consumed' | 'exported' | 'imported' | 'revenue' | 'cost' | 'net') =>
    round(rows.reduce((acc, r) => acc + r[key], 0), 2)
  return {
    generated: sum('generated'),
    consumed: sum('consumed'),
    exported: sum('exported'),
    imported: sum('imported'),
    revenue: sum('revenue'),
    cost: sum('cost'),
    net: sum('net'),
  };
}

const WEATHER_FACTOR: Record<Weather, number> = { sunny: 1, partly: 0.72, cloudy: 0.42, rain: 0.22 }

export function forecast(kwp: number, seed: number, from = new Date()): ForecastDay[] {
  const rand = seededRandom('forecast', isoDay(from), seed);
  return Array.from({ length: 7 }, (_, i) => {
    const date = addDays(from, i + 1);
		const weather: Weather = i === 0 ? 'sunny' : pick(rand, ['sunny', 'sunny', 'partly', 'partly', 'cloudy', 'rain'] as const);
    const { rise, set, peakPerKwp } = daylight(date);
    const ideal = (kwp * peakPerKwp * (set - rise) * 2) / Math.PI;
    return {
      date: isoDay(date),
			weather,
      expectedKwh: round(ideal * WEATHER_FACTOR[weather] * between(rand, 0.92, 1.05), 1),
      tempC: Math.round(between(rand, 8, 16) + (weather === 'sunny' ? 3 : 0)),
    };
  });
}
