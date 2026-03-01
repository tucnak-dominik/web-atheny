# Athens Trip Itinerary — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a single-page travel itinerary website for an Athens trip (May 12–15, 2026) with a Google Sheets data backend, interactive MapLibre GL map, and Vercel deployment.

**Architecture:** Astro 4.x static site with Preact islands for interactive components (countdown, map, itinerary timeline, packing list). Google Sheets published as CSV tabs are fetched client-side via PapaParse — no rebuild needed when content changes. NanoStores syncs state bidirectionally between the map island and itinerary island.

**Tech Stack:** Astro 4, Preact, Tailwind CSS 4, MapLibre GL JS, MapTiler (vector tiles), PapaParse, NanoStores, OSRM (routing), Vercel

---

## Prerequisites

- Node.js 20+ installed
- MapTiler account (free tier): https://cloud.maptiler.com/maps/ — get an API key
- Google Sheet created with 5 tabs (see Sheet Setup section at bottom)
- Vercel account linked to GitHub (free tier)

---

## Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`, `tailwind.config.mjs`, `.gitignore`

**Step 1: Initialize Astro project**

Run in `/Users/domino/VS Code/web-atheny`:
```bash
npm create astro@latest . -- --template minimal --typescript strict --no-install --no-git
```
Answer prompts: minimal template, TypeScript strict, skip install, skip git.

**Step 2: Install all dependencies at once**
```bash
npm install
npm install @astrojs/preact preact
npm install @astrojs/tailwind tailwindcss
npm install maplibre-gl papaparse nanostores @nanostores/preact
npm install --save-dev @types/papaparse vitest @testing-library/preact happy-dom
```

**Step 3: Configure Astro integrations**

Replace `astro.config.mjs` with:
```js
import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  integrations: [preact({ compat: true }), tailwind()],
  output: 'static',
});
```

**Step 4: Configure Tailwind**

Create `tailwind.config.mjs`:
```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        day1: '#3B82F6', // blue
        day2: '#10B981', // green
        day3: '#F59E0B', // amber
        day4: '#8B5CF6', // violet
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
```

**Step 5: Configure Vitest**

Add to `package.json` scripts section:
```json
{
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

Add `vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    environment: 'happy-dom',
  },
});
```

**Step 6: Update tsconfig.json**

Replace content with:
```json
{
  "extends": "astro/tsconfigs/strict",
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "preact"
  }
}
```

**Step 7: Initialize git and first commit**
```bash
cd "/Users/domino/VS Code/web-atheny"
git init
git add .
git commit -m "feat: initialize Astro project with Preact, Tailwind, Vitest"
```

Expected: Git repo initialized, all files committed.

---

## Task 2: Types and Utility Functions (TDD)

**Files:**
- Create: `src/lib/types.ts`
- Create: `src/lib/utils.ts`
- Create: `src/lib/utils.test.ts`

**Step 1: Write failing tests for utils**

Create `src/lib/utils.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { formatDate, formatTime, hashWaypoints, getDayColor } from './utils';

describe('formatDate', () => {
  it('formats date as readable Czech day label', () => {
    expect(formatDate('2026-05-12')).toBe('Úterý 12. 5.');
    expect(formatDate('2026-05-15')).toBe('Pátek 15. 5.');
  });
});

describe('formatTime', () => {
  it('formats time string to HH:MM', () => {
    expect(formatTime('09:30')).toBe('09:30');
    expect(formatTime('9:5')).toBe('09:05');
  });
});

describe('hashWaypoints', () => {
  it('returns same hash for same waypoints', () => {
    const wps = [{ lat: 37.9755, lng: 23.7348 }, { lat: 37.9714, lng: 23.7262 }];
    expect(hashWaypoints(wps)).toBe(hashWaypoints(wps));
  });
  it('returns different hash for different waypoints', () => {
    const a = [{ lat: 37.9755, lng: 23.7348 }];
    const b = [{ lat: 37.9714, lng: 23.7262 }];
    expect(hashWaypoints(a)).not.toBe(hashWaypoints(b));
  });
});

describe('getDayColor', () => {
  it('returns correct Tailwind color class per day', () => {
    expect(getDayColor('2026-05-12')).toBe('day1');
    expect(getDayColor('2026-05-13')).toBe('day2');
    expect(getDayColor('2026-05-14')).toBe('day3');
    expect(getDayColor('2026-05-15')).toBe('day4');
  });
});
```

**Step 2: Run tests to verify they fail**
```bash
npm test
```
Expected: 4 test failures ("Cannot find module './utils'")

**Step 3: Define types**

Create `src/lib/types.ts`:
```ts
export interface Flight {
  date: string;
  time: string;
  from: string;
  to: string;
  airline: string;
  flight_number: string;
  notes: string;
}

export interface Accommodation {
  name: string;
  address: string;
  check_in: string;
  check_out: string;
  booking_url: string;
  lat: number;
  lng: number;
  notes: string;
}

export interface ItineraryItem {
  date: string;
  time_start: string;
  time_end: string;
  title: string;
  description: string;
  category: string;
  travel_mode: 'walk' | 'transit' | 'taxi' | '';
  lat: number;
  lng: number;
  cost_estimate: string;
  notes: string;
  id: string; // generated: `${date}-${time_start}-${title.slice(0,10)}`
}

export interface PackingItem {
  item: string;
  category: string;
  packed: boolean;
  notes: string;
}

export interface SiteConfig {
  trip_name: string;
  departure_date: string;  // ISO: '2026-05-12T06:00:00'
  hero_image_url: string;
  sheet_base_url: string;  // base URL for published Sheet CSV
}

export interface Waypoint {
  lat: number;
  lng: number;
}
```

**Step 4: Implement utils**

Create `src/lib/utils.ts`:
```ts
import type { Waypoint } from './types';

const DAY_COLORS = ['day1', 'day2', 'day3', 'day4'] as const;
const TRIP_START = '2026-05-12';

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00');
  const days = ['Neděle', 'Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota'];
  const day = days[date.getDay()];
  return `${day} ${date.getDate()}. ${date.getMonth() + 1}.`;
}

export function formatTime(time: string): string {
  const [h, m] = time.split(':');
  return `${h.padStart(2, '0')}:${(m || '0').padStart(2, '0')}`;
}

export function hashWaypoints(waypoints: Waypoint[]): string {
  return waypoints.map(w => `${w.lat},${w.lng}`).join('|');
}

