import { useEffect, useState } from 'preact/hooks';

interface Props {
  departureDate: string;
  departureTime?: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  departed: boolean;
}

function calcTimeLeft(departureDateStr: string, departureTime = '00:00'): TimeLeft {
  const target = new Date(departureDateStr + 'T' + departureTime + ':00').getTime();
  const now = Date.now();
  const diff = target - now;

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, departed: true };
  }

  const days    = Math.floor(diff / 86_400_000);
  const hours   = Math.floor((diff % 86_400_000) / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  const seconds = Math.floor((diff % 60_000) / 1_000);

  return { days, hours, minutes, seconds, departed: false };
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

export default function CountdownIsland({ departureDate, departureTime }: Props) {
  const [time, setTime] = useState<TimeLeft>(() => calcTimeLeft(departureDate, departureTime));

  useEffect(() => {
    const id = setInterval(() => setTime(calcTimeLeft(departureDate, departureTime)), 1_000);
    return () => clearInterval(id);
  }, [departureDate, departureTime]);

  if (time.departed) {
    return (
      <div class="countdown countdown--departed">
        <p class="countdown-message">Cesta začala!</p>
      </div>
    );
  }

  const units = [
    { value: time.days,    label: 'dní' },
    { value: time.hours,   label: 'hodin' },
    { value: time.minutes, label: 'minut' },
    { value: time.seconds, label: 'sekund' },
  ];

  return (
    <div class="countdown">
      <p class="countdown-label">Odlet za</p>
      <div class="countdown-units">
        {units.map(({ value, label }, i) => (
          <div class="countdown-unit" key={label}>
            <span class="countdown-value">{i === 0 ? value : pad(value)}</span>
            <span class="countdown-unit-label">{label}</span>
            {i < units.length - 1 && (
              <span class="countdown-sep" aria-hidden="true">:</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
