jest.mock('@/store/UIStore', () => ({ __esModule: true, default: { getFromStorage: jest.fn(), setToStorage: jest.fn() } }));
jest.mock('@/utils/secureStorage', () => ({
  getSecret: jest.fn(async () => null),
  setSecret: jest.fn(async () => true),
  secretNames: { webSearch: () => 'webSearch.apiKey' },
}));

import uiStore from '@/store/UIStore';
import { isWebSearchConfigured, validateSearxngUrl } from '../config';

describe('web search configuration', () => {
  it('rejects non-http(s) and malformed server addresses', () => {
    expect(validateSearxngUrl('ftp://example.com')).not.toBeNull();
    expect(validateSearxngUrl('not a url')).not.toBeNull();
    expect(validateSearxngUrl('https://search.example.com')).toBeNull();
    expect(validateSearxngUrl('http://192.168.1.5:8080')).toBeNull();
  });

  it('is NOT configured by default (no provider chosen)', async () => {
    (uiStore.getFromStorage as jest.Mock).mockResolvedValue({ provider: null });
    expect(await isWebSearchConfigured()).toBe(false);
  });

  it('needs a valid address for SearXNG but not for You.com', async () => {
    (uiStore.getFromStorage as jest.Mock).mockResolvedValue({ provider: 'searxng', baseUrl: '' });
    expect(await isWebSearchConfigured()).toBe(false);
    (uiStore.getFromStorage as jest.Mock).mockResolvedValue({ provider: 'searxng', baseUrl: 'https://search.example.com' });
    expect(await isWebSearchConfigured()).toBe(true);
    (uiStore.getFromStorage as jest.Mock).mockResolvedValue({ provider: 'you' });
    expect(await isWebSearchConfigured()).toBe(true);
  });
});
