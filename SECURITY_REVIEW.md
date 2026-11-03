# SECURITY_REVIEW — NexVora AI Workspace 1.0.0 (Phase 4)

Scope: code review of the repository as delivered. **No dynamic testing, no device, no build** was possible in the authoring environment.
Legend: ✅ implemented & checked by code review/static scan · 🟡 implemented, not tested on a device · ⛔ not done / known gap · 🌐 needs an external service · 📱 needs a real device to verify

## 1. Credentials
| Item | Status | Notes |
| --- | --- | --- |
| Provider API keys stored in Android Keystore-backed keychain (`src/utils/secureStorage.ts`, wired in `UIStore`) | 🟡 📱 | Keys never written to AsyncStorage. Old plain-text keys migrate on first read. Must be tested: save key → restart → chat works. |
| Keychain write failure fallback | ✅ (by review) | If the keystore refuses a write, the key stays in the old location so the app keeps working; a warning with the secret *name* only is logged. This is a deliberate availability-over-secrecy trade-off. |
| Web search token | 🟡 | Stored in keychain (`webSearch.apiKey`). |
| ChatGPT sign-in tokens | ✅ (pre-existing) | Keychain, `AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY`. |
| Hard-coded credentials | ✅ | Upstream SearXNG proxy URL and key removed (grep clean). No keys in `.env.example`. |
| Orphaned secrets | ⛔ | Secrets of a provider removed from the saved-config cache stay in the keychain until "Reset". |
| Transient keystore read failure must not delete a key | ✅ **executed test** (Phase 4 fix + regression test, mutation-checked) | `secureStorage.ts` refuses to delete a secret whose last read failed. |
| Key handling logic executed under Node with fakes | ✅ 16/16 (`bash scripts/nex-tests/run.sh`) | Fakes, not a real Keystore — device test still required. |

## 2. Logging
✅ The complete `llmPreferences` object (contained the API key) and the remote device token were being logged — both fixed.
⛔ Not an exhaustive audit of every `console.*` call (≈ hundreds). Errors thrown by third-party SDKs may contain request details; do not share raw logcat output.

## 3. Backup and local data
| Item | Status |
| --- | --- |
| `android:allowBackup="false"` | ✅ |
| `data_extraction_rules.xml` (Android 12+) and `backup_rules.xml` (≤ 11) exclude root/file/database/sharedpref/external | ✅ (XML validated) 📱 |
| Local databases (WatermelonDB/SQLite, ObjectBox vectors, AsyncStorage, processed document text) | ⛔ **not encrypted at rest.** They live in the app sandbox (other apps cannot read them on a non-rooted device) but are readable on a rooted device, via `adb` on a debuggable build, or from a device backup made by tools that ignore the flags. Encrypting them would need SQLCipher/ObjectBox encryption — a larger change not made here. |
| Chats/documents sent to cloud providers | 🌐 | Leave the device when a cloud provider is selected. |

## 4. Network (see PHASE3_REPORT §External services)
| Item | Status |
| --- | --- |
| Upstream update check, highlight media, Terms/Privacy, GitHub/Discord links | ✅ removed/disabled |
| Citation favicons (Google favicon service) | ✅ removed |
| Web search | ✅ off by default; only the user's chosen provider; no silent fallback |
| IP location | ✅ **removed entirely (Phase 4)**: no `ipapi.co`, no location tool, no automatic lookup; security grep enforces it |
| `usesCleartextTraffic` / network security config permits HTTP globally | ⛔ required for LAN servers (Ollama/LM Studio); Android cannot whitelist IP ranges. Prefer HTTPS. |
| TLS pinning | ⛔ none |
| Deep-link scheme `anythingllm://` still registered | 🟡 — needed for Hugging Face "use this model" links and the ChatGPT sign-in return. Any app can send this intent to us: `parseDeepLink` handles it (pre-existing tests); review before release. |

## 5. Permissions (manifest)
INTERNET, ACCESS_NETWORK_STATE (no prompt) · CAMERA, RECORD_AUDIO, READ/WRITE_CALENDAR, POST_NOTIFICATIONS (runtime prompts requested only when the feature is used — checked by code search for the request calls) · SET_ALARM, VIBRATE (normal). **No location permission** is declared; "location" is an IP-based lookup that needs explicit consent. 📱 verify prompts appear only on use.

## 6. Third-party flows
- **ChatGPT sign-in**: **hidden in Phase 4** (provider flagged `hidden`; not offered anywhere in the UI). Code remains for a future authorized use. Standard OpenAI API-key provider is unaffected.
- **Remote AnythingLLM server**: user-initiated; uses a device token stored in app storage.

## 7. Recommendations before public release
1. Device-test the keychain migration (§1) — highest risk.
2. Decide on encrypting the local database (§3) or document the limitation in the store listing.
3. (done) location lookup removed.
4. Add a privacy policy URL and put it in `PATHS`/Settings > Legal (the section is hidden while empty).
5. Run a dependency vulnerability scan (`yarn audit`) — not possible offline.

## 8. Phase 4 checks (executed)
`bash scripts/security-check.sh` — all pass: no Firebase/Crashlytics, no ipapi/IP geolocation, no upstream search proxy/key, no upstream CDN/update endpoints, no Google favicon service, no key-like string literals, no logging of apiKey/token values, no old package name, `allowBackup` not true, no location permission, no AD_ID.
**Not claimed:** database encryption (none exists), certificate pinning, dependency vulnerability scan (needs network), penetration testing, device-level verification of any item.
