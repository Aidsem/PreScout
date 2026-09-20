import AsyncStorage from '@react-native-async-storage/async-storage';

/** Minimal key/value contract so the provider can be tested without native storage
 *  and so the SQLite mirror (hardening spec amendment) can replace AsyncStorage later. */
export interface TacticalStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
}

export const STORAGE_KEY = 'resqmesh.tactical';
/** Where an unreadable snapshot is parked so it is not lost and not re-read. */
export const BACKUP_KEY = 'resqmesh.tactical.corrupt';

export const asyncStorageAdapter: TacticalStorage = {
  getItem: (key) => AsyncStorage.getItem(key),
  setItem: (key, value) => AsyncStorage.setItem(key, value),
};

export function memoryStorage(seed: Record<string, string> = {}): TacticalStorage & { dump(): Record<string, string> } {
  const store: Record<string, string> = { ...seed };
  return {
    async getItem(key) {
      return key in store ? store[key] : null;
    },
    async setItem(key, value) {
      store[key] = value;
    },
    dump: () => ({ ...store }),
  };
}
