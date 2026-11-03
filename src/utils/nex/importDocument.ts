import * as RNFS from '@dr.pogodin/react-native-fs';
import { pick, isErrorWithCode, errorCodes } from '@react-native-documents/picker';
import Storage from '@/utils/storage';
import getEmbedder from '@/utils/Embedder';
import VectorDB from '@/utils/VectorDB';
import DocumentParser from '@/utils/DocumentParser';
import Document from '@/database/models/Document';
import { deleteProcessedFilesByName, storeProcessedFileAsText } from '@/utils/fs';
import { generateUUID } from '@/utils/constants';
import i18n from '@/i18n';

/**
 * Imports one document into a workspace's knowledge base from the Documents screen.
 *
 * This is the same pipeline the chat attachment button uses (`processAttachment` in hooks/useAttachments):
 * pick -> copy to app storage -> parse text (DocumentParser) -> store the processed text -> chunk + embed with the
 * on-device embedder -> save the vectors (VectorDB) -> create the Document row.
 * It is intentionally limited to the embedded (RAG) mode: with an external provider selected the app sends documents
 * whole inside one conversation, which only makes sense from inside that chat.
 *
 * Reports REAL stages only (`onStage`) - there is no percentage because the embedder does not expose one.
 * NOTE: kept separate from useAttachments (which is tied to the chat prompt UI); see KNOWN_LIMITATIONS.md.
 */
export type ImportStage = 'reading' | 'embedding' | 'saving';

export class ImportCancelled extends Error {
  constructor() { super('cancelled'); }
}

export async function importDocumentIntoWorkspace(workspaceSlug: string, onStage: (stage: ImportStage) => void): Promise<{ name: string }> {
  let picked: Awaited<ReturnType<typeof pick>>;
  try {
    picked = await pick({ allowMultiSelection: false, type: DocumentParser.PICKER_FILE_TYPES });
  } catch (e) {
    if (isErrorWithCode(e) && e.code === errorCodes.OPERATION_CANCELED) throw new ImportCancelled();
    throw e;
  }
  if (picked.length === 0) throw new ImportCancelled();
  const file = picked[0];
  const name = file.name || 'document';
  const resolved = DocumentParser.resolveDocument(name, file.type);
  const mimeType = resolved?.mimeType || file.type || 'application/octet-stream';

  let temporaryFilePath: string | null = null;
  // Tracked so a failure part-way leaves nothing half-imported behind (error recovery)
  let storedProcessedText = false;
  let insertedVectorIds: number[] = [];
  let documentCreated = false;
  try {
    onStage('reading');
    let uri = decodeURI(file.uri);
    // Same Android workaround as the chat attachment flow: read from an app-owned copy.
    await RNFS.mkdir(`${RNFS.TemporaryDirectoryPath}/uploads`);
    temporaryFilePath = `${RNFS.TemporaryDirectoryPath}/uploads/${generateUUID()}-${name}`;
    await RNFS.copyFile(uri, temporaryFilePath);
    uri = temporaryFilePath;
    const realPath = await Storage.getRealPathFromUri(uri).catch(() => {
      throw new Error(i18n.t('models.attachments.not_found'));
    });
    const text = await DocumentParser.extractText(realPath, name, mimeType);
    if (!text?.trim()) throw new Error(i18n.t('models.attachments.empty_content'));

    await storeProcessedFileAsText(name, text);
    storedProcessedText = true;

    onStage('embedding');
    const embedder = getEmbedder('native');
    const embedResults = await embedder.splitAndEmbed(text, { chunkSize: 2048, chunkOverlap: 20 });
    const embeddings = embedResults.map((result) => ({ embedding: result.embedding, metadata: { ...result.metadata, name } }));

    onStage('saving');
    const { ids } = await VectorDB.bulkInsert(workspaceSlug, embeddings);
    insertedVectorIds = ids;
    const document = await Document.create({ name, workspaceSlug, vectorBoxIds: ids });
    if (!document) throw new Error(i18n.t('models.attachments.create_failed'));
    documentCreated = true;
    return { name };
  } catch (error) {
    // Undo what this attempt created. Cleanup problems must never hide the original error.
    try {
      if (!documentCreated && insertedVectorIds.length > 0) await VectorDB.deleteVectorsByIds(insertedVectorIds);
      if (!documentCreated && storedProcessedText) {
        // Another document may already own a processed file of the same name - only remove ours when none does
        const sameName = await Document.find([{ field: 'name', value: name }]);
        if (sameName.length === 0) await deleteProcessedFilesByName([name]);
      }
    } catch {
      console.warn('[importDocument] cleanup after a failed import did not complete');
    }
    throw error;
  } finally {
    if (temporaryFilePath && (await RNFS.exists(temporaryFilePath))) await RNFS.unlink(temporaryFilePath);
  }
}
