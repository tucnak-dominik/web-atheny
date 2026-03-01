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
