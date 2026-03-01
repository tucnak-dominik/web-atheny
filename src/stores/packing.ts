import { atom } from 'nanostores';

const STORAGE_KEY = 'atheny-packed-items';

function loadFromStorage(): Set<string> {
  if (typeof localStorage === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

function saveToStorage(ids: Set<string>): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
}

// Set of packed item IDs, persisted to localStorage
export const $packedItems = atom<Set<string>>(loadFromStorage());

export function togglePacked(id: string): void {
  const current = new Set($packedItems.get());
  if (current.has(id)) {
    current.delete(id);
  } else {
    current.add(id);
  }
  saveToStorage(current);
  $packedItems.set(current);
}

export function resetPacking(): void {
  const empty = new Set<string>();
  saveToStorage(empty);
  $packedItems.set(empty);
}
