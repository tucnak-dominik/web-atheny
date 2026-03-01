import { useEffect, useRef } from 'preact/hooks';
import { useStore } from '@nanostores/preact';
import { $activeDay, $highlightedItem } from '../stores/ui';
import { getDayColor } from '../lib/utils';
import type { ItineraryItem, POI } from '../lib/types';

interface Props {
  items: ItineraryItem[];
  pois: POI[];
}

const DAY_COLORS: Record<string, string> = {
  day1: '#C4956A',
  day2: '#556B2F',
  day3: '#B8860B',
  day4: '#8B6F5E',
};

const CATEGORY_ICONS: Record<string, string> = {
  archaeology: '🏛️',
  museum:      '🏛',
  district:    '🏘️',
  viewpoint:   '👁️',
  market:      '🛒',
  landmark:    '📍',
};

export default function MapIsland({ items, pois }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<Map<string, any>>(new Map());
  const activeDay = useStore($activeDay);
  const highlighted = useStore($highlightedItem);

  // Athens centre
  const CENTER: [number, number] = [23.7275, 37.9838];
  const MAPTILER_KEY = import.meta.env.PUBLIC_MAPTILER_KEY ?? '';

  // Init map once
  useEffect(() => {
    if (mapInstanceRef.current || !mapRef.current) return;

    import('maplibre-gl').then(({ default: maplibregl }) => {
      const map = new maplibregl.Map({
        container: mapRef.current!,
        style: MAPTILER_KEY
          ? `https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_KEY}`
          : {
              version: 8,
              sources: {
                osm: {
                  type: 'raster',
                  tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
                  tileSize: 256,
                  attribution: '© OpenStreetMap',
                },
              },
              layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
            },
        center: CENTER,
        zoom: 13,
        attributionControl: false,
      });

      map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');

      map.on('load', () => {
        // Load routes GeoJSON
        const base = (import.meta as any).env?.BASE_URL ?? '/';
        map.addSource('routes', {
          type: 'geojson',
          data: `${base}data/routes.geojson`,
        });
        map.addLayer({
          id: 'routes-line',
          type: 'line',
          source: 'routes',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: {
            'line-color': '#C4956A',
            'line-width': 2.5,
            'line-opacity': 0.55,
            'line-dasharray': [2, 3],
          },
        });

        // Add POI markers
        pois.forEach((poi) => {
          const el = document.createElement('div');
          el.className = 'map-marker map-marker--poi';
          el.innerHTML = CATEGORY_ICONS[poi.category] ?? '•';
          el.setAttribute('title', poi.name);

          const popup = new maplibregl.Popup({ offset: 20, closeButton: false })
            .setHTML(`<strong>${poi.name}</strong>${poi.description ? `<br><span>${poi.description}</span>` : ''}`);

          new maplibregl.Marker({ element: el })
            .setLngLat([poi.lng, poi.lat])
            .setPopup(popup)
            .addTo(map);
        });

        // Add itinerary item markers
        items.forEach((item) => {
          if (!item.lat || !item.lng) return;

          const color = DAY_COLORS[getDayColor(item.date)] ?? '#C4956A';
          const el = document.createElement('div');
          el.className = 'map-marker map-marker--item';
          el.style.setProperty('--marker-color', color);
          el.dataset.id = item.id;

          const popup = new maplibregl.Popup({ offset: 24, closeButton: false })
            .setHTML(`
              <div class="map-popup">
                <span class="map-popup-time">${item.time_start}</span>
                <strong class="map-popup-title">${item.title}</strong>
                ${item.description ? `<p class="map-popup-desc">${item.description}</p>` : ''}
              </div>
            `);

          const marker = new maplibregl.Marker({ element: el })
            .setLngLat([item.lng, item.lat])
            .setPopup(popup)
            .addTo(map);

          el.addEventListener('mouseenter', () => $highlightedItem.set(item.id));
          el.addEventListener('mouseleave', () => $highlightedItem.set(null));

          markersRef.current.set(item.id, { marker, el });
        });
      });

      mapInstanceRef.current = map;
    });

    return () => {
      mapInstanceRef.current?.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Sync highlighted item → marker pulse
  useEffect(() => {
    markersRef.current.forEach(({ el }, id) => {
      el.classList.toggle('map-marker--highlighted', id === highlighted);
    });
  }, [highlighted]);

  // Dim markers from other days
  useEffect(() => {
    markersRef.current.forEach(({ el }, id) => {
      const item = items.find((i) => i.id === id);
      if (!item) return;
      el.classList.toggle('map-marker--dimmed', item.date !== activeDay);
    });

    // Fly to first item of active day
    const first = items.find((i) => i.date === activeDay && i.lat && i.lng);
    if (first && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo({
        center: [first.lng, first.lat],
        zoom: 14,
        duration: 800,
        essential: true,
      });
    }
  }, [activeDay]);

  return (
    <div class="map-wrap">
      <div ref={mapRef} class="map-canvas" aria-label="Interaktivní mapa Athén" />
      {!MAPTILER_KEY && (
        <div class="map-key-hint">
          Pro lepší mapu nastav <code>PUBLIC_MAPTILER_KEY</code> v <code>.env</code>.
        </div>
      )}
    </div>
  );
}
