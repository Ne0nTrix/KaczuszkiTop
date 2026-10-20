import type { Microgrid } from '../types';
import { findCity } from './countries'

export const SEED = 2026;
export const CO2_KG_PER_KWH = 0.7;
export const TREE_KG_CO2_PER_YEAR = 21;
export const STARTING_BALANCE = 1248.6;
export const STARTING_TOKENS = 640;
export const REDEEM_COST = 150;
export const REDEEM_DISCOUNT_PCT = 10;
export const INVITE_REWARD = 50

export const DEMO_DAY_LABEL = 'Sunny day, 24 May';
export const DEMO_DAY = new Date(2026, 4, 24);
export const CLOCK_MIN = 5;
export const CLOCK_MAX = 21
export const DEFAULT_HOUR = 12;

export const PLATFORM_PROSUMERS = 12480
export const PLATFORM_SCALE = PLATFORM_PROSUMERS / 300

export const EU_VIEW = { center: [50.0, 14.0] as [number, number], zoom: 4 };
export const HOME_COUNTRY = 'PL'

const ESRI = 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas';
export const TILES = {
  light: { base: `${ESRI}/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}`, labels: `${ESRI}/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}` },
  dark: { base: `${ESRI}/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}`, labels: `${ESRI}/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}` },
};
export const TILE_ATTRIBUTION = 'Tiles (c) Esri - Esri, HERE, Garmin, (c) OpenStreetMap contributors';
export const TILE_MAX_ZOOM = 16

const grid = (id: string, name: string, country: string, city: string): Microgrid => {	
  const at = findCity(country, city);
	return { id, name, country, city, lat: at.lat, lng: at.lng };
}

export const MICROGRIDS: Microgrid[] = [
  grid('mg-krakow', 'Krakow Sunny Hills', 'PL', 'Krakow'),
  grid('mg-gdansk', 'Gdansk Harbour Solar', 'PL', 'Gdansk'),
  grid('mg-warsaw', 'Warsaw Mokotow Sun Club', 'PL', 'Warsaw'),
  grid('mg-wroclaw', 'Wroclaw Riverside Grid', 'PL', 'Wroclaw'),
		grid('mg-poznan', 'Poznan Green Roofs', 'PL', 'Poznan'),
  grid('mg-lodz', 'Lodz Factory Lofts Solar', 'PL', 'Lodz'),
  grid('mg-munich', 'Bavaria Rooftops', 'DE', 'Munich'),
  grid('mg-berlin', 'Berlin Kreuzberg Solar', 'DE', 'Berlin'),
  grid('mg-hamburg', 'Hamburg Harbour Power', 'DE', 'Hamburg'),
  grid('mg-lyon', 'Lyon Soleil Commons', 'FR', 'Lyon'),
  grid('mg-paris', 'Paris Rooftop Collective', 'FR', 'Paris'),
	grid('mg-seville', 'Andalusia Sun Collective', 'ES', 'Seville'),
  grid('mg-valencia', 'Valencia Huerta Energy', 'ES', 'Valencia'),
  grid('mg-milan', 'Milan Green Balconies', 'IT', 'Milan'),
  grid('mg-rome', 'Rome Sunny Quarter', 'IT', 'Rome'),
  grid('mg-amsterdam', 'Amsterdam Canal Solar', 'NL', 'Amsterdam'),
  grid('mg-utrecht', 'Utrecht Energy Co-op', 'NL', 'Utrecht'),
  grid('mg-vienna', 'Vienna Danube Solar', 'AT', 'Vienna'),
	grid('mg-prague', 'Prague Vltava Sun', 'CZ', 'Prague'),
	grid('mg-ghent', 'Ghent Solar Street', 'BE', 'Ghent'),
  grid('mg-lisbon', 'Lisbon Sol Coop', 'PT', 'Lisbon'),
  grid('mg-athens', 'Athens Rooftop Sun', 'GR', 'Athens'),
	grid('mg-budapest', 'Budapest Sun Circle', 'HU', 'Budapest'),
  grid('mg-aarhus', 'Aarhus Wind and Sun', 'DK', 'Aarhus'),
]

export const AVATAR_COLORS = [
  '#F6C945', '#5FAE4B', '#F4A300', '#8CCB6E', '#F28C28', '#3B9BC4', '#C9A227', '#7FB77E', '#E8B04B', '#4E9A8A',
];

export const LEVELS = [
  { name: 'Seed', min: 0 },
  { name: 'Sprout', min: 200 },
	{ name: 'Green Neighbour', min: 500 },
  { name: 'Solar Leader', min: 1000 },
] as const;

export const INVERTERS = [
  'Fronius Primo 6.0', 'SMA Sunny Boy 5.0', 'Huawei SUN2000-6KTL', 'SolarEdge SE5000H', 'GoodWe GW6000-DNS',
	  'Growatt MIN 6000TL-X', 'Enphase IQ8+ microinverters', 'Sungrow SH6.0RT', 'Fronius Symo 10.0', 'SMA Sunny Tripower 8.0',
];

export const RESPONSE_TIMES = ['within 5 min', 'within 15 min', 'within 30 min', 'within 1 hour', 'within 3 hours'];
