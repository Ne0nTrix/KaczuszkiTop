export type Role = 'seller' | 'buyer'

export interface User {
  id: string
  name: string
  initials: string
  avatarColor: string
  city: string
  country: string 
  lat: number
  lng: number
  panelKwp: number
	inverter: string
  hasBattery: boolean
  batteryKwh: number
	surplusPeakKwh: number
	surplusKwh: number
	pricePerKwh: number
  rating: number
	ratingCount: number
	verified: boolean
	role: Role
  microgridId: string | null
  joinedAt: string
  bio: string
  responseTime: string
  tradesCompleted: number
	ecoTokens: number
}

export interface SessionProfile {
  name: string
  email: string
  country: string
  city: string
  panelKwp: number
  preferredPrice: number
  isDemo: boolean
}

export type OfferStatus = 'active' | 'counter-offered' | 'sold' | 'expired'

export interface CounterOffer {
  fromUserId: string
  pricePerKwh: number
  createdAt: string
}

export type MyCounterStatus = 'pending' | 'accepted' | 'declined'

export interface Offer {
  id: string
	sellerId: string
  kwh: number
  pricePerKwh: number
  date: string
  fromHour: number   
  toHour: number
  status: OfferStatus
	createdAt: string
	incomingCounter?: CounterOffer
  myCounter?: { pricePerKwh: number; status: MyCounterStatus }
}

export interface BuyRequest {
  id: string
  buyerId: string
  kwh: number
  when: string
  maxPrice: number
  status: 'open' | 'fulfilled'
  createdAt: string
}

export interface Comment {
  id: string
	authorId: string
  authorName: string
  stars: number
	text: string
  date: string
}

export interface ChatOffer {
	kwh: number
  pricePerKwh: number
	status: 'open' | 'accepted'
}

export interface ChatMessage {	
  id: string
  from: 'me' | 'them'
  text: string
	time: string
  offer?: ChatOffer
}

export interface ChatThread {
	id: string
  userId: string
  messages: ChatMessage[]
  unread: number
  typing: boolean
  online: boolean  
}

export type TransactionType = 'sale' | 'purchase' | 'reward' | 'redeem'

export interface Transaction {
  id: string
  date: string
  type: TransactionType
  counterpartyId: string | null
  counterpartyName: string
  country: string
  kwh: number
  pricePerKwh: number
		total: number
  status: 'completed' | 'pending'
  contractId?: string
  certificateId?: string
}

export interface Certificate {
  id: string
	  date: string
	kwh: number
	source: 'PV'
  sellerId: string
  sellerName: string
  sellerCity: string
  sellerCountry: string
  buyerId: string
	buyerName: string
  buyerCity: string
  buyerCountry: string
  contractId: string
}

export type BlockKind = 'genesis' | 'certificate' | 'contract'

export interface LedgerEntry {
  kind: BlockKind
  timestamp: string
  payload: string
  certificateId: string | null
  contractId: string | null
}

export interface LedgerBlock extends LedgerEntry {
  index: number
  prevHash: string
  hash: string
}
 
export type NotificationType = 'offer' | 'message' | 'trade' | 'forecast' | 'challenge'

export interface AppNotification {
	id: string
  type: NotificationType
  title: string
	body: string
	time: string
  read: boolean
  link?: string
}

export interface Microgrid {
  id: string
  name: string
  city: string
  country: string
  lat: number
	lng: number
}

export type Weather = 'sunny' | 'partly' | 'cloudy' | 'rain'

export interface ForecastDay {
	date: string
  weather: Weather
  expectedKwh: number
  tempC: number
}

export interface HourPoint {
  hour: number
  label: string
	generated: number
	consumed: number
  exported: number
  imported: number
  revenue: number
	cost: number
  net: number
}

export interface StatsRow extends Omit<HourPoint, 'hour'> {
	key: string
	cumulative: number  
}

export interface PricePoint {
	hour: number
  label: string
  price: number
}

export interface Badge {
	id: string
  name: string
  description: string
  unlocked: boolean
	progress: number
}

export interface Challenge {
  id: string 
  title: string
  progress: number
  target: number
  decimals: number
  reward: number
  daysLeft: number
	claimed: boolean
}

export interface Invite {
	id: string
	  name: string 
  email: string
  status: 'joined' | 'pending'
  date: string
}

export interface LeaderboardEntry {
	userId: string
  name: string
  initials: string
	avatarColor: string
	city: string
	country: string
  tokens: number
  isMe: boolean
}

export interface CountryRank {
  code: string
  name: string
  tradedKwh: number  
	sellers: number
}

export interface ActivityItem {
	id: string
  sellerName: string
  sellerCity: string
  buyerName: string
  buyerCity: string
  kwh: number
  total: number
  minutesAgo: number
}
