import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { ChatCircleText, FileText, Folders, GearSix, MagnifyingGlass } from 'phosphor-react-native';
import NexScreen from '@/components/nex/NexScreen';
import { NexBadge, NexCard, NexEmptyState, NexIconTile, NexRow, NexSearchInput, NexSectionHeader } from '@/components/nex/primitives';
import { NEX } from '@/components/nex/tokens';
import { ChatHit, fileKind, listDocumentSummaries, listThreadSummaries, listWorkspaceSummaries, relativeTime, searchChats } from '@/utils/nex/data';
import { openChat, resetTo } from '@/utils/nex/navigation';
import { openWorkspace } from '@/utils/nex/actions';
import { PATHS } from '@/utils/paths';

type Results = {
  threads: Awaited<ReturnType<typeof listThreadSummaries>>;
  messages: ChatHit[];
  workspaces: Awaited<ReturnType<typeof listWorkspaceSummaries>>;
  documents: Awaited<ReturnType<typeof listDocumentSummaries>>;
};
const EMPTY: Results = { threads: [], messages: [], workspaces: [], documents: [] };

/** Unified, on-device search. Nothing typed here leaves the phone. */
export default function Search() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Results>(EMPTY);
  const [searching, setSearching] = useState(false);

  const sections = useMemo(() => ([
    { key: 'agents', label: t('nex.nav.agents'), path: PATHS.agents },
    { key: 'models', label: t('nex.nav.models'), path: PATHS.models },
    { key: 'documents', label: t('nex.nav.documents'), path: PATHS.documents },
    { key: 'workspaces', label: t('nex.nav.workspaces'), path: PATHS.workspaces },
    { key: 'history', label: t('nex.nav.chat_history'), path: PATHS.chat_history },
    { key: 'tasks', label: t('nex.nav.scheduled_tasks'), path: PATHS.scheduled_jobs },
    { key: 'settings', label: t('nex.nav.settings'), path: PATHS.user_settings },
    { key: 'profile', label: t('nex.nav.profile'), path: PATHS.profile },
    { key: 'about', label: t('nex.nav.about'), path: PATHS.about },
  ]), [t]);

  useEffect(() => {
    const needle = query.trim().toLowerCase();
    if (needle.length < 2) { setResults(EMPTY); setSearching(false); return; }
    setSearching(true);
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const [threads, messages, workspaces, documents] = await Promise.all([listThreadSummaries(), searchChats(needle), listWorkspaceSummaries(), listDocumentSummaries()]);
        if (cancelled) return;
        setResults({
          threads: threads.filter((th) => th.name.toLowerCase().includes(needle)).slice(0, 8),
          messages,
          workspaces: workspaces.filter((w) => w.name.toLowerCase().includes(needle)),
          documents: documents.filter((d) => d.name.toLowerCase().includes(needle)),
        });
      } catch (e) {
        console.error('[Search] failed', e);
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 300);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [query]);

  const matchingSections = sections.filter((s) => query.trim().length >= 2 && s.label.toLowerCase().includes(query.trim().toLowerCase()));
  const total = results.threads.length + results.messages.length + results.workspaces.length + results.documents.length + matchingSections.length;
  const typed = query.trim().length >= 2;

  return (
    <NexScreen title={t('nex.nav.search')} activeTab="search" scroll={false}>
      <View style={styles.input}>
        <NexSearchInput value={query} onChangeText={setQuery} placeholder={t('nex.search.placeholder')} autoFocus />
        <Text style={styles.privacy}>{t('nex.search.privacy')}</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {!typed ? (
          <NexEmptyState icon={<MagnifyingGlass size={40} color={NEX.cyan} />} title={t('nex.search.start_title')} message={t('nex.search.start_hint')} />
        ) : searching ? (
          <ActivityIndicator color={NEX.cyan} style={{ marginTop: 24 }} />
        ) : total === 0 ? (
          <NexEmptyState title={t('nex.search.no_results')} message={t('nex.search.no_results_hint')} />
        ) : (
          <>
            {results.threads.length > 0 && (<>
              <NexSectionHeader title={t('nex.search.conversations')} />
              <NexCard>{results.threads.map((th) => (
                <NexRow key={th.slug} icon={<NexIconTile><ChatCircleText size={20} color={NEX.cyan} /></NexIconTile>} title={th.name} subtitle={th.workspaceName} onPress={() => openChat(navigation, th.workspaceSlug, th.slug)} />
              ))}</NexCard>
            </>)}
            {results.messages.length > 0 && (<>
              <NexSectionHeader title={t('nex.search.messages')} />
              <NexCard>{results.messages.map((hit, i) => (
                <NexRow key={`${hit.threadSlug}-${hit.createdAt}-${i}`} title={hit.snippet} subtitle={`${hit.threadName} · ${hit.workspaceName} · ${relativeTime(hit.createdAt)}`} onPress={() => openChat(navigation, hit.workspaceSlug, hit.threadSlug)} />
              ))}</NexCard>
            </>)}
            {results.workspaces.length > 0 && (<>
              <NexSectionHeader title={t('nex.search.workspaces')} />
              <NexCard>{results.workspaces.map((w) => (
                <NexRow key={w.slug} icon={<NexIconTile><Folders size={20} color={NEX.cyan} /></NexIconTile>} title={w.name} subtitle={t('nex.workspaces.counts', { chats: w.threadCount, docs: w.documentCount })} onPress={() => openWorkspace(navigation, w.slug)} />
              ))}</NexCard>
            </>)}
            {results.documents.length > 0 && (<>
              <NexSectionHeader title={t('nex.search.documents')} />
              <NexCard>{results.documents.map((d) => (
                <NexRow key={d.uuid} icon={<NexBadge label={fileKind(d.name)} tone="brand" />} title={d.name} subtitle={d.workspaceName} onPress={() => resetTo(navigation, PATHS.documents, { workspaceSlug: d.workspaceSlug })} />
              ))}</NexCard>
            </>)}
            {matchingSections.length > 0 && (<>
              <NexSectionHeader title={t('nex.search.app_sections')} />
              <NexCard>{matchingSections.map((s) => (
                <NexRow key={s.key} icon={<NexIconTile tint={NEX.violet}><GearSix size={20} color={NEX.violet} /></NexIconTile>} title={s.label} onPress={() => resetTo(navigation, s.path)} />
              ))}</NexCard>
            </>)}
          </>
        )}
      </ScrollView>
    </NexScreen>
  );
}

const styles = StyleSheet.create({
  input: { paddingHorizontal: 16 },
  privacy: { color: NEX.textSecondary, fontSize: 12, marginTop: 8 },
  content: { paddingHorizontal: 16, paddingBottom: 32 },
});
