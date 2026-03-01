import type { Accommodation } from '../lib/types';

export const accommodation = {
  name: 'Hotel Grande Bretagne',
  address: 'Vasileos Georgiou A 1, Athína 105 64',
  check_in: '2026-05-12',
  check_out: '2026-05-15',
  booking_url: 'https://www.booking.com',
  lat: 37.9757,
  lng: 23.7358,
  notes: 'Check-in od 15:00, pozdní check-out lze domluvit',
} as const satisfies Accommodation;
