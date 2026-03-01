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
  hero_image_url: string;
  sheet_base_url: string;
}

export interface Waypoint {
  lat: number;
  lng: number;
}
