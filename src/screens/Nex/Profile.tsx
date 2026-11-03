import React, { useCallback, useState } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as RNFS from '@dr.pogodin/react-native-fs';
import DeviceInfo from 'react-native-device-info';
import LinearGradient from 'react-native-linear-gradient';
import { useTranslation } from 'react-i18next';
import { Bell, Cpu, GearSix, Globe, Palette, ShieldCheck, Translate } from 'phosphor-react-native';
import NexScreen from '@/components/nex/NexScreen';
import { NexBadge, NexButton, NexCard, NexDivider, NexIconTile, NexRow, NexSectionHeader } from '@/components/nex/primitives';
import { NEX, NEX_GRADIENT } from '@/components/nex/tokens';
import useNexData from '@/hooks/useNexData';
import useCurrentModel from '@/hooks/useCurrentModel';
import Workspace from '@/database/models/Workspace';
import { LANGUAGES, currentLanguage } from '@/i18n';
import { isWebSearchConfigured, getWebSearchConfig } from '@/utils/ToolsManager/tools/webSearch/config';
import { formatBytes } from '@/utils/formatters';
import { listDocumentSummaries, listThreadSummaries } from '@/utils/nex/data';
import { resetTo } from '@/utils/nex/navigation';
import { PATHS } from '@/utils/paths';

async function load() {
  const [workspaces, threads, documents, fs, searchConfigured, searchConfig] = await Promise.all([
    Workspace.find([]),
    listThreadSummaries(),
    listDocumentSummaries(),
    RNFS.getFSInfo().catch(() => null),
    isWebSearchConfigured(),
    getWebSearchConfig(),
  ]);
  return {
    remote: workspaces.filter((w: any) => w.isRemote) as any[],
    workspaceCount: workspaces.length,
    chats: threads.filter((t) => t.hasMessages).length,
    documents: documents.length,
    free: fs?.freeSpace ?? null,
    total: fs?.totalSpace ?? null,
    searchProvider: searchConfigured ? searchConfig.provider : null,
    searchHost: searchConfig.provider === 'searxng' ? (() => { try { return new URL(searchConfig.baseUrl ?? '').host; } catch { return ''; } })() : 'api.you.com',
  };
}
const INITIAL = { remote: [] as any[], workspaceCount: 0, chats: 0, documents: 0, free: null as number | null, total: null as number | null, searchProvider: null as string | null, searchHost: '' };

