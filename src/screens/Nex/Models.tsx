import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import DeviceInfo from 'react-native-device-info';
import * as RNFS from '@dr.pogodin/react-native-fs';
import { useTranslation } from 'react-i18next';
import { Cpu, HardDrives, Plug } from 'phosphor-react-native';
import NexScreen from '@/components/nex/NexScreen';
import { NexBadge, NexButton, NexCard, NexDivider, NexIconTile, NexRow, NexSectionHeader } from '@/components/nex/primitives';
import { NEX } from '@/components/nex/tokens';
import useCurrentModel from '@/hooks/useCurrentModel';
import useLLMPreference from '@/hooks/useLLMPreference';
import useProviderConfigCache from '@/hooks/useProviderConfigCache';
import getLLM from '@/utils/AiProviders';
import { findProviderDefinition, providerDisplayName, validateProviderConnection } from '@/utils/llmproviders';
import { DEFAULT_GGUF_FOLDER } from '@/utils/models/manager';
import { getDeviceMemory, memoryFitForSize, MEMORY_FIT_LABELS } from '@/utils/models/memoryFit';
import { formatBytes } from '@/utils/formatters';
import { resetTo } from '@/utils/nex/navigation';
import { PATHS } from '@/utils/paths';
import { showToast } from '@/utils/Notification';

type TestState = { status: 'testing' } | { status: 'ok'; count: number } | { status: 'error'; message: string };
type LocalModel = { modelId: string; name: string; bytes: number };

