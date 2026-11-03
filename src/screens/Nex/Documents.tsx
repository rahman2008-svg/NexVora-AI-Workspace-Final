import React, { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Broom, FileText, Plus, Trash } from 'phosphor-react-native';
import NexScreen from '@/components/nex/NexScreen';
import NexSkeleton from '@/components/nex/NexSkeleton';
import { NexBadge, NexButton, NexCard, NexChip, NexEmptyState, NexRow, NexSearchInput } from '@/components/nex/primitives';
import NexPickerModal from '@/components/nex/NexPickerModal';
import { NEX } from '@/components/nex/tokens';
import useNexData from '@/hooks/useNexData';
import useLLMPreference from '@/hooks/useLLMPreference';
import Document from '@/database/models/Document';
import { DocumentSummary, fileKind, listDocumentSummaries, listWorkspaceSummaries, relativeTime, WorkspaceSummary } from '@/utils/nex/data';
import { ImportCancelled, importDocumentIntoWorkspace, ImportStage } from '@/utils/nex/importDocument';
import { openWorkspace } from '@/utils/nex/actions';
import { showToast } from '@/utils/Notification';

async function load() {
  const [documents, workspaces] = await Promise.all([listDocumentSummaries(), listWorkspaceSummaries()]);
  return { documents, workspaces };
}

