import { describe, expect, it } from 'vitest';
import {
  readMigratedStorageValue,
  APP_STORAGE_NAMESPACE,
} from './browserStorageNamespace';

function createMemoryStorage(): Storage {
  const entries = new Map<string, string>();
  return {
    get length() {
      return entries.size;
    },
    clear: () => entries.clear(),
    getItem: (key) => entries.get(key) ?? null,
    key: (index) => [...entries.keys()][index] ?? null,
    removeItem: (key) => {
      entries.delete(key);
    },
    setItem: (key, value) => {
      entries.set(key, value);
    },
  };
}

describe('browser storage namespace migration', () => {

  it('returns the current namespace value without changing other keys', () => {
    const currentKey = `${APP_STORAGE_NAMESPACE}.managerActivity.items`;
    const storage = createMemoryStorage();
    storage.setItem(currentKey, 'current');
    storage.setItem('prior-product.managerActivity.items', 'legacy');

    expect(readMigratedStorageValue(
      storage,
      currentKey,
      '.managerActivity.items',
    )).toBe('current');
    expect(storage.getItem('prior-product.managerActivity.items')).toBe('legacy');
  });

  it('moves a matching prior namespace value to the current namespace', () => {
    const currentKey = `${APP_STORAGE_NAMESPACE}.dayPlan.plan-1.stopStates`;
    const priorKey = 'prior-product.dayPlan.plan-1.stopStates';
    const storage = createMemoryStorage();
    storage.setItem(priorKey, '{"stop-1":"finished"}');

    expect(readMigratedStorageValue(
      storage,
      currentKey,
      '.dayPlan.plan-1.stopStates',
    )).toBe('{"stop-1":"finished"}');
    expect(storage.getItem(currentKey)).toBe('{"stop-1":"finished"}');
    expect(storage.getItem(priorKey)).toBeNull();
  });

  it('ignores keys that do not share the complete stable suffix', () => {
    const currentKey = `${APP_STORAGE_NAMESPACE}.managerActivity.sourceFilter`;
    const storage = createMemoryStorage();
    storage.setItem('another-product.managerActivity.toneFilter', 'warning');

    expect(readMigratedStorageValue(
      storage,
      currentKey,
      '.managerActivity.sourceFilter',
    )).toBeNull();
  });
});
