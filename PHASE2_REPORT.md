# NexVora AI Workspace — ধাপ ২ রিপোর্ট (UI Redesign + Feature Integration)

তারিখ: 2026-11-01 · ভার্সন 1.0.0 · ভিত্তি: Phase 1 ZIP (ব্যাকআপ আলাদা রাখা হয়েছে)

> **সবচেয়ে গুরুত্বপূর্ণ কথা:** এই পরিবেশে ইন্টারনেট, `node_modules` ও Android SDK নেই। তাই ধাপ ২-এর কোড **কম্পাইল বা ফোনে চালানো হয়নি।** ধরে নিন প্রথম `yarn typecheck`-এ কিছু ছোট ভুল (যেমন কোনো আইকনের নাম) বের হবে। নিচে ঠিক কোনটা চালানো হয়েছে আর কোনটা বাকি, তা আলাদা করা আছে।

---

## ১. স্ক্রিন অনুযায়ী কাজ

| স্ক্রিন | অবস্থা | কী আছে |
| --- | --- | --- |
| Home Dashboard | **নতুন** | ব্র্যান্ড হেডার, সময়-ভিত্তিক শুভেচ্ছা, সার্চ বার, New Chat, কুইক অ্যাকশন (Chat/Documents/Agents/Tasks), বর্তমান AI মডেল কার্ড, সাম্প্রতিক কনভার্সেশন, ওয়ার্কস্পেস, সাম্প্রতিক ডকুমেন্ট, ব্যবহার ও স্টোরেজ, Create Workspace, Settings |
| নেভিগেশন | **নতুন** | ৫-ট্যাব বটম বার + ড্রয়ারে ১২টি সেকশন (ড্রয়ারের ওয়ার্কস্পেস/থ্রেড তালিকা আগের কোড) |
| AI Chat | **পুনর্ব্যবহার** | স্ট্রিমিং, মার্কডাউন, কোড কপি, রিজেনারেট, স্টপ, অ্যাটাচমেন্ট, ভয়েস, এক্সপোর্ট, মডেল চিপ — সবই আগের কোড। শুধু ইউজার বাবল ব্র্যান্ড গ্র্যাডিয়েন্টে |
| Workspaces | **নতুন** | তালিকা (চ্যাট/ডকুমেন্ট সংখ্যা), তৈরি, রিনেম, ডিলিট (নিশ্চিতকরণ সহ), সেটিংস/ডকুমেন্টে যাওয়া |
| Documents | **নতুন** | সব ওয়ার্কস্পেসের ডকুমেন্ট, সার্চ, ওয়ার্কস্পেস ফিল্টার, ইমপোর্ট, ডিলিট, ফাইল টাইপ ব্যাজ, স্ট্যাটাস |
| AI Agents | **নতুন** | টুল তালিকা (চালু/বন্ধ), সেটআপ-প্রয়োজন ব্যাজ, শিডিউল্ড জব ও সাম্প্রতিক রান |
| Model Manager | **নতুন** | সক্রিয় মডেল, কনফিগার্ড প্রোভাইডার, Test connection, প্রোভাইডার বদল, ডিস্কে থাকা GGUF ফাইল |
| Search | **নতুন** | কনভার্সেশন, মেসেজ টেক্সট, ওয়ার্কস্পেস, ডকুমেন্ট নাম, অ্যাপ সেকশন — সব ডিভাইসেই |
| Chat History | **নতুন** | সব থ্রেড, সার্চ, রিনেম, ডিলিট, চালিয়ে যান |
| Profile | **নতুন** | লোকাল প্রোফাইল, ওভারভিউ, রিমোট সার্ভার স্ট্যাটাস, প্রেফারেন্স, **বাহ্যিক সার্ভিসের তালিকা** |
| About NexVora | **নতুন** | আপনার দেওয়া সব তথ্য ও লিংক, GPL-3.0 ও আপস্ট্রিম ক্রেডিট |
| Settings | **পুনর্ব্যবহার** | + Web search পেজ, About লিংক; টেলিমেট্রি পেজ ও GitHub/Discord প্রচার-লিংক বাদ |

## ২. যা পুনর্ব্যবহার হয়েছে (নতুন করে লেখা হয়নি)
Database/schema (অপরিবর্তিত, কোনো migration নেই), AI provider ক্লাস, llama.rn/GGUF, RAG ও VectorDB, DocumentParser, Kotlin মডিউল, ToolsManager, ScheduledJobs, NewWorkspaceModal, চ্যাট ইঞ্জিন ও সব চ্যাট ফিচার, ModelChip, সেটিংস পেজগুলো, ConnectToInstance।

## ৩. সম্পূর্ণ নতুন ফিচার
UI কিট (`src/components/nex`), ডেটা কোয়েরি লেয়ার (`src/utils/nex/data.ts`), ডকুমেন্ট ইমপোর্ট ইউটিলিটি, কনসোলিডেটেড সার্চ, Model Manager-এর কানেকশন টেস্ট ও ডিস্ক স্ক্যান, Web search সেটিংস, লোকেশন সম্মতি ডায়ালগ, কীচেইন-ভিত্তিক API key স্টোরেজ।

