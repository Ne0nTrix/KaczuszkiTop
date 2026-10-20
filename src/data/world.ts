import { fakerPL as faker } from "@faker-js/faker";
import type {
  ActivityItem,
  AppNotification,
  BuyRequest,
	Certificate,
  Challenge,
  ChatMessage,
  ChatThread,
  Comment,
  Invite,
  LedgerEntry,
  Offer,
  SessionProfile,
  Transaction,
  User,
} from '../types'
import { addDays, isoDay } from '../lib/format'	
import { distanceKm } from '../lib/geo'
import { round } from '../lib/random';
import { STARTING_BALANCE, STARTING_TOKENS } from './constants';
import { buildMe, generateUsers } from "./people";
import { CHAT_ME, CHAT_THEM, COMMENT_TEXTS, REQUEST_WHEN } from './phrases';
import { initialChallenges, initialInvites } from './rewards';



export interface World {
  seed: number
  me: User
  users: User[]
  offers: Offer[]
  requests: BuyRequest[]
  comments: Record<string, Comment[]>
  threads: ChatThread[]
  transactions: Transaction[]
  certificates: Certificate[]
  ledgerEntries: LedgerEntry[]
  notifications: AppNotification[]
  activity: ActivityItem[]
  challenges: Challenge[]
  invites: Invite[]
  referralCode: string
  balance: number
	  ecoTokens: number
}

const HOUR = 3600000;
const hoursAgo = (h: number) => new Date(Date.now() - h * HOUR).toISOString();  
const hex4 = () => faker.string.hexadecimal({ length: 4, casing: 'upper', prefix: '' });

export function contractId(date = new Date()): string {
  return `SC-${date.getFullYear()}-${hex4()}`;
}
	
	export function certificateId(index: number, date = new Date()): string {
  return `SUN-${date.getFullYear()}-${String(index).padStart(4, '0')}-${hex4()}`;
}

export function shortName(name: string): string {
  const [first, last] = name.split(' ');
  return last ? `${first} ${last[0]}.` : first;
}

	function summerness(date: Date): number {
  return 0.5 - 0.5 * Math.cos((2 * Math.PI * date.getMonth()) / 12);
}

function nearest(users: User[], from: User, count: number): User[] {
  return [...users].sort((a, b) => distanceKm(from, a) - distanceKm(from, b)).slice(0, count)
}

function generateOffers(sellers: User[], me: User): Offer[] {
  const today = new Date();
  const local = nearest(sellers, me, 30);
  const pool = [...local, ...local, ...sellers]
  const market: Offer[] = Array.from({ length: 160 }, (_, i) => {
    const seller = faker.helpers.arrayElement(pool)
    const fromHour = faker.number.int({ min: 8, max: 17 });
    return {
      id: `of-${i + 1}`,
      sellerId: seller.id,
      kwh: Math.max(1, round(Math.min(seller.surplusPeakKwh, faker.number.float({ min: 1.5, max: 14 })), 1)),
      pricePerKwh: round(Math.max(0.1, seller.pricePerKwh + faker.number.float({ min: -0.01, max: 0.01 })), 2),
      date: isoDay(addDays(today, faker.number.int({ min: 0, max: 3 }))),
      fromHour,
      toHour: fromHour + faker.number.int({ min: 2, max: 4 }),
      status: 'active',
      createdAt: hoursAgo(faker.number.float({ min: 0.2, max: 48 })),
    };
  });

  const counterBuyer = local[0] ?? sellers[0];
  const mine: Offer[] = [
    {
      id: 'my-1', sellerId: 'me', kwh: 6, pricePerKwh: 0.21, date: isoDay(today), fromHour: 12, toHour: 15,
			status: 'counter-offered', createdAt: hoursAgo(3),
      incomingCounter: { fromUserId: counterBuyer.id, pricePerKwh: 0.19, createdAt: hoursAgo(0.6) },
    },
    { id: 'my-2', sellerId: 'me', kwh: 4.5, pricePerKwh: 0.2, date: isoDay(addDays(today, 1)), fromHour: 11, toHour: 14, status: 'active', createdAt: hoursAgo(5) },
		{ id: 'my-3', sellerId: 'me', kwh: 8, pricePerKwh: 0.19, date: isoDay(addDays(today, -2)), fromHour: 10, toHour: 14, status: 'sold', createdAt: hoursAgo(52) },
    { id: 'my-4', sellerId: 'me', kwh: 3, pricePerKwh: 0.24, date: isoDay(addDays(today, -5)), fromHour: 16, toHour: 18, status: 'expired', createdAt: hoursAgo(130) },
    { id: 'my-5', sellerId: 'me', kwh: 5.5, pricePerKwh: 0.22, date: isoDay(addDays(today, -9)), fromHour: 18, toHour: 20, status: 'sold', createdAt: hoursAgo(220) },
  ];
  return [...mine, ...market];
}

