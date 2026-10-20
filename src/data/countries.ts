export interface CityInfo {	
  name: string
  lat: number
  lng: number
}

export interface CountryInfo {
  code: string
  name: string
  priceLevel: number
  sellers: number
  cities: CityInfo[]
  view: { center: [number, number]; zoom: number }
}

const c = (name: string, lat: number, lng: number): CityInfo => ({ name, lat, lng })

export const COUNTRIES: CountryInfo[] = [
  {
		code: 'PL', name: 'Poland', priceLevel: 0.95, sellers: 60, view: { center: [52.0, 19.4], zoom: 6 },
    cities: [
      c('Warsaw', 52.2297, 21.0122), c('Krakow', 50.0647, 19.945), c('Gdansk', 54.352, 18.6466), c('Wroclaw', 51.1079, 17.0385),
      c('Poznan', 52.4064, 16.9252), c('Lodz', 51.7592, 19.456), c('Lublin', 51.2465, 22.5684), c('Katowice', 50.2649, 19.0238),
      c('Szczecin', 53.4285, 14.5528), c('Bialystok', 53.1325, 23.1688), c('Rzeszow', 50.0412, 21.9991), c('Olsztyn', 53.7784, 20.4801),
      c('Kielce', 50.8661, 20.6286), c('Opole', 50.6751, 17.9213), c('Torun', 53.0138, 18.5984), c('Bydgoszcz', 53.1235, 18.0084),
    ],
  },
  {
    code: 'DE', name: 'Germany', priceLevel: 1.15, sellers: 24, view: { center: [51.1, 10.4], zoom: 6 },
    cities: [c('Berlin', 52.52, 13.405), c('Munich', 48.1351, 11.582), c('Hamburg', 53.5511, 9.9937), c('Cologne', 50.9375, 6.9603), c('Frankfurt', 50.1109, 8.6821), c('Stuttgart', 48.7758, 9.1829)],
  },
  {
    code: 'FR', name: 'France', priceLevel: 0.9, sellers: 18, view: { center: [46.6, 2.4], zoom: 6 },
    cities: [c('Paris', 48.8566, 2.3522), c('Lyon', 45.764, 4.8357), c('Marseille', 43.2965, 5.3698), c('Toulouse', 43.6047, 1.4442), c('Bordeaux', 44.8378, -0.5792)],
  },
  {
    code: 'ES', name: 'Spain', priceLevel: 0.75, sellers: 18, view: { center: [40.2, -3.6], zoom: 6 },
    cities: [c('Madrid', 40.4168, -3.7038), c('Barcelona', 41.3874, 2.1686), c('Valencia', 39.4699, -0.3763), c('Seville', 37.3891, -5.9845), c('Malaga', 36.7213, -4.4214)],
  },
  {
    code: 'IT', name: 'Italy', priceLevel: 1.0, sellers: 16, view: { center: [42.8, 12.5], zoom: 6 },
    cities: [c('Rome', 41.9028, 12.4964), c('Milan', 45.4642, 9.19), c('Naples', 40.8518, 14.2681), c('Turin', 45.0703, 7.6869), c('Bologna', 44.4949, 11.3426)],
  },
  {
    code: 'NL', name: 'Netherlands', priceLevel: 1.0, sellers: 12, view: { center: [52.2, 5.3], zoom: 7 },
    cities: [c('Amsterdam', 52.3676, 4.9041), c('Rotterdam', 51.9244, 4.4777), c('Utrecht', 52.0907, 5.1214), c('Eindhoven', 51.4416, 5.4697)],
  },
  { code: 'AT', name: 'Austria', priceLevel: 0.95, sellers: 8, view: { center: [47.6, 14.1], zoom: 7 }, cities: [c('Vienna', 48.2082, 16.3738), c('Graz', 47.0707, 15.4395), c('Salzburg', 47.8095, 13.055)] },
  { code: 'CZ', name: 'Czechia', priceLevel: 0.92, sellers: 8, view: { center: [49.8, 15.5], zoom: 7 }, cities: [c('Prague', 50.0755, 14.4378), c('Brno', 49.1951, 16.6068), c('Ostrava', 49.8209, 18.2625)] },
  { code: 'BE', name: 'Belgium', priceLevel: 1.05, sellers: 7, view: { center: [50.8, 4.5], zoom: 8 }, cities: [c('Brussels', 50.8503, 4.3517), c('Antwerp', 51.2194, 4.4025), c('Ghent', 51.0543, 3.7174)] },
  { code: 'PT', name: 'Portugal', priceLevel: 0.8, sellers: 6, view: { center: [39.6, -8.0], zoom: 7 }, cities: [c('Lisbon', 38.7223, -9.1393), c('Porto', 41.1579, -8.6291)] },
  { code: 'GR', name: 'Greece', priceLevel: 0.9, sellers: 5, view: { center: [39.0, 22.9], zoom: 6 }, cities: [c('Athens', 37.9838, 23.7275), c('Thessaloniki', 40.6401, 22.9444)] },
  { code: 'HU', name: 'Hungary', priceLevel: 0.88, sellers: 5, view: { center: [47.2, 19.5], zoom: 7 }, cities: [c('Budapest', 47.4979, 19.0402), c('Debrecen', 47.5316, 21.6273)] },
  { code: 'RO', name: 'Romania', priceLevel: 0.87, sellers: 5, view: { center: [45.9, 24.9], zoom: 6 }, cities: [c('Bucharest', 44.4268, 26.1025), c('Cluj-Napoca', 46.7712, 23.6236)] },
  { code: 'SK', name: 'Slovakia', priceLevel: 0.9, sellers: 4, view: { center: [48.7, 19.5], zoom: 7 }, cities: [c('Bratislava', 48.1486, 17.1077), c('Kosice', 48.7164, 21.2611)] },
  { code: 'SE', name: 'Sweden', priceLevel: 0.6, sellers: 4, view: { center: [59.0, 15.0], zoom: 5 }, cities: [c('Stockholm', 59.3293, 18.0686), c('Gothenburg', 57.7089, 11.9746)] },
  { code: 'DK', name: 'Denmark', priceLevel: 1.1, sellers: 4, view: { center: [56.0, 10.5], zoom: 7 }, cities: [c('Copenhagen', 55.6761, 12.5683), c('Aarhus', 56.1629, 10.2039)] },
  { code: 'HR', name: 'Croatia', priceLevel: 0.88, sellers: 3, view: { center: [44.9, 15.9], zoom: 7 }, cities: [c('Zagreb', 45.815, 15.9819), c('Split', 43.5081, 16.4402)] },
  { code: 'BG', name: 'Bulgaria', priceLevel: 0.85, sellers: 3, view: { center: [42.7, 25.3], zoom: 7 }, cities: [c('Sofia', 42.6977, 23.3219), c('Plovdiv', 42.1354, 24.7453)] },
  { code: 'FI', name: 'Finland', priceLevel: 0.6, sellers: 3, view: { center: [61.5, 25.5], zoom: 5 }, cities: [c('Helsinki', 60.1699, 24.9384), c('Tampere', 61.4978, 23.761)] },
  { code: 'IE', name: 'Ireland', priceLevel: 1.1, sellers: 3, view: { center: [53.2, -7.9], zoom: 7 }, cities: [c('Dublin', 53.3498, -6.2603), c('Cork', 51.8985, -8.4756)] },
  { code: 'LT', name: 'Lithuania', priceLevel: 0.92, sellers: 3, view: { center: [55.3, 23.9], zoom: 7 }, cities: [c('Vilnius', 54.6872, 25.2797), c('Kaunas', 54.8985, 23.9036)] },
  { code: 'LV', name: 'Latvia', priceLevel: 0.92, sellers: 2, view: { center: [56.9, 24.6], zoom: 7 }, cities: [c('Riga', 56.9496, 24.1052)] },
  { code: 'EE', name: 'Estonia', priceLevel: 0.9, sellers: 2, view: { center: [58.7, 25.5], zoom: 7 }, cities: [c('Tallinn', 59.437, 24.7536), c('Tartu', 58.378, 26.729)] },
  { code: 'SI', name: 'Slovenia', priceLevel: 0.93, sellers: 2, view: { center: [46.1, 14.9], zoom: 8 }, cities: [c('Ljubljana', 46.0569, 14.5058), c('Maribor', 46.5547, 15.6459)] },
  { code: 'LU', name: 'Luxembourg', priceLevel: 1.0, sellers: 2, view: { center: [49.7, 6.1], zoom: 9 }, cities: [c('Luxembourg City', 49.6116, 6.1319)] }, 
  { code: 'CY', name: 'Cyprus', priceLevel: 0.98, sellers: 2, view: { center: [35.0, 33.2], zoom: 8 }, cities: [c('Nicosia', 35.1856, 33.3823), c('Limassol', 34.7071, 33.0226)] },
  { code: 'MT', name: 'Malta', priceLevel: 0.95, sellers: 1, view: { center: [35.9, 14.45], zoom: 10 }, cities: [c('Valletta', 35.8989, 14.5146)] },
]

