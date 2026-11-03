import { Q } from '@nozbe/watermelondb';
import { database } from '@/database';
import Workspace from '@/database/models/Workspace';
import WorkspaceThread from '@/database/models/WorkspaceThread';
import WorkspaceChat from '@/database/models/WorkspaceChat';
import Document, { type DocumentType } from '@/database/models/Document';
import { listProcessedFiles } from '@/utils/fs';

/**
 * Read-only queries behind the Phase 2 dashboard, history, documents and search screens.
 * Everything comes from the existing WatermelonDB tables - nothing is cached or invented here.
 */

export type ThreadSummary = {
  slug: string;
  name: string;
  workspaceSlug: string;
  workspaceName: string;
  /** Time of the last message, or the thread's creation time when it has none yet */
  lastActivity: number;
  /** Last prompt sent in the thread, if any */
  preview: string;
  hasMessages: boolean;
};

const RECENT_CHAT_SCAN = 500;

export async function listThreadSummaries(limit?: number): Promise<ThreadSummary[]> {
  const [workspaces, threads, recentChats] = await Promise.all([
    Workspace.find([]),
    WorkspaceThread.find([]),
    database.get(WorkspaceChat.table).query(Q.sortBy('created_at', Q.desc), Q.take(RECENT_CHAT_SCAN)).fetch(),
  ]);
  const workspaceNames = new Map<string, string>(workspaces.map((w: any) => [w.slug, w.name]));
  const last = new Map<string, { at: number; prompt: string }>();
  for (const chat of recentChats as any[]) {
    if (!last.has(chat.workspaceThreadSlug)) last.set(chat.workspaceThreadSlug, { at: chat.createdAt, prompt: chat.prompt });
  }
  const summaries: ThreadSummary[] = threads
    .filter((thread) => workspaceNames.has(thread.workspaceSlug))
    .map((thread) => {
      const activity = last.get(thread.slug);
      return {
        slug: thread.slug,
        name: thread.name,
        workspaceSlug: thread.workspaceSlug,
        workspaceName: workspaceNames.get(thread.workspaceSlug) ?? '',
        lastActivity: activity?.at ?? thread.createdAt,
        preview: activity?.prompt ?? '',
        hasMessages: !!activity,
      };
    })
    .sort((a, b) => b.lastActivity - a.lastActivity);
  return limit ? summaries.slice(0, limit) : summaries;
}

export type WorkspaceSummary = {
  slug: string;
  name: string;
  isRemote: boolean;
  threadCount: number;
  documentCount: number;
  createdAt: number;
};

export async function listWorkspaceSummaries(): Promise<WorkspaceSummary[]> {
  const [workspaces, threads, documents] = await Promise.all([
    Workspace.find([]),
    WorkspaceThread.find([]),
    Document.find([]) as Promise<DocumentType[]>,
  ]);
  return workspaces
    .map((w: any) => ({
      slug: w.slug,
      name: w.name,
      isRemote: !!w.isRemote,
      createdAt: w.createdAt,
      threadCount: threads.filter((t) => t.workspaceSlug === w.slug).length,
      documentCount: documents.filter((d) => d.workspaceSlug === w.slug).length,
    }))
    .sort((a, b) => b.createdAt - a.createdAt);
}

/**
 * - `embedded`: indexed in the vector store (retrieved by similarity)
 * - `full-context`: sent whole with the conversation (cloud providers)
 * - `text-missing`: a full-context document whose processed text file is gone, so it can NOT be sent to the model
 */
export type DocumentSummary = DocumentType & { workspaceName: string; kind: 'embedded' | 'full-context' | 'text-missing' };

export async function listDocumentSummaries(): Promise<DocumentSummary[]> {
  const [workspaces, documents, processed] = await Promise.all([
    Workspace.find([]),
    Document.find([]) as Promise<DocumentType[]>,
    listProcessedFiles().catch(() => []),
  ]);
  const names = new Map<string, string>(workspaces.map((w: any) => [w.slug, w.name]));
  const processedNames = new Set(processed.map((file) => file.name.toLowerCase()));
  return documents
    .filter((d) => names.has(d.workspaceSlug))
    .map((d) => {
      const fullContext = Document.isFullContext(d);
      const kind: DocumentSummary['kind'] = !fullContext ? 'embedded' : processedNames.has(d.name.toLowerCase()) ? 'full-context' : 'text-missing';
      return { ...d, workspaceName: names.get(d.workspaceSlug) ?? '', kind } as DocumentSummary;
    })
    .sort((a, b) => b.createdAt - a.createdAt);
}

export type ChatHit = { threadSlug: string; workspaceSlug: string; workspaceName: string; threadName: string; prompt: string; snippet: string; createdAt: number };

const SEARCH_LIMIT = 40;

/** Full-text-ish search over saved prompts and replies (SQL LIKE on the stored text). */
export async function searchChats(query: string): Promise<ChatHit[]> {
  const needle = query.trim();
  if (needle.length < 2) return [];
  const like = `%${Q.sanitizeLikeString(needle)}%`;
  const [chats, threads, workspaces] = await Promise.all([
    database
      .get(WorkspaceChat.table)
      .query(Q.or(Q.where('prompt', Q.like(like)), Q.where('response', Q.like(like))), Q.sortBy('created_at', Q.desc), Q.take(SEARCH_LIMIT))
      .fetch(),
    WorkspaceThread.find([]),
    Workspace.find([]),
  ]);
  const threadBySlug = new Map(threads.map((t) => [t.slug, t]));
  const wsName = new Map<string, string>(workspaces.map((w: any) => [w.slug, w.name]));
  const lower = needle.toLowerCase();
  const hits: ChatHit[] = [];
  for (const chat of chats as any[]) {
    const thread = threadBySlug.get(chat.workspaceThreadSlug);
    if (!thread) continue;
    const reply: string = chat.response?.textResponse ?? '';
    const source = chat.prompt?.toLowerCase().includes(lower) ? chat.prompt : reply;
    const at = source.toLowerCase().indexOf(lower);
    const start = Math.max(0, at - 40);
    hits.push({
      threadSlug: thread.slug,
      workspaceSlug: thread.workspaceSlug,
      workspaceName: wsName.get(thread.workspaceSlug) ?? '',
      threadName: thread.name,
      prompt: chat.prompt,
      snippet: (start > 0 ? '…' : '') + source.slice(start, start + 140).replace(/\s+/g, ' '),
      createdAt: chat.createdAt,
    });
  }
  return hits;
}

export function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'now';
  if (min < 60) return `${min}m`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d`;
  return new Date(ts).toLocaleDateString();
}

const EXT_KIND: Record<string, string> = { pdf: 'PDF', docx: 'DOCX', doc: 'DOC', txt: 'TXT', md: 'MD', csv: 'CSV', xlsx: 'XLSX', xls: 'XLS', pptx: 'PPTX', html: 'HTML', json: 'JSON' };
export function fileKind(name: string): string {
  const ext = name.includes('.') ? name.split('.').pop()!.toLowerCase() : '';
  return EXT_KIND[ext] ?? (ext ? ext.toUpperCase() : 'FILE');
}
