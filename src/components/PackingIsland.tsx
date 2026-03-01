import { useState } from 'preact/hooks';
import { useStore } from '@nanostores/preact';
import { $packedItems, togglePacked, resetPacking } from '../stores/packing';
import type { PackingItem } from '../lib/types';

interface Props {
  items: PackingItem[];
}

// Stable ID for a packing item (category + item name)
function itemId(item: PackingItem): string {
  return `${item.category}::${item.item}`;
}

export default function PackingIsland({ items }: Props) {
  const packed = useStore($packedItems);
  const [activeCategory, setActiveCategory] = useState<string>('Vše');

  const categories = ['Vše', ...new Set(items.map((i) => i.category))];
  const filtered = activeCategory === 'Vše'
    ? items
    : items.filter((i) => i.category === activeCategory);

  const totalPacked = items.filter((i) => packed.has(itemId(i))).length;
  const progress = Math.round((totalPacked / items.length) * 100);

  const byCategory = Object.fromEntries(
    [...new Set(filtered.map((i) => i.category))].map((cat) => [
      cat,
      filtered.filter((i) => i.category === cat),
    ])
  );

  return (
    <div class="packing">
      {/* Progress bar */}
      <div class="packing-progress">
        <div class="packing-progress-header">
          <span class="packing-progress-label">Zabaleno</span>
          <span class="packing-progress-count">
            <strong>{totalPacked}</strong> / {items.length}
          </span>
        </div>
        <div class="packing-bar" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
          <div
            class="packing-bar-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
        {progress === 100 && (
          <p class="packing-complete">Vše zabaleno — připraven na výlet! ✈️</p>
        )}
      </div>

      {/* Category filter */}
      <div class="packing-filters" role="group" aria-label="Filtr kategorií">
        {categories.map((cat) => {
          const catItems = cat === 'Vše' ? items : items.filter((i) => i.category === cat);
          const catPacked = catItems.filter((i) => packed.has(itemId(i))).length;
          return (
            <button
              key={cat}
              class={`packing-filter-btn ${activeCategory === cat ? 'packing-filter-btn--active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
              <span class="packing-filter-count">{catPacked}/{catItems.length}</span>
            </button>
          );
        })}
      </div>

      {/* Item groups */}
      <div class="packing-groups">
        {Object.entries(byCategory).map(([cat, catItems]) => (
          <div key={cat} class="packing-group">
            <h3 class="packing-group-title">{cat}</h3>
            <ul class="packing-list" role="list">
              {catItems.map((item) => {
                const id = itemId(item);
                const isPacked = packed.has(id);
                return (
                  <li key={id} class={`packing-item ${isPacked ? 'packing-item--packed' : ''}`}>
                    <label class="packing-label">
                      <input
                        type="checkbox"
                        class="packing-checkbox"
                        checked={isPacked}
                        onChange={() => togglePacked(id)}
                        aria-label={item.item}
                      />
                      <span class="packing-check-icon" aria-hidden="true">
                        {isPacked ? (
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path d="M2 6l3 3 5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                          </svg>
                        ) : null}
                      </span>
                      <span class="packing-item-name">{item.item}</span>
                      {item.notes && (
                        <span class="packing-item-note" title={item.notes}>
                          <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor" aria-label={`Poznámka: ${item.notes}`}>
                            <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 3a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm0 3.5c.55 0 1 .45 1 1V11a1 1 0 1 1-2 0V8.5c0-.55.45-1 1-1z"/>
                          </svg>
                        </span>
                      )}
                    </label>
                    {item.notes && (
                      <p class="packing-item-note-text">{item.notes}</p>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {/* Reset button */}
      <button
        class="packing-reset"
        onClick={() => {
          if (confirm('Opravdu chceš resetovat packing list?')) resetPacking();
        }}
      >
        Resetovat seznam
      </button>
    </div>
  );
}
