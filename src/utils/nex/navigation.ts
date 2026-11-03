import { PATHS } from '@/utils/paths';

/**
 * The drawer navigator is used with a single live route at a time (the sidebar does the same):
 * `reset` guarantees exactly one screen is mounted, so list screens always reload fresh data and
 * only one screen owns the Android back button.
 */
export function resetTo(navigation: { reset: (state: any) => void }, name: string, params?: object) {
  navigation.reset({ index: 0, routes: [{ name, params }] });
}

export function openChat(navigation: { reset: (state: any) => void }, wsSlug: string, threadSlug: string) {
  resetTo(navigation, PATHS.workspace_chat, { wsSlug, threadSlug });
}

/** Bottom navigation destinations (the five most-used sections). */
export const BOTTOM_TABS = [
  { key: 'home', path: PATHS.home },
  { key: 'workspaces', path: PATHS.workspaces },
  { key: 'documents', path: PATHS.documents },
  { key: 'models', path: PATHS.models },
  { key: 'search', path: PATHS.search },
] as const;
export type BottomTabKey = (typeof BOTTOM_TABS)[number]['key'];
