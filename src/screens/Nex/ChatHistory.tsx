import React, { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, NativeEventEmitter, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { ChatCircleText, DotsThreeVertical } from 'phosphor-react-native';
import NexScreen from '@/components/nex/NexScreen';
import NexSkeleton from '@/components/nex/NexSkeleton';
import { NexCard, NexChip, NexEmptyState, NexIconTile, NexRow, NexSearchInput } from '@/components/nex/primitives';
import NexTextPrompt from '@/components/nex/NexTextPrompt';
import NexPickerModal from '@/components/nex/NexPickerModal';
import { NEX } from '@/components/nex/tokens';
import useNexData from '@/hooks/useNexData';
import WorkspaceThread from '@/database/models/WorkspaceThread';
import Workspace from '@/database/models/Workspace';
import useLLMPreference from '@/hooks/useLLMPreference';
import { buildThreadExportContext, EXPORT_FORMATS, resolveThreadModelName, saveThreadExport, shareThreadExport, type ExportFormat } from '@/utils/chat/export';
import { listThreadSummaries, relativeTime, ThreadSummary } from '@/utils/nex/data';
import { openChat } from '@/utils/nex/navigation';
import { showToast } from '@/utils/Notification';

const eventEmitter = new NativeEventEmitter();
const loadAll = () => listThreadSummaries();

export default function ChatHistory() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { data, loading, refreshing, refresh, error } = useNexData(loadAll, [] as ThreadSummary[]);
  const [query, setQuery] = useState('');
  const [onlyWithMessages, setOnlyWithMessages] = useState(true);
  const [renaming, setRenaming] = useState<ThreadSummary | null>(null);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return data.filter((th) => (!onlyWithMessages || th.hasMessages) && (!needle || th.name.toLowerCase().includes(needle) || th.preview.toLowerCase().includes(needle) || th.workspaceName.toLowerCase().includes(needle)));
  }, [data, query, onlyWithMessages]);

  const rename = useCallback(async (value: string) => {
    if (!renaming) return;
    if (!value) return;
    try {
      await WorkspaceThread.update([{ field: 'workspace_slug', value: renaming.workspaceSlug }, { field: 'slug', value: renaming.slug }], { name: value });
      eventEmitter.emit('workspaceUpdate', { type: 'rename-thread', details: { workspaceSlug: renaming.workspaceSlug, threadSlug: renaming.slug, newName: value } });
      setRenaming(null);
      refresh();
    } catch (e) {
      console.error('[ChatHistory] rename failed', e);
      showToast(t('nex.common.something_wrong'));
    }
  }, [renaming, refresh, t]);

  const remove = useCallback((thread: ThreadSummary) => {
    Alert.alert(t('nex.history.delete_title', { name: thread.name }), t('nex.history.delete_message'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          const ok = await WorkspaceThread.delete([{ field: 'workspace_slug', value: thread.workspaceSlug }, { field: 'slug', value: thread.slug }]);
          if (!ok) return showToast(t('nex.common.something_wrong'));
          eventEmitter.emit('workspaceUpdate', { type: 'remove-thread', details: { workspaceSlug: thread.workspaceSlug, threadSlug: thread.slug } });
          refresh();
        },
      },
    ]);
  }, [refresh, t]);

  // Android's Alert shows at most 3 buttons, so the per-conversation menu is a picker sheet instead
  const [menuFor, setMenuFor] = useState<ThreadSummary | null>(null);
  const [exportFor, setExportFor] = useState<ThreadSummary | null>(null);
  const [exporting, setExporting] = useState(false);
  const { llmPreferences } = useLLMPreference();
  const actions = useCallback((thread: ThreadSummary) => setMenuFor(thread), []);
  const onMenuSelect = useCallback((key: string) => {
    const thread = menuFor;
    setMenuFor(null);
    if (!thread) return;
    if (key === 'continue') openChat(navigation, thread.workspaceSlug, thread.slug);
    else if (key === 'export') setExportFor(thread);
    else if (key === 'rename') setRenaming(thread);
    else if (key === 'delete') remove(thread);
  }, [menuFor, navigation, remove]);

  // Same exporters as the chat's thread menu: build from the local DB, save to Downloads, offer the share sheet
  const runExport = useCallback(async (format: ExportFormat) => {
    const thread = exportFor;
    setExportFor(null);
    if (!thread || exporting) return;
    setExporting(true);
    try {
      const [workspace] = await Workspace.find([{ field: 'slug', value: thread.workspaceSlug }]);
      const [threadRecord] = await WorkspaceThread.find([{ field: 'workspace_slug', value: thread.workspaceSlug }, { field: 'slug', value: thread.slug }]);
      if (!workspace || !threadRecord) throw new Error(t('nex.common.something_wrong'));
      const modelName = await resolveThreadModelName(workspace, llmPreferences);
      const ctx = await buildThreadExportContext({ workspace, thread: threadRecord, modelName });
      if (ctx.chats.length === 0) return showToast(t('nex.history.export_empty'));
      const saved = await saveThreadExport(format, ctx);
      showToast(t('nex.history.exported'));
      await shareThreadExport(saved);
    } catch (e) {
      console.error('[ChatHistory] export failed', e);
      showToast(t('nex.history.export_failed'));
    } finally {
      setExporting(false);
    }
  }, [exportFor, exporting, llmPreferences, t]);

  return (
    <NexScreen title={t('nex.nav.chat_history')} scroll={false}>
      <View style={styles.controls}>
        <NexSearchInput value={query} onChangeText={setQuery} placeholder={t('nex.history.search')} />
        <View style={styles.chips}>
          <NexChip label={t('nex.history.with_messages')} selected={onlyWithMessages} onPress={() => setOnlyWithMessages(true)} />
          <NexChip label={t('nex.common.all')} selected={!onlyWithMessages} onPress={() => setOnlyWithMessages(false)} />
        </View>
      </View>
      <FlatList
        data={visible}
        keyExtractor={(th) => th.slug}
        initialNumToRender={12}
        windowSize={7}
        contentContainerStyle={styles.list}
        refreshing={refreshing}
        onRefresh={refresh}
        ListEmptyComponent={
          loading ? <NexSkeleton rows={5} /> : error ? (
            <NexEmptyState title={t('nex.common.load_failed')} message={error} actionLabel={t('nex.common.retry')} onAction={refresh} />
          ) : (
            <NexEmptyState icon={<ChatCircleText size={40} color={NEX.cyan} />} title={t('nex.history.empty')} message={t('nex.history.empty_hint')} />
          )
        }
        renderItem={({ item }) => (
          <NexCard style={{ marginBottom: 10 }}>
            <NexRow
              icon={<NexIconTile><ChatCircleText size={22} color={NEX.cyan} /></NexIconTile>}
              title={item.name}
              subtitle={`${item.workspaceName}${item.preview ? ` · ${item.preview}` : ''}`}
              onPress={() => openChat(navigation, item.workspaceSlug, item.slug)}
              trailing={
                <View style={styles.trailing}>
                  <Text style={styles.time}>{relativeTime(item.lastActivity)}</Text>
                  <TouchableOpacity hitSlop={12} accessibilityRole="button" accessibilityLabel={t('nex.common.more_actions')} onPress={() => actions(item)}>
                    <DotsThreeVertical size={22} color={NEX.textSecondary} weight="bold" />
                  </TouchableOpacity>
                </View>
              }
            />
          </NexCard>
        )}
      />
      <NexPickerModal
        visible={!!menuFor}
        title={menuFor?.name ?? ''}
        items={[
          { key: 'continue', title: t('nex.history.continue') },
          { key: 'export', title: t('nex.history.export') },
          { key: 'rename', title: t('nex.common.rename') },
          { key: 'delete', title: t('common.delete') },
        ]}
        onClose={() => setMenuFor(null)}
        onSelect={(item) => onMenuSelect(item.key)}
      />
      <NexPickerModal
        visible={!!exportFor}
        title={t('nex.history.export_as')}
        items={(Object.keys(EXPORT_FORMATS) as ExportFormat[]).map((format) => ({ key: format, title: EXPORT_FORMATS[format].label, subtitle: EXPORT_FORMATS[format].description }))}
        onClose={() => setExportFor(null)}
        onSelect={(item) => runExport(item.key as ExportFormat)}
      />
      <NexTextPrompt visible={!!renaming} title={t('nex.history.rename_title')} initialValue={renaming?.name ?? ''} confirmLabel={t('common.save')} onCancel={() => setRenaming(null)} onConfirm={rename} />
    </NexScreen>
  );
}

const styles = StyleSheet.create({
  controls: { paddingHorizontal: 16 },
  chips: { flexDirection: 'row', gap: 8, paddingTop: 12 },
  list: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24, flexGrow: 1 },
  trailing: { alignItems: 'flex-end', gap: 6 },
  time: { color: NEX.textSecondary, fontSize: 12 },
});
