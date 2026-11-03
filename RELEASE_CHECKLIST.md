# RELEASE_CHECKLIST — NexVora AI Workspace 1.0.0

Tick each item on a real device. "Static" items were checked in code only.

## A. Build
- [ ] GitHub Actions *Android Debug APK* run is green and the APK installs
- [ ] GitHub Actions *Android Release APK* run is green with your secrets (`apksigner verify` step passes)
- [ ] `bash scripts/nex-tests/run.sh`, `scripts/security-check.sh`, `node scripts/check-android-config.mjs`, `node scripts/check-deps.mjs` still pass after your changes
- [ ] `yarn install` succeeds; commit regenerated `yarn.lock`
- [ ] `yarn typecheck` clean · `yarn lint` clean · `yarn test` green · `yarn translations:verify` green (static: passes)
- [ ] `./gradlew assembleRelease` succeeds; APK installs; `adb shell pm list packages | grep com.nexvora.aiworkspace`
- [ ] Signed with your own keystore; keystore backed up offline

## B. Security-critical regression checks
- [ ] Save a provider API key → force-stop → reopen → chat with that provider works
- [ ] Upgrade path: install a build that stored a plain-text key, then this build → key still works and is no longer in app storage
- [ ] Web search is OFF on a fresh install; setting it up then toggling the tool works; removing the settings turns it off
- [ ] No location tool anywhere in Agents/tool menus; no network call to any IP-lookup service
- [ ] "Sign in with ChatGPT" does not appear in any provider list
- [ ] `adb logcat` while chatting shows no API key or device token
- [ ] `adb backup`/cloud backup produce no app data

## C. Functional smoke tests
- [ ] Onboarding → Home dashboard; every Home button works
- [ ] New chat, streaming reply, stop, retry, copy code, export
- [ ] Workspaces: create, rename, delete (drawer updates)
- [ ] Documents: import PDF, DOCX, XLSX, PPTX, TXT, CSV with an on-device model; chat answers cite them; delete; "Clean up"
- [ ] Models: Test connection (OpenAI-compatible / Ollama / LM Studio); switch provider; local model list matches disk
- [ ] Search finds a message, a thread, a workspace, a document
- [ ] Chat History: rename, delete, export (Markdown/PDF/TXT/JSON)
- [ ] Scheduled job runs in the background; failure shows an error; battery-optimisation hint shown
- [ ] Share-sheet import (file/image/link); file picker; camera; microphone; notifications permission prompts appear only on use
- [ ] Remote AnythingLLM connection (if you keep this feature)

## D. Android experience
- [ ] Android 12+ splash (icon on #090B14) and pre-12 splash (logo on #090B14)
- [ ] Launcher icon: adaptive, round mask, themed (monochrome) on Android 13+
- [ ] Back button: Home exits; other screens go Home; modals close; settings sub-pages go back one level
- [ ] Keyboard does not cover inputs (Search, rename dialog, Web search settings, chat prompt)
- [ ] TalkBack reads buttons (labels set on main controls)
- [ ] Rotation, split-screen, low-memory behaviour with a large GGUF

## E. Localization
- [ ] Switch to Bengali: all screens readable, no clipped text, Bengali digits/numbers acceptable; check Model Manager, Documents, Search, About, Web search settings
- [ ] Switch to English
- [ ] Other 16 languages: new NexVora screens still show English text (known, see KNOWN_LIMITATIONS)

## F. Legal and store
- [ ] LICENSE (GPL-3.0) and NOTICE.md ship with the source; source offer works (About › License)
- [ ] Privacy policy URL created and added (Settings > Legal section stays hidden until you do)
- [ ] Store listing states: on-device by default, optional cloud providers, no analytics
- [ ] Remove or keep `anythingllm://` deep link (clashes if the upstream app is installed)