## ৪. প্রাইভেসি ও নিরাপত্তা পরিবর্তন
1. **API key এতদিন প্লেইন-টেক্সটে AsyncStorage-এ ছিল** (Phase 1 README-তে আমি Keychain লিখেছিলাম — সেটি প্রোভাইডার key-এর ক্ষেত্রে ভুল ছিল; ChatGPT টোকেন অবশ্য আগেও Keychain-এ ছিল)। এখন `UIStore`-এর একটি জায়গায় key আলাদা হয়ে Keychain-এ যায়, পুরোনো key প্রথম রিডে স্বয়ংক্রিয়ভাবে মাইগ্রেট হয়।
2. `allowBackup=false` — আগের ব্যাকআপে key/চ্যাট Google Drive-এ যেতে পারত।
3. **হার্ডকোড করা আপস্ট্রিম SearXNG প্রক্সি URL ও গোপন key সম্পূর্ণ মুছে ফেলা হয়েছে।** Web search ডিফল্টে বন্ধ; ব্যবহারকারী নিজের SearXNG অথবা You.com বেছে নেয়; প্রোভাইডার ছাড়া টুলটি মডেলের কাছেই পৌঁছায় না; এক প্রোভাইডার ফেল করলে অন্যটিতে নীরবে যায় না।
4. **লোকেশন:** আগে খালি চ্যাটেই (সম্মতি ছাড়া) আপস্ট্রিমের সার্ভারে IP-লোকেশন যেত। এখন টুল ডিফল্টে বন্ধ, চালুর সময় কোথায় কী যাবে তা জানিয়ে সম্মতি নেয়, আপস্ট্রিম এন্ডপয়েন্ট বাদ (এখন `ipapi.co`), IP সংরক্ষণ করা হয় না।
5. সাইটেশনের favicon Google-এ ডোমেইন পাঠাত — বন্ধ, এখন গ্লোব আইকন।
6. আপডেট-চেক, হাইলাইট ভিডিও, Terms/Privacy, GitHub/Discord লিংক — আপস্ট্রিমমুখী সবকিছু বন্ধ/সরানো।
7. লগে সম্পূর্ণ `llmPreferences` (API key সহ) এবং রিমোট ডিভাইস টোকেন প্রিন্ট হচ্ছিল — ঠিক করা হয়েছে।
8. ChatGPT সাইন-ইন পর্যালোচনা: OpenAI-র প্রকাশিত "Sign in with ChatGPT" ফ্লো (dynamic client, loopback redirect, টোকেন Keychain-এ), UI-তে "Experimental" লেখা আছে, কোনো অননুমোদিত দাবি নেই। **তবে আপনার অ্যাপ এই প্রোগ্রামের শর্তে অনুমোদিত কি না আপনাকে OpenAI-র কাছে নিশ্চিত করতে হবে**; নিশ্চিত না হলে অপশনটি লুকিয়ে ফেলুন।
9. নেটওয়ার্ক কনফিগে সব HTTP (cleartext) অনুমোদিত — LAN-এর Ollama/LM Studio-র জন্য দরকার; সম্ভব হলে HTTPS ব্যবহার করুন।

## ৫. বাহ্যিক সার্ভিসের তালিকা (কোডে যা পাওয়া গেছে)
| সার্ভিস | কখন | কী যায় |
| --- | --- | --- |
| আপনার বেছে নেওয়া AI provider (OpenAI, Anthropic, Gemini, OpenRouter, xAI, DeepSeek, … বা আপনার Ollama/LM Studio) | সেটি সক্রিয় থাকলে | প্রম্পট, (cloud হলে) ডকুমেন্ট/ছবি, API key (হেডারে) |
| huggingface.co, cdn-avatars.huggingface.co | মডেল ব্রাউজ/ডাউনলোডে | মডেল নাম/অনুরোধ |
| আপনার SearXNG অথবা api.you.com | Web search কনফিগার করলে | সার্চ কোয়েরি (+ আপনার key) |
| ipapi.co | লোকেশন টুল চালু করলে | ডিভাইসের পাবলিক IP |
| যেকোনো ওয়েবসাইট | আপনি লিংক শেয়ার/URL জিজ্ঞেস করলে (web scraping, YouTube সহ) | সেই পেজের অনুরোধ |
| auth.openai.com, chatgpt.com | ChatGPT সাইন-ইন ব্যবহার করলে | OAuth ফ্লো |
| আপনার AnythingLLM সার্ভার | রিমোট সংযোগ করলে | চ্যাট/ডেটা সেই সার্ভারে |

## ৬. যা অসম্পূর্ণ (ফিচার হিসেবে দাবি করা হচ্ছে না)
Light theme · চ্যাট স্ক্রিনের পূর্ণ রিডিজাইন (শুধু বাবল + রঙ) · একাধিক "agent profile" (অ্যাপে নেই) · ডকুমেন্টের কনটেন্ট-সার্চ · মডেল ডাউনলোড/রিমুভ Model Manager-এ নয় (বিদ্যমান পিকারে) · নতুন স্ট্রিংয়ের অনুবাদ। বিস্তারিত: `KNOWN_LIMITATIONS.md`।

