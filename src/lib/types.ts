export interface TransportLeg {
  id: string;
  date: string;
  from: string;
  to: string;
  mode: 'flight' | 'train';
  direction: 'outbound' | 'return';
  status: 'planned' | 'partial' | 'confirmed';
  time_departure?: string;
  time_arrival?: string;
  carrier?: string;
  reference?: string;
  notes?: string;
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
  isPlaceholder?: boolean;
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
  id: string;
}

export interface PackingItem {
  item: string;
  category: string;
  packed: boolean;
  notes: string;
}

export interface SiteConfig {
  trip_name: string;
  departure_date: string;
  return_date: string;
  hero_image_url: string;
}

export interface POI {
  id: string;
  name: string;
  category: string;
  lat: number;
  lng: number;
  description?: string;
}

export interface Waypoint {
  lat: number;
  lng: number;
}
