import { useStore } from '@nanostores/preact';
import { $activeDay, $highlightedItem } from '../stores/ui';
import { formatDate, formatTime, getDayColor } from '../lib/utils';
import type { ItineraryItem } from '../lib/types';

interface Props {
  items: ItineraryItem[];
}

const TRAVEL_ICONS: Record<string, string> = {
  walk:    '🚶',
  transit: '🚇',
  taxi:    '🚕',
  '':      '',
};

const CATEGORY_COLORS: Record<string, string> = {
  kultura:      'var(--color-aegean)',
  jídlo:        'var(--color-terracotta)',
  procházka:    'var(--color-olive)',
  logistika:    'var(--color-text-muted)',
  'volný čas':  'var(--color-day3)',
};

function getCategoryColor(cat: string): string {
  return CATEGORY_COLORS[cat] ?? 'var(--color-text-muted)';
}

export default function ItineraryIsland({ items }: Props) {
  const activeDay = useStore($activeDay);
  const highlighted = useStore($highlightedItem);

  // Group items by date, preserve insertion order
  const days = [...new Set(items.map((i) => i.date))];
  const byDay = Object.fromEntries(
    days.map((d) => [d, items.filter((i) => i.date === d)])
  );

  const dayItems = byDay[activeDay] ?? [];

  return (
    <div class="itinerary">
      {/* Day tabs */}
      <div class="itinerary-tabs" role="tablist" aria-label="Dny výletu">
        {days.map((date) => {
          const color = getDayColor(date);
          const isActive = date === activeDay;
          return (
            <button
              key={date}
              role="tab"
              aria-selected={isActive}
              class={`itinerary-tab ${isActive ? 'itinerary-tab--active' : ''} itinerary-tab--${color}`}
              onClick={() => $activeDay.set(date)}
            >
              <span class="itinerary-tab-dot" aria-hidden="true" />
              <span class="itinerary-tab-label">{formatDate(date)}</span>
            </button>
          );
        })}
      </div>

      {/* Timeline */}
      <ol class="timeline" aria-label={`Itinerář — ${formatDate(activeDay)}`}>
        {dayItems.map((item, idx) => {
          const isHighlighted = highlighted === item.id;
          const color = getDayColor(item.date);
          return (
            <li
              key={item.id}
              class={`timeline-item ${isHighlighted ? 'timeline-item--highlighted' : ''}`}
              onMouseEnter={() => $highlightedItem.set(item.id)}
              onMouseLeave={() => $highlightedItem.set(null)}
            >
              {/* Spine line */}
              <div class="timeline-spine" aria-hidden="true">
                <div class={`timeline-dot timeline-dot--${color}`} />
                {idx < dayItems.length - 1 && <div class="timeline-line" />}
              </div>

              {/* Content */}
              <div class="timeline-content">
                <div class="timeline-meta">
                  <span class="timeline-time">
                    {formatTime(item.time_start)}
                    {item.time_end && ` – ${formatTime(item.time_end)}`}
                  </span>
                  <span
                    class="timeline-category"
                    style={{ color: getCategoryColor(item.category) }}
                  >
                    {item.category}
                  </span>
                  {item.travel_mode && (
                    <span class="timeline-travel" title={item.travel_mode} aria-label={item.travel_mode}>
                      {TRAVEL_ICONS[item.travel_mode]}
                    </span>
                  )}
                </div>

                <h3 class="timeline-title">{item.title}</h3>

                {item.description && (
                  <p class="timeline-desc">{item.description}</p>
                )}

                <div class="timeline-footer">
                  {item.cost_estimate && (
                    <span class="timeline-cost">
                      <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                        <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm.75 10.25V12a.75.75 0 0 1-1.5 0v-.75C5.9 11.06 5 10.14 5 9a.75.75 0 0 1 1.5 0c0 .55.45 1 1 1h1c.55 0 1-.45 1-1 0-.42-.27-.7-.63-.82L6.5 7.6C5.6 7.28 5 6.43 5 5.5 5 4.36 5.9 3.44 7.25 3.25V2.5a.75.75 0 0 1 1.5 0v.75C10.1 3.56 11 4.44 11 5.5a.75.75 0 0 1-1.5 0c0-.55-.45-1-1-1h-1c-.55 0-1 .45-1 1 0 .42.27.7.63.82l1.37.58c.9.32 1.5 1.17 1.5 2.1 0 1.14-.9 2.06-2.25 2.25z"/>
                      </svg>
                      {item.cost_estimate}
                    </span>
                  )}
                  {item.notes && (
                    <span class="timeline-notes">{item.notes}</span>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
