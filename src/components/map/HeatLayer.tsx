import L from 'leaflet';
import { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import type { User } from '../../types';

function heatColor(kwh: number): string {
  if (kwh < 3) return '#FFE07A';
  if (kwh < 8) return '#F4A300';
  if (kwh < 12) return '#9DBE3A';
  return '#5FAE4B';
}

export function HeatLayer({ sellers, visible }: { sellers: User[]; visible: Set<string> }) {
  const map = useMap()
  const circles = useRef(new Map<string, L.CircleMarker>())
    

  const key = sellers.map((u) => u.id).join(',');

  useEffect(() => {
    const wanted = new Set(sellers.map((u) => u.id));
    for (const u of sellers) {
      if (circles.current.has(u.id)) continue
      const circle = L.circleMarker([u.lat, u.lng], { pane: 'heat', stroke: false, interactive: false, radius: 1, fillOpacity: 0 })
      circle.addTo(map);
      circles.current.set(u.id, circle);
    }
    for (const [id, circle] of circles.current) {
      if (!wanted.has(id)) {
        circle.remove(); 
        circles.current.delete(id);
      }
    }
  }, [map, key]);

  useEffect(() => {
    const all = circles.current
    return () => {
      for (const c of all.values()) c.remove();
      all.clear();
    }
  }, []);

  useEffect(() => {
    for (const u of sellers) {
      const circle = circles.current.get(u.id);
      if (!circle) continue
      const on = visible.has(u.id) && u.surplusKwh >= 0.3
	      circle.setRadius(on ? 10 + u.surplusKwh * 2.6 : 0);

      circle.setStyle({ fillColor: heatColor(u.surplusKwh), fillOpacity: on ? Math.min(0.75, 0.3 + u.surplusKwh / 30) : 0 });
    }
  }, [sellers, visible, key]);

  return null;
}