export function getDayColor(dateStr: string): string {
  const start = new Date(TRIP_START).getTime();
  const date = new Date(dateStr).getTime();
  const dayIndex = Math.round((date - start) / 86400000);
  return DAY_COLORS[Math.max(0, Math.min(dayIndex, DAY_COLORS.length - 1))];
}
```

**Step 5: Run tests to verify they pass**
```bash
npm test
```
Expected: All 4 tests PASS

**Step 6: Commit**
```bash
git add src/lib/
git commit -m "feat: add types and utility functions with tests"
```

---

## Task 3: Google Sheets Data Layer (TDD)

**Files:**
- Create: `src/lib/sheets.ts`
- Create: `src/lib/sheets.test.ts`

**Step 1: Write failing tests**

Create `src/lib/sheets.test.ts`:
```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { parseFlightsCsv, parseItineraryCsv, buildCsvUrl } from './sheets';

describe('buildCsvUrl', () => {
  it('builds CSV export URL from sheet ID and gid', () => {
    const url = buildCsvUrl('abc123', '0');
    expect(url).toBe(
      'https://docs.google.com/spreadsheets/d/abc123/export?format=csv&gid=0'
    );
  });
});

describe('parseFlightsCsv', () => {
  it('parses CSV string into Flight objects', () => {
    const csv = `date,time,from,to,airline,flight_number,notes
2026-05-12,07:30,PRG,ATH,Aegean,A3-860,Terminal 2`;
    const flights = parseFlightsCsv(csv);
    expect(flights).toHaveLength(1);
    expect(flights[0].from).toBe('PRG');
    expect(flights[0].airline).toBe('Aegean');
  });

  it('skips empty rows', () => {
    const csv = `date,time,from,to,airline,flight_number,notes
2026-05-12,07:30,PRG,ATH,Aegean,A3-860,
,,,,,,`;
    const flights = parseFlightsCsv(csv);
    expect(flights).toHaveLength(1);
  });
});

describe('parseItineraryCsv', () => {
  it('parses itinerary CSV and generates item id', () => {
    const csv = `date,time_start,time_end,title,description,category,travel_mode,lat,lng,cost_estimate,notes
2026-05-12,10:00,12:00,Akropolis,Navštívíme Akropolis,sights,walk,37.9715,23.7262,20 EUR,`;
    const items = parseItineraryCsv(csv);
    expect(items).toHaveLength(1);
    expect(items[0].lat).toBe(37.9715);
    expect(items[0].id).toMatch(/2026-05-12/);
    expect(items[0].travel_mode).toBe('walk');
  });
});
```

**Step 2: Run tests to verify they fail**
```bash
npm test
```
Expected: Failures ("Cannot find module './sheets'")

**Step 3: Implement sheets.ts**

Create `src/lib/sheets.ts`:
```ts
import Papa from 'papaparse';
import type { Flight, Accommodation, ItineraryItem, PackingItem, SiteConfig } from './types';

export function buildCsvUrl(sheetId: string, gid: string): string {
  return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
}

function parseRows<T>(csv: string, transform: (row: Record<string, string>) => T | null): T[] {
  const result = Papa.parse<Record<string, string>>(csv, {
    header: true,
    skipEmptyLines: true,
    transformHeader: h => h.trim(),
    transform: v => v.trim(),
  });
  return result.data
    .filter(row => Object.values(row).some(v => v !== ''))
    .map(transform)
    .filter((item): item is T => item !== null);
}

export function parseFlightsCsv(csv: string): Flight[] {
  return parseRows<Flight>(csv, row => {
    if (!row.date || !row.from) return null;
    return {
      date: row.date,
      time: row.time,
      from: row.from,
      to: row.to,
      airline: row.airline,
      flight_number: row.flight_number,
      notes: row.notes,
    };
  });
}

export function parseAccommodationCsv(csv: string): Accommodation[] {
  return parseRows<Accommodation>(csv, row => {
    if (!row.name) return null;
    return {
      name: row.name,
      address: row.address,
      check_in: row.check_in,
      check_out: row.check_out,
      booking_url: row.booking_url,
      lat: parseFloat(row.lat) || 0,
      lng: parseFloat(row.lng) || 0,
      notes: row.notes,
    };
  });
}

export function parseItineraryCsv(csv: string): ItineraryItem[] {
  return parseRows<ItineraryItem>(csv, row => {
    if (!row.date || !row.title) return null;
    return {
      date: row.date,
      time_start: row.time_start,
      time_end: row.time_end,
      title: row.title,
      description: row.description,
      category: row.category,
      travel_mode: (row.travel_mode as ItineraryItem['travel_mode']) || '',
      lat: parseFloat(row.lat) || 0,
      lng: parseFloat(row.lng) || 0,
      cost_estimate: row.cost_estimate,
      notes: row.notes,
      id: `${row.date}-${row.time_start}-${row.title.slice(0, 10).replace(/\s/g, '-')}`,
    };
  });
}

export function parsePackingCsv(csv: string): PackingItem[] {
  return parseRows<PackingItem>(csv, row => {
    if (!row.item) return null;
    return {
      item: row.item,
      category: row.category,
      packed: row.packed?.toUpperCase() === 'TRUE',
      notes: row.notes,
    };
  });
}

export function parseConfigCsv(csv: string): SiteConfig {
  const rows = parseRows<{ key: string; value: string }>(csv, row => {
    if (!row.key) return null;
    return { key: row.key, value: row.value };
  });
  const map = Object.fromEntries(rows.map(r => [r.key, r.value]));
  return {
    trip_name: map.trip_name ?? 'Athény 2026',
    departure_date: map.departure_date ?? '2026-05-12T00:00:00',
    hero_image_url: map.hero_image_url ?? '',
    sheet_base_url: map.sheet_base_url ?? '',
  };
}