function generateRequests(buyers: User[]): BuyRequest[] {
  return faker.helpers.arrayElements(buyers, 40).map((buyer, i) => ({
    id: `rq-${i + 1}`,
    buyerId: buyer.id,
    kwh: faker.number.int({ min: 2, max: 10 }),
    when: faker.helpers.arrayElement(REQUEST_WHEN),
    maxPrice: faker.number.float({ min: 0.17, max: 0.27, fractionDigits: 2 }),
    status: 'open',
    createdAt: hoursAgo(faker.number.float({ min: 0.3, max: 30 })), 
  }));
}

function generateComments(users: User[]): Record<string, Comment[]> {
  const result: Record<string, Comment[]> = {};


  for (const user of users) {
    const popular = user.ratingCount > 60 || user.id === 'me';

    const count = popular
      ? faker.number.int({ min: 6, max: 12 })
      : user.role === 'seller'
        ? faker.number.int({ min: 1, max: 4 })
        : faker.number.int({ min: 0, max: 2 });
    const authors = faker.helpers.arrayElements(users.filter((u) => u.id !== user.id), count);
    result[user.id] = authors
      .map((author, i) => ({
        id: `cm-${user.id}-${i}`,
        authorId: author.id,
        authorName: author.name,
        stars: faker.helpers.weightedArrayElement([ 
					{ value: 5, weight: 6 }, 
          { value: 4, weight: 3 },
          { value: 3, weight: 1 },
        ]),
        text: faker.helpers.arrayElement(COMMENT_TEXTS),
        date: faker.date.recent({ days: 200 }).toISOString(),
	      }))
      .sort((a, b) => b.date.localeCompare(a.date));
  }
  return result;
}

function generateThreads(sellers: User[], me: User): ChatThread[] {
  const local = nearest(sellers, me, 12);
  const others = faker.helpers.arrayElements(sellers.filter((s) => !local.includes(s)), 13)
  return [...local, ...others].map((partner, i) => {
    const count = faker.number.int({ min: 3, max: 12 });
    const start = 1.5 + i * 9 + faker.number.float({ min: 0, max: 4 })
    const endsWithThem = i < 4 || faker.datatype.boolean()
    const firstFromThem = endsWithThem ? count % 2 === 1 : count % 2 === 0;
    const messages: ChatMessage[] = Array.from({ length: count }, (_, m) => {
      const fromThem = firstFromThem ? m % 2 === 0 : m % 2 === 1;
			const withOffer = fromThem && m === count - 1 && i % 3 === 0;
      const kwhOffer = faker.number.int({ min: 3, max: 9 });
      return {
        id: `msg-${i}-${m}`,
        from: fromThem ? 'them' : 'me',
        text: withOffer
	          ? `Here is an offer just for you - ${kwhOffer} kWh this afternoon.`
          : faker.helpers.arrayElement(fromThem ? CHAT_THEM : CHAT_ME),
        time: hoursAgo(start - m * 0.2),
        offer: withOffer ? { kwh: kwhOffer, pricePerKwh: round(partner.pricePerKwh, 2), status: 'open' } : undefined,
      };
    });
    return {
      id: `th-${partner.id}`,
      userId: partner.id,
      messages,
      unread: endsWithThem && i < 4 ? faker.number.int({ min: 1, max: 3 }) : 0,
      typing: false,
      online: i < 3 || faker.datatype.boolean({ probability: 0.35 }),
    }
  });
}	

