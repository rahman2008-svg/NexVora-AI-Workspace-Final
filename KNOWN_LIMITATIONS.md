# Known limitations — Phase 2 + Phase 3

## Not verified (no toolchain in the authoring environment)
Nothing in Phase 2 has been compiled or run on a device. See "Tests" in `PHASE2_REPORT.md`. Expect a first
`yarn typecheck` to surface small type/import mistakes (e.g. an icon name) that must be fixed locally.

## Incomplete or intentionally partial
1. **Light theme:** not implemented. The existing theme architecture is dark-only (the original code marks light as TODO). Profile says so.
2. **Chat screen redesign is partial:** user message bubbles use the brand gradient and all colour tokens changed. The prompt bar,
   assistant bubbles, tool cards and action sheets keep their original layout. All chat features (streaming, markdown, code copy,
   regenerate, stop, export, attachments, voice, thread history) are the original, untouched code.
3. **Agents:** the app has one assistant plus tools, not multiple "agent profiles". The Agents screen shows tools, toggles, setup state,
   scheduled jobs and recent runs. Per-tool configuration exists only for Web search and tool auto-approvals.
4. **Documents import** uses the embedded (RAG) pipeline with the on-device embedder, same steps as the chat attachment button.
   With a cloud provider selected, documents are sent whole inside one conversation, so the Documents screen asks you to attach from the chat.
   The pipeline is a small duplicate of `hooks/useAttachments` (that hook is bound to the chat prompt UI) — refactor into one shared module after device testing.
   Progress shows real stages only; the embedder reports no percentage.
5. **Model Manager** lists/tests/switches providers and lists GGUF files on disk. Downloading and removing models still happens in the
   existing model picker (button "Download or remove models"). "Connected" means `availableModels()` succeeded.
6. **Search** is SQL `LIKE` (substring) over chat text; no ranking, no document *content* search (document names only), 40 message results max.
7. **Chat History** computes last activity from the newest 500 messages; older threads fall back to their creation time.
8. **Profile:** there are no user accounts; the profile is a local overview. Server status is a manual check of connected remote workspaces.
9. **Translations:** Bengali (`bn`) and English are complete. The 233 `nex.*` strings of the new screens are still English text in the other 16 locales (key parity passes; translate them).
10. **Dynamic plural forms** are avoided on purpose (translation checker requires per-language plural keys).

## Security / privacy notes
1. **Provider API keys** moved from AsyncStorage (plain SQLite) to the Android keystore-backed keychain via `UIStore` (`src/utils/secureStorage.ts`).
   Old plain-text keys are migrated on first read. If the keystore refuses a write, the key stays where it was so the app keeps working (a console warning is logged, never the key).
   Secrets of providers removed from the saved-config cache are not garbage-collected until "Reset all data".
2. **Android auto-backup disabled** (`allowBackup=false`): earlier builds could back keys/chats up to Google Drive.
3. `network_security_config.xml` still permits **cleartext HTTP** globally. This is needed for self-hosted servers (Ollama/LM Studio on a LAN IP);
   use HTTPS anywhere you can. Android cannot whitelist IP ranges.
4. **Web search** is off by default; user chooses SearXNG (own server) or You.com. You.com without a key uses a keyless tier that is rate limited per IP.
5. **IP location lookup was removed in Phase 4** (no tool, no network request).
6. **ChatGPT sign-in is hidden** (Phase 4). The code remains but is unreachable from the UI.
7. The log audit covered the obvious sites (full preference object and a device token were being logged and were fixed). It is not an exhaustive review of every `console.log` call.
8. `deep link scheme` `anythingllm://` is still registered (needed for Hugging Face "use this model" links and ChatGPT sign-in return). It can clash with the upstream app if both are installed.

## Still present from upstream
1. `ios/` project is untouched (Android only).
2. The ClashDisplay brand font is not bundled (license); the system font is used.
3. Remote-server features talk to a real AnythingLLM Desktop/Server when you connect one — by design.
4. Highlights tour/media, update check, Terms/Privacy links stay disabled until NexVora hosts its own.

## Added in Phase 3
1. Not implemented: chat folders, message editing, document content search, moving a document between workspaces, local database encryption, light theme.
2. Phase 2 menus used Android `Alert` with more than 3 buttons (Android shows at most 3); replaced by picker sheets — device-test them.
3. No APK and no build/test run were possible; see FINAL_TEST_REPORT.md for exactly what was executed.

## Added in Phase 4
1. Nothing was built or run on a device; see FINAL_TEST_REPORT.md (executed vs not executed).
2. GitHub Actions workflows are untested and may need small fixes on the first run.
3. Local GGUF inference, RAG, provider connections and every format parser remain untested on a device; do not assume a given model runs on a given phone.
4. 16 upstream languages still show English for the NexVora screens (only `bn` and `en` are complete).
5. Declared-but-unimported packages that look removable (`react-native-fs` old fork next to `@dr.pogodin/react-native-fs`, etc.) were **not** removed because they may be autolinked native modules; removal needs a device-tested build.
6. Local databases are not encrypted at rest.
