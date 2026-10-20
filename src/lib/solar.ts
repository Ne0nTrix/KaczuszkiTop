import { hashString } from "./random"

	export interface SolarSite {
  id: string
  lat: number
  lng: number
  panelKwp: number
  surplusPeakKwh: number
  hasBattery: boolean
}

const SUNRISE = 5.5
const SUNSET = 20.5

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))
const gauss = (x: number, mu: number, sigma: number) => Math.exp(-((x - mu) ** 2) / (2 * sigma ** 2))

export function solarHour(clockHour: number, lng: number): number {
  return clockHour + (lng - 15) / 15
}

export function latitudeFactor(lat: number): number {
  return clamp(1.25 - (lat - 35) * 0.018, 0.65, 1.3)
}

export function sunShape(solarH: number): number {
  if (solarH <= SUNRISE || solarH >= SUNSET) return 0
  return Math.sin((Math.PI * (solarH - SUNRISE)) / (SUNSET - SUNRISE)) ** 1.6
}

export function consumptionShape(clockHour: number): number {
  return 0.22 + 0.3 * gauss(clockHour, 7.5, 1.2) + 0.55 * gauss(clockHour, 19.5, 1.6)
}
  
function noise(id: string, hour: number): number {
  return 0.92 + (hashString(`${id}|${Math.round(hour * 10)}`) % 1000) / 6250
}

export function productionAt(site: SolarSite, clockHour: number): number {
  const shape = sunShape(solarHour(clockHour, site.lng))
  return site.panelKwp * 0.85 * shape * latitudeFactor(site.lat) * noise(site.id, clockHour)


}

export function surplusAt(site: SolarSite, clockHour: number): number {
  if (site.surplusPeakKwh <= 0) return 0
  const shape = sunShape(solarHour(clockHour, site.lng)) * latitudeFactor(site.lat) * noise(site.id, clockHour)
  const battery = site.hasBattery ? 1.15 : 1
  const evening = site.hasBattery ? 0.18 * gauss(clockHour, 19, 1.4) : 0
  const value = site.surplusPeakKwh * battery * (shape + evening) - site.surplusPeakKwh * 0.28 * consumptionShape(clockHour)
  return Math.max(0, Math.round(value * 10) / 10)
}

export function surplusCurve(site: SolarSite, from = 5, to = 21): Array<{ hour: number; kwh: number }> {
  return Array.from({ length: to - from + 1 }, (_, i) => ({ hour: from + i, kwh: surplusAt(site, from + i) }))
}

    
export type DayPhase = 'dawn' | 'day' | 'golden' | 'dusk'



export function dayPhase(clockHour: number): DayPhase {
  if (clockHour < 7.5) return 'dawn'
  if (clockHour < 17.5) return 'day'
  if (clockHour < 20) return 'golden'
  return 'dusk'
}