function generateTransactions(users: User[], me: User): Transaction[] {
  const sameCountry = users.filter((u) => u.country === me.country);
  const list: Transaction[] = []
  const now = new Date();
  for (let back = 11; back >= 0; back--) {
    const month = new Date(now.getFullYear(), now.getMonth() - back, 1);
    const s = summerness(month)
    const count = Math.round(17 + 16 * s);
    const lastDay = back === 0 ? now.getDate() : new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    for (let i = 0; i < count; i++) {
      const date = new Date(month.getFullYear(), month.getMonth(), faker.number.int({ min: 1, max: lastDay }), faker.number.int({ min: 7, max: 21 }), faker.number.int({ min: 0, max: 59 }));
      if (date > now) date.setTime(now.getTime() - faker.number.int({ min: 1, max: 40 }) * HOUR);
      const type = faker.helpers.weightedArrayElement([
        { value: 'sale' as const, weight: 64 },
        { value: 'purchase' as const, weight: 31 },
        { value: 'reward' as const, weight: 5 }, 
      ]);
      if (type === 'reward') {
        list.push({
          id: `tx-${list.length}`, date: date.toISOString(), type, counterpartyId: null,
          counterpartyName: faker.helpers.arrayElement(['SunSwap Community Bonus', 'Weekly challenge reward', 'Referral reward']),
          country: me.country, kwh: 0, pricePerKwh: 0, total: faker.helpers.arrayElement([3, 5, 8]), status: 'completed',
        });
        continue
      }
      const user = faker.datatype.boolean({ probability: 0.65 }) ? faker.helpers.arrayElement(sameCountry) : faker.helpers.arrayElement(users);   
      const kwh = faker.number.float({ min: 1.5, max: 4 + 9 * s, fractionDigits: 1 });
      const price = faker.number.float({ min: 0.15, max: 0.24, fractionDigits: 2 });
      list.push({
        id: `tx-${list.length}`,
        date: date.toISOString(),
        type,
        counterpartyId: user.id,
        counterpartyName: user.name,
        country: user.country,
        kwh,
        pricePerKwh: price, 
        total: round(kwh * price, 2),
        status: back === 0 && i === 0 ? 'pending' : 'completed',
        contractId: contractId(date),
      });
    }
  }
  return list.sort((a, b) => b.date.localeCompare(a.date))
}

function generateCertificates(users: User[], me: User, transactions: Transaction[]): Certificate[] {
  const sellers = users.filter((u) => u.role === 'seller');
  const mine = transactions.filter((t) => t.counterpartyId && t.contractId && t.status === 'completed').slice(0, 25)
  const fromMine = mine.map((t) => {
    const other = users.find((u) => u.id === t.counterpartyId) ?? sellers[0]
    const seller = t.type === 'sale' ? me : other;
    const buyer = t.type === 'sale' ? other : me;
    return { date: t.date, kwh: t.kwh, seller, buyer, contract: t.contractId ?? contractId() }
  })
  const platform = Array.from({ length: 35 }, () => {
    const seller = faker.helpers.arrayElement(sellers);
    const local = users.filter((u) => u.country === seller.country && u.id !== seller.id);
    const buyer = faker.helpers.arrayElement(local.length ? local : users);
    const date = faker.date.recent({ days: 120 });
		return { date: date.toISOString(), kwh: faker.number.float({ min: 1.5, max: 12, fractionDigits: 1 }), seller, buyer, contract: contractId(date) }
  })
  return [...fromMine, ...platform]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((x, i) => ({
      id: certificateId(i + 1, new Date(x.date)),
      date: x.date,
      kwh: x.kwh,
      source: 'PV' as const,
      sellerId: x.seller.id,
      sellerName: x.seller.name,
      sellerCity: x.seller.city,
      sellerCountry: x.seller.country,
      buyerId: x.buyer.id,
      buyerName: x.buyer.name,
      buyerCity: x.buyer.city,
      buyerCountry: x.buyer.country,
      contractId: x.contract,
    }))
}

