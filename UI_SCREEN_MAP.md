# UI Screen Map — NexVora AI Workspace (Phase 2)

All screens live in one React Navigation **Drawer** navigator (`App.tsx`). Only one screen is mounted at a time
(`resetTo()` in `src/utils/nex/navigation.ts`, the same technique the original sidebar uses).

```
Drawer (hamburger on every screen) ── section list + workspaces/threads (reused SidebarContent)
Bottom bar (5 tabs): Home · Workspaces · Documents · Models · Search
```

| Route (`PATHS`) | Screen file | Status | Data source (all existing) |
| --- | --- | --- | --- |
| `home` | `src/screens/Nex/Home.tsx` | **New** (replaces old empty-state Home) | WatermelonDB threads/workspaces/documents, `useLLMPreference`, `RNFS.getFSInfo` |
| `workspace_chat` | `src/screens/WorkspaceChat/**` | **Reused**, user bubble restyled | unchanged chat engine |
| `workspaces` | `src/screens/Nex/Workspaces.tsx` | **New** | `Workspace.find/update/delete` |
| `documents` | `src/screens/Nex/Documents.tsx` | **New** | `Document`, `VectorDB`, `DocumentParser`, on-device embedder |
| `agents` | `src/screens/Nex/Agents.tsx` | **New** | `ToolsManager`, `ScheduledJob`, `ScheduledJobRun` |
| `models` | `src/screens/Nex/Models.tsx` | **New** | `useLLMPreference`, `useProviderConfigCache`, `getLLM().availableModels()`, GGUF folder scan |
| `search` | `src/screens/Nex/Search.tsx` | **New** | SQL `LIKE` over `workspace_chats`, thread/workspace/document names |
| `chat_history` | `src/screens/Nex/ChatHistory.tsx` | **New** | `WorkspaceThread`, `WorkspaceChat` |
| `scheduled_jobs` | `src/screens/ScheduledJobs/**` | **Reused** | unchanged |
| `user_settings` | `src/screens/UserSettings/**` | **Reused**, + `web_search` page, promo links removed, telemetry page removed | unchanged |
| `profile` | `src/screens/Nex/Profile.tsx` | **New** | workspaces (remote status), storage, tool/search state |
| `about` | `src/screens/Nex/About.tsx` | **New** | `src/utils/nex/brand.ts`, `react-native-device-info` |
| `workspace_settings`, `connect_to_instance`, onboarding screens, `developer` | existing | **Reused** | unchanged |

## Shared UI kit (`src/components/nex/`)
`tokens.ts` (colours/radii) · `primitives.tsx` (NexCard, NexButton, NexBadge, NexRow, NexChip, NexSearchInput, NexEmptyState, …) ·
`NexScreen.tsx` (header, pull-to-refresh, bottom bar, Android back → Home) · `NexBottomBar.tsx` · `NexDrawerNav.tsx` ·
`NexTextPrompt.tsx` · `NexPickerModal.tsx`.

## Button → action map (Home)
| Control | Action |
| --- | --- |
| New chat | `startNewChat()`: creates a `WorkspaceThread` in the latest workspace and opens it (opens "create workspace" if none) |
| Search bar | opens Search |
| Quick tiles | AI Chat (new chat) · Documents · Agents · Scheduled tasks |
| AI model card | opens Model Manager |
| Recent conversation row | opens that thread |
| Workspace card | opens the workspace's newest thread |
| Create new workspace | existing `NewWorkspaceModal` |
| Gear icon | opens Settings |
