# NexVora AI Workspace — ধাপ ১ রিপোর্ট (Branding + Package Rename)

তারিখ: 2026-10-31 · ভার্সন: 1.0.0 (versionCode 1) · Application ID: `com.nexvora.aiworkspace`

> **গুরুত্বপূর্ণ:** এই পরিবেশে ইন্টারনেট, `node_modules`, Android SDK বা yarn ছিল না। তাই **Android build, পূর্ণ TypeScript টাইপচেক, ESLint, Jest ও অ্যাপ চালিয়ে দেখা — কিছুই করা যায়নি।** নিচে স্পষ্ট লেখা আছে কোনটা সত্যিই চালানো হয়েছে আর কোনটা আপনাকে নিজের পিসিতে চালাতে হবে।

---

## ১. কী কী করা হয়েছে

| # | কাজ | অবস্থা |
|---|-----|--------|
| 1 | অ্যাপের নাম → NexVora AI Workspace (`strings.xml`, `app.json`, নোটিফিকেশন চ্যানেল, এক্সপোর্ট/PDF/DOCX/PPTX মেটাডাটা, AI system prompt) | কোডে করা হয়েছে |
| 2 | Application ID ও namespace → `com.nexvora.aiworkspace` | কোডে করা হয়েছে |
| 3 | ভার্সন 1.0.0, versionCode 1 (`package.json`, `.version`, `build.gradle`, changelog) | কোডে করা হয়েছে |
| 4 | থিম: Cyan #22D3EE, Violet #8B5CF6, Background #090B14, Surface #141827, Text #F8FAFC (`global.css`, `theme.ts`, Android colors) | কোডে করা হয়েছে |
| 5 | নতুন আইকন, adaptive icon (background/foreground/monochrome), splash, ইন-অ্যাপ লোগো | তৈরি করে ছবি দেখে যাচাই করা হয়েছে (ডিভাইসে দেখা হয়নি) |
| 6 | ১৩টি Kotlin মডিউল `com/anythingllm` → `com/nexvora/aiworkspace`, সব `package`/`import`, Manifest, XML, ProGuard, Fastlane | করা হয়েছে ও স্ক্রিপ্ট দিয়ে মিলিয়ে দেখা হয়েছে |
| 7 | `anythingllm` নামের ব্যবহার একে একে বিচার করা (নিচে ৩ নম্বর) | করা হয়েছে |
| 8 | Firebase Analytics + Crashlytics + Google Services সম্পূর্ণ সরানো | করা হয়েছে |
| 9 | GPL-3.0 `LICENSE` অক্ষত, `NOTICE.md` যোগ (আসল লেখক + পরিবর্তনের বিবরণ) | করা হয়েছে |

## ২. Firebase যেভাবে সরানো হয়েছে

- `package.json` থেকে `@react-native-firebase/{app,analytics,crashlytics}` বাদ
- `android/build.gradle`: `google-services` ও `firebase-crashlytics-gradle` classpath বাদ
- `android/app/build.gradle`: দুটি `apply plugin` বাদ
- মুছে ফেলা: `android/app/google-services.json`, `firebase.json`
- Manifest থেকে `AD_ID` permission বাদ
- `src/utils/Telemetry/index.ts`: আগের API (`logEvent`, `recordError`, `trackNativeModelLoad`, `CUSTOM_EVENTS`) রেখে **শুধু লোকাল কনসোল লগ** করে এমন স্টাব — ফলে ৩৬টি কল-সাইট বদলাতে হয়নি। কিছুই বাইরে যায় না।
- "Anonymous telemetry" সেটিংস স্ক্রিন ও তার মেনু এন্ট্রি মুছে ফেলা; `ErrorBoundary` থেকে আপস্ট্রিমের GitHub-রিপোর্ট বাটন বাদ (এখন শুধু কপি করার মতো error details দেখায়)
- ১৭টি ভাষা থেকে টেলিমেট্রি-সংক্রান্ত অব্যবহৃত স্ট্রিং মুছে ফেলা
- `index.js` ও `.env.example` থেকে Firebase/AppCheck অংশ বাদ

## ৩. "anythingllm" ব্যবহারের সিদ্ধান্ত (অন্ধভাবে বদলানো হয়নি)

