import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as RNFS from '@dr.pogodin/react-native-fs';
import { useTranslation } from 'react-i18next';
import { ClockCountdown, Cpu, FileText, GearSix, MagnifyingGlass, Plus, Robot, Sparkle } from 'phosphor-react-native';
import NexScreen from '@/components/nex/NexScreen';
import NexSkeleton from '@/components/nex/NexSkeleton';
import { NexBadge, NexButton, NexCard, NexEmptyState, NexIconTile, NexRow, NexSectionHeader } from '@/components/nex/primitives';
import { NEX, NEX_RADIUS } from '@/components/nex/tokens';
import NewWorkspaceModal, { useNewWorkspaceModal } from '@/components/NewWorkspaceModal';
import useNexData from '@/hooks/useNexData';
import useCurrentModel from '@/hooks/useCurrentModel';
import { fileKind, listDocumentSummaries, listThreadSummaries, listWorkspaceSummaries, relativeTime } from '@/utils/nex/data';
import { openChat, resetTo } from '@/utils/nex/navigation';
import { openWorkspace, startNewChat } from '@/utils/nex/actions';
import { formatBytes } from '@/utils/formatters';
import { PATHS } from '@/utils/paths';
import { showToast } from '@/utils/Notification';

async function loadDashboard() {
  const [threads, workspaces, documents] = await Promise.all([listThreadSummaries(), listWorkspaceSummaries(), listDocumentSummaries()]);
  const fs = await RNFS.getFSInfo().catch(() => null);
  return { threads, workspaces, documents, freeBytes: fs?.freeSpace ?? null, totalBytes: fs?.totalSpace ?? null };
}
const INITIAL = { threads: [], workspaces: [], documents: [], freeBytes: null, totalBytes: null } as Awaited<ReturnType<typeof loadDashboard>>;

function greetingKey(): string {
  const hour = new Date().getHours();
  return hour < 12 ? 'nex.home.greeting_morning' : hour < 18 ? 'nex.home.greeting_afternoon' : 'nex.home.greeting_evening';
}

