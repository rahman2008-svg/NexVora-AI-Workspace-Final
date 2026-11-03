# BUILD_INSTRUCTIONS — NexVora AI Workspace

> **Status:** no APK has been built by the author — the authoring environment had no network, Gradle or Android SDK. The workflows and commands below are correct for this project's configuration (RN 0.81, Gradle 8.14.3, AGP via RN plugin, compileSdk/targetSdk 36, minSdk 24, NDK 27.1.12297006, Kotlin 2.1.20, JDK 17, Node 20.19.5) but **have never been run.** Expect to fix small problems on the first run (the first full `yarn typecheck` especially).

Target ABI: **arm64-v8a only** (`reactNativeArchitectures=arm64-v8a`). x86 emulators will not run the app; use a real phone or an arm64 emulator image.

## A. GitHub Actions — Debug APK (no secrets needed)
1. Create a GitHub repository and push this source (keep `.gitignore` as is).
2. Repository → **Actions** → **Android Debug APK** → **Run workflow**.
3. Wait (≈ 20–45 min the first time). Download the artifact **NexVora-AI-Workspace-debug-apk** → `app-debug.apk`.
4. What the workflow does: Node from `.nvmrc`, JDK 17, Android SDK + `platforms;android-36`, `build-tools;36.0.0`, `ndk;27.1.12297006`, `cmake;3.22.1`, `yarn install` (HUSKY=0), `cp .env.example .env`, then `./gradlew assembleDebug -PbundleDebug=true`. The `-PbundleDebug=true` property (defined in `android/app/build.gradle`) packs the JavaScript into the debug APK so it runs without Metro.
5. A parallel **checks** job runs translations, `yarn typecheck`, `yarn lint`, `yarn test --ci`; it is `continue-on-error`, so a failing check does not stop the APK — read its log.
6. `yarn.lock` still lists removed Firebase packages and is regenerated in CI. After a first successful run, commit the updated `yarn.lock` from a local `yarn install`.

## B. GitHub Actions — signed Release APK (needs YOUR key)
Nothing is invented by the project: you create the keystore.

```bash
keytool -genkeypair -v -keystore nexvora-upload-key.keystore \
  -alias nexvora-keystore -keyalg RSA -keysize 2048 -validity 10000
base64 -w0 nexvora-upload-key.keystore      # copy the output
```
Add three repository secrets (Settings → Secrets and variables → Actions):
| Secret | Value |
| --- | --- |
| `ANDROID_KEYSTORE_BASE64` | the base64 text above |
| `ANDROID_KEYSTORE_PASSWORD` | the keystore password |
| `ANDROID_KEY_PASSWORD` | the password of alias `nexvora-keystore` |

Then **Actions → Android Release APK → Run workflow**. The alias must be exactly `nexvora-keystore` (hard-wired in `android/app/build.gradle`). The workflow stops with a clear error if a secret is missing, builds `assembleRelease`, verifies the signature with `apksigner`, deletes the keystore and `.env` from the runner, and uploads **NexVora-AI-Workspace-release-apk**.
Back up the keystore offline: if you lose it you cannot update the app under the same signature. Never commit it (`*.keystore` is git-ignored).

## C. Local build on a PC (Android Studio or CLI)
Requirements: Node 20.19.5, JDK 17, Android SDK Platform 36, Build-Tools 36.0.0, NDK 27.1.12297006, CMake 3.22.1, `ANDROID_HOME`, internet for the first `yarn install`.
```bash
corepack enable
HUSKY=0 yarn install
cp .env.example .env
yarn typecheck && yarn lint && yarn test && yarn translations:verify
bash scripts/security-check.sh && node scripts/check-android-config.mjs && node scripts/check-deps.mjs && bash scripts/nex-tests/run.sh
cd android
./gradlew assembleDebug -PbundleDebug=true      # standalone debug APK
# → app/build/outputs/apk/debug/app-debug.apk
adb install -r app/build/outputs/apk/debug/app-debug.apk
```
Release: put the keystore at `android/app/nexvora-upload-key.keystore`, set `APP_RELEASE_STORE_PASSWORD` and `APP_RELEASE_KEY_PASSWORD` in `.env`, then `./gradlew assembleRelease` → `app/build/outputs/apk/release/app-release.apk`. Play Store bundle: `./gradlew bundleRelease`.
Metro workflow (development): `yarn start` + `yarn android` with a phone attached.

## D. Termux (phone) — what is and is not possible
**Not possible/realistic:** building the APK inside Termux (Google's `aapt2`/NDK are not available for Termux's aarch64-Android userland, plus very high RAM use). Use A or B for the APK.
**Possible — source inspection and JS-side checks** (about 1.5 GB free space):
```bash
pkg update && pkg install -y nodejs-lts git python
cd ~/NexVora-AI-Workspace-Final
corepack enable 2>/dev/null || npm i -g yarn
HUSKY=0 yarn install --ignore-scripts      # skips patch-package/llama.rn native downloads
node scripts/translations/verify.mjs
node scripts/check-android-config.mjs
node scripts/check-deps.mjs
bash scripts/security-check.sh
bash scripts/nex-tests/run.sh              # uses node_modules/.bin/tsc after install
yarn typecheck                             # full type check (needs the install above)
yarn lint && yarn test
```
(`--ignore-scripts` skips the `postinstall` that applies patches; `yarn typecheck`/`test` may report errors that depend on those patches — run a normal `yarn install` on a PC for authoritative results.)

## Troubleshooting
- `SDK location not found` → set `ANDROID_HOME` or `android/local.properties` (`sdk.dir=...`).
- Gradle OOM → raise `org.gradle.jvmargs` in `android/gradle.properties`.
- Debug APK shows a red screen → it was built without `-PbundleDebug=true` (needs Metro).
- `Keystore file ... not found` on release → create/restore the keystore at `android/app/nexvora-upload-key.keystore`.
- Cache issues → `yarn start --reset-cache`; `cd android && ./gradlew clean`.
