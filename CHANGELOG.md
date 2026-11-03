# Changelog

All notable changes to NexVora AI Workspace. Based on AnythingLLM Mobile (GPL-3.0) by Mintplex Labs.

## 1.0.0 (versionCode 1)

### Phase 4 — hardening and audit
- **Removed** the experimental "Sign in with ChatGPT" option from every picker (code kept, provider flagged `hidden`); standard OpenAI API-key provider unchanged.
- **Removed** the IP-location tool and the `ipapi.co` request completely, plus the automatic location lookup of the empty-chat suggestions.
- Fixed: Android back button now closes the drawer first, then returns Home.
- Fixed: rename dialog keyboard handling on Android.
- Fixed: a transient Android Keystore read failure could have deleted a stored API key when settings were saved again (regression test added).
- Documents: real "text missing" status for documents that cannot be sent to the model; failed imports now clean up partial vectors/processed text.
- Model Manager: RAM-fit warnings per model file, "Unload model" button, instructions for importing GGUF models.
- Declared `lodash` (was imported but undeclared); removed unused `add` and `yarn` packages; removed Firebase leftovers (`AppCheckError`).
- Added GitHub Actions: debug APK (JS bundled) and signed release APK workflows (user-provided secrets only).
- Added runnable checks: `scripts/nex-tests/run.sh`, `scripts/security-check.sh`, `scripts/check-android-config.mjs`, `scripts/check-deps.mjs`.
- Bengali (`bn`) and English strings completed for every new screen.

### Phase 3
- Bengali locale (1,351 keys), conversation export from Chat History, document clean-up, offline banner, loading skeletons, hardened backup rules, replaced >3-button Android alerts with picker sheets.

### Phase 2
- New Home dashboard, bottom navigation + drawer, Workspaces, Documents, AI Agents, Model Manager, Search, Chat History, Profile and About screens.
- Provider API keys moved from AsyncStorage to the Android Keystore-backed keychain (legacy keys migrate on first read).
- Web search off by default (bring your own provider); upstream search proxy and credentials removed; favicon, update-check, promo links removed.

### Phase 1
- Rebrand to NexVora AI Workspace, package `com.nexvora.aiworkspace`, new theme/icon/splash, Firebase Analytics/Crashlytics removed, GPL-3.0 attribution kept (`NOTICE.md`).
