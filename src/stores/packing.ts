import { persistentAtom } from '@nanostores/persistent';

// Set of packed item IDs, persisted to localStorage with cross-tab sync
export const $packedItems = persistentAtom<Set<string>>(
  'atheny-packed-items',
  new Set(),
  {
    encode: (val) => JSON.stringify([...val]),
    decode: (raw) => {
      try {
        return new Set(JSON.parse(raw) as string[]);
      } catch {
        return new Set();
      }
    },
  }
);

export function togglePacked(id: string): void {
  const current = new Set($packedItems.get());
  if (current.has(id)) {
    current.delete(id);
  } else {
    current.add(id);
  }
  $packedItems.set(current);
}

export function resetPacking(): void {
  $packedItems.set(new Set<string>());
}
