import type { TransportLeg } from '../lib/types';

export const transport: TransportLeg[] = [
  {
    id: 'train-out',
    date: '2026-05-12',
    from: 'Brno',
    to: 'Vídeň (Wien Hbf)',
    mode: 'train',
    status: 'planned',
  },
  {
    id: 'flight-out',
    date: '2026-05-12',
    from: 'Vídeň (VIE)',
    to: 'Atény (ATH)',
    mode: 'flight',
    status: 'partial',
    time_departure: '13:35',
    time_arrival: '16:45',
  },
  {
    id: 'flight-ret',
    date: '2026-05-15',
    from: 'Atény (ATH)',
    to: 'Vídeň (VIE)',
    mode: 'flight',
    status: 'partial',
    time_departure: '16:15',
    time_arrival: '17:35',
  },
  {
    id: 'train-ret',
    date: '2026-05-15',
    from: 'Vídeň (Wien Hbf)',
    to: 'Brno',
    mode: 'train',
    status: 'planned',
  },
];
