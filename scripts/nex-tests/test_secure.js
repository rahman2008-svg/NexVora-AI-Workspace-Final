const H = require('./harness.js');
const assert = require('assert');
const results = [];
async function t(name, fn) { try { await fn(); results.push(['PASS', name]); } catch (e) { results.push(['FAIL', name + ' -> ' + e.message]); } }

(async () => {
  const { UIStore } = require(H.OUT + '/src/store/UIStore.js');
  const mk = () => { const s = new UIStore(); return s; };

  await t('UIStore class loads and exposes storage API', async () => {
    const s = mk(); assert.strictEqual(typeof s.setToStorage, 'function'); assert.strictEqual(typeof s.getFromStorage, 'function');
  });

  await t('saving llmPreference keeps the API key OUT of AsyncStorage and IN the keychain', async () => {
    const s = mk();
    await s.setToStorage('llmPreference', { provider: 'openai', config: { apiKey: 'sk-test-SECRET-123', model: 'gpt-x' } });
    const raw = H.asyncStore.get('llmPreference');
    assert.ok(raw, 'something was stored');
    assert.ok(!raw.includes('sk-test-SECRET-123'), 'plain-text key must not be in AsyncStorage: ' + raw);
    assert.strictEqual(JSON.parse(raw).config.model, 'gpt-x');
    assert.ok([...H.keychainStore.values()].includes('sk-test-SECRET-123'), 'key is in the keychain');
  });

  await t('reading llmPreference returns the full config including the key', async () => {
    const s = mk();
    const v = await s.getFromStorage('llmPreference', null);
    assert.strictEqual(v.config.apiKey, 'sk-test-SECRET-123'); assert.strictEqual(v.provider, 'openai'); assert.strictEqual(v.config.model, 'gpt-x');
  });

  await t('provider_config_cache: keys of several providers are separated and restored', async () => {
    const s = mk();
    await s.setToStorage('provider_config_cache', { openai: { apiKey: 'K1', model: 'a' }, anthropic: { apiKey: 'K2', model: 'b' }, ollama: { apiKey: '', baseUrl: 'http://x', model: 'c' } });
    const raw = H.asyncStore.get('provider_config_cache');
    assert.ok(!raw.includes('K1') && !raw.includes('K2'), 'no keys in AsyncStorage');
    const v = await s.getFromStorage('provider_config_cache', {});
    assert.strictEqual(v.openai.apiKey, 'K1'); assert.strictEqual(v.anthropic.apiKey, 'K2'); assert.strictEqual(v.ollama.apiKey || '', ''); assert.strictEqual(v.ollama.baseUrl, 'http://x');
  });

  await t('MIGRATION: a legacy plain-text key is moved to the keychain on first read and removed from AsyncStorage', async () => {
    H.keychainStore.clear();
    H.asyncStore.set('llmPreference', JSON.stringify({ provider: 'anthropic', config: { apiKey: 'LEGACY-PLAIN-KEY', model: 'claude' } }));
    const s = mk();
    const v = await s.getFromStorage('llmPreference', null);
    assert.strictEqual(v.config.apiKey, 'LEGACY-PLAIN-KEY', 'caller still receives the key');
    assert.ok(!H.asyncStore.get('llmPreference').includes('LEGACY-PLAIN-KEY'), 'plain-text copy removed');
    assert.ok([...H.keychainStore.values()].includes('LEGACY-PLAIN-KEY'), 'copied to keychain');
    const again = await s.getFromStorage('llmPreference', null);
    assert.strictEqual(again.config.apiKey, 'LEGACY-PLAIN-KEY', 'still readable after migration');
  });

  await t('clearing a key removes it from the keychain', async () => {
    const s = mk();
    await s.setToStorage('llmPreference', { provider: 'anthropic', config: { apiKey: '', model: 'claude' } });
    assert.ok(![...H.keychainStore.values()].includes('LEGACY-PLAIN-KEY'));
  });

  await t('FALLBACK: if the keystore refuses, the key is kept so the app keeps working (and a warning never contains the key)', async () => {
    const warns = []; const ow = console.warn; console.warn = (...a) => warns.push(a.join(' '));
    H.setKeychainFails(true);
    const s = mk();
    await s.setToStorage('llmPreference', { provider: 'gemini', config: { apiKey: 'FALLBACK-KEY', model: 'g' } });
    H.setKeychainFails(false); console.warn = ow;
    const v = await s.getFromStorage('llmPreference', null);
    assert.strictEqual(v.config.apiKey, 'FALLBACK-KEY');
    assert.ok(warns.length > 0, 'a warning was logged'); assert.ok(!warns.join(' ').includes('FALLBACK-KEY'), 'warning must not contain the key');
  });

  await t('DATA-LOSS GUARD: a transient keystore READ failure must not delete a stored key when the config is saved again', async () => {
    const s = mk();
    H.keychainStore.clear();
    await s.setToStorage('provider_config_cache', { openai: { apiKey: 'KEEP-ME', model: 'a' } });
    // simulate: the app restarts (in-memory cache gone) and the keystore read fails once
    // "restart": drop the modules (and their in-memory secret cache) so values must come from the keystore again
    for (const k of Object.keys(require.cache)) if (k.includes('/src/utils/secureStorage') || k.includes('/src/store/UIStore')) delete require.cache[k];
    const fresh = new (require(H.OUT + '/src/store/UIStore.js').UIStore)();
    H.setKeychainReadFails(true);
    const unhydrated = await fresh.getFromStorage('provider_config_cache', {});
    assert.strictEqual(unhydrated.openai.apiKey || '', '', 'read failed so the key is not available');
    await fresh.setToStorage('provider_config_cache', unhydrated);   // what useProviderConfigCache.save() would do
    H.setKeychainReadFails(false);
    assert.ok([...H.keychainStore.values()].includes('KEEP-ME'), 'secret must still be in the keychain');
  });

  await t('non-secret storage keys are untouched', async () => {
    const s = mk(); await s.setToStorage('tools', { webSearch: true }); assert.strictEqual(H.asyncStore.get('tools'), JSON.stringify({ webSearch: true }));
    assert.deepStrictEqual(await s.getFromStorage('tools', {}), { webSearch: true });
  });

  await t('setToStorage emits the FULL value (with key) to in-process listeners', async () => {
    const s = mk(); let got = null; s.emitter.addListener('llmPreference', (e) => { got = e; });
    await s.setToStorage('llmPreference', { provider: 'openai', config: { apiKey: 'EMIT-KEY', model: 'm' } });
    assert.strictEqual(got.details.config.apiKey, 'EMIT-KEY');
  });

  await t('resetAllStorage wipes keychain secrets and stored values', async () => {
    const s = mk(); await s.resetAllStorage();
    assert.strictEqual(H.keychainStore.size, 0); assert.strictEqual(H.asyncStore.has('llmPreference'), false);
  });

  // ---- web search config
  const cfg = require(H.OUT + '/src/utils/ToolsManager/tools/webSearch/config.js');
  await t('web search: invalid server addresses rejected, valid accepted', async () => {
    assert.ok(cfg.validateSearxngUrl('ftp://a.b')); assert.ok(cfg.validateSearxngUrl('not a url')); assert.ok(cfg.validateSearxngUrl(''));
    assert.strictEqual(cfg.validateSearxngUrl('https://search.example.com'), null); assert.strictEqual(cfg.validateSearxngUrl('http://192.168.1.5:8080'), null);
  });
  await t('web search: NOT configured by default', async () => { assert.strictEqual(await cfg.isWebSearchConfigured(), false); });
  await t('web search: configured only after a provider (and valid URL for SearXNG) is saved; key goes to keychain', async () => {
    await cfg.saveWebSearchConfig({ provider: 'searxng', baseUrl: 'https://s.example.com/', apiKey: 'TOKEN-1' });
    assert.strictEqual(await cfg.isWebSearchConfigured(), true);
    const c = await cfg.getWebSearchConfig(); assert.strictEqual(c.baseUrl, 'https://s.example.com'); assert.strictEqual(c.apiKey, 'TOKEN-1');
    const { asyncStore } = H; assert.ok(!(asyncStore.get('web_search_config') || '').includes('TOKEN-1'), 'token not in AsyncStorage');
    await cfg.saveWebSearchConfig({ provider: 'searxng', baseUrl: 'not a url', apiKey: '' });
    assert.strictEqual(await cfg.isWebSearchConfigured(), false);
    await cfg.saveWebSearchConfig({ provider: 'you', apiKey: '' }); assert.strictEqual(await cfg.isWebSearchConfigured(), true);
    await cfg.clearWebSearchConfig(); assert.strictEqual(await cfg.isWebSearchConfigured(), false);
  });

  // ---- pure helpers in nex/data
  const data = require(H.OUT + '/src/utils/nex/data.js');
  await t('fileKind maps extensions', async () => {
    assert.strictEqual(data.fileKind('a.PDF'), 'PDF'); assert.strictEqual(data.fileKind('b.xlsx'), 'XLSX'); assert.strictEqual(data.fileKind('c.pptx'), 'PPTX');
    assert.strictEqual(data.fileKind('noext'), 'FILE'); assert.strictEqual(data.fileKind('x.weird'), 'WEIRD');
  });
  await t('relativeTime formats', async () => {
    const now = Date.now(); assert.strictEqual(data.relativeTime(now), 'now'); assert.strictEqual(data.relativeTime(now - 5 * 60000), '5m');
    assert.strictEqual(data.relativeTime(now - 3 * 3600000), '3h'); assert.strictEqual(data.relativeTime(now - 2 * 86400000), '2d');
  });

  for (const [s, m] of results) console.log(s, '-', m);
  const failed = results.filter(r => r[0] === 'FAIL').length;
  console.log(`\n${results.length - failed}/${results.length} passed`);
  process.exit(failed ? 1 : 0);
})();