**বদলানো হয়েছে (ব্র্যান্ড / ইউজার-ফেসিং):** অ্যাপ নাম, UI স্ট্রিং (১৭ ভাষা), নোটিফিকেশন চ্যানেলের নাম, system prompt, এক্সপোর্ট ফুটার, PDF/DOCX/PPTX লোগো ও মেটাডাটা, OpenRouter `X-Title`, ChatGPT sign-in-এ অ্যাপের নাম, Keychain service নাম, WorkManager নাম, Kotlin কম্পোনেন্ট নাম (`NexVoraQuickContext`, `NexVoraAssistant`), signing keystore নাম।

**ইচ্ছা করে রাখা হয়েছে:**

| কী | কেন রাখা |
|----|----------|
| `anythingllm://` deep-link scheme (Manifest, `DeepLinks`, `LoopbackAuthModule`) | Hugging Face-এর "Use this model" লিংক এই স্কিম ব্যবহার করে; ChatGPT সাইন-ইনের return URL-ও এটা। বদলালে ফিচার ভাঙবে। ধাপ ২-এ `nexvora://` সহ দুটোই সমর্থন করা যায় |
| WatermelonDB `dbName: 'anythingllm'`, `UIStore` কী (`anythingllm_external_connections` ইত্যাদি) | অভ্যন্তরীণ identifier; বদলালে লাভ নেই, ঝুঁকি আছে |
| `AnythingLLMExternal` ক্লাস, HTTP হেডার `x-anythingllm-mobile-device-token` | আসল AnythingLLM Desktop/Server-এর সাথে যোগাযোগের প্রোটোকল |
| "Connect to AnythingLLM" স্ক্রিনের লেখা, `AnythingLLM Desktop/Server` | বাস্তব এক্সটার্নাল প্রোডাক্টের উল্লেখ |
| `ModelOrigin.ANYTHINGLLM`, `theme.colors.anythingllm` | অভ্যন্তরীণ enum/কী |
| কোডের মন্তব্যে "Port of ... from AnythingLLM core" | আসল লেখকের কৃতিত্ব |

## ৪. আপস্ট্রিম সার্ভারে যা এখনো যায় (ধাপ ২-এ আপনার সিদ্ধান্ত লাগবে)

**বন্ধ করা হয়েছে:** আপডেট-চেক (`cdn.anythingllm.com` — আপনার ইউজারদের আপস্ট্রিম অ্যাপে পাঠাত), Highlights ভিডিও (`webassets.anythingllm.com`), Terms/Privacy লিংক (আপস্ট্রিমের পলিসি)।

**এখনো সক্রিয় (সতর্কতা):**
1. **Web Search টুলের ডিফল্ট** `src/utils/ToolsManager/tools/webSearch/index.ts`-এ Mintplex-এর SearXNG প্রক্সি URL ও **হার্ডকোড করা একটি কী** আছে (আপস্ট্রিমেই ছিল)। এটা তাদের সার্ভিস; আপনার অ্যাপ থেকে ব্যবহার করা ঠিক নয়। সুপারিশ: ডিফল্ট বন্ধ করে ইউজার নিজের SearXNG/সার্চ কী দেবে।
2. **Get Location টুল** `geojson.anythingllm.com`-এ IP-লোকেশন চায়।
3. **ChatGPT সাইন-ইন** OpenAI-এর `dynamic_agent_client` ফ্লো ব্যবহার করে; আপনার অ্যাপের জন্য এটা অনুমোদিত কি না যাচাই করুন।

## ৫. পরিবর্তিত / নতুন / মুছে ফেলা ফাইল

মোট ৯১টি ফাইল পরিবর্তিত (১৭টি `src/locales/*/common.json` সহ), এছাড়া মুভ/নতুন/মুছে ফেলা নিচে।

**মুভ + আপডেট:** `android/app/src/main/java/com/anythingllm/**` → `android/app/src/main/java/com/nexvora/aiworkspace/**` (সব `.kt`)

