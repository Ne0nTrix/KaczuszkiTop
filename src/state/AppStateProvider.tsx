import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { AppNotification, Certificate, ChatMessage, LedgerEntry, Offer, SessionProfile, Transaction, User } from "../types"
import { INVITE_REWARD, REDEEM_COST, REDEEM_DISCOUNT_PCT, SEED } from '../data/constants'
import { CANNED_REPLIES, INCOMING_MESSAGE_TEXTS } from "../data/phrases" 
import { DEMO_PROFILE } from '../data/people'
import { tokensForTrade } from "../data/rewards"
import { buildWorld, certificatePayload, contractPayload, shortName } from '../data/world'
import type { World } from '../data/world'
import { distanceKm } from "../lib/geo"
import { eur, kwh } from '../lib/format'
import { round, uid } from '../lib/random'
import { surplusAt } from '../lib/solar'
import { useMarket } from "./MarketProvider"
import { useSession } from "./SessionProvider"
import { useToast } from './ToastProvider'

export interface NewOfferInput {
  kwh: number
  pricePerKwh: number
	  date: string
  fromHour: number
  toHour: number
}



export interface NewRequestInput {
  kwh: number
  when: string
  maxPrice: number
}

export interface PendingContract {
  id: string
  kind: 'sale' | 'purchase'
  counterparty: User   
  kwh: number
  pricePerKwh: number
  total: number
}

export interface ContractResult {
  certificateId: string
  tokens: number 
}

interface AppActions {
  getUser: (id: string) => User | undefined
  regenerate: () => void
  simulateIncomingOffer: () => void
  simulateIncomingMessage: () => void
  markNotificationRead: (id: string) => void
  markAllNotificationsRead: () => void
  rateUser: (userId: string, stars: number) => void
  addComment: (userId: string, stars: number, text: string) => void
  ensureThread: (userId: string) => string
  setActiveThread: (threadId: string | null) => void
  sendMessage: (threadId: string, text: string) => void
  acceptChatOffer: (threadId: string, messageId: string) => void
  createOffer: (input: NewOfferInput) => void
  acceptOffer: (offerId: string) => void
  sendCounterOffer: (offerId: string, pricePerKwh: number) => void
  acceptIncomingCounter: (offerId: string) => void
  declineIncomingCounter: (offerId: string) => void
  cancelOffer: (offerId: string) => void
  createRequest: (input: NewRequestInput) => void
  fulfillRequest: (requestId: string) => void
	buyEnergy: (sellerId: string, amountKwh: number) => void
  redeemTokens: () => void
  claimChallenge: (id: string) => number
  sendInvite: (email: string) => void
  settleContract: () => ContractResult | null
  closeContract: () => void
}

interface AppStateValue extends AppActions {
  world: World
  me: User
  discountPct: number
  contract: PendingContract | null
}

const AppStateContext = createContext<AppStateValue | null>(null)

const nowIso = () => new Date().toISOString()

function randomHex(length: number): string {
  return Array.from({ length }, () => Math.floor(Math.random() * 16).toString(16)).join('').toUpperCase()
}