export const COUNTRY_BY_CODE: Record<string, CountryInfo> = Object.fromEntries(COUNTRIES.map((x) => [x.code, x]))  

export function countryName(code: string): string {
  return COUNTRY_BY_CODE[code]?.name ?? code
	}

export function priceLevel(code: string): number {
  return COUNTRY_BY_CODE[code]?.priceLevel ?? 0.95
}


export function findCity(country: string, city: string): CityInfo {
  const info = COUNTRY_BY_CODE[country] ?? COUNTRY_BY_CODE.PL
  return info.cities.find((x) => x.name === city) ?? info.cities[0]	
}

export function allocate(total: number, weights: number[]): number[] {
  const sum = weights.reduce((a, b) => a + b, 0)
  const raw = weights.map((w) => (w / sum) * total)
  const base = raw.map(Math.floor)
	  let left = total - base.reduce((a, b) => a + b, 0)
  const order = raw.map((r, i) => ({ i, rest: r - Math.floor(r) })).sort((a, b) => b.rest - a.rest)
  for (const { i } of order) {
    if (left <= 0) break
    base[i] += 1
    left -= 1
  }
  return base
}

export const TOTAL_SELLERS = COUNTRIES.reduce((s, x) => s + x.sellers, 0)
export const TOTAL_BUYERS = 70

export const BUYERS_PER_COUNTRY: Record<string, number> = (() => {
  const counts = allocate(TOTAL_BUYERS, COUNTRIES.map((x) => x.sellers))
  return Object.fromEntries(COUNTRIES.map((x, i) => [x.code, counts[i]]))
})()
