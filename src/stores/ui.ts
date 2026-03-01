import { atom } from 'nanostores';

// Active day shown in ItineraryIsland (ISO date string, e.g. '2026-05-12')
export const $activeDay = atom<string>('2026-05-12');

// ID of the itinerary item currently hovered/highlighted (syncs map ↔ itinerary)
export const $highlightedItem = atom<string | null>(null);