export function certificatePayload(c: Certificate): string {
	return `Certificate ${c.id} | ${c.kwh.toFixed(1)} kWh PV | ${shortName(c.sellerName)} (${c.sellerCity}, ${c.sellerCountry}) -> ${shortName(c.buyerName)} (${c.buyerCity}, ${c.buyerCountry})`;
}

export function contractPayload(id: string, kwh: number, total: number, from: string, to: string): string {
  return `Contract ${id} settled | ${kwh.toFixed(1)} kWh | EUR ${total.toFixed(2)} | ${from} -> ${to}`
}

function generateLedger(certificates: Certificate[], users: User[], transactions: Transaction[], me: User): LedgerEntry[] {
  const certEntries: LedgerEntry[] = certificates.map((c) => ({
    kind: 'certificate',
    timestamp: c.date,
    payload: certificatePayload(c),
    certificateId: c.id,
    contractId: c.contractId,
  }))
  const myName = shortName(me.name);
  const contractTx = transactions.filter((t) => t.contractId).slice(25, 84);
  const contractEntries: LedgerEntry[] = contractTx.map((t) => {
    const other = shortName(users.find((u) => u.id === t.counterpartyId)?.name ?? 'Neighbour');
    return {
      kind: 'contract',
      timestamp: new Date(new Date(t.date).getTime() - 60000).toISOString(),
      payload: contractPayload(t.contractId ?? '', t.kwh, t.total, t.type === 'sale' ? myName : other, t.type === 'sale' ? other : myName),
      certificateId: null,
      contractId: t.contractId ?? null,
    };	
  })
  const genesis: LedgerEntry = {
    kind: 'genesis',
		timestamp: '2025-01-01T00:00:00.000Z',
    payload: 'Genesis block - SunSwap renewable energy registry',
    certificateId: null,
    contractId: null,  
  };
  const rest = [...certEntries, ...contractEntries].sort((a, b) => a.timestamp.localeCompare(b.timestamp)).slice(-119);
  return [genesis, ...rest];
}