export default function NexHome() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const model = useCurrentModel();
  const { showNewWorkspaceModal, openNewWorkspaceModal, closeNewWorkspaceModal } = useNewWorkspaceModal();
  const { data, loading, refreshing, refresh, error } = useNexData(loadDashboard, INITIAL);
  const [starting, setStarting] = useState(false);

  const newChat = useCallback(async () => {
    if (starting) return;
    setStarting(true);
    try {
      const started = await startNewChat(navigation, undefined, data.threads[0]?.workspaceSlug);
      if (!started) openNewWorkspaceModal();
    } catch (e) {
      console.error('[Home] new chat failed', e);
      showToast(t('nex.common.something_wrong'));
    } finally {
      setStarting(false);
    }
  }, [starting, navigation, data.threads, openNewWorkspaceModal, t]);

  const go = (path: string) => resetTo(navigation, path);
  const recent = data.threads.filter((th) => th.hasMessages).slice(0, 4);
  const hasWorkspaces = data.workspaces.length > 0;

  const quick = [
    { key: 'chat', label: t('nex.home.quick_chat'), icon: <Sparkle size={22} color={NEX.cyan} />, onPress: newChat },
    { key: 'docs', label: t('nex.home.quick_import'), icon: <FileText size={22} color={NEX.cyan} />, onPress: () => go(PATHS.documents) },
    { key: 'agents', label: t('nex.home.quick_agents'), icon: <Robot size={22} color={NEX.violet} />, onPress: () => go(PATHS.agents) },
    { key: 'jobs', label: t('nex.home.quick_tasks'), icon: <ClockCountdown size={22} color={NEX.violet} />, onPress: () => go(PATHS.scheduled_jobs) },
  ];

  return (
    <NexScreen
      isHome
      activeTab="home"
      title={t('nex.app_name')}
      subtitle={t(greetingKey())}
      refreshing={refreshing}
      onRefresh={refresh}
      headerRight={
        <TouchableOpacity accessibilityRole="button" accessibilityLabel={t('nex.nav.settings')} hitSlop={10} onPress={() => go(PATHS.user_settings)} style={styles.iconButton}>
          <GearSix size={22} color={NEX.text} />
        </TouchableOpacity>
      }>
      <Text style={styles.tagline}>{t('nex.tagline')}</Text>

      <NexCard onPress={() => go(PATHS.search)} accessibilityLabel={t('nex.search.placeholder')} style={styles.searchEntry}>
        <View style={styles.searchRow}>
          <MagnifyingGlass size={18} color={NEX.textSecondary} />
          <Text style={styles.searchText}>{t('nex.search.placeholder')}</Text>
        </View>
      </NexCard>

      <NexButton label={t('nex.home.new_chat')} icon={<Plus size={20} color={NEX.onCyan} weight="bold" />} onPress={newChat} loading={starting} style={{ marginTop: 14 }} />

      {error ? <NexEmptyState title={t('nex.common.load_failed')} message={error} actionLabel={t('nex.common.retry')} onAction={refresh} /> : null}

      <View style={styles.quickGrid}>
        {quick.map((item) => (
          <TouchableOpacity key={item.key} accessibilityRole="button" accessibilityLabel={item.label} activeOpacity={0.8} onPress={item.onPress} style={styles.quickTile}>
            <NexIconTile tint={NEX.cyan}>{item.icon}</NexIconTile>
            <Text style={styles.quickLabel} numberOfLines={2}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <NexSectionHeader title={t('nex.home.ai_model')} actionLabel={t('nex.nav.models')} onAction={() => go(PATHS.models)} />
      <NexCard onPress={() => go(PATHS.models)}>
        {model.configured ? (
          <NexRow
            icon={<NexIconTile tint={NEX.violet}><Cpu size={22} color={NEX.violet} /></NexIconTile>}
            title={model.model || model.providerName}
            subtitle={model.model ? model.providerName : t('nex.home.no_model_selected')}
            trailing={model.isLocal ? <NexBadge tone={model.loaded ? 'success' : 'neutral'} label={model.loaded ? t('nex.models.loaded') : t('nex.models.not_loaded')} /> : <NexBadge tone="brand" label={t('nex.models.cloud')} />}
          />
        ) : (
          <NexRow icon={<NexIconTile tint={NEX.warning}><Cpu size={22} color={NEX.warning} /></NexIconTile>} title={t('nex.home.no_provider')} subtitle={t('nex.home.no_provider_hint')} />
        )}
      </NexCard>

      <NexSectionHeader title={t('nex.home.recent_chats')} actionLabel={t('nex.common.see_all')} onAction={() => go(PATHS.chat_history)} />
      <NexCard>
        {loading ? <NexSkeleton rows={2} /> : recent.length === 0 ? (
          <Text style={styles.muted}>{t('nex.home.no_chats')}</Text>
        ) : recent.map((th) => (
          <NexRow key={th.slug} title={th.name} subtitle={`${th.workspaceName} · ${th.preview}`} trailing={<Text style={styles.time}>{relativeTime(th.lastActivity)}</Text>} onPress={() => openChat(navigation, th.workspaceSlug, th.slug)} />
        ))}
      </NexCard>

      <NexSectionHeader title={t('nex.home.workspaces')} actionLabel={t('nex.common.see_all')} onAction={() => go(PATHS.workspaces)} />
      {hasWorkspaces ? data.workspaces.slice(0, 3).map((w) => (
        <NexCard key={w.slug} onPress={() => openWorkspace(navigation, w.slug)} style={{ marginBottom: 10 }}>
          <NexRow title={w.name} subtitle={t('nex.workspaces.counts', { chats: w.threadCount, docs: w.documentCount })} />
        </NexCard>
      )) : !loading ? <Text style={styles.muted}>{t('nex.home.no_workspaces')}</Text> : null}
      <NexButton variant="secondary" label={t('nex.home.create_workspace')} icon={<Plus size={18} color={NEX.text} />} onPress={openNewWorkspaceModal} style={{ marginTop: 6 }} />

      <NexSectionHeader title={t('nex.home.documents')} actionLabel={t('nex.common.see_all')} onAction={() => go(PATHS.documents)} />
      <NexCard>
        {data.documents.length === 0 ? <Text style={styles.muted}>{t('nex.documents.empty')}</Text> : data.documents.slice(0, 3).map((d) => (
          <NexRow key={d.uuid} icon={<NexBadge label={fileKind(d.name)} tone="brand" />} title={d.name} subtitle={d.workspaceName} onPress={() => go(PATHS.documents)} />
        ))}
      </NexCard>

      <NexSectionHeader title={t('nex.home.status')} />
      <NexCard>
        <NexRow title={t('nex.home.stat_chats')} trailing={<Text style={styles.stat}>{data.threads.filter((th) => th.hasMessages).length}</Text>} />
        <NexRow title={t('nex.home.stat_documents')} trailing={<Text style={styles.stat}>{data.documents.length}</Text>} />
        {data.freeBytes != null && data.totalBytes != null ? (
          <NexRow title={t('nex.home.stat_storage')} subtitle={t('nex.home.storage_free', { free: formatBytes(data.freeBytes), total: formatBytes(data.totalBytes) })} />
        ) : null}
      </NexCard>

      <NewWorkspaceModal showing={showNewWorkspaceModal} close={closeNewWorkspaceModal} />
    </NexScreen>
  );
}

const styles = StyleSheet.create({
  tagline: { color: NEX.textSecondary, fontSize: 14, marginBottom: 14 },
  searchEntry: { paddingVertical: 14 },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  searchText: { color: NEX.textSecondary, fontSize: 15 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 18 },
  quickTile: { width: '23%', flexGrow: 1, minWidth: 74, alignItems: 'center', gap: 8, backgroundColor: NEX.card, borderRadius: NEX_RADIUS.lg, paddingVertical: 14, paddingHorizontal: 6, borderWidth: StyleSheet.hairlineWidth, borderColor: NEX.border },
  quickLabel: { color: NEX.text, fontSize: 12, fontWeight: '600', textAlign: 'center' },
  iconButton: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: NEX.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: NEX.border },
  muted: { color: NEX.textSecondary, fontSize: 14, paddingVertical: 6 },
  time: { color: NEX.textSecondary, fontSize: 12 },
  stat: { color: NEX.cyan, fontSize: 16, fontWeight: '700' },
});
