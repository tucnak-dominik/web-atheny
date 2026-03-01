/**
 * Generates walking/transit routes between sequential itinerary items
 * using the public OSRM demo API and writes them to public/data/routes.geojson.
 *
 * Usage: npm run generate-routes
 * Run manually after the itinerary changes.
 *
 * NOTE: Uses the public OSRM demo server (walking profile).
 * For production use, consider self-hosting or a paid routing service.
 */

import { writeFileSync } from 'fs';
import { mkdirSync } from 'fs';
import { join } from 'path';
import { itinerary } from '../src/data/itinerary';

const OSRM_BASE = 'https://router.project-osrm.org/route/v1/foot';

interface GeoJSONFeature {
  type: 'Feature';
  properties: Record<string, unknown>;
  geometry: {
    type: 'LineString';
    coordinates: [number, number][];
  };
}

interface OSRMResponse {
  code: string;
  routes: Array<{
    geometry: { coordinates: [number, number][]; type: string };
    distance: number;
    duration: number;
  }>;
}

async function fetchRoute(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
): Promise<[number, number][] | null> {
  const url = `${OSRM_BASE}/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = (await res.json()) as OSRMResponse;
  if (data.code !== 'Ok' || !data.routes[0]) return null;
  return data.routes[0].geometry.coordinates;
}

async function main() {
  console.log('Generating routes from OSRM…');

  // Group items by day and filter those with coordinates
  const days = [...new Set(itinerary.map((i) => i.date))];
  const features: GeoJSONFeature[] = [];

  for (const day of days) {
    const dayItems = itinerary
      .filter((i) => i.date === day && i.lat && i.lng)
      .sort((a, b) => a.time_start.localeCompare(b.time_start));

    for (let i = 0; i < dayItems.length - 1; i++) {
      const from = dayItems[i];
      const to = dayItems[i + 1];

      if (from.lat === to.lat && from.lng === to.lng) continue;
      if (to.travel_mode === 'taxi') {
        // Skip taxi legs — just draw a straight line
        features.push({
          type: 'Feature',
          properties: {
            from: from.id,
            to: to.id,
            day,
            travel_mode: 'taxi',
            straight_line: true,
          },
          geometry: {
            type: 'LineString',
            coordinates: [
              [from.lng, from.lat],
              [to.lng, to.lat],
            ],
          },
        });
        continue;
      }

      console.log(`  → ${from.title} → ${to.title}`);
      const coords = await fetchRoute(
        { lat: from.lat, lng: from.lng },
        { lat: to.lat, lng: to.lng },
      );

      if (coords) {
        features.push({
          type: 'Feature',
          properties: {
            from: from.id,
            to: to.id,
            day,
            travel_mode: to.travel_mode || 'walk',
          },
          geometry: { type: 'LineString', coordinates: coords },
        });
      }

      // Polite delay to avoid hammering the demo server
      await new Promise((r) => setTimeout(r, 300));
    }
  }

  const geojson = {
    type: 'FeatureCollection',
    features,
    _generated: new Date().toISOString().slice(0, 10),
  };

  const outDir = join(process.cwd(), 'public/data');
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, 'routes.geojson');
  writeFileSync(outPath, JSON.stringify(geojson, null, 2), 'utf-8');
  console.log(`  ✓ Written ${features.length} route segments to public/data/routes.geojson`);
}

main().catch((err) => {
  console.error('generate-routes failed:', err);
  process.exit(1);
});