export default function Models() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const current = useCurrentModel();
  // `loaded` is read from the engine on render, so bump this after unloading to re-read it
  const [, forceRender] = useState(0);
  const [unloading, setUnloading] = useState(false);
  const { llmPreferences, updateLLMPreference, LLMProvider } = useLLMPreference();
  const { restore, cachedProviders } = useProviderConfigCache();
  const [providers, setProviders] = useState<string[]>([]);
  const [tests, setTests] = useState<Record<string, TestState>>({});
  const [local, setLocal] = useState<LocalModel[] | null>(null);
  const [storageFree, setStorageFree] = useState<number | null>(null);
  const [totalRam, setTotalRam] = useState<number | null>(null);
  useEffect(() => { DeviceInfo.getTotalMemory().then(setTotalRam).catch(() => setTotalRam(null)); }, []);

  // Providers the user has configured: the active one plus everything in the saved-config cache
  const loadProviders = useCallback(async () => {
    const cached = await cachedProviders();
    const set = new Set<string>(cached);
    if (current.configured) set.add(current.provider);
    setProviders(Array.from(set).filter((p) => p !== 'native' && !!findProviderDefinition(p)));
  }, [cachedProviders, current.configured, current.provider]);
  useEffect(() => { loadProviders(); }, [loadProviders]);

  // Local GGUF files that are really on disk: scans models/gguf/<creator>/<model>/*.gguf (no provider is instantiated)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const found: LocalModel[] = [];
      try {
        if (await RNFS.exists(DEFAULT_GGUF_FOLDER)) {
          for (const creator of (await RNFS.readDir(DEFAULT_GGUF_FOLDER)).filter((i) => i.isDirectory())) {
            for (const model of (await RNFS.readDir(creator.path)).filter((i) => i.isDirectory())) {
              for (const file of (await RNFS.readDir(model.path)).filter((i) => i.isFile() && i.name.toLowerCase().endsWith('.gguf'))) {
                found.push({ modelId: file.path, name: `${model.name} · ${file.name}`, bytes: Number(file.size) });
              }
            }
          }
        }
      } catch (e) {
        console.error('[Models] could not scan local models', e);
      }
      const fs = await RNFS.getFSInfo().catch(() => null);
      if (cancelled) return;
      setLocal(found);
      setStorageFree(fs?.freeSpace ?? null);
    })();
    return () => { cancelled = true; };
  }, []);

  const test = useCallback(async (provider: string) => {
    setTests((s) => ({ ...s, [provider]: { status: 'testing' } }));
    try {
      const config = provider === current.provider ? llmPreferences.config : await restore(provider);
      if (!config) throw new Error(t('nex.models.no_saved_config'));
      const problem = validateProviderConnection(provider, config);
      if (problem) throw new Error(problem);
      // Real request: ask the provider to list its models. Success means the server answered with this key/URL.
      const models = await (getLLM(provider, config) as any).availableModels();
      const count = Array.isArray(models) ? models.length : 0;
      setTests((s) => ({ ...s, [provider]: { status: 'ok', count } }));
    } catch (e) {
      setTests((s) => ({ ...s, [provider]: { status: 'error', message: (e as Error)?.message || t('nex.common.something_wrong') } }));
    }
  }, [current.provider, llmPreferences.config, restore, t]);

  const activate = useCallback(async (provider: string) => {
    const config = await restore(provider);
    if (!config) return showToast(t('nex.models.no_saved_config'));
    await updateLLMPreference(provider, config);
    showToast(t('nex.models.switched', { name: providerDisplayName(provider) }));
  }, [restore, updateLLMPreference, t]);

  const unload = useCallback(async () => {
    setUnloading(true);
    try {
      // Frees the RAM held by llama.rn; the next message loads the model again
      await (LLMProvider as any)?.unloadModel?.();
      showToast(t('nex.models.unloaded'));
    } catch (e) {
      console.error('[Models] unload failed', e);
      showToast(t('nex.models.unload_failed'));
    } finally {
      setUnloading(false);
      forceRender((n) => n + 1);
    }
  }, [LLMProvider, t]);

  const deviceMemory = getDeviceMemory();
  const configure = () => resetTo(navigation, PATHS.user_settings, { page: 'advanced_model_preferences' });

  return (
    <NexScreen title={t('nex.nav.models')} activeTab="models">
      <NexSectionHeader title={t('nex.models.active')} />
      <NexCard>
        {current.configured ? (
          <NexRow
            icon={<NexIconTile tint={NEX.violet}><Cpu size={22} color={NEX.violet} /></NexIconTile>}
            title={current.model || current.providerName}
            subtitle={current.model ? current.providerName : t('nex.home.no_model_selected')}
            trailing={current.isLocal ? <NexBadge tone={current.loaded ? 'success' : 'neutral'} label={current.loaded ? t('nex.models.loaded') : t('nex.models.not_loaded')} /> : <NexBadge tone="brand" label={t('nex.models.cloud')} />}
          />
        ) : (
          <Text style={styles.muted}>{t('nex.home.no_provider_hint')}</Text>
        )}
        {current.isLocal && current.loaded ? (
          <NexButton variant="secondary" label={t('nex.models.unload')} loading={unloading} onPress={unload} style={{ marginTop: 12 }} />
        ) : null}
        <NexButton label={t('nex.models.change_provider')} icon={<Plug size={18} color={NEX.onCyan} />} onPress={configure} style={{ marginTop: 12 }} />
      </NexCard>

      <NexSectionHeader title={t('nex.models.providers')} />
      {providers.length === 0 ? <Text style={styles.muted}>{t('nex.models.no_providers')}</Text> : providers.map((provider) => {
        const state = tests[provider];
        const active = provider === current.provider;
        return (
          <NexCard key={provider} style={{ marginBottom: 10 }}>
            <NexRow
              title={providerDisplayName(provider)}
              subtitle={active ? current.model || undefined : undefined}
              trailing={active ? <NexBadge tone="brand" label={t('nex.models.in_use')} /> : undefined}
            />
            {state?.status === 'ok' ? <Text style={[styles.result, { color: NEX.success }]}>{t('nex.models.test_ok', { count: state.count })}</Text> : null}
            {state?.status === 'error' ? <Text style={[styles.result, { color: NEX.danger }]}>{t('nex.models.test_failed', { message: state.message })}</Text> : null}
            <View style={styles.actions}>
              <NexButton compact variant="secondary" label={t('nex.models.test')} loading={state?.status === 'testing'} onPress={() => test(provider)} style={{ flex: 1 }} />
              {!active ? <NexButton compact label={t('nex.models.use')} onPress={() => activate(provider)} style={{ flex: 1 }} /> : null}
              <NexButton compact variant="ghost" label={t('nex.models.configure')} onPress={configure} />
            </View>
          </NexCard>
        );
      })}

      <NexSectionHeader title={t('nex.models.local')} />
      <NexCard>
        {local === null ? <Text style={styles.muted}>{t('nex.common.loading')}</Text> : local.length === 0 ? (
          <Text style={styles.muted}>{t('nex.models.no_local')}</Text>
        ) : local.map((m, i) => (
          <View key={m.modelId}>
            {i > 0 ? <NexDivider /> : null}
            <NexRow icon={<NexIconTile size={36}><HardDrives size={18} color={NEX.cyan} /></NexIconTile>} title={m.name} subtitle={formatBytes(m.bytes)} trailing={<View style={{ alignItems: 'flex-end', gap: 4 }}><NexBadge tone="success" label={t('nex.models.on_disk')} />{(() => { const fit = memoryFitForSize(m.bytes, deviceMemory); return fit && fit !== 'ok' ? <NexBadge tone={fit === 'impossible' ? 'danger' : 'warning'} label={t(MEMORY_FIT_LABELS[fit].compact)} /> : null; })()}</View>} />
          </View>
        ))}
        {storageFree != null ? <Text style={[styles.muted, { marginTop: 10 }]}>{t('nex.models.free_space', { free: formatBytes(storageFree) })}</Text> : null}
        <NexButton variant="secondary" label={t('nex.models.manage_local')} onPress={configure} style={{ marginTop: 12 }} />
        <Text style={styles.note}>{t('nex.models.local_note')}</Text>
      </NexCard>

      <NexSectionHeader title={t('nex.models.device')} />
      <NexCard>
        <NexRow title={t('nex.models.ram')} trailing={<Text style={styles.value}>{totalRam != null ? formatBytes(totalRam) : '—'}</Text>} />
        <NexRow title={t('nex.models.storage_free')} trailing={<Text style={styles.value}>{storageFree != null ? formatBytes(storageFree) : '—'}</Text>} />
        <NexDivider />
        <Text style={styles.howtoTitle}>{t('nex.models.howto_title')}</Text>
        <Text style={styles.note}>{t('nex.models.howto_1')}</Text>
        <Text style={styles.note}>{t('nex.models.howto_2')}</Text>
        <Text style={styles.note}>{t('nex.models.howto_3')}</Text>
        <Text style={styles.note}>{t('nex.models.howto_4')}</Text>
        <Text style={styles.howtoTitle}>{t('nex.models.import_title')}</Text>
        <Text style={styles.note}>{t('nex.models.import_1')}</Text>
        <Text style={styles.note}>{t('nex.models.import_2')}</Text>
      </NexCard>
    </NexScreen>
  );
}

const styles = StyleSheet.create({
  muted: { color: NEX.textSecondary, fontSize: 14 },
  note: { color: NEX.textSecondary, fontSize: 12, marginTop: 10, lineHeight: 17 },
  value: { color: NEX.cyan, fontSize: 15, fontWeight: '700' },
  howtoTitle: { color: NEX.text, fontSize: 14, fontWeight: '600', marginTop: 12 },
  result: { fontSize: 13, marginTop: 4, marginBottom: 6 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 10, alignItems: 'center' },
});