export async function fetchSheetTab(sheetId: string, gid: string): Promise<string> {
  const url = buildCsvUrl(sheetId, gid);
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch sheet tab ${gid}: ${response.status}`);
  return response.text();
}
```

**Step 4: Run tests to verify they pass**
```bash
npm test
```
Expected: All tests PASS

**Step 5: Commit**
```bash
git add src/lib/sheets.ts src/lib/sheets.test.ts
git commit -m "feat: add Google Sheets CSV data layer with tests"
```

---

## Task 4: NanoStores State

**Files:**
- Create: `src/stores/itineraryStore.ts`

**Step 1: Create the store** (no test needed — NanoStores are trivial wrappers)

Create `src/stores/itineraryStore.ts`:
```ts
import { atom, computed } from 'nanostores';
import type { ItineraryItem } from '../lib/types';

// Active day (date string like '2026-05-12')
export const $activeDay = atom<string>('2026-05-12');

// Hovered item ID (for map↔timeline sync)
export const $hoveredItemId = atom<string | null>(null);

// Selected/clicked item ID
export const $selectedItemId = atom<string | null>(null);

// All itinerary items (populated once CSV is fetched)
export const $itineraryItems = atom<ItineraryItem[]>([]);

// Derived: items for the active day
export const $activeDayItems = computed(
  [$itineraryItems, $activeDay],
  (items, day) => items.filter(item => item.date === day)
);

// All unique dates in itinerary
export const $tripDates = computed($itineraryItems, items => {
  const dates = [...new Set(items.map(i => i.date))];
  return dates.sort();
});
```

**Step 2: Commit**
```bash
git add src/stores/
git commit -m "feat: add NanoStores for cross-island state management"
```

---

## Task 5: Layout and Base Styles

**Files:**
- Create: `src/layouts/Layout.astro`
- Create: `src/styles/global.css`
- Modify: `src/pages/index.astro`

**Step 1: Create global styles**

Create `src/styles/global.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

@layer base {
  html {
    scroll-behavior: smooth;
  }
  body {
    @apply bg-white text-gray-900 font-sans antialiased;
  }
}

@layer components {
  .section-title {
    @apply text-2xl font-semibold text-gray-800 mb-6;
  }
  .card {
    @apply bg-white border border-gray-100 rounded-2xl shadow-sm p-6;
  }
  .badge {
    @apply inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium;
  }
}
```

**Step 2: Create layout**

Create `src/layouts/Layout.astro`:
```astro
---
import '../styles/global.css';
export interface Props {
  title: string;
  description?: string;
}
const { title, description = 'Plán výletu do Athén' } = Astro.props;
---
<!doctype html>
<html lang="cs">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content={description} />
    <title>{title}</title>
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  </head>
  <body>
    <nav class="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div class="max-w-5xl mx-auto px-4 py-3 flex items-center gap-6 text-sm font-medium text-gray-600">
        <a href="#hero" class="hover:text-gray-900 transition-colors">✈️ Let</a>
        <a href="#accommodation" class="hover:text-gray-900 transition-colors">🏨 Hotel</a>
        <a href="#itinerary" class="hover:text-gray-900 transition-colors">📅 Plán</a>
        <a href="#map" class="hover:text-gray-900 transition-colors">🗺️ Mapa</a>
        <a href="#packing" class="hover:text-gray-900 transition-colors">🎒 Zavazadlo</a>
      </div>
    </nav>
    <main class="pt-14">
      <slot />
    </main>
  </body>
</html>
```

**Step 3: Create skeleton index page**

Replace `src/pages/index.astro` with:
```astro
---
import Layout from '../layouts/Layout.astro';
---
<Layout title="Athény 2026">
  <section id="hero" class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="text-center">
      <h1 class="text-5xl font-bold text-gray-900 mb-4">Athény 2026</h1>
      <p class="text-xl text-gray-500">12. – 15. května</p>
      <div id="countdown-placeholder" class="mt-8 text-4xl font-mono text-blue-600">
        Načítám...
      </div>
    </div>
  </section>
</Layout>
```

**Step 4: Verify dev server runs**
```bash
npm run dev
```
Expected: http://localhost:4321 shows "Athény 2026" heading, no errors in console.

**Step 5: Commit**
```bash
git add src/layouts/ src/styles/ src/pages/index.astro
git commit -m "feat: add layout, base styles, and skeleton index page"
```

---

## Task 6: CountdownIsland

**Files:**
- Create: `src/components/CountdownIsland.tsx`

**Step 1: Create countdown island**

Create `src/components/CountdownIsland.tsx`:
```tsx
import { useState, useEffect } from 'preact/hooks';

interface Props {
  departureDate: string; // ISO string: '2026-05-12T06:00:00'
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calcTimeLeft(target: Date): TimeLeft {
  const diff = Math.max(0, target.getTime() - Date.now());
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
  };
}

export default function CountdownIsland({ departureDate }: Props) {
  const target = new Date(departureDate);
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calcTimeLeft(target));

  useEffect(() => {
    const interval = setInterval(() => setTimeLeft(calcTimeLeft(target)), 1000);
    return () => clearInterval(interval);
  }, [departureDate]);

  const isPast = target.getTime() < Date.now();
  if (isPast) return <p class="text-2xl text-green-600 font-semibold">Jste na výletě! 🇬🇷</p>;

  return (
    <div class="flex gap-6 justify-center mt-8">
      {[
        { value: timeLeft.days, label: 'dní' },
        { value: timeLeft.hours, label: 'hodin' },
        { value: timeLeft.minutes, label: 'minut' },
        { value: timeLeft.seconds, label: 'sekund' },
      ].map(({ value, label }) => (
        <div key={label} class="text-center">
          <div class="text-4xl font-mono font-bold text-blue-600 tabular-nums">
            {String(value).padStart(2, '0')}
          </div>
          <div class="text-xs text-gray-400 uppercase tracking-wide mt-1">{label}</div>
        </div>
      ))}
    </div>
  );
}
```

**Step 2: Add to index.astro** — replace the hero section:
```astro
---
import Layout from '../layouts/Layout.astro';
import CountdownIsland from '../components/CountdownIsland';
---
<Layout title="Athény 2026">
  <section id="hero" class="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white">
    <div class="text-center px-4">
      <p class="text-blue-500 font-medium text-sm uppercase tracking-widest mb-4">12. – 15. května 2026</p>
      <h1 class="text-6xl font-bold text-gray-900 mb-2">Athény</h1>
      <p class="text-xl text-gray-400 mb-8">Do odletu zbývá</p>
      <CountdownIsland departureDate="2026-05-12T06:00:00" client:load />
      <div class="mt-16">
        <a href="#flights" class="text-gray-400 hover:text-gray-600 transition-colors">
          ↓ Scroll
        </a>
      </div>
    </div>
  </section>
</Layout>
```

**Step 3: Verify countdown works**
```bash
npm run dev
```
Expected: Countdown ticks every second in the browser.

**Step 4: Commit**
```bash
git add src/components/CountdownIsland.tsx src/pages/index.astro
git commit -m "feat: add live countdown island"
```

---

## Task 7: Flight and Accommodation Components

**Files:**
- Create: `src/components/FlightCard.astro`
- Create: `src/components/AccommodationCard.astro`
- Create: `src/components/DataLoader.tsx` (client-side data fetcher)

**Step 1: Create FlightCard component**

Create `src/components/FlightCard.astro`:
```astro
---
export interface Props {
  direction: 'outbound' | 'return';
  date: string;
  time: string;
  from: string;
  to: string;
  airline: string;
  flightNumber: string;
  notes?: string;
}
const { direction, date, time, from, to, airline, flightNumber, notes } = Astro.props;
const label = direction === 'outbound' ? 'Odlet' : 'Zpáteční let';
const emoji = direction === 'outbound' ? '✈️' : '🏠';
---
<div class="card flex flex-col gap-3">
  <div class="flex items-center gap-2">
    <span class="text-lg">{emoji}</span>
    <span class="text-sm font-medium text-gray-500">{label}</span>
    <span class="ml-auto badge bg-blue-50 text-blue-700">{airline} {flightNumber}</span>
  </div>
  <div class="flex items-center gap-6">
    <div class="text-center">
      <div class="text-3xl font-bold text-gray-900">{from}</div>
      <div class="text-sm text-gray-400">{time}</div>
    </div>
    <div class="flex-1 flex flex-col items-center">
      <div class="w-full border-t-2 border-dashed border-gray-200 relative">
        <span class="absolute -top-3 left-1/2 -translate-x-1/2 bg-white px-2 text-gray-300 text-lg">✈</span>
      </div>
      <div class="text-xs text-gray-400 mt-2">{date}</div>
    </div>
    <div class="text-center">
      <div class="text-3xl font-bold text-gray-900">{to}</div>
      <div class="text-sm text-gray-400">Přílět</div>
    </div>
  </div>
  {notes && <p class="text-sm text-gray-400">{notes}</p>}
</div>
```

**Step 2: Create AccommodationCard component**

Create `src/components/AccommodationCard.astro`:
```astro
---
export interface Props {
  name: string;
  address: string;
  checkIn: string;
  checkOut: string;
  bookingUrl?: string;
  notes?: string;
}
const { name, address, checkIn, checkOut, bookingUrl, notes } = Astro.props;
---
<div class="card">
  <div class="flex items-start justify-between mb-4">
    <div>
      <h3 class="text-lg font-semibold text-gray-900">{name}</h3>
      <p class="text-sm text-gray-500">{address}</p>
    </div>
    <span class="text-2xl">🏨</span>
  </div>
  <div class="flex gap-6 text-sm">
    <div>
      <span class="text-gray-400">Check-in</span>
      <div class="font-medium">{checkIn}</div>
    </div>
    <div>
      <span class="text-gray-400">Check-out</span>
      <div class="font-medium">{checkOut}</div>
    </div>
  </div>
  {notes && <p class="text-sm text-gray-400 mt-3">{notes}</p>}
  {bookingUrl && (
    <a href={bookingUrl} target="_blank" rel="noopener"
       class="mt-4 inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800">
      Booking rezervace →
    </a>
  )}
</div>
```

**Step 3: Create DataLoader island**

This island fetches all CSV data client-side and stores it; other islands read from NanoStores.

Create `src/components/DataLoader.tsx`:
```tsx
import { useEffect } from 'preact/hooks';
import { $itineraryItems } from '../stores/itineraryStore';
import {
  fetchSheetTab,
  parseItineraryCsv,
} from '../lib/sheets';

interface Props {
  sheetId: string;
  itineraryGid: string; // tab GID from Google Sheets URL
}

export default function DataLoader({ sheetId, itineraryGid }: Props) {
  useEffect(() => {
    async function load() {
      try {
        const itineraryCsv = await fetchSheetTab(sheetId, itineraryGid);
        $itineraryItems.set(parseItineraryCsv(itineraryCsv));
      } catch (err) {
        console.error('Failed to load sheet data:', err);
      }
    }
    load();
  }, []);

  return null; // renders nothing
}
```

**Step 4: Wire static sections into index.astro**

Add placeholder flight + accommodation sections (real data loaded later with sheet IDs):
```astro
<section id="flights" class="py-20 max-w-5xl mx-auto px-4">
  <h2 class="section-title">Lety</h2>
  <div class="grid md:grid-cols-2 gap-4">
    <FlightCard direction="outbound" date="12. 5. 2026" time="07:30" from="PRG" to="ATH"
      airline="Aegean" flightNumber="A3-860" notes="Terminál 2" />
    <FlightCard direction="return" date="15. 5. 2026" time="22:00" from="ATH" to="PRG"
      airline="Aegean" flightNumber="A3-861" />
  </div>
</section>

<section id="accommodation" class="py-20 bg-gray-50">
  <div class="max-w-5xl mx-auto px-4">
    <h2 class="section-title">Ubytování</h2>
    <AccommodationCard name="Hotel Placeholder" address="Athény, centrum"
      checkIn="12. 5. 2026 / 15:00" checkOut="15. 5. 2026 / 11:00" />
  </div>
</section>
```

**Step 5: Verify page renders without errors**
```bash
npm run dev
```
Expected: Page shows Hero, Flights, Accommodation sections without console errors.

**Step 6: Commit**
```bash
git add src/components/FlightCard.astro src/components/AccommodationCard.astro src/components/DataLoader.tsx
git commit -m "feat: add flight card, accommodation card, and data loader"
```

---

## Task 8: Itinerary Island

**Files:**
- Create: `src/components/ItineraryIsland.tsx`

**Step 1: Create ItineraryIsland**

Create `src/components/ItineraryIsland.tsx`:
```tsx
import { useStore } from '@nanostores/preact';
import { $tripDates, $activeDay, $activeDayItems, $hoveredItemId, $selectedItemId } from '../stores/itineraryStore';
import { formatDate, formatTime, getDayColor } from '../lib/utils';

const CATEGORY_ICONS: Record<string, string> = {
  sights: '🏛',
  food: '🍽',
  drinks: '🥂',
  shopping: '🛍',
  transport: '🚌',
  hotel: '🏨',
  nature: '🌿',
  default: '📍',
};

const TRAVEL_MODE_ICONS: Record<string, string> = {
  walk: '🚶',
  transit: '🚌',
  taxi: '🚕',
  '': '',
};

const DAY_COLOR_MAP: Record<string, string> = {
  day1: 'bg-blue-500',
  day2: 'bg-emerald-500',
  day3: 'bg-amber-500',
  day4: 'bg-violet-500',
};

export default function ItineraryIsland() {
  const dates = useStore($tripDates);
  const activeDay = useStore($activeDay);
  const items = useStore($activeDayItems);
  const hoveredId = useStore($hoveredItemId);

  if (dates.length === 0) {
    return <div class="text-gray-400 text-center py-12">Načítám plán...</div>;
  }

  return (
    <div>
      {/* Day tabs */}
      <div class="flex gap-2 mb-8 flex-wrap">
        {dates.map(date => {
          const color = getDayColor(date);
          const bgClass = DAY_COLOR_MAP[color] ?? 'bg-gray-500';
          const isActive = date === activeDay;
          return (
            <button
              key={date}
              onClick={() => $activeDay.set(date)}
              class={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                isActive
                  ? `${bgClass} text-white shadow-sm`
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {formatDate(date)}
            </button>
          );
        })}
      </div>

      {/* Timeline */}
      <div class="relative">
        <div class="absolute left-[88px] top-0 bottom-0 w-px bg-gray-100" />
        <div class="space-y-1">
          {items.map((item, idx) => {
            const isHovered = hoveredId === item.id;
            return (
              <div
                key={item.id}
                class={`flex gap-4 group cursor-pointer rounded-xl p-3 transition-colors ${
                  isHovered ? 'bg-blue-50' : 'hover:bg-gray-50'
                }`}
                onMouseEnter={() => $hoveredItemId.set(item.id)}
                onMouseLeave={() => $hoveredItemId.set(null)}
                onClick={() => $selectedItemId.set(item.id)}
              >
                {/* Time column */}
                <div class="w-20 text-right shrink-0">
                  <span class="text-sm font-mono text-gray-400">
                    {formatTime(item.time_start)}
                  </span>
                </div>

                {/* Dot */}
                <div class="relative z-10 mt-1 shrink-0">
                  <div class={`w-3 h-3 rounded-full border-2 border-white shadow ${
                    isHovered ? 'bg-blue-500' : 'bg-gray-300'
                  }`} />
                </div>

                {/* Content */}
                <div class="flex-1 pb-4">
                  <div class="flex items-start gap-2">
                    <span class="text-lg leading-tight">
                      {CATEGORY_ICONS[item.category] ?? CATEGORY_ICONS.default}
                    </span>
                    <div class="flex-1">
                      <div class="flex items-center gap-2">
                        <h4 class="font-medium text-gray-900 text-sm">{item.title}</h4>
                        {item.travel_mode && (
                          <span class="text-base">{TRAVEL_MODE_ICONS[item.travel_mode]}</span>
                        )}
                        {item.cost_estimate && (
                          <span class="ml-auto text-xs text-gray-400">{item.cost_estimate}</span>
                        )}
                      </div>
                      {item.description && (
                        <p class="text-xs text-gray-500 mt-1">{item.description}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Add to index.astro**

Add section after accommodation:
```astro
<section id="itinerary" class="py-20 max-w-5xl mx-auto px-4">
  <h2 class="section-title">Plán výletu</h2>
  <ItineraryIsland client:load />
</section>
```

**Step 3: Verify itinerary renders**
```bash
npm run dev
```
Expected: Itinerary section shows "Načítám plán..." (no sheet connected yet — that's fine)

**Step 4: Commit**
```bash
git add src/components/ItineraryIsland.tsx src/pages/index.astro
git commit -m "feat: add day-by-day itinerary timeline island"
```

---

## Task 9: Routing Utility (TDD)

**Files:**
- Create: `src/lib/routing.ts`
- Create: `src/lib/routing.test.ts`

**Step 1: Write failing tests**

Create `src/lib/routing.test.ts`:
```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildRouteSegments, getCacheKey } from './routing';
import type { ItineraryItem } from './types';

