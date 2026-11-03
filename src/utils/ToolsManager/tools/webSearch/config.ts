import uiStore from '@/store/UIStore';
import { getSecret, secretNames, setSecret } from '@/utils/secureStorage';

/**
 * Web search is OFF until the user picks a provider here. NexVora AI Workspace ships no search
 * server, no shared proxy and no shared credentials.
 *
 *  - `searxng`: the user's own SearXNG instance (JSON output must be enabled on it). The base URL is
 *    chosen by the user; an optional token is sent as `Authorization: Bearer <token>`.
 *  - `you`: You.com Search API (https://api.you.com). Works with the user's own API key; without a key
 *    it uses You.com's keyless free tier, which is rate limited per IP.
 *
 * The provider choice and URL live in AsyncStorage; the optional key/token lives in the keychain.
 */
export type WebSearchProvider = 'searxng' | 'you';

export const WEB_SEARCH_PROVIDERS: { id: WebSearchProvider; host: string }[] = [
  { id: 'searxng', host: 'your own server' },
  { id: 'you', host: 'api.you.com' },
];

type StoredConfig = { provider: WebSearchProvider | null; baseUrl?: string };
export type WebSearchConfig = StoredConfig & { apiKey: string };

const EMPTY: StoredConfig = { provider: null };

export async function getWebSearchConfig(): Promise<WebSearchConfig> {
  const stored = await uiStore.getFromStorage<StoredConfig>('web_search_config', EMPTY);
  const apiKey = (await getSecret(secretNames.webSearch())) ?? '';
  return { provider: stored.provider ?? null, baseUrl: stored.baseUrl, apiKey };
}

/** Returns an error message when the URL cannot be used, otherwise null. */
export function validateSearxngUrl(raw: string): string | null {
  try {
    const url = new URL(raw.trim());
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return 'URL must start with http:// or https://';
    return null;
  } catch {
    return 'Enter a valid URL, for example https://search.example.com';
  }
}

export async function saveWebSearchConfig(config: WebSearchConfig): Promise<void> {
  const { apiKey, ...stored } = config;
  if (stored.baseUrl) stored.baseUrl = stored.baseUrl.trim().replace(/\/+$/, '');
  await uiStore.setToStorage<StoredConfig>('web_search_config', stored);
  await setSecret(secretNames.webSearch(), apiKey.trim());
}

export async function clearWebSearchConfig(): Promise<void> {
  await uiStore.setToStorage<StoredConfig>('web_search_config', EMPTY);
  await setSecret(secretNames.webSearch(), '');
}

/** True when the user has chosen a provider that can actually be called. */
export async function isWebSearchConfigured(): Promise<boolean> {
  const config = await getWebSearchConfig();
  if (config.provider === 'you') return true;
  if (config.provider === 'searxng') return !!config.baseUrl && !validateSearxngUrl(config.baseUrl);
  return false;
}
