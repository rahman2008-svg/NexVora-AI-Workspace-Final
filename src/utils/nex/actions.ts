import { NativeEventEmitter } from 'react-native';
import Workspace from '@/database/models/Workspace';
import WorkspaceThread from '@/database/models/WorkspaceThread';
import { openChat } from './navigation';

const eventEmitter = new NativeEventEmitter();

/**
 * Starts a fresh conversation. Uses `workspaceSlug` when given, otherwise the workspace of the most
 * recently active conversation (falling back to the first workspace). Returns false when the user has
 * no workspace yet - the caller should then offer to create one.
 */
export async function startNewChat(navigation: { reset: (state: any) => void }, workspaceSlug?: string, fallbackSlug?: string): Promise<boolean> {
  const workspaces = await Workspace.find([]);
  if (workspaces.length === 0) return false;
  const slug = [workspaceSlug, fallbackSlug].find((candidate) => candidate && workspaces.some((w: any) => w.slug === candidate)) ?? (workspaces[0] as any).slug;
  const thread = await WorkspaceThread.create({ workspaceSlug: slug });
  // Same event the sidebar listens to so its thread list updates
  eventEmitter.emit('workspaceUpdate', { type: 'add-thread', details: { workspaceSlug: slug, thread } });
  openChat(navigation, slug, thread.slug);
  return true;
}

/** Opens a workspace on its newest thread (creating one if it has none). */
export async function openWorkspace(navigation: { reset: (state: any) => void }, workspaceSlug: string) {
  const threads = await WorkspaceThread.find([{ field: 'workspace_slug', value: workspaceSlug }]);
  const thread = threads.sort((a, b) => b.createdAt - a.createdAt)[0] ?? (await WorkspaceThread.create({ workspaceSlug }));
  openChat(navigation, workspaceSlug, thread.slug);
}
