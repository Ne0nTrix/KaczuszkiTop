import L from "leaflet"
import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import type { BuyRequest, User } from '../../types'
import { pulseFor } from './pinIcons'

const PLUG_SVG =
  '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22v-5"/><path d="M9 8V2"/><path d="M15 8V2"/><path d="M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8Z"/></svg>';

const SELLER_HTML =
  '<div class="pin-body"><span class="pin-ring"></span><span class="pin-ring delay"></span><span class="pin-core"></span><span class="pin-label"></span></div>';
 
const sellerIcon = L.divIcon({ className: 'sun-pin', iconSize: [24, 24], iconAnchor: [12, 12], html: SELLER_HTML });

function buyerIcon(tag: string, short: string) {
  return L.divIcon({
    className: 'buyer-pin',
    iconSize: [24, 24],
		iconAnchor: [12, 20],
    html: `<div class="pin-body"><span class="buyer-drop">${PLUG_SVG}</span><span class="buyer-tag short">${short}</span><span class="buyer-tag full">${tag}</span></div>`,
	})
}

export interface BuyerPin {
	user: User
  request: BuyRequest
	clickable: boolean
}

interface PinsLayerProps {
  sellers: User[]
	buyers: BuyerPin[]
  visible: Set<string>
  selectedId: string | null
	onSelect: (id: string) => void
}
	
interface Entry {
  marker: L.Marker
  body: HTMLElement | null
}



export function PinsLayer({ sellers, buyers, visible, selectedId, onSelect }: PinsLayerProps) {
	const map = useMap();
  const entries = useRef(new Map<string, Entry>());
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect

  const sellerKey = sellers.map((u) => u.id).join(',');
	const buyerKey = buyers.map((b) => `${b.request.id}:${b.user.id}`).join(',');

	useEffect(() => {
    const wanted = new Set<string>();	
		const add = (key: string, latlng: [number, number], icon: L.DivIcon, z: number, clickable: boolean, userId: string) => {
			wanted.add(key)
      if (entries.current.has(key)) return;
			const marker = L.marker(latlng, { icon, pane: 'pins', zIndexOffset: z, keyboard: false })
      if(clickable) marker.on('click', () => onSelectRef.current(userId));
			marker.addTo(map);
      entries.current.set(key, { marker, body: null })
    
    };
    for (const u of sellers) add(`s:${u.id}`, [u.lat, u.lng], sellerIcon, 0, true, u.id);
    for(const b of buyers) {
      add(`b:${b.request.id}`, [b.user.lat, b.user.lng], buyerIcon(`Needs ${b.request.kwh} kWh ${b.request.when}`, `${b.request.kwh} kWh`), 500, b.clickable, b.user.id)
			}
    for (const [key, entry] of entries.current) {
      if (!wanted.has(key)) {
        entry.marker.remove();   
				entries.current.delete(key);
      }
    }
  }, [map, sellerKey, buyerKey]);

  useEffect(() => {
    const all = entries.current;
    return () => {
			for(const entry of all.values()) entry.marker.remove()
      all.clear();
    }
  }, []);

  useEffect(() => {
    const bodyOf = (entry: Entry) => {
			if (!entry.body || !entry.body.isConnected) entry.body = entry.marker.getElement()?.querySelector<HTMLElement>('.pin-body') ?? null;
			return entry.body;
    };
    for(const u of sellers) {
      const entry = entries.current.get(`s:${u.id}`);
      const body = entry && bodyOf(entry)
      if(!entry || !body) continue
			const { ring, speed } = pulseFor(u.surplusKwh);
      body.style.setProperty('--ring', `${ring}px`);
      body.style.setProperty('--speed', `${speed}s`)
      body.classList.toggle('is-hidden', !visible.has(u.id));
      body.classList.toggle('is-asleep', u.surplusKwh < 0.3)
      body.classList.toggle('is-selected', selectedId === u.id)
      const label = body.querySelector('.pin-label');	
			if(label) label.textContent = `${u.surplusKwh.toFixed(1)} kWh`
			entry.marker.setZIndexOffset(selectedId === u.id ? 1000 : Math.round(u.surplusKwh * 10));
    }
    for (const b of buyers) {
      const entry = entries.current.get(`b:${b.request.id}`)
      const body = entry && bodyOf(entry);
      if(!body) continue
      body.classList.toggle('is-hidden', !visible.has(b.user.id))
			body.classList.toggle('is-selected', selectedId === b.user.id);
		}	
	}, [sellers, buyers, visible, selectedId, sellerKey, buyerKey]);

  return null;  
}
