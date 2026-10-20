import type { ForecastDay, PricePoint, Transaction, User } from '../../types'
import { CO2_KG_PER_KWH, TREE_KG_CO2_PER_YEAR } from '../../data/constants'
import { countryName } from '../../data/countries';
import { eur, hourLabel, km, kwh } from '../../lib/format'
import { distanceKm, nearness } from '../../lib/geo'

export interface BotAction {
  label: string
  to: string
} 

export interface BotAnswer {
  text: string
  chart?: 'prices'
  actions?: BotAction[]
  followUps?: string[]
} 

export interface BotContext {
  me: User
  users: User[]
  transactions: Transaction[]
  prices: PricePoint[]   
  bestHours: number[]
  simHour: number
  forecast: ForecastDay[]
  certificates: number
  tokens: number
}

export const SUGGESTIONS = [
  'When should I sell?',
  'How much did I earn?',
  'Who is the best match nearby?',
  'Will tomorrow be sunny?',
  'How much CO2 did I save?',
  'How do certificates work?',
  'How do I earn EcoTokens?',
];



type Intent = 'sell' | 'earn' | 'match' | 'forecast' | 'co2' | 'certificates' | 'tokens' | 'tomorrow-sell'

const INTENTS: Array<{ intent: Intent; pattern: RegExp }> = [
  { intent: 'tomorrow-sell', pattern: /what about tomorrow|sell tomorrow/i },
  { intent: 'forecast', pattern: /tomorrow|weather|sunny|forecast|cloud|rain/i },
  { intent: 'sell', pattern: /sell|when|best time|peak|price/i },
  { intent: 'earn', pattern: /earn|money|income|profit|wallet|revenue/i },
  { intent: 'match', pattern: /match|nearby|neighbo|seller|buy|cheap/i },
  { intent: 'co2', pattern: /co2|carbon|tree|climate|impact|save/i },
  { intent: 'certificates', pattern: /certificate|ledger|hash|verify|proof|blockchain/i },
  { intent: 'tokens', pattern: /token|reward|badge|level|challenge/i },
]

