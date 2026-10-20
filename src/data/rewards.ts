import type { Faker } from '@faker-js/faker'
import type { Badge, Challenge, CountryRank, Invite, LeaderboardEntry, User } from '../types'
import { LEVELS } from './constants'
import { COUNTRIES } from './countries'

export interface LevelInfo {
  name: string
  index: number
  min: number
  next: { name: string; min: number } | null
  progress: number
}

export function levelFor(tokens: number): LevelInfo {
  let index = 0
  LEVELS.forEach((level, i) => {
    if (tokens >= level.min) index = i
  })
    

  const current = LEVELS[index]
  const next = LEVELS[index + 1] ?? null
  const progress = next ? (tokens - current.min) / (next.min - current.min) : 1
	return { name: current.name, index, min: current.min, next, progress: Math.min(1, Math.max(0, progress)) }
}

export interface BadgeStats {
  trades: number
  localTrades: number
  tokens: number
  streakDays: number
  invitedJoined: number
  certificates: number
  rating: number
  kwhSold: number
  countriesTraded: number
}

export function badgesFor(s: BadgeStats): Badge[] {
  const ratio = (value: number, target: number) => Math.min(1, value / target)
  const badge = (id: string, name: string, description: string, value: number, target: number): Badge => ({
    id,
    name,
		description,   
    unlocked: value >= target,
    progress: ratio(value, target),
  })
	  return [
    badge('first-trade', 'First Trade', 'Complete your first energy trade.', s.trades, 1),
    badge('local-hero', 'Local Hero', 'Complete 5 trades within 25 km.', s.localTrades, 5),
    badge('sunny-streak', 'Sunny Streak', 'Sell surplus 7 days in a row.', s.streakDays, 7),
    badge('solar-leader', 'Solar Leader', 'Reach 1,000 EcoTokens.', s.tokens, 1000),
    badge('community-builder', 'Community Builder', 'Invite 5 neighbours who join.', s.invitedJoined, 5),
    badge('green-certified', 'Green Certified', 'Collect 10 energy certificates.', s.certificates, 10),
    badge('five-star', 'Five Star Neighbour', 'Keep a 4.8+ average rating.', s.rating, 4.8),
    badge('megawatt', 'Megawatt Club', 'Sell 1,000 kWh in total.', s.kwhSold, 1000),
    badge('early-bird', 'Early Bird', 'List 10 offers before 9:00.', 6, 10),
    badge('peak-saver', 'Peak Saver', 'Sell during 3 evening price peaks.', 3, 3),
    badge('cross-border', 'Cross-Border Trader', 'Trade with 3 different EU countries.', s.countriesTraded, 3),
    badge('night-owl', 'Battery Night Owl', 'Sell stored energy after 21:00.', 0, 1),
  ]
}

    
export function initialChallenges(): Challenge[] {
  const ch = (id: string, title: string, progress: number, target: number, reward: number, daysLeft: number, decimals = 0): Challenge => ({
		id,   
    title,
    progress,
    target,
    reward,
    daysLeft,
    decimals,
    claimed: false,
  })
  return [
    ch('sell-local', 'Sell 20 kWh locally this week', 14, 20, 100, 3),
    ch('three-neighbours', 'Trade with 3 different neighbours', 2, 3, 60, 3),
    ch('early-offers', 'List an offer before 10:00 on 5 sunny days', 3, 5, 80, 3),
	    ch('rating', 'Reach a 4.8 average rating', 4.7, 4.8, 50, 5, 1),
    ch('grid-peak', 'Sell during a grid peak', 1, 1, 40, 2),
    ch('invite', 'Invite one neighbour', 0, 1, 50, 6),
    { ...ch('verify', 'Verify your installation', 1, 1, 30, 0), claimed: true },
    ch('ten-trades', 'Complete 10 trades this month', 7, 10, 120, 12),
  ]
}

export function initialInvites(f: Faker, users: User[]): Invite[] {
  const statuses: Invite['status'][] = ['joined', 'joined', 'joined', 'pending', 'joined', 'pending']
  return f.helpers.arrayElements(users, 6).map((u, i) => ({   
    id: `inv-${i}`,
    name: u.name,
    email: `${u.name.toLowerCase().replace(/[^a-z]+/g, '.')}@mail.eu`,
    status: statuses[i],
    date: f.date.recent({ days: 60 }).toISOString(),   
  }))
}

export function tokensForTrade(kwh: number, distanceKm: number): number {
  const base = Math.round(kwh * 3)
  const localBonus = distanceKm < 25 ? 15 : distanceKm < 150 ? 8 : 0
  return Math.max(5, base + localBonus)
}

export function leaderboard(users: User[], me: User, myTokens: number): LeaderboardEntry[] {
  const monthly = (u: User) => Math.round(u.ecoTokens * 0.42)
  const entries: LeaderboardEntry[] = users
    .filter((u) => u.role === 'seller')
    .map((u) => ({
      userId: u.id,
      name: u.name,
      initials: u.initials,
      avatarColor: u.avatarColor,
      city: u.city,
      country: u.country,
      tokens: monthly(u),
      isMe: false,
		}))
  entries.push({
    userId: me.id,
    name: me.name,
    initials: me.initials,
    avatarColor: me.avatarColor,
    city: me.city,
    country: me.country,
    tokens: Math.round(myTokens * 0.88),
    isMe: true,
  })
  return entries.sort((a, b) => b.tokens - a.tokens)
}

export function countryRanking(users: User[]): CountryRank[] {
  return COUNTRIES.map((c) => {
    const sellers = users.filter((u) => u.country === c.code && u.role === 'seller')
    const traded = sellers.reduce((s, u) => s + u.tradesCompleted * u.surplusPeakKwh * 0.9, 0) * 6.5
    return { code: c.code, name: c.name, tradedKwh: Math.round(traded), sellers: sellers.length }
  }).sort((a, b) => b.tradedKwh - a.tradedKwh)
}
