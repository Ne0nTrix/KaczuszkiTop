import {
	fakerCS_CZ,
	fakerDA,
  fakerDE,
	fakerDE_AT,
  fakerEN_IE,
	fakerES,
  fakerFI,
	fakerFR,
  fakerFR_LU,
  fakerHR,
  fakerHU,
  fakerIT,
  fakerLV,
  fakerNL,
  fakerNL_BE,
	fakerPL,
	fakerPT_PT,
  fakerRO,
  fakerSK,
  fakerSL_SI,
	fakerSV,
} from '@faker-js/faker'
import type { Faker } from "@faker-js/faker"
import type { Role, SessionProfile, User } from "../types"
import { AVATAR_COLORS, INVERTERS, MICROGRIDS, RESPONSE_TIMES } from "./constants"
import { BUYERS_PER_COUNTRY, COUNTRIES, allocate, findCity, priceLevel } from './countries'
import type { CountryInfo } from './countries'
import { BIO_CLOSERS, BUYER_BIOS, FALLBACK_NAMES, SELLER_BIOS } from "./phrases"

const LOCALES: Record<string, Faker> = {
  PL: fakerPL, DE: fakerDE, AT: fakerDE_AT, FR: fakerFR, ES: fakerES, IT: fakerIT, NL: fakerNL, BE: fakerNL_BE,
  CZ: fakerCS_CZ, PT: fakerPT_PT, HU: fakerHU, RO: fakerRO, SK: fakerSK, SE: fakerSV, DK: fakerDA, HR: fakerHR,
  FI: fakerFI, IE: fakerEN_IE, LV: fakerLV, SI: fakerSL_SI, LU: fakerFR_LU,
}

export function toAscii(text: string): string {
  return text
    .replace(/ł/g, 'l')
    .replace(/Ł/g, 'L')
		.replace(/[øØ]/g, (m) => (m === 'ø' ? 'o' : 'O'))
		.replace(/æ/g, 'ae')
    .replace(/Æ/g, 'Ae')
    .replace(/ß/g, 'ss')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
    .replace(/[^\x20-\x7E]/g, '')
}

export function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)   

		.map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

function microgridFor(country: string, city: string): string | null {
  return MICROGRIDS.find((m) => m.country === country && m.city === city)?.id ?? null
}

function personName(f: Faker, country: string): string {
  const locale = LOCALES[country]
  const sex = f.helpers.arrayElement(['female', 'male'] as const)
  if(locale) return toAscii(`${locale.person.firstName(sex)} ${locale.person.lastName(sex)}`).replace(/\s+/g, ' ').trim()
  const pool = FALLBACK_NAMES[country] ?? FALLBACK_NAMES.MT
  return `${f.helpers.arrayElement(pool.first)} ${f.helpers.arrayElement(pool.last)}`
}

function citiesFor(country: CountryInfo, count: number): string[] {
  const weights = country.cities.map((_, i) => 1 / Math.sqrt(i + 1))
	const counts = allocate(count, weights)
  return country.cities.flatMap((city, i) => Array.from({ length: counts[i] }, () => city.name))
}

function makeUser(f: Faker, id: string, role: Role, country: string, cityName: string): User {
  const city = findCity(country, cityName)
  const isSeller = role === 'seller'
  const name = personName(f, country)

	const panelKwp = isSeller ? f.number.float({ min: 3, max: 15, fractionDigits: 1 }) : 0
  const hasBattery = isSeller && f.datatype.boolean({ probability: 0.45 })
	const surplusPeakKwh = isSeller ? Math.round((1 + 16 * f.number.float({ min: 0, max: 1 }) ** 1.5) * (0.7 + panelKwp / 30) * 10) / 10 : 0
  const microgrid = microgridFor(country, cityName)
  const inMicrogrid = microgrid !== null && (role === 'buyer' || f.datatype.boolean({ probability: 0.85 }))
  const ratingCount = f.number.int({ min: 3, max: 140 })

  return {
		id,
    name,
		initials: initialsOf(name),
		avatarColor: f.helpers.arrayElement(AVATAR_COLORS),
    city: cityName,  
    country,
    lat: city.lat + f.number.float({ min: -0.07, max: 0.07 }),
    lng: city.lng + f.number.float({ min: -0.1, max: 0.1 }),
		panelKwp,
	    inverter: isSeller ? f.helpers.arrayElement(INVERTERS) : '-',
    hasBattery,
    batteryKwh: hasBattery ? f.helpers.arrayElement([5, 7.7, 10, 13.5]) : 0,
    surplusPeakKwh,
    surplusKwh: 0, 
		pricePerKwh: isSeller ? Math.round(f.number.float({ min: 0.15, max: 0.24 }) * priceLevel(country) * 100) / 100 : 0,
    rating: f.number.float({ min: 3.6, max: 5, fractionDigits: 1 }),
		ratingCount,   
    verified: f.datatype.boolean({ probability: 0.75 }),
		role,
		microgridId: inMicrogrid ? microgrid : null,
		joinedAt: f.date.between({ from: '2023-02-01', to: '2026-04-01' }).toISOString(),
    bio: isSeller ? `${f.helpers.arrayElement(SELLER_BIOS)} ${f.helpers.arrayElement(BIO_CLOSERS)}` : f.helpers.arrayElement(BUYER_BIOS),
		responseTime: f.helpers.arrayElement(RESPONSE_TIMES),
    tradesCompleted: f.number.int({ min: 2, max: 220 }),
    ecoTokens: f.number.int({ min: 60, max: 1500 }),
	}
}

export function generateUsers(f: Faker, seed: number): User[] {
  for (const localeFaker of new Set(Object.values(LOCALES))) localeFaker.seed(seed)
	const users: User[] = []
	let sellerIndex = 1
	let buyerIndex = 1  
  for (const country of COUNTRIES) {
    for (const city of citiesFor(country, country.sellers)) {
      users.push(makeUser(f, `s${String(sellerIndex++).padStart(3, '0')}`, 'seller', country.code, city))   
    }
    for(const city of citiesFor(country, BUYERS_PER_COUNTRY[country.code])) {
      users.push(makeUser(f, `b${String(buyerIndex++).padStart(3, '0')}`, 'buyer', country.code, city))   
		}
  }
  return users
}

export const DEMO_PROFILE: SessionProfile = {
  name: 'Demo User',
  email: 'demo@sunswap.app',
  country: 'PL',
  city: 'Krakow',
  panelKwp: 6.5,
	preferredPrice: 0.19,
	isDemo: true,
}

export function buildMe(profile: SessionProfile): User {
  const country = profile.country || 'PL'
  const city = findCity(country, profile.city)
  const name = profile.name || 'Demo User'
  return {
    id: 'me',
		name,
		initials: initialsOf(name),
    avatarColor: '#2F6B3A',
    city: city.name,
    country,
    lat: city.lat,
    lng: city.lng,
    panelKwp: profile.panelKwp,
    inverter: 'Fronius Primo 6.0',
    hasBattery: true,
    batteryKwh: 5,
    surplusPeakKwh: Math.round(profile.panelKwp * 1.1 * 10) / 10,
    surplusKwh: 0,
    pricePerKwh: profile.preferredPrice,
    rating: 4.8,
		ratingCount: 23,
    verified: true,
    role: 'seller',
    microgridId: microgridFor(country, city.name) ?? 'mg-krakow',   
		joinedAt: '2025-03-14T10:00:00.000Z',
    bio: 'Proud prosumer sharing sunshine with the neighbourhood.',
    responseTime: 'within 15 min',
	    tradesCompleted: 37,
		ecoTokens: 0,
	}


}
