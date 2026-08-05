import { LocalStorageAdapter } from './local-storage.adapter.js';
import type { StorageAdapter } from './storage.types.js';

let adapter: StorageAdapter | null = null;

export function getStorage(): StorageAdapter {
  adapter ??= new LocalStorageAdapter();
  return adapter;
}

export function setStorageAdapter(nextAdapter: StorageAdapter) {
  adapter = nextAdapter;
}
