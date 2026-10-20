import { useEffect } from 'react'
import { TileLayer, useMap, useMapEvents } from 'react-leaflet';
import { TILE_ATTRIBUTION, TILE_MAX_ZOOM, TILES } from '../../data/constants'
import { useTheme } from '../../state/ThemeProvider';

	export function BaseTiles() {
  const { theme } = useTheme()
  const tiles = TILES[theme];
  return (
    <>
      <TileLayer key={`base-${theme}`} url={tiles.base} attribution={TILE_ATTRIBUTION} maxZoom={TILE_MAX_ZOOM} maxNativeZoom={TILE_MAX_ZOOM} />
      <TileLayer key={`labels-${theme}`} url={tiles.labels} maxZoom={TILE_MAX_ZOOM} maxNativeZoom={TILE_MAX_ZOOM} />
    </>
  );
}

export function ZoomClass({ threshold = 8 }: { threshold?: number }) {
  const map = useMapEvents({ zoomend: () => apply() });
  const apply = () => {
    const zoom = map.getZoom();
    const el = map.getContainer();
    el.classList.toggle('zoomed-in', zoom >= threshold)
    el.classList.toggle('zoom-far', zoom < 5);
    el.classList.toggle('zoom-mid', zoom === 5);
  }
  useEffect(apply)
  return null
}

export function FlyTo({ center, zoom, version }: { center: [number, number]; zoom: number; version: number }) {
  const map = useMap();
  useEffect(() => {
    if (version === 0) return
    map.flyTo(center, zoom, { duration: 1.4 });
  }, [version]);
  return null;
}

export function InvalidateSize() {
  const map = useMap();
  useEffect(() => {
    const timers = [150, 450].map((ms) => setTimeout(() => map.invalidateSize(), ms));


    return () => timers.forEach(clearTimeout);
  }, [map]);
  return null;
}

  