## ৭. টেস্ট

**এখানে সত্যিই চালানো হয়েছে ✅**
- `node scripts/translations/verify.mjs` — ১৭ ভাষা, সব key মিলেছে (পাস)
- `tsc` সিনট্যাক্স-স্ক্যান (`--noResolve`) — ০টি syntax error। (পূর্ণ টাইপচেক ডিপেন্ডেন্সি ছাড়া অসম্ভব; আউটপুটের বাকি ডায়াগনস্টিক "module নেই" ধরনের)
- ব্যবহৃত প্রতিটি `nex.*` translation key ইংরেজি ডিকশনারিতে আছে কি না — স্ক্রিপ্টে মেলানো
- JSON/XML বৈধতা, `com.anythingllm`/Firebase অবশিষ্ট নেই — grep
- হার্ডকোড করা আপস্ট্রিম key/URL (`anythingLLMPublicSearXNGKey`, `cguicrchal`) কোডে নেই — grep

**আপনাকে চালাতে হবে ⏳ (Android Studio / আসল ফোন)**
- `yarn install && yarn typecheck && yarn lint && yarn test` (নতুন `webSearch/__tests__/config.test.ts` ও পুরোনো টেস্ট; UIStore-এর কীচেইন লজিকের জন্য আলাদা টেস্ট লেখা হয়নি)
- `./gradlew assembleDebug/Release` ও ইনস্টল
- API key সেভ → অ্যাপ রিস্টার্ট → চ্যাট কাজ করে? পুরোনো প্লেইন key মাইগ্রেট হয়? (সবচেয়ে গুরুত্বপূর্ণ রিগ্রেশন-চেক)
- প্রতিটি নতুন স্ক্রিন খুলে প্রতিটি বাটন চাপা; ড্রয়ার ও Android Back
- Home → New Chat → বার্তা পাঠানো; থ্রেড রিনেম/ডিলিট ড্রয়ারে প্রতিফলিত হয় কি না
- Documents ইমপোর্ট (on-device embedder সহ, PDF/DOCX/XLSX/PPTX) ও চ্যাটে RAG উত্তর
- Models: Test connection (OpenAI/Ollama/LM Studio), প্রোভাইডার বদল
- Web search সেটআপ + টেস্ট; লোকেশন সম্মতি + ipapi.co-র আসল রেসপন্স
- স্প্ল্যাশ/আইকন, স্ক্রিন সাইজ ও keyboard আচরণ, TalkBack অ্যাক্সেসিবিলিটি

## ৮. পরিবর্তিত ফাইল
- **নতুন:** `src/screens/Nex/*` (৮টি স্ক্রিন), `src/components/nex/*`, `src/utils/nex/*`, `src/hooks/{useNexData,useCurrentModel}.ts`, `src/utils/secureStorage.ts`, `src/utils/ToolsManager/tools/webSearch/config.ts` (+ `__tests__`), `src/screens/UserSettings/WebSearch/`, `scripts/nex/nex_strings_en.json`, `PHASE2_REPORT.md`, `UI_SCREEN_MAP.md`, `KNOWN_LIMITATIONS.md`
- **মুছে ফেলা:** `src/screens/Home/` (নতুন Home দিয়ে প্রতিস্থাপিত)
- **মূল পরিবর্তন:** `App.tsx`, `src/screens/index.ts`, `src/hooks/useInitialRoute.ts`, `src/utils/paths.ts`, `src/store/UIStore.ts`, `ToolsManager/{index,tools/webSearch,tools/getLocation}`, `WorkspaceDrawer/SidebarContent`, `UserSettings/{index,Main}`, `EmptyList`, `Favicon`, `Messages/User`, `useModelManager`, `AndroidManifest.xml`, ১৭টি `locales/*/common.json`, `README.md`, `NOTICE.md`
- **রঙ-সুইপ (শুধু hex বদল):** প্রায় ৫০টি আরও ফাইল — পুরোনো ধূসর/নীল → NexVora টোকেন
- মোট: ৯০টি পরিবর্তিত, ১২টি নতুন এন্ট্রি, ১টি মুছে ফেলা (Phase 1 ব্যাকআপের তুলনায়)

## ৯. বিল্ড নির্দেশনা
Phase 1-এর `STEP1_REPORT.md` §৮ প্রযোজ্য (Node 20.19.5, JDK 17+, SDK 36, NDK 27.1.12297006)। নতুন কোনো dependency যোগ হয়নি, তাই `yarn.lock` বদলায়নি (Phase 1-এ Firebase সরানোর কারণে `yarn install` একবার চালিয়ে lockfile নতুন করে কমিট করুন)।

## ১০. পরের ধাপ
আপনার অনুমোদন ও বিল্ড-যাচাই ছাড়া ধাপ ৩ শুরু হবে না।
