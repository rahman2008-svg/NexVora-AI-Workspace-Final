// Runs the real compiled TypeScript with native/third-party modules replaced by in-memory fakes.
const Module = require('module');
const path = require('path');
const OUT = process.env.NEX_TEST_OUT || '/tmp/nex-test-out';
const keychainStore = new Map();
const asyncStore = new Map();
const calls = { setGeneric: 0, getGeneric: 0 };
let keychainFails = false;
let keychainReadFails = false;
const fakes = {
  'react-native-keychain': {
    ACCESSIBLE: { AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY: 'afutdo' },
    async setGenericPassword(user, pass, opts) { calls.setGeneric++; if (keychainFails) throw new Error('keystore unavailable'); keychainStore.set(opts.service, pass); return { service: opts.service }; },
    async getGenericPassword(opts) { calls.getGeneric++; if (keychainReadFails) throw new Error('read failed'); return keychainStore.has(opts.service) ? { username: 'secret', password: keychainStore.get(opts.service), service: opts.service } : false; },
    async resetGenericPassword(opts) { keychainStore.delete(opts.service); return true; },
    async getAllGenericPasswordServices() { return [...keychainStore.keys()]; },
  },
  'react-native': { NativeEventEmitter: class { constructor(){ this.h={}; } emit(k,v){ (this.h[k]||[]).forEach(f=>f(v)); } addListener(k,f){ (this.h[k]=this.h[k]||[]).push(f); return {remove(){}}; } removeAllListeners(){} }, Appearance: { getColorScheme: () => 'dark' }, Platform: { OS: 'android' } },
  '@react-native-async-storage/async-storage': { default: { async getItem(k){ return asyncStore.has(k)?asyncStore.get(k):null; }, async setItem(k,v){ asyncStore.set(k,v); }, async removeItem(k){ asyncStore.delete(k); }, async multiRemove(ks){ ks.forEach(k=>asyncStore.delete(k)); }, async multiGet(ks){ return ks.map(k=>[k,asyncStore.get(k)??null]); } }, __esModule: true },
  'mobx-persist-store': { makePersistable: async () => {} },
  'mobx': { makeAutoObservable: () => {}, runInAction: (f) => f() },
};
const anyProxy = () => new Proxy(function(){}, { get: (t,k) => k === '__esModule' ? true : k === 'default' ? anyProxy() : anyProxy(), apply: () => anyProxy(), construct: () => anyProxy() });
const origResolve = Module._resolveFilename;
Module._resolveFilename = function (request, parent, ...rest) {
  if (request.startsWith('@/')) return origResolve.call(this, path.join(OUT, 'src', request.slice(2)), parent, ...rest);
  return origResolve.call(this, request, parent, ...rest);
};
const origLoad = Module._load;
const fs = require('fs');
Module._load = function (request, parent, isMain) {
  if (request.startsWith('@/')) {
    const base = path.join(OUT, 'src', request.slice(2));
    if (!fs.existsSync(base + '.js') && !fs.existsSync(path.join(base, 'index.js'))) return anyProxy(); // module not part of this test
  }
  if (fakes[request]) { const f = fakes[request]; return f.__esModule || f.default ? f : f; }
  if (!request.startsWith('.') && !request.startsWith('@/') && !path.isAbsolute(request) && !['fs','path','util','assert'].includes(request)) return anyProxy();
  return origLoad.apply(this, arguments);
};
module.exports = { keychainStore, asyncStore, calls, setKeychainFails: (v) => { keychainFails = v; }, setKeychainReadFails: (v) => { keychainReadFails = v; }, OUT };