function generateNotifications(threads: ChatThread[], users: User[], me: User): AppNotification[] {
  const byId = (id: string) => users.find((u) => u.id === id);
  const local = nearest(users.filter((u) => u.role === 'seller'), me, 10);
  const items: Array<Omit<AppNotification, 'id' | 'time' | 'read'>> = [
    { type: 'offer', title: 'Counter offer received', body: 'A neighbour offered EUR 0.19 / kWh for your 6 kWh batch.', link: '/trade?tab=mine' },
    ...threads.slice(0, 4).map((t) => ({
      type: 'message' as const,
      title: `New message from ${byId(t.userId)?.name ?? 'a neighbour'}`,
      body: t.messages[t.messages.length - 1]?.text ?? 'You have a new message.',
      link: `/messages?thread=${t.id}`,
    })),
    { type: 'challenge', title: 'Challenge ready to claim', body: '"Sell during a grid peak" is complete - claim 40 EcoTokens.', link: '/rewards?tab=challenges' },
    { type: 'forecast', title: 'Tomorrow will be sunny', body: 'Expected production is high - a good moment to list an offer.', link: '/microgrid' },
    ...local.slice(0, 6).map((u) => ({
      type: 'offer' as const,
      title: `New offer from ${u.name}`,
      body: `${round(u.surplusPeakKwh * 0.7, 1)} kWh at EUR ${u.pricePerKwh.toFixed(2)} / kWh in ${u.city}.`,
      link: '/trade',
    })),
    { type: 'trade', title: 'Trade confirmed', body: 'Your 8 kWh sale was settled and a certificate was issued.', link: '/certificates' },
    { type: 'challenge', title: 'Weekly streak: 4 days', body: 'Sell surplus 3 more days in a row to unlock Sunny Streak.', link: '/rewards?tab=challenges' },
    { type: 'trade', title: 'Payment released from escrow', body: 'EUR 1.52 for 8 kWh was added to your wallet.', link: '/wallet' },
    { type: 'forecast', title: 'Evening price peak expected', body: 'Prices may reach EUR 0.29 / kWh between 18:00 and 20:00.', link: '/trade' },
    { type: 'trade', title: 'Certificate issued', body: 'A new renewable energy certificate was added to the registry.', link: '/certificates' },
    { type: 'challenge', title: 'New weekly challenges', body: '8 fresh challenges are waiting for you this week.', link: '/rewards?tab=challenges' },
    { type: 'offer', title: 'Buy request near you', body: 'A neighbour needs 5 kWh tonight within 3 km.', link: '/trade?tab=requests' },
    { type: 'forecast', title: 'Cloudy Friday ahead', body: 'Production may drop by 60% - consider holding battery energy.', link: '/microgrid' },
    { type: 'trade', title: 'Invite joined', body: 'A neighbour you invited joined SunSwap. +50 EcoTokens!', link: '/rewards?tab=invite' },
	    { type: 'message', title: 'SunBot tip', body: 'Prices peak tonight - holding 3 kWh in your battery could earn you more.', link: '/trade' },
    { type: 'challenge', title: 'Badge unlocked: Local Hero', body: 'You completed 5 trades within 25 km. Well done!', link: '/rewards' },
    { type: 'forecast', title: 'Record sunny week ahead', body: 'Your microgrid could be energy positive for 5 days in a row.', link: '/microgrid' },
  ];	
  return items.slice(0, 25).map((n, i) => ({ ...n, id: `n-${i}`, time: hoursAgo(0.4 + i * i * 0.9), read: i >= 6 }));
}

function generateActivity(users: User[]): ActivityItem[] {
  const sellers = users.filter((u) => u.role === 'seller');
  return Array.from({ length: 60 }, (_, i) => {
    const seller = faker.helpers.arrayElement(sellers);
		const local = users.filter((u) => u.country === seller.country && u.id !== seller.id);
    const buyer = faker.helpers.arrayElement(local.length ? local : users)
    const kwh = faker.number.float({ min: 1, max: 9, fractionDigits: 1 });
    return {
      id: `act-${i}`,
      sellerName: shortName(seller.name),
      sellerCity: seller.city,
      buyerName: shortName(buyer.name), 
      buyerCity: buyer.city,
      kwh,
      total: round(kwh * seller.pricePerKwh, 2),
      minutesAgo: 1 + Math.floor(i * 1.7),
    };
	})
}

export function buildWorld(seed: number, profile: SessionProfile): World {
  faker.seed(seed);
  const me = buildMe(profile)
  const users = generateUsers(faker, seed); 
  faker.seed(seed + 1)


  const sellers = users.filter((u) => u.role === 'seller')
  const buyers = users.filter((u) => u.role === 'buyer');
  const transactions = generateTransactions(users, me);
  const certificates = generateCertificates(users, me, transactions);
  const certByContract = new Map(certificates.map((c) => [c.contractId, c.id]))   
  const linked = transactions.map((t) => (t.contractId && certByContract.has(t.contractId) ? { ...t, certificateId: certByContract.get(t.contractId) } : t))
  const threads = generateThreads(sellers, me);
	return {
    seed,
    me,
    users,
    offers: generateOffers(sellers, me),
    requests: generateRequests(buyers),
    comments: generateComments([...users, me]),
    threads,   
    transactions: linked,
    certificates,
    ledgerEntries: generateLedger(certificates, users, linked, me),
    notifications: generateNotifications(threads, users, me),
		activity: generateActivity(users),
    challenges: initialChallenges(),
    invites: initialInvites(faker, users),
    referralCode: `SUN-${me.city.slice(0, 3).toUpperCase()}-7Q2X`,
    balance: STARTING_BALANCE,
    ecoTokens: STARTING_TOKENS,
  };
    
}
