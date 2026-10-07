import { APP_TECHNICAL_NAMESPACE } from '../appIdentity';

export const APP_STORAGE_NAMESPACE = APP_TECHNICAL_NAMESPACE;

/**
 * Reads a namespaced browser value and adopts a matching value from an older
 * product namespace when the current key has not been written yet.
 *
 * Matching by the stable suffix keeps rename compatibility without retaining
 * former product names in the application bundle. The source key is removed
 * only after the value has been copied successfully.
 */
export function readMigratedStorageValue(
  storage: Storage,
  currentKey: string,
  stableSuffix: string,
): string | null {
  const currentValue = storage.getItem(currentKey);
  if (currentValue !== null) return currentValue;

  const candidateKeys: string[] = [];
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (key && key !== currentKey && key.endsWith(stableSuffix)) {
      candidateKeys.push(key);
    }
  }

  for (const candidateKey of candidateKeys.sort()) {
    const candidateValue = storage.getItem(candidateKey);
    if (candidateValue === null) continue;

    storage.setItem(currentKey, candidateValue);
    storage.removeItem(candidateKey);
    return candidateValue;
  }

  return null;
}