const makeItem = (override: Partial<ItineraryItem>): ItineraryItem => ({
  id: 'test',
  date: '2026-05-12',
  time_start: '10:00',
  time_end: '11:00',
  title: 'Test',
  description: '',
  category: 'sights',
  travel_mode: 'walk',
  lat: 37.9715,
  lng: 23.7262,
  cost_estimate: '',
  notes: '',
  ...override,
});

describe('buildRouteSegments', () => {
  it('groups consecutive walk items into segments', () => {
    const items = [
      makeItem({ id: 'a', travel_mode: 'walk', lat: 37.9, lng: 23.7 }),
      makeItem({ id: 'b', travel_mode: 'walk', lat: 37.91, lng: 23.71 }),
      makeItem({ id: 'c', travel_mode: 'transit', lat: 37.95, lng: 23.75 }),
      makeItem({ id: 'd', travel_mode: 'walk', lat: 37.96, lng: 23.76 }),
    ];
    const segments = buildRouteSegments(items);
    expect(segments).toHaveLength(3);
    expect(segments[0].type).toBe('walk');
    expect(segments[0].waypoints).toHaveLength(2);
    expect(segments[1].type).toBe('transit');
    expect(segments[1].waypoints).toHaveLength(2); // from/to
    expect(segments[2].type).toBe('walk');
  });

  it('returns empty array for items with no coordinates', () => {
    const items = [makeItem({ lat: 0, lng: 0 })];
    const segments = buildRouteSegments(items);
    expect(segments).toHaveLength(0);
  });
});