**নতুন:** `NOTICE.md`, `STEP1_REPORT.md`, `scripts/brand/generate-brand-assets.py`, `android/app/src/main/res/drawable/splash_background.xml`, `android/app/src/main/res/drawable-nodpi/splash_logo.png`, `android/app/src/main/res/values-v31/styles.xml`, `images/nexvora-icon-512.png`, `src/assets/logo/nexvora{,-dark,-icon,-infinity}.png`

**মুছে ফেলা:** `android/app/google-services.json`, `firebase.json`, `src/screens/UserSettings/AnonymousTelemetry/`, `src/assets/logo/anything-llm*.png`, `.github/workflows/cla.yml`, `CLA.md` (আপস্ট্রিমের contributor চুক্তি — আপনার ফর্কে প্রযোজ্য নয়)

**পরিবর্তিত (লোকেল বাদে):**
- রুট: `.env.example`, `.version`, `DEVELOPMENT.md`, `README.md`, `app.json`, `env.d.ts`, `global.css`, `index.js`, `package.json`
- Android: `app/build.gradle`, `build.gradle`, `settings.gradle`, `app/proguard-rules.pro`, `AndroidManifest.xml`, `res/values/{colors,strings,styles}.xml`, `res/xml/assistant_interaction_service.xml`, `fastlane/Fastfile`, ২০টি `mipmap-*/ic_launcher*.png`
- scripts: `buildAndroidRelease.js`, `translations/brandWords.json`
- src: `assistant/index.ts`, `components/ErrorBoundary`, `components/TopBar`, `quickContext/QuickContextApp.tsx`, `screens/Onboarding/{Welcome,DataHandling}`, `screens/UserSettings/{index,Main/index,Main/ApkVersion}`, `utils/{theme,paths,highlights,changelog,calendar}.ts`, `utils/Telemetry`, `utils/AiProviders/OpenRouterProvider`, `utils/PushNotifications`, `utils/ScheduledJobs/runner.ts`, `utils/chat/export/*`, `utils/chatgpt/{auth,__tests__/auth.test}.ts`, `utils/documents/{pdf,ooxml,logoLight}.ts` ও `docx/`, `pptx/`, `utils/models/defaults.ts`

## ৬. Package rename verification checklist

**এখানে সত্যিই চালানো হয়েছে ✅**

- [x] `com.anythingllm` সার্চ: Kotlin/Gradle/XML/ProGuard/Fastlane-এ ০টি অবশিষ্ট (শুধু `anythingllm://` scheme ইচ্ছা করে)
- [x] স্ক্রিপ্টে প্রতিটি `.kt`-এর `package` ডিরেক্টরির সাথে মিলিয়ে দেখা: সব মিলেছে (শুধু `vectordb/` ফোল্ডারের `package ...vector` আপস্ট্রিমেও এমন ছিল এবং `MainApplication`-এর import-এর সাথে সামঞ্জস্যপূর্ণ)
- [x] `xmllint` দিয়ে সব Manifest/resource XML বৈধ
- [x] `package.json`, `app.json`, locale JSON বৈধ
- [x] `node scripts/translations/verify.mjs` পাস (১৭ ভাষায় key মিলেছে, কোডে ব্যবহৃত সব key আছে)
- [x] `tsc` দিয়ে **শুধু সিনট্যাক্স** স্ক্যান (`--noResolve`): ০টি syntax error। (পূর্ণ টাইপচেক সম্ভব ছিল না, ডিপেন্ডেন্সি নেই — আউটপুটের ~২৬০০ ডায়াগনস্টিক সবই "module পাওয়া যায়নি" ধরনের)
- [x] আইকন ও ওয়ার্ডমার্ক ছবি দেখে যাচাই

**আপনাকে চালাতে হবে ⏳ (আমি করতে পারিনি)**