export default function Profile() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const model = useCurrentModel();
  const { data, refreshing, refresh } = useNexData(load, INITIAL);
  const [checking, setChecking] = useState(false);
  const [remoteStatus, setRemoteStatus] = useState<Record<string, boolean>>({});
  const language = LANGUAGES.find((l) => l.code === currentLanguage());
  const go = (path: string, params?: object) => resetTo(navigation, path, params);

  const checkRemote = useCallback(async () => {
    setChecking(true);
    try {
      const result: Record<string, boolean> = {};
      for (const ws of data.remote) {
        // `remoteServerReachable` is the existing real reachability probe of the connected AnythingLLM server
        const object: any = Workspace.toWorkspaceObject(ws);
        result[ws.slug] = await object.remoteServerReachable().catch(() => false);
      }
      setRemoteStatus(result);
    } finally {
      setChecking(false);
    }
  }, [data.remote]);

  const services: { key: string; name: string; detail: string; active: boolean }[] = [
    { key: 'provider', name: t('nex.profile.svc_provider'), detail: model.configured && !model.isLocal ? model.providerName : t('nex.profile.svc_provider_none'), active: model.configured && !model.isLocal },
    { key: 'hf', name: 'Hugging Face (huggingface.co)', detail: t('nex.profile.svc_hf'), active: false },
    { key: 'search', name: t('nex.web_search.title'), detail: data.searchProvider ? t('nex.profile.svc_search_on', { host: data.searchHost }) : t('nex.profile.svc_search_off'), active: !!data.searchProvider },
    { key: 'web', name: t('nex.profile.svc_web'), detail: t('nex.profile.svc_web_detail'), active: false },
    { key: 'remote', name: t('nex.profile.svc_remote'), detail: data.remote.length ? t('nex.profile.svc_remote_on', { count: data.remote.length }) : t('nex.profile.svc_remote_off'), active: data.remote.length > 0 },
  ];

  return (
    <NexScreen title={t('nex.nav.profile')} refreshing={refreshing} onRefresh={refresh}>
      <LinearGradient colors={[...NEX_GRADIENT.brand]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
        <View style={styles.avatar}><Text style={styles.avatarText}>N</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.heroName}>{t('nex.profile.local_profile')}</Text>
          <Text style={styles.heroSub}>{t('nex.profile.no_account')}</Text>
        </View>
      </LinearGradient>

      <NexSectionHeader title={t('nex.profile.overview')} />
      <NexCard>
        <NexRow title={t('nex.nav.workspaces')} trailing={<Text style={styles.stat}>{data.workspaceCount}</Text>} />
        <NexRow title={t('nex.home.stat_chats')} trailing={<Text style={styles.stat}>{data.chats}</Text>} />
        <NexRow title={t('nex.home.stat_documents')} trailing={<Text style={styles.stat}>{data.documents}</Text>} />
        {data.free != null && data.total != null ? <NexRow title={t('nex.home.stat_storage')} subtitle={t('nex.home.storage_free', { free: formatBytes(data.free), total: formatBytes(data.total) })} /> : null}
      </NexCard>

      <NexSectionHeader title={t('nex.profile.connection')} />
      <NexCard>
        {data.remote.length === 0 ? <Text style={styles.muted}>{t('nex.profile.no_remote')}</Text> : data.remote.map((ws) => (
          <NexRow key={ws.slug} title={ws.name} subtitle={t('nex.profile.remote_workspace')} trailing={remoteStatus[ws.slug] === undefined ? undefined : <NexBadge tone={remoteStatus[ws.slug] ? 'success' : 'danger'} label={remoteStatus[ws.slug] ? t('nex.profile.reachable') : t('nex.profile.unreachable')} />} />
        ))}
        {data.remote.length > 0 ? <NexButton variant="secondary" compact label={t('nex.profile.check_connection')} loading={checking} onPress={checkRemote} style={{ marginTop: 10 }} /> : null}
        <NexButton variant="ghost" compact label={t('nex.profile.connect_server')} onPress={() => go(PATHS.connect_to_instance)} />
      </NexCard>

      <NexSectionHeader title={t('nex.profile.preferences')} />
      <NexCard>
        <NexRow icon={<NexIconTile size={36}><Palette size={18} color={NEX.cyan} /></NexIconTile>} title={t('nex.profile.theme')} subtitle={t('nex.profile.theme_dark')} />
        <NexDivider />
        <NexRow icon={<NexIconTile size={36}><Translate size={18} color={NEX.cyan} /></NexIconTile>} title={t('settings.language.app_language')} subtitle={language?.nativeName} onPress={() => go(PATHS.user_settings, { page: 'language' })} />
        <NexDivider />
        <NexRow icon={<NexIconTile size={36}><Cpu size={18} color={NEX.cyan} /></NexIconTile>} title={t('nex.profile.model_prefs')} subtitle={model.configured ? `${model.providerName}${model.model ? ` · ${model.model}` : ''}` : t('nex.home.no_provider')} onPress={() => go(PATHS.models)} />
        <NexDivider />
        <NexRow icon={<NexIconTile size={36}><Bell size={18} color={NEX.cyan} /></NexIconTile>} title={t('nex.profile.notifications')} subtitle={t('nex.profile.notifications_hint')} onPress={() => Linking.openSettings().catch(() => { })} />
        <NexDivider />
        <NexRow icon={<NexIconTile size={36}><GearSix size={18} color={NEX.cyan} /></NexIconTile>} title={t('nex.nav.settings')} subtitle={t('nex.profile.settings_hint')} onPress={() => go(PATHS.user_settings)} />
      </NexCard>

      <NexSectionHeader title={t('nex.profile.external_services')} />
      <NexCard>
        <Text style={styles.muted}>{t('nex.profile.services_intro')}</Text>
        {services.map((s) => (
          <View key={s.key}>
            <NexDivider />
            <NexRow icon={<NexIconTile size={36} tint={s.active ? NEX.warning : NEX.cyan}>{s.key === 'search' || s.key === 'web' ? <Globe size={18} color={s.active ? NEX.warning : NEX.cyan} /> : <ShieldCheck size={18} color={s.active ? NEX.warning : NEX.cyan} />}</NexIconTile>} title={s.name} subtitle={s.detail} trailing={<NexBadge tone={s.active ? 'warning' : 'neutral'} label={s.active ? t('nex.profile.in_use') : t('nex.profile.idle')} />} />
          </View>
        ))}
        <Text style={[styles.muted, { marginTop: 10 }]}>{t('nex.profile.keys_note')}</Text>
      </NexCard>

      <NexSectionHeader title={t('nex.profile.app_info')} />
      <NexCard>
        <NexRow title={t('nex.about.version', { version: DeviceInfo.getVersion() })} subtitle={`${DeviceInfo.getBundleId()} (${DeviceInfo.getBuildNumber()})`} onPress={() => go(PATHS.about)} />
      </NexCard>
    </NexScreen>
  );
}

const styles = StyleSheet.create({
  hero: { borderRadius: 20, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: NEX.background, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: NEX.cyan, fontSize: 24, fontWeight: '800' },
  heroName: { color: NEX.onCyan, fontSize: 18, fontWeight: '800' },
  heroSub: { color: NEX.onCyan, fontSize: 13, marginTop: 2, opacity: 0.85 },
  muted: { color: NEX.textSecondary, fontSize: 13, lineHeight: 19 },
  stat: { color: NEX.cyan, fontSize: 16, fontWeight: '700' },
});
