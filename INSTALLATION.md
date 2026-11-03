# INSTALLATION & USER GUIDE — NexVora AI Workspace

> No ready-made APK is shipped in this repository. Build one with GitHub Actions (easiest, no PC needed beyond a browser) or locally — see [BUILD_INSTRUCTIONS.md](./BUILD_INSTRUCTIONS.md).

## 1. Install on your phone
1. Get `app-debug.apk` (testing) or your signed `app-release.apk` from the build workflow's artifacts.
2. Copy it to the phone, open it, allow "Install unknown apps" for your file manager/browser when asked.
3. Needs a 64-bit ARM Android phone (arm64-v8a), Android 7.0+ (minSdk 24); 6 GB RAM recommended for local models.

## 2. Two different ways to use AI — know the difference
| | **Online (cloud) provider** | **Local (on-device) model** |
| --- | --- | --- |
| Examples | OpenAI, Anthropic, Google Gemini, OpenRouter, or your own Ollama / LM Studio / OpenAI-compatible server | A GGUF file running inside the app (llama.cpp via llama.rn) |
| Needs internet | Yes (a LAN server needs your network) | No, after the model file is on the phone |
| Needs an account / API key | **Yes** (except a server you run yourself) | **No** |
| Your messages leave the phone | **Yes — to that provider** | **No** |
| Cost | The provider's pricing | Free, uses phone battery/RAM |
| Quality / speed | Usually best | Depends on the model and phone; small models are limited |

No provider is pre-configured and **no API key ships with the app.** Cloud providers only work with credentials you enter; this project has not tested any provider with real credentials.

## 3. Connect an online provider
1. Open **Model Manager** (bottom bar) → **Connect or change provider**.
2. Pick a provider, paste your API key (and base URL for Ollama/LM Studio/OpenAI-compatible), choose a model.
3. Back in Model Manager press **Test connection** — it succeeds only if the server really answers.
4. Your key is stored in the Android Keystore-backed keychain, not in plain app storage. Never share screenshots of the key field.

## 4. Use a local GGUF model
1. Model Manager → **Download or remove models**.
2. Choose a suggested model, or **Add a model from Hugging Face** and paste a repo link / id, then pick a `.gguf` file. Smaller quantizations (Q4) suit phones. Gated/private repos are not supported.
3. **The app never downloads a model without your confirmation.** Large files are big — use Wi-Fi.
4. Model Manager shows files actually on disk, a RAM-fit warning ("may not fit" / "too large"), and **Unload model** to free memory.
5. Not every GGUF model runs on every phone. If loading fails, the app shows the error — try a smaller model.

## 5. Documents (RAG)
- Supported by the built-in parsers: PDF, Word (.docx), PowerPoint (.pptx), spreadsheets, TXT/CSV (runtime behaviour of each format is not yet device-tested).
- **Local model selected:** Documents → **+** → pick a workspace → the file is read, split and indexed on your phone. Progress shows real stages (reading / indexing / saving). Then chat in that workspace; answers use retrieved passages (see citations).
- **Cloud provider selected:** attach the file inside a chat (paperclip). The whole document is sent to that provider with the conversation — only do this if you accept that.
- A document marked **Text missing** cannot be sent to the model: delete it and import again. **Clean up** removes leftover processed files.

## 6. Workspaces, chats, search
- A workspace keeps its own chats, documents and instructions (workspace settings → system prompt, temperature, context length).
- Chat History: rename, delete, export (Markdown / PDF / TXT / JSON). Search looks through your saved messages, workspaces and document file names — on the phone only.

## 7. Web search (optional)
Off by default. Settings → **Web search** → choose your own SearXNG server or You.com; queries go only to that provider. Then switch the tool on in **AI Agents**.

## 8. Privacy summary
No analytics, no crash-reporting SDK, no NexVora servers, Android backup disabled. **Local data is not encrypted at rest** (it is in the app's private storage). Profile → *Privacy: external services* lists everything the app can contact.

## 9. Language
Settings → Language: **English** and **বাংলা (Bengali)** are fully translated. Other languages show English for the new NexVora screens.

## 10. About
Developer: Prince AR Abdur Rahman · Company: NexVora Lab's Ofc · WhatsApp 01707424006 / 01796951709 · Facebook https://www.facebook.com/share/1BNn32qoJo/ · Instagram https://www.instagram.com/ur___abdur____rahman__ · prince.ar.abdur.rahman2008@gmail.com
Based on AnythingLLM Mobile by Mintplex Labs (GPL-3.0); not made or endorsed by the original authors. See `LICENSE` and `NOTICE.md`.