export default function Documents() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const initialWorkspace = (route.params as { workspaceSlug?: string } | undefined)?.workspaceSlug ?? null;
  const { LLMProvider } = useLLMPreference();
  const external = !!(LLMProvider as any)?.isExternalProvider;
  const { data, loading, refreshing, refresh, error } = useNexData(load, { documents: [] as DocumentSummary[], workspaces: [] as WorkspaceSummary[] });
  const [query, setQuery] = useState('');
  const [workspaceFilter, setWorkspaceFilter] = useState<string | null>(initialWorkspace);
  const [picking, setPicking] = useState(false);
  const [stage, setStage] = useState<ImportStage | null>(null);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return data.documents.filter((d) => (!workspaceFilter || d.workspaceSlug === workspaceFilter) && (!needle || d.name.toLowerCase().includes(needle)));
  }, [data.documents, query, workspaceFilter]);

  const runImport = useCallback(async (workspaceSlug: string) => {
    try {
      setStage('reading');
      const { name } = await importDocumentIntoWorkspace(workspaceSlug, setStage);
      showToast(t('nex.documents.imported', { name }));
      refresh();
    } catch (e) {
      if (!(e instanceof ImportCancelled)) {
        console.error('[Documents] import failed', e);
        showToast((e as Error).message || t('nex.common.something_wrong'));
      }
    } finally {
      setStage(null);
    }
  }, [refresh, t]);

  const startImport = useCallback(() => {
    if (stage) return;
    if (external) {
      // With a cloud provider documents are sent whole inside one conversation - attach them from the chat.
      Alert.alert(t('nex.documents.cloud_title'), t('nex.documents.cloud_message'));
      return;
    }
    if (data.workspaces.length === 0) return showToast(t('nex.documents.need_workspace'));
    const target = workspaceFilter ?? (data.workspaces.length === 1 ? data.workspaces[0].slug : null);
    if (target) runImport(target);
    else setPicking(true);
  }, [stage, external, data.workspaces, workspaceFilter, runImport, t]);

  const remove = useCallback((doc: DocumentSummary) => {
    Alert.alert(t('nex.documents.delete_title', { name: doc.name }), t('nex.documents.delete_message'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          const ok = await Document.deleteByUuids([doc.uuid], true);
          if (!ok) return showToast(t('nex.common.something_wrong'));
          refresh();
        },
      },
    ]);
  }, [refresh, t]);

  const [cleaning, setCleaning] = useState(false);
  // Removes processed-text files no document refers to any more (left behind by earlier deletions)
  const cleanUp = useCallback(async () => {
    setCleaning(true);
    try {
      await Document.purgeUnreferencedProcessedFiles();
      showToast(t('nex.documents.cleanup_done'));
    } finally {
      setCleaning(false);
    }
  }, [t]);

  const busy = !!stage;
  return (
    <NexScreen
      title={t('nex.nav.documents')}
      activeTab="documents"
      scroll={false}
      headerRight={
        <TouchableOpacity accessibilityRole="button" accessibilityLabel={t('nex.documents.import')} onPress={startImport} disabled={busy} style={[styles.add, busy && { opacity: 0.5 }]}>
          <Plus size={22} color={NEX.onCyan} weight="bold" />
        </TouchableOpacity>
      }>
      <View style={styles.controls}>
        <NexSearchInput value={query} onChangeText={setQuery} placeholder={t('nex.documents.search')} />
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[{ slug: null as string | null, name: t('nex.common.all') }, ...data.workspaces.map((w) => ({ slug: w.slug as string | null, name: w.name }))]}
          keyExtractor={(w) => w.slug ?? 'all'}
          contentContainerStyle={{ gap: 8, paddingTop: 12 }}
          renderItem={({ item }) => <NexChip label={item.name} selected={workspaceFilter === item.slug} onPress={() => setWorkspaceFilter(item.slug)} />}
        />
        <View style={styles.summary}>
          <Text style={styles.summaryText}>{t('nex.documents.summary', { count: visible.length, parts: visible.reduce((n, d) => n + (d.vectorBoxIds?.length ?? 0), 0) })}</Text>
          <NexButton compact variant="ghost" label={t('nex.documents.cleanup')} icon={<Broom size={16} color={NEX.text} />} loading={cleaning} onPress={cleanUp} />
        </View>
        {busy ? (
          <NexCard style={{ marginTop: 12 }}>
            <NexEmptyState loading title={t(`nex.documents.stage_${stage}`)} message={t('nex.documents.stage_hint')} />
          </NexCard>
        ) : null}
      </View>
      <FlatList
        data={visible}
        keyExtractor={(d) => d.uuid}
        initialNumToRender={10}
        windowSize={7}
        contentContainerStyle={styles.list}
        refreshing={refreshing}
        onRefresh={refresh}
        ListEmptyComponent={
          loading ? <NexSkeleton rows={5} /> : error ? (
            <NexEmptyState title={t('nex.common.load_failed')} message={error} actionLabel={t('nex.common.retry')} onAction={refresh} />
          ) : (
            <NexEmptyState icon={<FileText size={40} color={NEX.cyan} />} title={t('nex.documents.empty')} message={t('nex.documents.empty_hint')} actionLabel={t('nex.documents.import')} onAction={startImport} />
          )
        }
        renderItem={({ item }) => (
          <NexCard style={{ marginBottom: 10 }}>
            <NexRow
              icon={<NexBadge label={fileKind(item.name)} tone="brand" />}
              title={item.name}
              subtitle={item.kind === 'text-missing' ? t('nex.documents.missing_hint') : `${item.workspaceName} · ${relativeTime(item.createdAt)}`}
              onPress={() => openWorkspace(navigation, item.workspaceSlug)}
              accessibilityLabel={t('nex.documents.open_workspace', { name: item.workspaceName })}
              trailing={
                <View style={styles.trailing}>
                  <NexBadge tone={item.kind === 'embedded' ? 'success' : item.kind === 'text-missing' ? 'danger' : 'warning'} label={item.kind === 'embedded' ? t('nex.documents.status_embedded', { count: item.vectorBoxIds.length }) : item.kind === 'text-missing' ? t('nex.documents.status_missing') : t('nex.documents.status_full')} />
                  <TouchableOpacity hitSlop={12} accessibilityRole="button" accessibilityLabel={t('common.delete')} onPress={() => remove(item)}>
                    <Trash size={20} color={NEX.danger} />
                  </TouchableOpacity>
                </View>
              }
            />
          </NexCard>
        )}
      />
      <NexPickerModal
        visible={picking}
        title={t('nex.documents.choose_workspace')}
        items={data.workspaces.map((w) => ({ key: w.slug, title: w.name, subtitle: t('nex.workspaces.counts', { chats: w.threadCount, docs: w.documentCount }) }))}
        onClose={() => setPicking(false)}
        onSelect={(item) => { setPicking(false); runImport(item.key); }}
      />
    </NexScreen>
  );
}

const styles = StyleSheet.create({
  controls: { paddingHorizontal: 16, paddingBottom: 4 },
  list: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24, flexGrow: 1 },
  add: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: NEX.cyan },
  trailing: { alignItems: 'flex-end', gap: 8 },
  summary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
  summaryText: { color: NEX.textSecondary, fontSize: 12, flex: 1 },
});