- [ ] `yarn install` সফল হয় (llama.rn নেটিভ ফাইল ডাউনলোড সহ)
- [ ] `yarn typecheck` — নতুন কোনো error নেই
- [ ] `yarn lint`, `yarn test` (বিশেষ করে `auth.test.ts` ও `parseDeepLink.test.ts`)
- [ ] `./gradlew assembleDebug` / `assembleRelease` সফল
- [ ] অ্যাপ ইনস্টল হয়ে চালু হয়; `adb shell pm list packages | grep nexvora`
- [ ] স্প্ল্যাশ (Android 12+ ও পুরোনো), launcher আইকন (round/adaptive/themed) ঠিক দেখায়
- [ ] চ্যাট, ওয়ার্কস্পেস তৈরি, ডকুমেন্ট ইমপোর্ট + RAG, লোকাল GGUF লোড, প্রোভাইডার সংযোগ — আগের মতো চলে
- [ ] Share-sheet, "Ask with NexVora AI Workspace" টেক্সট-সিলেকশন, ডিজিটাল অ্যাসিস্ট্যান্ট ওভারলে, ব্যাকগ্রাউন্ড জব (Kotlin মডিউল সরানো হয়েছে, এগুলো বিশেষভাবে দেখুন)
- [ ] Hugging Face `anythingllm://pull-hf?...` লিংক এখনো অ্যাপ খোলে

## ৭. সম্ভাব্য সমস্যা ও জানা সীমাবদ্ধতা