function randomItem<T>(items: T[]): T {
	return items[Math.floor(Math.random() * items.length)]
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const { profile } = useSession()
  const { toast, celebrateTokens } = useToast()
  const { simHour } = useMarket()
  const activeProfile: SessionProfile = profile ?? DEMO_PROFILE

  const [baseWorld, setBaseWorld] = useState<World>(() => buildWorld(SEED, activeProfile))
  const [discountPct, setDiscountPct] = useState(0)
  const [contract, setContract] = useState<PendingContract | null>(null)
  const worldRef = useRef(baseWorld)
  const discountRef = useRef(discountPct)
  const contractRef = useRef<PendingContract | null>(null)
  const activeThreadRef = useRef<string | null>(null)
  const timers = useRef<number[]>([])

  const world = useMemo<World>(() => {
    const withSurplus = (u: User) => ({ ...u, surplusKwh: surplusAt(u, simHour) })
    return { ...baseWorld, users: baseWorld.users.map(withSurplus), me: withSurplus(baseWorld.me) }
  }, [baseWorld, simHour])
  const liveRef = useRef(world)
  liveRef.current = world

  const update = useCallback((fn: (w: World) => World) => {
    worldRef.current = fn(worldRef.current)	
    setBaseWorld(worldRef.current)
  }, [])

  const later = useCallback((ms: number, fn: () => void) => {	
    timers.current.push(window.setTimeout(fn, ms))
  }, [])

  useEffect(() => {
    const pending = timers.current
    return () => pending.forEach((t) => clearTimeout(t))
  }, [])

  const profileKey = `${activeProfile.name}|${activeProfile.country}|${activeProfile.city}|${activeProfile.panelKwp}|${activeProfile.preferredPrice}`
  const lastProfileKey = useRef(profileKey)
  useEffect(() => {
    if (lastProfileKey.current === profileKey) return
    lastProfileKey.current = profileKey
    worldRef.current = buildWorld(worldRef.current.seed, activeProfile)

    setBaseWorld(worldRef.current)
  }, [profileKey])   

  const getUser = useCallback(
    (id: string) => (id === 'me' ? liveRef.current.me : liveRef.current.users.find((u) => u.id === id)),
    [],
  )

  const notify = useCallback(
    (n: Omit<AppNotification, 'id' | 'time' | 'read'>) => {
      update((w) => ({ ...w, notifications: [{ ...n, id: uid('n'), time: nowIso(), read: false }, ...w.notifications] }))
    },
    [update],
  )

  const startContract = useCallback((kind: 'sale' | 'purchase', counterparty: User, amountKwh: number, pricePerKwh: number) => {
    let price = pricePerKwh
    if (kind === 'purchase' && discountRef.current > 0) price = round(price * (1 - discountRef.current / 100), 3)
    const pending: PendingContract = {
      id: `SC-2026-${randomHex(4)}`,
      kind,
      counterparty,
      kwh: round(amountKwh, 1),
      pricePerKwh: price,
			total: round(amountKwh * price, 2),
    }
    contractRef.current = pending
    setContract(pending)
  }, [])

  const settleContract = useCallback((): ContractResult | null => {
    const pending = contractRef.current
    if (!pending) return null
    contractRef.current = null
    const w = worldRef.current
		const me = w.me
    const { kind, counterparty, total } = pending
    let discountNote = ''
    if (kind === 'purchase' && discountRef.current > 0) {
      discountNote = ` (${discountRef.current}% EcoToken discount applied)`
      discountRef.current = 0
      setDiscountPct(0)
    } 
    const seller = kind === 'sale' ? me : counterparty
    const buyer = kind === 'sale' ? counterparty : me
    const certificate: Certificate = {
      id: `SUN-2026-${String(w.certificates.length + 1).padStart(4, '0')}-${randomHex(4)}`,
      date: nowIso(),
			kwh: pending.kwh,
      source: 'PV',
      sellerId: seller.id,
      sellerName: seller.name,
      sellerCity: seller.city,
      sellerCountry: seller.country,
			buyerId: buyer.id,
      buyerName: buyer.name,	
      buyerCity: buyer.city,
      buyerCountry: buyer.country,
      contractId: pending.id,
    }
    const transaction: Transaction = {   
      id: uid('tx'),
      date: nowIso(),
			type: kind,
      counterpartyId: counterparty.id,
      counterpartyName: counterparty.name,
      country: counterparty.country,
      kwh: pending.kwh,
      pricePerKwh: pending.pricePerKwh,
      total,
      status: 'completed',   
      contractId: pending.id,
      certificateId: certificate.id,
    }
    const blocks: LedgerEntry[] = [
			{
        kind: 'contract',
        timestamp: nowIso(),
        payload: contractPayload(pending.id, pending.kwh, total, shortName(seller.name), shortName(buyer.name)),
        certificateId: null,
        contractId: pending.id,
      },
      { kind: 'certificate', timestamp: nowIso(), payload: certificatePayload(certificate), certificateId: certificate.id, contractId: pending.id },
    ]
    const tokens = Math.round(tokensForTrade(pending.kwh, distanceKm(me, counterparty)) * (kind === 'sale' ? 1 : 0.5)) 

    update((prev) => ({
      ...prev,
      balance: round(prev.balance + (kind === 'sale' ? total : -total), 2),
      ecoTokens: prev.ecoTokens + tokens,
      transactions: [transaction, ...prev.transactions],
      certificates: [...prev.certificates, certificate],
      ledgerEntries: [...prev.ledgerEntries, ...blocks],
      me: { ...prev.me, tradesCompleted: prev.me.tradesCompleted + 1 },
      users: prev.users.map((u) =>
        u.id === counterparty.id && kind === 'purchase' ? { ...u, surplusPeakKwh: Math.max(0.5, round(u.surplusPeakKwh - pending.kwh * 0.3, 1)) } : u,
      ),
    }))
    notify({
      type: 'trade',
      title: kind === 'sale' ? 'Energy sold' : 'Energy purchased',
      body: `${kwh(pending.kwh)} ${kind === 'sale' ? 'to' : 'from'} ${counterparty.name} for ${eur(total)}. Certificate ${certificate.id} issued.`,
      link: `/certificates/${certificate.id}`,
    })
    toast(
      kind === 'sale' ? 'Trade settled - energy sold!' : 'Trade settled - energy purchased!',
      `${kwh(pending.kwh)} at ${eur(pending.pricePerKwh)} / kWh = ${eur(total)}${discountNote}`,
    )
    later(400, () => celebrateTokens(tokens))
    return { certificateId: certificate.id, tokens }
  }, [update, notify, toast, celebrateTokens, later])

	const closeContract = useCallback(() => {
    contractRef.current = null
    setContract(null)
  }, [])

  const actions = useMemo<AppActions>(() => {
    const findOffer = (id: string) => worldRef.current.offers.find((o) => o.id === id)
    const patchOffer = (id: string, patch: Partial<Offer>) =>
      update((w) => ({ ...w, offers: w.offers.map((o) => (o.id === id ? { ...o, ...patch } : o)) }))

    const nearbyUsers = () => {
      const { me, users } = liveRef.current
      return [...users].sort((a, b) => distanceKm(me, a) - distanceKm(me, b)).slice(0, 10)
    }  

    const pushMessage = (threadId: string, message: ChatMessage, countUnread: boolean) =>
      update((w) => ({
        ...w,
        threads: w.threads.map((t) =>
          t.id === threadId
            ? { ...t, typing: false, messages: [...t.messages, message], unread: countUnread ? t.unread + 1 : t.unread }
            : t,
        ),
      }))

    const ensureThread = (userId: string) => {
      const existing = worldRef.current.threads.find((t) => t.userId === userId)
      if (existing) return existing.id
      const id = `th-${userId}`
      update((w) => ({ ...w, threads: [{ id, userId, messages: [], unread: 0, typing: false, online: true }, ...w.threads] }))
      return id
		}

    return {
      getUser,
      settleContract,
      closeContract,

      regenerate: () => {  
        const nextSeed = worldRef.current.seed + 1
        worldRef.current = buildWorld(nextSeed, activeProfile)
        setBaseWorld(worldRef.current)
        toast('Data regenerated', `New mock world generated (seed ${nextSeed}).`, 'info')
      },

      simulateIncomingOffer: () => {
        const seller = randomItem(nearbyUsers().filter((u) => u.role === 'seller'))
        if (!seller) return
        const fromHour = 11 + Math.floor(Math.random() * 4)
        const offer: Offer = {
          id: uid('of'),
          sellerId: seller.id,
          kwh: round(3 + Math.random() * 8, 1),
          pricePerKwh: round(0.15 + Math.random() * 0.04, 2),
          date: new Date().toISOString().slice(0, 10),
          fromHour,
          toHour: fromHour + 3,
          status: 'active',   
          createdAt: nowIso(),
        }
        update((w) => ({ ...w, offers: [offer, ...w.offers] }))
        notify({ type: 'offer', title: `New offer from ${seller.name}`, body: `${kwh(offer.kwh)} at ${eur(offer.pricePerKwh)} / kWh in ${seller.city}.`, link: '/trade' })
        toast('New offer nearby', `${seller.name} listed ${kwh(offer.kwh)} at ${eur(offer.pricePerKwh)} / kWh.`, 'info')
			},

      simulateIncomingMessage: () => {
				const thread = randomItem(worldRef.current.threads.slice(0, 6))
        if (!thread) return
        const user = getUser(thread.userId)
        const text = randomItem(INCOMING_MESSAGE_TEXTS)
        pushMessage(thread.id, { id: uid('msg'), from: 'them', text, time: nowIso() }, activeThreadRef.current !== thread.id)
        notify({ type: 'message', title: `New message from ${user?.name ?? 'a neighbour'}`, body: text, link: `/messages?thread=${thread.id}` })
        toast(`Message from ${user?.name ?? 'a neighbour'}`, text, 'info')
      },

      markNotificationRead: (id) =>
        update((w) => ({ ...w, notifications: w.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) })), 
   
      markAllNotificationsRead: () => update((w) => ({ ...w, notifications: w.notifications.map((n) => ({ ...n, read: true })) })),

      rateUser: (userId, stars) => {
        const apply = (u: User) => {
          const count = u.ratingCount + 1
          return { ...u, ratingCount: count, rating: round((u.rating * u.ratingCount + stars) / count, 1) }
        }
        update((w) => ({ ...w, users: w.users.map((u) => (u.id === userId ? apply(u) : u)), me: w.me.id === userId ? apply(w.me) : w.me }))
        toast('Thanks for your rating!', `You gave ${getUser(userId)?.name ?? 'this neighbour'} ${stars} star${stars > 1 ? 's' : ''}.`)
      },

      addComment: (userId, stars, text) => {
        const me = worldRef.current.me
        update((w) => ({
          ...w,
          comments: {
            ...w.comments,
	            [userId]: [{ id: uid('cm'), authorId: me.id, authorName: me.name, stars, text, date: nowIso() }, ...(w.comments[userId] ?? [])],
          },
        }))
        toast('Comment posted', 'Your review is now visible on the profile.')
      },

	      ensureThread,

      setActiveThread: (threadId) => {
        activeThreadRef.current = threadId
        if (threadId && worldRef.current.threads.find((t) => t.id === threadId)?.unread) {
          update((w) => ({ ...w, threads: w.threads.map((t) => (t.id === threadId ? { ...t, unread: 0 } : t)) }))
        }
      },

      sendMessage: (threadId, text) => {
        pushMessage(threadId, { id: uid('msg'), from: 'me', text, time: nowIso() }, false) 
        later(450, () => update((w) => ({ ...w, threads: w.threads.map((t) => (t.id === threadId ? { ...t, typing: true } : t)) })))
	        later(1900, () => {
          const reply = randomItem(CANNED_REPLIES)
          const isActive = activeThreadRef.current === threadId
          pushMessage(threadId, { id: uid('msg'), from: 'them', text: reply, time: nowIso() }, !isActive)
          if (!isActive) {
            const thread = worldRef.current.threads.find((t) => t.id === threadId)
            toast(`Reply from ${getUser(thread?.userId ?? '')?.name ?? 'a neighbour'}`, reply, 'info')
          }
        })
      },


      acceptChatOffer: (threadId, messageId) => {
        const thread = worldRef.current.threads.find((t) => t.id === threadId)
        const message = thread?.messages.find((m) => m.id === messageId)
        const partner = thread ? getUser(thread.userId) : undefined
        if (!thread || !message?.offer || !partner) return
        update((w) => ({
          ...w,
          threads: w.threads.map((t) =>
            t.id === threadId
              ? { ...t, messages: t.messages.map((m) => (m.id === messageId && m.offer ? { ...m, offer: { ...m.offer, status: 'accepted' } } : m)) }
              : t,
          ),
        }))
        startContract('purchase', partner, message.offer.kwh, message.offer.pricePerKwh)
      },

      createOffer: (input) => {
        const offer: Offer = { id: uid('my'), sellerId: 'me', status: 'active', createdAt: nowIso(), ...input }	
    
        update((w) => ({ ...w, offers: [offer, ...w.offers] }))  
        toast('Offer listed!', `${kwh(input.kwh)} at ${eur(input.pricePerKwh)} / kWh is now visible to your neighbours.`)
        later(6500, () => {
          const current = findOffer(offer.id)
	          if (!current || current.status !== 'active') return
          const neighbour = randomItem(nearbyUsers())


          const counterPrice = round(Math.max(0.1, input.pricePerKwh - 0.02), 2)
          patchOffer(offer.id, {
            status: 'counter-offered',
            incomingCounter: { fromUserId: neighbour.id, pricePerKwh: counterPrice, createdAt: nowIso() },
          })
          notify({ type: 'offer', title: 'Counter offer received', body: `${neighbour.name} offers ${eur(counterPrice)} / kWh for your ${kwh(input.kwh)}.`, link: '/trade?tab=mine' })
          toast('Counter offer received', `${neighbour.name} offers ${eur(counterPrice)} / kWh.`, 'info')
        })
      },

      acceptOffer: (offerId) => {
        const offer = findOffer(offerId)
        const seller = offer ? getUser(offer.sellerId) : undefined
        if (!offer || !seller) return
        const price = offer.myCounter?.status === 'accepted' ? offer.myCounter.pricePerKwh : offer.pricePerKwh
        patchOffer(offerId, { status: 'sold' })
        startContract('purchase', seller, offer.kwh, price)
      },
	
      sendCounterOffer: (offerId, pricePerKwh) => {
        patchOffer(offerId, { myCounter: { pricePerKwh, status: 'pending' } })
        toast('Counter offer sent', `You proposed ${eur(pricePerKwh)} / kWh. Waiting for a reply...`, 'info')
        later(3200, () => {
          const offer = findOffer(offerId)
          const seller = offer ? getUser(offer.sellerId) : undefined
          if (!offer || !seller || offer.status !== 'active') return
          const accepted = pricePerKwh >= offer.pricePerKwh * 0.85
          patchOffer(offerId, { myCounter: { pricePerKwh, status: accepted ? 'accepted' : 'declined' } })
          notify({
            type: 'offer',
            title: accepted ? `${seller.name} accepted your counter offer` : `${seller.name} declined your counter offer`,
            body: accepted ? `You can now buy at ${eur(pricePerKwh)} / kWh.` : 'Try a price closer to the asking price.',
            link: '/trade',
          })
          toast(
            accepted ? 'Counter offer accepted!' : 'Counter offer declined',
	            accepted ? `${seller.name}: "Deal! ${eur(pricePerKwh)} / kWh works for me."` : `${seller.name}: "Sorry, that is too low for me."`,
            accepted ? 'success' : 'warning',
          )
        })
      },

      acceptIncomingCounter: (offerId) => {
        const offer = findOffer(offerId)
        const buyer = offer?.incomingCounter ? getUser(offer.incomingCounter.fromUserId) : undefined
        if (!offer?.incomingCounter || !buyer) return
        patchOffer(offerId, { status: 'sold', pricePerKwh: offer.incomingCounter.pricePerKwh })
        startContract('sale', buyer, offer.kwh, offer.incomingCounter.pricePerKwh)
      },
 
      declineIncomingCounter: (offerId) => {
        patchOffer(offerId, { status: 'active', incomingCounter: undefined })
        toast('Counter offer declined', 'Your offer stays active at the original price.', 'info')   
      },

      cancelOffer: (offerId) => {
        patchOffer(offerId, { status: 'expired', incomingCounter: undefined })
        toast('Offer withdrawn', 'The offer is no longer visible on the marketplace.', 'info')
      },


      createRequest: (input) => {
        update((w) => ({ ...w, requests: [{ id: uid('rq'), buyerId: 'me', status: 'open', createdAt: nowIso(), ...input }, ...w.requests] }))
        toast('Buy request posted', `"I need ${input.kwh} kWh ${input.when}" is now on the map.`)

      },

      fulfillRequest: (requestId) => {
        const request = worldRef.current.requests.find((r) => r.id === requestId)
        const buyer = request ? getUser(request.buyerId) : undefined
        if (!request || !buyer) return
        update((w) => ({ ...w, requests: w.requests.map((r) => (r.id === requestId ? { ...r, status: 'fulfilled' } : r)) }))
        startContract('sale', buyer, request.kwh, Math.min(request.maxPrice, worldRef.current.me.pricePerKwh + 0.01))
      },
    

      buyEnergy: (sellerId, amountKwh) => {
        const seller = getUser(sellerId)
        if (!seller) return
        startContract('purchase', seller, amountKwh, seller.pricePerKwh)
      },

      redeemTokens: () => {
        if (worldRef.current.ecoTokens < REDEEM_COST) {   
          toast('Not enough EcoTokens', `You need ${REDEEM_COST} tokens to redeem a discount.`, 'warning')
          return
        }
        update((w) => ({ ...w, ecoTokens: w.ecoTokens - REDEEM_COST }))
        discountRef.current = REDEEM_DISCOUNT_PCT
        setDiscountPct(REDEEM_DISCOUNT_PCT)
        toast('Discount unlocked!', `${REDEEM_DISCOUNT_PCT}% off your next energy purchase.`, 'token')
      },

      claimChallenge: (id) => {
        const challenge = worldRef.current.challenges.find((c) => c.id === id)
        if (!challenge || challenge.claimed || challenge.progress < challenge.target) return 0
        update((w) => ({
          ...w,
          ecoTokens: w.ecoTokens + challenge.reward,
          challenges: w.challenges.map((c) => (c.id === id ? { ...c, claimed: true } : c)),
        }))
        toast('Reward claimed!', `+${challenge.reward} EcoTokens for "${challenge.title}".`, 'token')  
        later(300, () => celebrateTokens(challenge.reward))
				return challenge.reward
      },

      sendInvite: (email) => {
        const name = email.split('@')[0].replace(/[._-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) || 'Neighbour'
        update((w) => ({
          ...w,
          invites: [{ id: uid('inv'), name, email, status: 'pending', date: nowIso() }, ...w.invites],  
          challenges: w.challenges.map((c) => (c.id === 'invite' ? { ...c, progress: c.target } : c)),
        }))
        toast('Invitation sent!', `${email} will get your code. You both get ${INVITE_REWARD} EcoTokens when they join.`)
      },
    }
  }, [update, later, notify, toast, celebrateTokens, getUser, startContract, settleContract, closeContract, activeProfile])

  const value = useMemo<AppStateValue>(
    () => ({ world, me: world.me, discountPct, contract, ...actions }),
    [world, discountPct, contract, actions],
  )

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
}

    
export function useApp(): AppStateValue {
  const ctx = useContext(AppStateContext)
  if (!ctx) throw new Error('useApp must be used inside AppStateProvider')
  return ctx
}
