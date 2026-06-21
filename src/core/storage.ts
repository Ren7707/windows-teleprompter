export interface KeyValueStorage {
  get(key: string): string | undefined;
  set(key: string, value: string): void;
}

export function loadJson<T>(storage: KeyValueStorage, key: string, fallback: T): T {
  const raw = storage.get(key);
  if (!raw) return fallback;

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function saveJson(storage: KeyValueStorage, key: string, value: unknown) {
  storage.set(key, JSON.stringify(value));
}