describe('getCacheKey', () => {
  it('returns deterministic cache key', () => {
    const wps = [{ lat: 37.9, lng: 23.7 }, { lat: 37.91, lng: 23.71 }];
    expect(getCacheKey(wps)).toBe(getCacheKey(wps));
    expect(getCacheKey(wps)).toContain('route:');
  });
});
```

**Step 2: Run tests to verify they fail**
```bash
npm test
```
Expected: Failures

**Step 3: Implement routing.ts**

Create `src/lib/routing.ts`:
```ts
import type { ItineraryItem, Waypoint } from './types';

export type RouteSegmentType = 'walk' | 'transit' | 'taxi';

export interface RouteSegment {
  type: RouteSegmentType;
  waypoints: Waypoint[];
  geojson?: GeoJSON.LineString; // filled after OSRM fetch
}

const OSRM_BASE = 'https://router.project-osrm.org/route/v1/foot';

export function buildRouteSegments(items: ItineraryItem[]): RouteSegment[] {
  const validItems = items.filter(i => i.lat !== 0 && i.lng !== 0);
  if (validItems.length < 2) return [];

  const segments: RouteSegment[] = [];
  let current: RouteSegment | null = null;

  for (let i = 0; i < validItems.length - 1; i++) {
    const from = validItems[i];
    const to = validItems[i + 1];
    const segType = (to.travel_mode || 'walk') as RouteSegmentType;

    if (current && current.type === segType && segType === 'walk') {
      current.waypoints.push({ lat: to.lat, lng: to.lng });
    } else {
      if (current) segments.push(current);
      current = {
        type: segType,
        waypoints: [
          { lat: from.lat, lng: from.lng },
          { lat: to.lat, lng: to.lng },
        ],
      };
    }
  }
  if (current) segments.push(current);
  return segments;
}

export function getCacheKey(waypoints: Waypoint[]): string {
  const hash = waypoints.map(w => `${w.lat},${w.lng}`).join('|');
  return `route:${hash}`;
}

