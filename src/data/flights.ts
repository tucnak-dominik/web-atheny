import type { Flight } from '../lib/types';

export const flights = [
  {
    date: '2026-05-12',
    time: '07:30',
    from: 'Praha (PRG)',
    to: 'Atény (ATH)',
    airline: 'Aegean Airlines',
    flight_number: 'A3 671',
    notes: 'Terminál 1, check-in od 05:30',
  },
  {
    date: '2026-05-15',
    time: '21:15',
    from: 'Atény (ATH)',
    to: 'Praha (PRG)',
    airline: 'Aegean Airlines',
    flight_number: 'A3 672',
    notes: 'Dolet cca 23:45',
  },
] as const satisfies Flight[];
