import * as Keychain from 'react-native-keychain';

/**
 * Thin wrapper around the Android Keystore-backed keychain for small secrets (API keys).
 *
 * - Secrets are stored one per keychain "service": `com.nexvora.aiworkspace.secret.<name>`.
 * - Values are cached in memory after the first read so hot paths (every tool lookup reads the
 *   LLM preference) do not hit the keystore each time.
 * - Nothing here ever logs a secret value - only the (non-secret) name of the entry on failure.
 */
const SERVICE_PREFIX = 'com.nexvora.aiworkspace.secret.';

/** `''` in the cache means "known to be empty" so we do not ask the keystore again. */
const cache = new Map<string, string>();

/**
 * Secrets whose last keystore READ failed. While a read has failed we cannot tell "the user cleared the key" from "the key
 * could not be read", so an empty value must NOT delete the stored secret (that would turn a transient keystore error into
 * permanent data loss).
 */
const unreadable = new Set<string>();

const serviceFor = (name: string) => `${SERVICE_PREFIX}${name}`;

/** Reads a secret, or null when none is stored (or the keystore is unavailable). */
export async function getSecret(name: string): Promise<string | null> {
  if (cache.has(name)) return cache.get(name) || null;
  try {
    const stored = await Keychain.getGenericPassword({ service: serviceFor(name) });
    const value = stored ? stored.password : '';
    cache.set(name, value);
    unreadable.delete(name);
    return value || null;
  } catch {
    unreadable.add(name);
    console.warn(`[secureStorage] could not read secret "${name}"`);
    return null;
  }
}

/** Stores (or, for an empty value, removes) a secret. Resolves false when the keystore refused. */
export async function setSecret(name: string, value: string): Promise<boolean> {
  try {
    if (!value) {
      // Never delete a secret we failed to read - an empty value may only mean "could not read it" (see `unreadable`).
      if (unreadable.has(name)) return false;
      await Keychain.resetGenericPassword({ service: serviceFor(name) });
      cache.set(name, '');
      return true;
    }
    await Keychain.setGenericPassword('secret', value, {
      service: serviceFor(name),
      accessible: Keychain.ACCESSIBLE.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
    });
    cache.set(name, value);
    unreadable.delete(name);
    return true;
  } catch {
    console.warn(`[secureStorage] could not store secret "${name}"`);
    return false;
  }
}

export async function deleteSecret(name: string): Promise<void> {
  await setSecret(name, '');
}

/** Removes every secret this app stored (used by "Reset"). */
export async function deleteAllSecrets(): Promise<void> {
  try {
    const services = await Keychain.getAllGenericPasswordServices();
    await Promise.all(
      services
        .filter((service) => service.startsWith(SERVICE_PREFIX))
        .map((service) => Keychain.resetGenericPassword({ service }).catch(() => false)),
    );
  } catch {
    console.warn('[secureStorage] could not enumerate secrets while resetting');
  } finally {
    cache.clear();
    unreadable.clear();
  }
}

/**
 * Splits `apiKey` fields out of a provider config. Used by UIStore so the key never reaches
 * AsyncStorage (which is a plain SQLite file inside the app sandbox).
 */
export type SecretCarrier = { apiKey?: string } & Record<string, any>;

/** Names of the keychain entries for each persisted structure that can hold an API key. */
export const secretNames = {
  llmPreference: (provider: string) => `llmPreference.${provider}.apiKey`,
  providerCache: (provider: string) => `providerCache.${provider}.apiKey`,
  webSearch: () => 'webSearch.apiKey',
};