export async function fetchOsrmRoute(waypoints: Waypoint[]): Promise<GeoJSON.LineString | null> {
  const cacheKey = getCacheKey(waypoints);
  const cached = localStorage.getItem(cacheKey);
  if (cached) {
    return JSON.parse(cached) as GeoJSON.LineString;
  }

  const coords = waypoints.map(w => `${w.lng},${w.lat}`).join(';');
  const url = `${OSRM_BASE}/${coords}?overview=full&geometries=geojson`;

  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const geometry: GeoJSON.LineString = data.routes?.[0]?.geometry;
    if (geometry) {
      localStorage.setItem(cacheKey, JSON.stringify(geometry));
    }
    return geometry ?? null;
  } catch {
    return null;
  }
}
```

**Step 4: Run tests to verify they pass**
```bash
npm test
```
Expected: All tests PASS

**Step 5: Commit**
```bash
git add src/lib/routing.ts src/lib/routing.test.ts
git commit -m "feat: add OSRM routing utility with segment logic and tests"
```

---

## Task 10: Build-time POI Script

**Files:**
- Create: `scripts/fetch-pois.ts`
- Modify: `package.json` (add script)

**Step 1: Create POI fetch script**

Create `scripts/fetch-pois.ts`:
```ts
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

interface OverpassElement {
  id: number;
  lat: number;
  lon: number;
  tags: Record<string, string>;
}

interface POI {
  id: string;
  name: string;
  category: 'food' | 'drinks' | 'sights' | 'shopping' | 'other';
  lat: number;
  lng: number;
  rating?: string;
}

const ATHENS_CENTER = { lat: 37.9755, lng: 23.7348 };
const RADIUS = 3000; // meters

// Overpass QL query: restaurants, cafes, sights near Athens center
const OVERPASS_QUERY = `
[out:json][timeout:30];
(
  node["amenity"~"restaurant|cafe|bar"](around:${RADIUS},${ATHENS_CENTER.lat},${ATHENS_CENTER.lng});
  node["tourism"~"attraction|museum|viewpoint"](around:${RADIUS},${ATHENS_CENTER.lat},${ATHENS_CENTER.lng});
  node["historic"~"monument|ruins|archaeological_site"](around:${RADIUS},${ATHENS_CENTER.lat},${ATHENS_CENTER.lng});
);
out body 200;
`;

function classifyPOI(tags: Record<string, string>): POI['category'] {
  if (tags.amenity === 'restaurant') return 'food';
  if (tags.amenity === 'cafe' || tags.amenity === 'bar') return 'drinks';
  if (tags.tourism || tags.historic) return 'sights';
  if (tags.shop) return 'shopping';
  return 'other';
}

async function fetchPOIs(): Promise<void> {
  console.log('Fetching POIs from Overpass API...');
  const response = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    body: OVERPASS_QUERY,
  });

  if (!response.ok) throw new Error(`Overpass API error: ${response.status}`);

  const data = await response.json() as { elements: OverpassElement[] };
  const pois: POI[] = data.elements
    .filter(el => el.tags?.name)
    .map(el => ({
      id: `osm-${el.id}`,
      name: el.tags.name,
      category: classifyPOI(el.tags),
      lat: el.lat,
      lng: el.lon,
    }));

  console.log(`Found ${pois.length} POIs`);

  mkdirSync('public', { recursive: true });
  writeFileSync(join('public', 'pois.json'), JSON.stringify(pois, null, 2));
  console.log('Saved to public/pois.json');
}

fetchPOIs().catch(console.error);
```

**Step 2: Add to package.json scripts**

In `package.json`, add:
```json
"fetch-pois": "npx tsx scripts/fetch-pois.ts",
"build": "npm run fetch-pois && astro build"
```

**Step 3: Create placeholder pois.json for development**

Create `public/pois.json`:
```json
[
  {"id":"placeholder-1","name":"Akropolis","category":"sights","lat":37.9715,"lng":23.7262},
  {"id":"placeholder-2","name":"Café Avissinia","category":"drinks","lat":37.9759,"lng":23.7246},
  {"id":"placeholder-3","name":"Monastiraki","category":"shopping","lat":37.9757,"lng":23.7240}
]
```

**Step 4: Commit**
```bash
git add scripts/ public/pois.json package.json
git commit -m "feat: add build-time Overpass POI fetch script with placeholder data"
```

---

## Task 11: Interactive Map Island

**Files:**
- Create: `src/components/MapIsland.tsx`

**Step 1: Create MapIsland**

Note: MapTiler API key needed. Get free key at https://cloud.maptiler.com — store in `.env`:
```
PUBLIC_MAPTILER_KEY=your_key_here
```

Create `src/components/MapIsland.tsx`:
```tsx
import { useEffect, useRef, useState } from 'preact/hooks';
import { useStore } from '@nanostores/preact';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { $itineraryItems, $activeDay, $hoveredItemId, $selectedItemId, $activeDayItems } from '../stores/itineraryStore';
import { buildRouteSegments, fetchOsrmRoute } from '../lib/routing';
import { getDayColor } from '../lib/utils';
import type { ItineraryItem } from '../lib/types';

const MAPTILER_KEY = import.meta.env.PUBLIC_MAPTILER_KEY ?? '';
const ATHENS_CENTER: [number, number] = [23.7348, 37.9755];
const DAY_COLORS: Record<string, string> = {
  day1: '#3B82F6',
  day2: '#10B981',
  day3: '#F59E0B',
  day4: '#8B5CF6',
};
const CATEGORY_COLORS: Record<string, string> = {
  food: '#EF4444',
  drinks: '#F97316',
  sights: '#8B5CF6',
  shopping: '#EC4899',
  other: '#6B7280',
};