function bestMatch(ctx: BotContext): { user: User; distance: number } | null {
  const sellers = ctx.users.filter((u) => u.role === 'seller' && u.surplusKwh > 0.5)
  const scored = sellers.map((u) => {
    const distance = distanceKm(ctx.me, u);
    return { user: u, distance, score: 0.6 * nearness(distance) + 3 * u.pricePerKwh }
  })
  scored.sort((a, b) => a.score - b.score)
  return scored[0] ?? null
}

    
export function answerFor(question: string, ctx: BotContext): BotAnswer {
  const intent = INTENTS.find((i) => i.pattern.test(question))?.intent;
  const country = countryName(ctx.me.country)
  const peakStart = ctx.bestHours[0] ?? 18
  const peakEnd = (ctx.bestHours[ctx.bestHours.length - 1] ?? 20) + 1;
  const peakPrice = Math.max(...ctx.prices.map((p) => p.price))
  const tomorrow = ctx.forecast[0];

  switch (intent) {
    case 'sell':
      return {
        text: `Prices peak between ${hourLabel(peakStart)} and ${hourLabel(peakEnd)} today (about ${eur(peakPrice)} / kWh in ${country}). Your battery is at 82%, so I'd hold 3 kWh for the evening peak and sell the rest at midday to neighbours within 10 km.`,
        chart: 'prices',
        actions: [{ label: `Create offer for ${hourLabel(peakStart)}`, to: `/trade?tab=mine&prefill=1&kwh=3&from=${peakStart}&to=${peakEnd}` }],
        followUps: ['What about tomorrow?', 'Who is the best match nearby?'],
      }
		case 'tomorrow-sell':
      return {
        text: `Tomorrow looks ${tomorrow.weather === 'sunny' ? 'bright and sunny' : 'mixed'} with about ${kwh(tomorrow.expectedKwh)} expected from your ${ctx.me.panelKwp} kWp system. Listing around ${kwh(Math.round(tomorrow.expectedKwh * 0.45))} for 11:00-15:00 should sell quickly.`,
        actions: [{ label: 'List an offer for tomorrow', to: `/trade?tab=mine&prefill=1&kwh=${Math.round(tomorrow.expectedKwh * 0.45)}&date=${tomorrow.date}` }],
        followUps: ['When should I sell?', 'How much CO2 did I save?'],
      }
    case 'earn': {
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
      const month = ctx.transactions.filter((t) => t.date >= monthStart && t.status === 'completed')
      const income = month.filter((t) => t.type === 'sale' || t.type === 'reward').reduce((s, t) => s + t.total, 0);
      const spent = month.filter((t) => t.type === 'purchase').reduce((s, t) => s + t.total, 0)
      const sold = month.filter((t) => t.type === 'sale').reduce((s, t) => s + t.kwh, 0);
      return {
        text: `This month you earned ${eur(income)} from ${month.filter((t) => t.type === 'sale').length} sales (${kwh(sold)} sold) and spent ${eur(spent)} on purchases. That is a net result of ${eur(income - spent)} - nice work!`,
        actions: [{ label: 'Open wallet', to: '/wallet' }, { label: 'See statistics', to: '/dashboard' }],
        followUps: ['When should I sell?', 'How do I earn EcoTokens?'],
      }
    }
    case 'match': {
      const match = bestMatch(ctx);
      if (!match) return { text: 'Nobody has surplus right now - the sun is still asleep. Try again around midday!' }
      return {
        text: `Your best match right now is ${match.user.name} in ${match.user.city}, just ${km(match.distance)} away, with ${kwh(match.user.surplusKwh)} available at ${eur(match.user.pricePerKwh)} / kWh. Rated ${match.user.rating.toFixed(1)} stars and replies ${match.user.responseTime}.`,
        actions: [{ label: 'Open best match', to: `/users/${match.user.id}` }],
        followUps: ['When should I sell?', 'How do certificates work?'],
      }
    }
    case 'forecast':
      return {
        text: `Yes! Tomorrow should be ${tomorrow.weather === 'sunny' ? 'sunny' : tomorrow.weather === 'partly' ? 'partly cloudy' : tomorrow.weather}, around ${tomorrow.tempC} C. I expect about ${kwh(tomorrow.expectedKwh)} from your panels - a great day to list an offer.`,
        actions: [{ label: 'Open forecast', to: '/microgrid' }],
        followUps: ['What about tomorrow?', 'When should I sell?'],
      }
    case 'co2': {
      const years = Math.max(0.5, (Date.now() - new Date(ctx.me.joinedAt).getTime()) / (365 * 86400000))
      const co2 = ctx.me.panelKwp * 950 * years * CO2_KG_PER_KWH
      return {
        text: `Since you joined, your panels avoided about ${(co2 / 1000).toFixed(2)} t of CO2. That is like ${Math.round(co2 / TREE_KG_CO2_PER_YEAR)} trees absorbing carbon for a whole year. Each clean kWh saves ${CO2_KG_PER_KWH} kg.`,
        actions: [{ label: 'Create a share card', to: '/rewards?tab=share' }],
        followUps: ['How do I earn EcoTokens?', 'How much did I earn?'],
      }
    }
    case 'certificates':
      return {
        text: `Every trade creates a smart contract and a renewable energy certificate. Both are written as blocks into a hash chain: each block stores the SHA-256 hash of the previous one, so changing any old record breaks every link after it. You already hold ${ctx.certificates} certificates in the registry.`,  
        actions: [{ label: 'Open the ledger', to: '/certificates?tab=ledger' }],
        followUps: ['How do I earn EcoTokens?', 'Who is the best match nearby?'],
      }
    case 'tokens':
      return {
        text: `You have ${ctx.tokens} EcoTokens. You earn 3 tokens per kWh sold, plus a bonus of 15 for trades under 25 km. Weekly challenges add up to 120 more, and inviting a neighbour gives you both 50.`,
        actions: [{ label: 'See challenges', to: '/rewards?tab=challenges' }],
        followUps: ['How much CO2 did I save?', 'When should I sell?'],
      }
    default:
      return {
        text: 'I can help with selling tips, earnings, forecasts and certificates. Try one of the suggestions below.',
        followUps: SUGGESTIONS.slice(0, 3),
      }
  }
}