1. **`yarn.lock` পুরোনো।** এতে Firebase এন্ট্রি আছে। `yarn install` চালালে নিজে ঠিক করে নেবে। CI-তে `--immutable` দিলে ব্যর্থ হবে; তখন আগে লোকালি `yarn install` করে নতুন `yarn.lock` কমিট করুন।
2. **`ios/` ফোল্ডার অপরিবর্তিত** (নাম AnythingLLM, Firebase pod সহ)। ধাপ ১ শুধু Android। iOS বিল্ড করবেন না বা ফোল্ডারটি সরিয়ে দিন।
3. **নতুন Application ID = সম্পূর্ণ নতুন অ্যাপ।** আপস্ট্রিম অ্যাপের ডেটা/Keychain/মডেল আসবে না; পাশাপাশি দুটো ইনস্টল থাকতে পারে (তবে `anythingllm://` scheme-এ chooser আসবে)।
4. **Release signing:** `nexvora-upload-key.keystore` (alias `nexvora-keystore`) আপনাকে নিজে বানাতে হবে এবং `.env`-এ পাসওয়ার্ড দিতে হবে। কোনো কী/পাসওয়ার্ড প্রজেক্টে দেওয়া হয়নি।
5. **ABI শুধু `arm64-v8a`** (আপস্ট্রিমের কনফিগ)। x86 এমুলেটরে চলবে না; বাস্তব ফোন বা arm64 এমুলেটর লাগবে।
6. **ফন্ট:** আপস্ট্রিমের ব্র্যান্ড ফন্ট `ClashDisplay-Medium.ttf` লাইসেন্সের কারণে রিপোতে নেই; `yarn start/android` সতর্কবার্তা দেখাবে এবং সিস্টেম ফন্ট ব্যবহার হবে। ধাপ ২-এ নিজেদের ফন্ট ঠিক করব।
7. **হার্ডকোড রঙ:** থিম টোকেন (`global.css` ভেরিয়েবল + `theme.ts`) বদলানো হয়েছে, তাই বেশিরভাগ UI নতুন রঙ পাবে। কিন্তু কিছু জায়গায় সরাসরি `#000`, `#131314`, `#1B1B1E`, `bg-black` ইত্যাদি লেখা (প্রায় ৩০+টি); সেগুলো ধাপ ২-এর UI রিডিজাইনে ঠিক হবে। অর্থাৎ **ধাপ ১ শেষে UI আংশিক নতুন রঙে দেখাবে।**
8. **আইকনের ডিজাইন** আমার তৈরি সাধারণ "N + নোড-ডট" গ্রাডিয়েন্ট মার্ক; টেক্সটে DejaVu Sans ব্যবহার হয়েছে। চূড়ান্ত লোগো থাকলে `scripts/brand/generate-brand-assets.py` সম্পাদনা করে পুনরায় চালান।
9. **দীর্ঘ লেবেল:** "Ask with NexVora AI Workspace" টেক্সট-সিলেকশন মেনুতে লম্বা লাগতে পারে; ডিভাইসে দেখে ছোট করা যাবে।
10. **Android 12+ স্প্ল্যাশ** সিস্টেমের স্প্ল্যাশ API ব্যবহার করে (লঞ্চার আইকন + #090B14); পুরোনো ভার্সনে `splash_background.xml` (রঙ + লোগো)। `values-v31/styles.xml`-এ `AppTheme` কপি আছে — `values/styles.xml` বদলালে দুটো মিলিয়ে রাখুন।
11. `README.md`-তে পুরোনো আপস্ট্রিম ডেমো ভিডিও/ব্যাজ সরানো হয়েছে; ধাপ ২-এর পর স্ক্রিনশট যোগ করুন।

## ৮. বিল্ড নির্দেশনা

### ক) Android Studio / PC (সুপারিশকৃত)

প্রয়োজন: Node `20.19.5` (`.nvmrc`), Yarn (Corepack), JDK 17+, Android SDK Platform 36, Build-Tools 36.0.0, NDK `27.1.12297006`, `ANDROID_HOME` সেট করা।

```bash
unzip NexVora-AI-Workspace-Step-1.zip && cd NexVora-AI-Workspace
corepack enable
yarn install                      # llama.rn-এর নেটিভ লাইব্রেরি ডাউনলোড হবে, ইন্টারনেট লাগবে
cp .env.example .env
yarn typecheck && yarn lint && yarn test && yarn translations:verify

# ডিবাগ (Metro লাগে): ফোন USB-তে যুক্ত করে
yarn start                        # টার্মিনাল ১
yarn android                      # টার্মিনাল ২
# অথবা শুধু APK:
cd android && ./gradlew assembleDebug
# → android/app/build/outputs/apk/debug/app-debug.apk
```

**স্বতন্ত্র (Metro ছাড়া) রিলিজ APK:**

```bash
keytool -genkeypair -v -keystore android/app/nexvora-upload-key.keystore \
  -alias nexvora-keystore -keyalg RSA -keysize 2048 -validity 10000
# .env-এ APP_RELEASE_STORE_PASSWORD ও APP_RELEASE_KEY_PASSWORD দিন
cd android && ./gradlew assembleRelease
# → android/app/build/outputs/apk/release/app-release.apk
```

Android Studio-তে `android/` ফোল্ডারটি Open করে Gradle Sync চালালেও হবে।

### খ) Termux (ফোনে) — সত্যিকারের সীমাবদ্ধতা

Termux-এ **পূর্ণ APK বিল্ড বাস্তবে খুবই কঠিন**: Google-এর `aapt2`/NDK x86-64 Linux-এর জন্য, Termux aarch64 — অনানুষ্ঠানিক প্যাচ লাগে; llama.rn নেটিভ + 4GB Gradle মেমরি ফোনে প্রায় অসম্ভব। বাস্তবসম্মত পথ: **Termux-এ কোড যাচাই, APK বানানো PC/Android Studio বা GitHub Actions-এ।**

```bash
pkg update && pkg install nodejs-lts git openjdk-17 -y
cd ~/NexVora-AI-Workspace
corepack enable || npm i -g yarn
yarn install --ignore-scripts          # llama.rn ডাউনলোড বাদ; শুধু JS যাচাইয়ের জন্য
yarn typecheck
yarn lint
yarn test
yarn translations:verify
```

APK ফাইল ফোনে ইনস্টল করতে PC-তে বানানো `app-release.apk` ফোনে কপি করে "Install unknown apps" অনুমতি দিন।

### গ) GitHub Actions (PC ছাড়া বিকল্প)
রিপো GitHub-এ পুশ করে `ubuntu-latest` + `actions/setup-java@v4 (17)` + `android-actions/setup-android` দিয়ে `./gradlew assembleRelease` চালানো যায়; keystore ও পাসওয়ার্ড অবশ্যই GitHub Secrets-এ রাখুন।

---

## ৯. পরবর্তী ধাপ (আপনার অনুমোদন ও বিল্ড যাচাইয়ের আগে শুরু হবে না)

ধাপ ২: নেভিগেশন ও Home Dashboard, তারপর Documents/Agents/Model Manager/Search/Profile/About স্ক্রিন, হার্ডকোড রঙ ঠিক করা, এবং ৪ নম্বর অংশের আপস্ট্রিম-সার্ভার সিদ্ধান্ত।