export default function MapIsland() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markers = useRef<maplibregl.Marker[]>([]);
  const itineraryItems = useStore($itineraryItems);
  const activeDay = useStore($activeDay);
  const activeDayItems = useStore($activeDayItems);
  const hoveredId = useStore($hoveredItemId);
  const [poiCategories, setPoiCategories] = useState<Record<string, boolean>>({
    food: true, drinks: true, sights: true, shopping: false,
  });

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: `https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_KEY}`,
      center: ATHENS_CENTER,
      zoom: 13,
    });
    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');
    map.current.on('load', () => {
      loadPOIs();
    });
    return () => { map.current?.remove(); map.current = null; };
  }, []);

  // Load static POIs
  async function loadPOIs() {
    if (!map.current) return;
    const res = await fetch('/pois.json');
    const pois = await res.json();
    pois.forEach((poi: { id: string; name: string; category: string; lat: number; lng: number }) => {
      const el = document.createElement('div');
      el.className = 'poi-marker';
      el.style.cssText = `width:10px;height:10px;border-radius:50%;background:${
        CATEGORY_COLORS[poi.category] ?? CATEGORY_COLORS.other
      };border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.3);cursor:pointer;`;
      el.dataset.category = poi.category;
      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([poi.lng, poi.lat])
        .setPopup(new maplibregl.Popup({ offset: 12 }).setHTML(
          `<strong>${poi.name}</strong><br><small>${poi.category}</small>`
        ))
        .addTo(map.current!);
    });
  }

  // Update itinerary pins when active day changes
  useEffect(() => {
    if (!map.current) return;
    markers.current.forEach(m => m.remove());
    markers.current = [];

    activeDayItems.forEach(item => {
      if (!item.lat || !item.lng) return;
      const color = DAY_COLORS[getDayColor(item.date)] ?? '#6B7280';
      const el = document.createElement('div');
      el.className = 'itinerary-marker';
      el.style.cssText = `width:14px;height:14px;border-radius:50%;background:${color};
        border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);cursor:pointer;transition:transform 0.15s;`;
      el.dataset.itemId = item.id;
      el.addEventListener('mouseenter', () => $hoveredItemId.set(item.id));
      el.addEventListener('mouseleave', () => $hoveredItemId.set(null));

      const popup = new maplibregl.Popup({ offset: 16 }).setHTML(`
        <div style="min-width:160px">
          <strong>${item.title}</strong>
          <div style="font-size:12px;color:#6B7280;margin-top:4px">${item.time_start} – ${item.time_end}</div>
          ${item.description ? `<p style="font-size:12px;margin-top:6px">${item.description}</p>` : ''}
          <a href="https://www.google.com/maps?q=${item.lat},${item.lng}" target="_blank"
             style="font-size:12px;color:#3B82F6;display:inline-block;margin-top:6px">
            Google Maps →
          </a>
        </div>
      `);

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([item.lng, item.lat])
        .setPopup(popup)
        .addTo(map.current!);
      markers.current.push(marker);
    });

    // Fetch and render routes
    renderRoutes(activeDayItems);
  }, [activeDay, activeDayItems]);

  // Fly to hovered item
  useEffect(() => {
    if (!map.current || !hoveredId) return;
    const item = activeDayItems.find(i => i.id === hoveredId);
    if (item?.lat && item?.lng) {
      map.current.flyTo({ center: [item.lng, item.lat], zoom: 15, duration: 800 });
    }
  }, [hoveredId]);

  async function renderRoutes(items: ItineraryItem[]) {
    if (!map.current) return;
    const segments = buildRouteSegments(items);

    // Remove old route layers
    ['walk-route', 'transit-route'].forEach(id => {
      if (map.current!.getLayer(id)) map.current!.removeLayer(id);
      if (map.current!.getSource(id)) map.current!.removeSource(id);
    });

    for (const segment of segments) {
      if (segment.type === 'walk') {
        const geojson = await fetchOsrmRoute(segment.waypoints);
        if (!geojson || !map.current) continue;
        const sourceId = `walk-route-${segment.waypoints[0].lat}`;
        if (!map.current.getSource(sourceId)) {
          map.current.addSource(sourceId, { type: 'geojson', data: { type: 'Feature', geometry: geojson, properties: {} } });
          map.current.addLayer({ id: sourceId, type: 'line', source: sourceId,
            paint: { 'line-color': '#3B82F6', 'line-width': 3, 'line-opacity': 0.8 } });
        }
      } else {
        // Dashed line for transit/taxi
        const [from, to] = segment.waypoints;
        const sourceId = `transit-route-${from.lat}`;
        if (!map.current.getSource(sourceId)) {
          map.current.addSource(sourceId, {
            type: 'geojson',
            data: { type: 'Feature', geometry: { type: 'LineString', coordinates: [[from.lng, from.lat], [to.lng, to.lat]] }, properties: {} }
          });
          map.current.addLayer({ id: sourceId, type: 'line', source: sourceId,
            paint: { 'line-color': '#9CA3AF', 'line-width': 2, 'line-dasharray': [4, 4] } });
        }
      }
    }
  }

  return (
    <div class="relative">
      {/* POI category filters */}
      <div class="absolute top-3 left-3 z-10 flex gap-2 flex-wrap">
        {Object.entries(poiCategories).map(([cat, active]) => (
          <button
            key={cat}
            onClick={() => setPoiCategories(prev => ({ ...prev, [cat]: !prev[cat] }))}
            class={`px-3 py-1 rounded-full text-xs font-medium transition-all shadow-sm ${
              active ? 'bg-white text-gray-900' : 'bg-white/50 text-gray-400'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>
      <div ref={mapContainer} class="w-full h-[60vh] rounded-2xl overflow-hidden" />
    </div>
  );
}
```

**Step 2: Add to index.astro**

Add map section after itinerary:
```astro
<section id="map" class="py-20 bg-gray-50">
  <div class="max-w-5xl mx-auto px-4">
    <h2 class="section-title">Mapa</h2>
    <MapIsland client:load />
  </div>
</section>
```

**Step 3: Create .env file (add to .gitignore)**
```bash
echo "PUBLIC_MAPTILER_KEY=your_key_here" >> .env
echo ".env" >> .gitignore
```

**Step 4: Verify map loads**
```bash
npm run dev
```
Expected: Map renders at Athens center, POI markers visible, no console errors.

**Step 5: Commit**
```bash
git add src/components/MapIsland.tsx src/pages/index.astro .gitignore
git commit -m "feat: add interactive MapLibre GL map island with POI, routes, and filters"
```

---

## Task 12: Packing Island

**Files:**
- Create: `src/components/PackingIsland.tsx`

**Step 1: Create PackingIsland**

Create `src/components/PackingIsland.tsx`:
```tsx
import { useState, useEffect } from 'preact/hooks';
import { fetchSheetTab, parsePackingCsv } from '../lib/sheets';
import type { PackingItem } from '../lib/types';

const CATEGORY_ICONS: Record<string, string> = {
  documents: '📄',
  clothes: '👕',
  electronics: '🔌',
  toiletries: '🧴',
  misc: '📦',
};

interface Props {
  sheetId: string;
  packingGid: string;
}

export default function PackingIsland({ sheetId, packingGid }: Props) {
  const [items, setItems] = useState<PackingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSheetTab(sheetId, packingGid)
      .then(csv => setItems(parsePackingCsv(csv)))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [sheetId, packingGid]);

  if (loading) return <div class="text-gray-400 text-center py-8">Načítám seznam...</div>;
  if (items.length === 0) return <div class="text-gray-400 text-center py-8">Žádné položky v seznamu</div>;

  const grouped = items.reduce<Record<string, PackingItem[]>>((acc, item) => {
    const cat = item.category || 'misc';
    (acc[cat] ??= []).push(item);
    return acc;
  }, {});

  const totalPacked = items.filter(i => i.packed).length;
  const progress = Math.round((totalPacked / items.length) * 100);

  return (
    <div>
      {/* Progress bar */}
      <div class="mb-8">
        <div class="flex justify-between text-sm text-gray-500 mb-2">
          <span>Zabaleno {totalPacked} z {items.length}</span>
          <span>{progress}%</span>
        </div>
        <div class="w-full bg-gray-100 rounded-full h-2">
          <div
            class="bg-green-500 h-2 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Categories */}
      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(grouped).map(([category, categoryItems]) => (
          <div key={category} class="card">
            <h3 class="font-medium text-gray-700 mb-3 flex items-center gap-2">
              <span>{CATEGORY_ICONS[category] ?? '📦'}</span>
              <span class="capitalize">{category}</span>
              <span class="ml-auto text-xs text-gray-400">
                {categoryItems.filter(i => i.packed).length}/{categoryItems.length}
              </span>
            </h3>
            <ul class="space-y-2">
              {categoryItems.map(item => (
                <li key={item.item} class="flex items-center gap-2 text-sm">
                  <span class={`text-lg ${item.packed ? 'opacity-100' : 'opacity-30'}`}>
                    {item.packed ? '✅' : '⬜'}
                  </span>
                  <span class={item.packed ? 'text-gray-400 line-through' : 'text-gray-700'}>
                    {item.item}
                  </span>
                  {item.notes && (
                    <span class="text-xs text-gray-400 ml-auto">{item.notes}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
```

**Step 2: Add to index.astro**
```astro
<section id="packing" class="py-20 max-w-5xl mx-auto px-4">
  <h2 class="section-title">Zavazadlo</h2>
  <PackingIsland sheetId="YOUR_SHEET_ID" packingGid="YOUR_PACKING_GID" client:load />
</section>
```

**Step 3: Commit**
```bash
git add src/components/PackingIsland.tsx src/pages/index.astro
git commit -m "feat: add packing checklist island with category grouping and progress bar"
```

---

## Task 13: Connect Real Google Sheets Data

**Step 1: Create Google Sheet**

1. Go to https://docs.google.com/spreadsheets and create new sheet named "Athény 2026"
2. Create 5 tabs: Flights, Accommodation, Itinerary, Packing, Config
3. Add header rows matching the column names from Task 2 (types.ts)
4. Fill in sample data (at least 2-3 itinerary items with lat/lng coordinates)

**Step 2: Publish the sheet**

File → Share → Publish to web → Select "Entire Document" → CSV → Publish

**Step 3: Get sheet GIDs**

Each tab has a GID in its URL: `...gid=XXXXXXX`. Note them all.

**Step 4: Update .env**
```
PUBLIC_SHEET_ID=your_google_sheet_id_here
PUBLIC_FLIGHTS_GID=0
PUBLIC_ACCOMMODATION_GID=123456789
PUBLIC_ITINERARY_GID=987654321
PUBLIC_PACKING_GID=111222333
PUBLIC_MAPTILER_KEY=your_maptiler_key
```

**Step 5: Update DataLoader to use env vars**

Update `src/components/DataLoader.tsx` to import env:
```tsx
const sheetId = import.meta.env.PUBLIC_SHEET_ID ?? '';
const itineraryGid = import.meta.env.PUBLIC_ITINERARY_GID ?? '0';
```

**Step 6: Update index.astro to use env vars for all islands**

**Step 7: Verify real data loads**
```bash
npm run dev
```
Expected: Itinerary items appear in timeline, map shows correct pins over Athens.

**Step 8: Commit**
```bash
git add src/ .env.example
git commit -m "feat: connect real Google Sheets data via published CSV"
```

---

## Task 14: Deploy to Vercel

**Step 1: Create GitHub repo**
```bash
cd "/Users/domino/VS Code/web-atheny"
gh repo create web-atheny --public --source=. --push
```

**Step 2: Deploy to Vercel**
- Go to https://vercel.com/new
- Import `web-atheny` GitHub repo
- Framework: Astro (auto-detected)
- Add environment variables (all PUBLIC_* from .env)
- Deploy

**Step 3: Verify production deploy**
- Open live URL
- Check countdown, map, itinerary all load
- Edit Google Sheet → refresh Vercel URL → changes visible

**Step 4: Commit env example file**
```bash
echo "PUBLIC_SHEET_ID=\nPUBLIC_FLIGHTS_GID=\nPUBLIC_ACCOMMODATION_GID=\nPUBLIC_ITINERARY_GID=\nPUBLIC_PACKING_GID=\nPUBLIC_MAPTILER_KEY=" > .env.example
git add .env.example
git commit -m "chore: add .env.example for deployment reference"
```

---

## Task 15: Final Polish

**Step 1: Test on mobile (375px viewport)**

In browser DevTools → mobile viewport:
- Check nav is scrollable
- Countdown fits
- Timeline readable
- Map touchable

**Step 2: Add loading skeleton for islands**

In each island, show skeleton placeholders while `loading = true`:
```tsx
if (loading) return (
  <div class="space-y-3 animate-pulse">
    {[1,2,3].map(i => <div key={i} class="h-16 bg-gray-100 rounded-xl" />)}
  </div>
);
```

**Step 3: Run final build**
```bash
npm run build
npm run preview
```
Expected: Build succeeds, preview works at localhost:4321

**Step 4: Final commit**
```bash
git add -A
git commit -m "feat: final polish - mobile layout and loading skeletons"
```

---

## Google Sheet Setup Reference

Create a Google Sheet with these exact headers per tab:

**Flights tab:** `date | time | from | to | airline | flight_number | notes`

**Accommodation tab:** `name | address | check_in | check_out | booking_url | lat | lng | notes`

**Itinerary tab:** `date | time_start | time_end | title | description | category | travel_mode | lat | lng | cost_estimate | notes`
- `category` values: sights, food, drinks, shopping, transport, hotel, nature
- `travel_mode` values: walk, transit, taxi (or leave empty)
- `lat`/`lng`: decimal coordinates (e.g. 37.9715, 23.7262 for Acropolis)

**Packing tab:** `item | category | packed | notes`
- `category` values: documents, clothes, electronics, toiletries, misc
- `packed` values: TRUE or FALSE

**Config tab:** `key | value`
- Keys: trip_name, departure_date, hero_image_url, sheet_base_url
- `departure_date` format: `2026-05-12T06:00:00`

---

## Verification Checklist

- [ ] `npm test` — all tests pass
- [ ] `npm run dev` — page loads without console errors
- [ ] Countdown ticks live every second
- [ ] Itinerary shows day tabs and timeline items
- [ ] Map renders with Athens center, POI markers visible
- [ ] Clicking map pin shows popup with Google Maps link
- [ ] Clicking itinerary item flies map to that location
- [ ] POI category filters toggle markers
- [ ] Packing list shows progress bar
- [ ] Editing Google Sheet → refresh browser → changes visible
- [ ] `npm run build` — build succeeds
- [ ] Mobile viewport (375px) — all sections readable
- [ ] Vercel deploy — live URL works
