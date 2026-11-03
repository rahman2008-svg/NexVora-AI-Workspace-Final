# NOTICE — Attribution and license

**NexVora AI Workspace** is a modified version of **AnythingLLM Mobile**
(<https://github.com/Mintplex-Labs/anythingllm-mobile>), created by Mintplex Labs, Inc. and contributors.

- Upstream project: AnythingLLM Mobile — Copyright © Mintplex Labs, Inc. and contributors
- Upstream license: GNU General Public License v3.0 or later (GPL-3.0-or-later)
- This modified version: Copyright © 2026 NexVora Lab's Ofc. Modifications by Prince AR Abdur Rahman.

This program is free software: you can redistribute it and/or modify it under the terms of the GNU General
Public License as published by the Free Software Foundation, either version 3 of the License, or (at your
option) any later version. It is distributed WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. The full license text is in [LICENSE](./LICENSE) and must
stay with every copy you distribute. If you distribute the app (for example as an APK) you must also make the
complete corresponding source code of your version available under the same license.

## Statement of changes (GPL-3.0 §5a)

Modified on 2026-10-31 (Step 1 — branding and package rename):

- Application renamed to "NexVora AI Workspace"; Android application id and Kotlin package changed from
  `com.anythingllm` to `com.nexvora.aiworkspace`; version reset to 1.0.0 (versionCode 1).
- New visual identity: colour theme, launcher icon, adaptive icon, splash screen, in-app wordmarks.
- Firebase Analytics, Firebase Crashlytics and Google Services were removed.
- Upstream-hosted update check, feature-highlight media and Terms/Privacy links were disabled.

Phase 2 (2026-11-01): new Home, Workspaces, Documents, Agents, Model Manager, Search, Chat History, Profile and About
screens; provider API keys moved to the keychain; web search and location lookup made opt-in; upstream search proxy,
promotional links, favicon lookups and update check removed.

Phase 3 (2026-11-01): Bengali locale, history export, document cleanup, offline/skeleton states, stricter backup rules, security and release documentation.

Phase 4 (2026-11-02): ChatGPT sign-in hidden, IP-location lookup removed, keychain data-loss guard, document and model-manager fixes, CI workflows and check scripts, dependency clean-up (`lodash` declared; unused `add`, `yarn` removed).

The names "AnythingLLM" and "Mintplex Labs" belong to their owners. They remain in this repository only to
credit the original authors and where the app talks to a real AnythingLLM Desktop/Server instance
(feature "Connect to AnythingLLM"). They do not indicate endorsement of NexVora AI Workspace.

## Third-party software

This app bundles open-source libraries (React Native, llama.rn / llama.cpp, WatermelonDB, ObjectBox, PDFBox
Android, and others) under their own licenses; see each package's license in `node_modules` and
`yarn.lock` for the complete list.
