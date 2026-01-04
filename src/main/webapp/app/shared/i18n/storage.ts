/**
 * Simple storage wrapper for localStorage and sessionStorage.
 */
const createStorageWrapper = (storage: Storage) => ({
  get(key: string, defaultValue?: string): string | null {
    try {
      const value = storage.getItem(key);
      return value !== null ? value : (defaultValue ?? null);
    } catch {
      return defaultValue ?? null;
    }
  },
  set(key: string, value: string): void {
    try {
      storage.setItem(key, value);
    } catch {
      // Storage full or disabled
    }
  },
  remove(key: string): void {
    try {
      storage.removeItem(key);
    } catch {
      // Storage disabled
    }
  },
});

export const Storage = {
  local: createStorageWrapper(window.localStorage),
  session: createStorageWrapper(window.sessionStorage),
};
