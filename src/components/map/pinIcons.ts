import L from 'leaflet'

const PLUG_SVG =
  '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22v-5"/><path d="M9 8V2"/><path d="M15 8V2"/><path d="M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8Z"/></svg>'

const HOME_SVG =
  '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/></svg>'

const BATTERY_SVG =
  '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2B2A1F" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="16" height="10" rx="2"/><path d="M22 11v2"/><path d="m11 9-2 3h3l-2 3"/></svg>'

export function pulseFor(surplusKwh: number): { ring: number; speed: number } {
  const t = Math.max(0, Math.min(1, (surplusKwh - 1) / 17))
  return { ring: Math.round(30 + t * 70), speed: Number((3.4 - t * 2.5).toFixed(2)) }
}



interface PinState {
  hidden?: boolean
	selected?: boolean
}

function stateClass({ hidden, selected }: PinState): string {
  return `${hidden ? ' is-hidden' : ''}${selected ? ' is-selected' : ''}`
}

export function sellerIcon(surplusKwh: number, state: PinState, showLabel = true): L.DivIcon {
  const { ring, speed } = pulseFor(surplusKwh)
  return L.divIcon({
    className: 'sun-pin',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    html: `<div class="pin-body${stateClass(state)}" style="--ring:${ring}px;--speed:${speed}s">
      <span class="pin-ring"></span><span class="pin-ring delay"></span>
      <span class="pin-core"></span>
      ${showLabel ? `<span class="pin-label">${surplusKwh.toFixed(1)} kWh</span>` : ''}
    </div>`,
  })
}

export function buyerIcon(tag: string, state: PinState, shortTag = tag): L.DivIcon {
	  return L.divIcon({
    className: 'buyer-pin',
    iconSize: [24, 24],
    iconAnchor: [12, 20],
    html: `<div class="pin-body${stateClass(state)}">
      <span class="buyer-drop">${PLUG_SVG}</span>
      <span class="buyer-tag short">${shortTag}</span>
      <span class="buyer-tag full">${tag}</span>
    </div>`,
  })

}

export function homeIcon(label = 'You'): L.DivIcon {
  return L.divIcon({
    className: 'home-pin',
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    html: `<div class="pin-body"><span class="home-dot">${HOME_SVG}</span><span class="pin-label" style="top:29px;color:#2B2A1F">${label}</span></div>`,
  })
}

export function batteryIcon(): L.DivIcon {
  return L.divIcon({
    className: 'battery-pin',
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    html: `<div class="pin-body" style="width:34px;height:34px"><span class="home-dot" style="background:#F6C945;border-radius:12px">${BATTERY_SVG}</span><span class="pin-label" style="top:37px;color:#2B2A1F">Community battery</span></div>`,
  })
}   
