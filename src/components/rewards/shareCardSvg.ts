export type ShareVariant = 'co2' | 'kwh' | 'trees' | 'money'
export type ShareStyle = 'light' | 'dark'  

export interface ShareCardData {
  variant: ShareVariant
  style: ShareStyle
  value: string
  name: string
  initials: string
  city: string
}

export const SHARE_W = 1200
export const SHARE_H = 630

const HEADLINES: Record<ShareVariant, (v: string) => [string, string]> = {
  co2: (v) => ['I saved', `${v} of CO2`],
	kwh: (v) => ['I sold', `${v} of solar energy`],
  trees: (v) => ['My panels equal', `${v} trees planted`],
  money: (v) => ['I earned', `${v} from my roof`],
}

const escapeXml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

function tree(x: number, y: number, s: number, color: string) {
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <rect x="-6" y="40" width="12" height="38" rx="3" fill="#8B6A3E"/>
    <circle cx="0" cy="18" r="38" fill="${color}"/>
    <circle cx="-26" cy="38" r="24" fill="${color}" opacity="0.9"/>
    <circle cx="26" cy="38" r="24" fill="${color}" opacity="0.9"/>
    <circle cx="-10" cy="4" r="12" fill="#ffffff" opacity="0.18"/>
  </g>`
}

export function shareCardSvg(d: ShareCardData): string {
  const dark = d.style === 'dark'
  const bgA = dark ? '#2a2614' : '#FFE07A'   
  const bgB = dark ? '#1c2a17' : '#BFE3A8'
	const ink = dark ? '#F5EFD0' : '#2B2A1F'
  const soft = dark ? '#C9C2A0' : '#4F4B38'
  const [line1, line2] = HEADLINES[d.variant](d.value)
  const font = "Nunito, 'Arial Rounded MT Bold', 'Helvetica Neue', Arial, sans-serif"
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SHARE_W}" height="${SHARE_H}" viewBox="0 0 ${SHARE_W} ${SHARE_H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${bgA}"/>
      <stop offset="100%" stop-color="${bgB}"/>
    </linearGradient>
    <radialGradient id="sun" cx="40%" cy="38%" r="65%">
      <stop offset="0%" stop-color="#FFF4B8"/>
      <stop offset="60%" stop-color="#F6C945"/>
      <stop offset="100%" stop-color="#F4A300"/>
    </radialGradient>
  </defs>
  <rect width="${SHARE_W}" height="${SHARE_H}" fill="url(#bg)"/>
  <circle cx="1040" cy="120" r="230" fill="#F6C945" opacity="${dark ? 0.12 : 0.35}"/>
  <g transform="translate(1040 120)">
    ${Array.from({ length: 12 }, (_, i) => `<rect x="-6" y="-150" width="12" height="44" rx="6" fill="#F6C945" opacity="0.75" transform="rotate(${i * 30})"/>`).join('')}
    <circle r="86" fill="url(#sun)"/>
  </g>
  <path d="M0 520 Q300 460 620 500 T1200 470 V630 H0z" fill="${dark ? '#24331d' : '#8CCB6E'}" opacity="0.8"/>
  <path d="M0 570 Q320 530 640 560 T1200 545 V630 H0z" fill="${dark ? '#2f4524' : '#5FAE4B'}"/>
  ${tree(930, 400, 1.15, dark ? '#4C963B' : '#2F6B3A')}
  ${tree(1080, 430, 0.85, dark ? '#5FAE4B' : '#4C963B')}
  <g transform="translate(80 78)">
    <rect width="64" height="64" rx="18" fill="${dark ? '#3d3617' : '#FFF6CC'}"/>
    <circle cx="32" cy="32" r="14" fill="url(#sun)"/>
    <path d="M26 34c3-8 10-9 14-9-1 7-5 12-13 12" fill="#5FAE4B"/>
    <text x="82" y="44" font-family="${font}" font-size="34" font-weight="900" fill="${ink}">Sun<tspan fill="#5FAE4B">Swap</tspan></text>
  </g>
  <text x="80" y="232" font-family="${font}" font-size="44" font-weight="800" fill="${soft}">${escapeXml(line1)}</text>
  <text x="76" y="352" font-family="${font}" font-size="120" font-weight="900" fill="${ink}">${escapeXml(d.value)}</text>
  <text x="80" y="420" font-family="${font}" font-size="44" font-weight="800" fill="${ink}">${escapeXml(line2.replace(d.value, '').trim())}</text>
  <g transform="translate(80 470)">
    <circle cx="34" cy="34" r="34" fill="#2F6B3A"/>
    <text x="34" y="46" text-anchor="middle" font-family="${font}" font-size="28" font-weight="900" fill="#ffffff">${escapeXml(d.initials)}</text>
    <text x="84" y="30" font-family="${font}" font-size="28" font-weight="900" fill="${ink}">${escapeXml(d.name)}</text>
    <text x="84" y="62" font-family="${font}" font-size="22" font-weight="700" fill="${soft}">${escapeXml(d.city)} - Trade your surplus sun with your neighbours.</text>
  </g>
</svg>`
}
