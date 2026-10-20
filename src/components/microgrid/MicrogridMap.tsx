import L from 'leaflet';
import { useMemo } from 'react';
import { MapContainer, Marker, Polyline, Tooltip } from 'react-leaflet';
import type { User } from '../../types';
import { TILE_MAX_ZOOM } from '../../data/constants'
import { BaseTiles, InvalidateSize, ZoomClass } from '../map/MapHelpers';


import { batteryIcon, buyerIcon, homeIcon, sellerIcon } from '../map/pinIcons'

export interface MemberBalance {
  user: User
  production: number
  consumption: number
  balance: number
}

export interface Flow {
  from: [number, number]
  to: [number, number]
  kwh: number
	  label: string
	  fromBattery: boolean
}

interface MicrogridMapProps {
  members: MemberBalance[]
  flows: Flow[]	
  battery: [number, number]
}

function flowLabel(kwh: number, fromBattery: boolean) {
  return L.divIcon({
    className: 'flow-label',
    iconSize: [0, 0],
    html: `<span class="flow-chip${fromBattery ? ' battery' : ''}">${kwh.toFixed(1)} kWh</span>`,
  });	
}

export function MicrogridMap({ members, flows, battery }: MicrogridMapProps) {
  const bounds = useMemo(() => {
		const pts = [...members.map((m) => [m.user.lat, m.user.lng] as [number, number]), battery]
    return L.latLngBounds(pts).pad(0.2); 
  }, [members, battery]);

  return (
    <MapContainer bounds={bounds} minZoom={4} maxZoom={TILE_MAX_ZOOM} scrollWheelZoom={false} className="size-full rounded-2xl" zoomControl>
      <BaseTiles />
      <InvalidateSize />  
      <ZoomClass threshold={9} />
      {flows.map((f, i) => (
        <Polyline
          key={`${f.label}-${i}`}
          positions={[f.from, f.to]}
          pathOptions={{
            color: f.fromBattery ? '#F4A300' : '#5FAE4B',
            weight: Math.min(7, 2.5 + f.kwh / 1.2),
            opacity: 0.9,
            dashArray: '10 8',
            lineCap: 'round',
            className: f.kwh < 1 ? 'flow-line slow' : 'flow-line',
          }}
        >
          <Tooltip sticky>{f.label}</Tooltip>
        </Polyline>
      ))}
      {flows
        .filter((f) => f.kwh >= 0.3)
        .map((f, i) => (
          <Marker
            key={`label-${i}`}
            position={[(f.from[0] + f.to[0]) / 2, (f.from[1] + f.to[1]) / 2]}
            icon={flowLabel(f.kwh, f.fromBattery)}
            interactive={false}
          />
        ))}
      <Marker position={battery} icon={batteryIcon()} />
      {members.map((m) =>
        m.user.id === 'me' ? (
          <Marker key={m.user.id} position={[m.user.lat, m.user.lng]} icon={homeIcon('You')} zIndexOffset={1000} />
        ) : m.balance >= 0 ? (
          <Marker key={m.user.id} position={[m.user.lat, m.user.lng]} icon={sellerIcon(Math.max(1, m.balance * 2), {}, false)}>
            <Tooltip direction="top" offset={[0, -10]}>
              {m.user.name}: +{m.balance.toFixed(1)} kWh
            </Tooltip>
          </Marker>
        ) : (
          <Marker key={m.user.id} position={[m.user.lat, m.user.lng]} icon={buyerIcon(`${m.balance.toFixed(1)} kWh`, {})}>
            <Tooltip direction="top" offset={[0, -16]}>
              {m.user.name}: needs {Math.abs(m.balance).toFixed(1)} kWh  
            </Tooltip>
          </Marker>
        ),
      )}
    </MapContainer>	
	  );
    
}
