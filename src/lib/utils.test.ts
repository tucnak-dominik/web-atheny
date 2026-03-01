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
