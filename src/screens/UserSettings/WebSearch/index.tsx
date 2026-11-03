import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft } from 'phosphor-react-native';
import { useTranslation } from 'react-i18next';
import useHighjackBackButtonPress from '@/hooks/useHighjackBackButtonPress';
import { NexButton, NexCard, NexChip } from '@/components/nex/primitives';
import { NEX } from '@/components/nex/tokens';
import { showToast } from '@/utils/Notification';
import ToolsManager from '@/utils/ToolsManager';
import webSearchTool from '@/utils/ToolsManager/tools/webSearch';
import { clearWebSearchConfig, getWebSearchConfig, saveWebSearchConfig, validateSearxngUrl, type WebSearchProvider } from '@/utils/ToolsManager/tools/webSearch/config';
import { IWorkspacePageKey } from '../index';

/**
 * Settings > Web search. Web search is OFF until a provider is chosen here. The app ships no search proxy and no
 * shared credentials. Queries go ONLY to the provider selected below; the API key (if any) is kept in the keychain.
 */
export default function WebSearchSettings({ goToPage }: { goToPage: (page: IWorkspacePageKey) => void }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [provider, setProvider] = useState<WebSearchProvider | null>(null);
  const [baseUrl, setBaseUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  const goBack = () => { goToPage('main'); return true; };
  useHighjackBackButtonPress(goBack);

  useEffect(() => {
    getWebSearchConfig().then((c) => { setProvider(c.provider); setBaseUrl(c.baseUrl ?? ''); setApiKey(c.apiKey); });
  }, []);

  const validate = (): boolean => {
    if (!provider) { setError(t('nex.web_search.choose_provider')); return false; }
    if (provider === 'searxng') {
      const problem = validateSearxngUrl(baseUrl);
      if (problem) { setError(problem); return false; }
    }
    setError(null);
    return true;
  };

  const save = async () => {
    if (!validate()) return;
    await saveWebSearchConfig({ provider, baseUrl: provider === 'searxng' ? baseUrl : undefined, apiKey });
    ToolsManager.resetTools();
    showToast(t('nex.web_search.saved'));
  };

  const test = async () => {
    if (!validate()) return;
    setTesting(true);
    setTestResult(null);
    try {
      const config = { provider, baseUrl: provider === 'searxng' ? baseUrl.trim().replace(/\/+$/, '') : undefined, apiKey: apiKey.trim() };
      const found = provider === 'you' ? await webSearchTool._youSearch('NexVora test', config) : await webSearchTool._searXNG('NexVora test', config as any);
      setTestResult(found === null ? { ok: false, message: t('nex.web_search.test_failed') } : { ok: true, message: t('nex.web_search.test_ok', { count: found.length }) });
    } finally {
      setTesting(false);
    }
  };

  const remove = async () => {
    await clearWebSearchConfig();
    ToolsManager.resetTools();
    setProvider(null); setBaseUrl(''); setApiKey(''); setTestResult(null);
    showToast(t('nex.web_search.removed'));
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} hitSlop={10} accessibilityRole="button" accessibilityLabel={t('common.back')}>
          <ArrowLeft size={24} color={NEX.text} weight="bold" />
        </TouchableOpacity>
        <Text style={styles.title}>{t('nex.web_search.title')}</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 32 }} keyboardShouldPersistTaps="handled">
        <NexCard>
          <Text style={styles.body}>{t('nex.web_search.explainer')}</Text>
        </NexCard>

        <Text style={styles.label}>{t('nex.web_search.provider')}</Text>
        <View style={styles.chips}>
          <NexChip label={t('nex.web_search.provider_searxng')} selected={provider === 'searxng'} onPress={() => setProvider('searxng')} />
          <NexChip label={t('nex.web_search.provider_you')} selected={provider === 'you'} onPress={() => setProvider('you')} />
        </View>

        {provider === 'searxng' ? (
          <>
            <Text style={styles.label}>{t('nex.web_search.url')}</Text>
            <TextInput value={baseUrl} onChangeText={setBaseUrl} placeholder="https://search.example.com" placeholderTextColor={NEX.textSecondary} autoCapitalize="none" autoCorrect={false} keyboardType="url" style={styles.input} accessibilityLabel={t('nex.web_search.url')} />
            <Text style={styles.hint}>{t('nex.web_search.searxng_hint')}</Text>
          </>
        ) : null}
        {provider ? (
          <>
            <Text style={styles.label}>{provider === 'you' ? t('nex.web_search.key_you') : t('nex.web_search.key_searxng')}</Text>
            <TextInput value={apiKey} onChangeText={setApiKey} secureTextEntry autoCapitalize="none" autoCorrect={false} placeholder={t('nex.web_search.key_placeholder')} placeholderTextColor={NEX.textSecondary} style={styles.input} accessibilityLabel={t('nex.web_search.key_you')} />
            <Text style={styles.hint}>{provider === 'you' ? t('nex.web_search.you_hint') : t('nex.web_search.key_stored')}</Text>
            <Text style={styles.disclosure}>{t(provider === 'you' ? 'nex.web_search.sends_you' : 'nex.web_search.sends_searxng')}</Text>
          </>
        ) : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {testResult ? <Text style={[styles.result, { color: testResult.ok ? NEX.success : NEX.danger }]}>{testResult.message}</Text> : null}

        <View style={styles.actions}>
          <NexButton label={t('common.save')} onPress={save} style={{ flex: 1 }} />
          <NexButton variant="secondary" label={t('nex.models.test')} loading={testing} onPress={test} style={{ flex: 1 }} />
        </View>
        <NexButton variant="danger" label={t('nex.web_search.remove')} onPress={remove} style={{ marginTop: 12 }} />
        <Text style={styles.hint}>{t('nex.web_search.then_enable')}</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: NEX.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 16, paddingVertical: 14 },
  title: { color: NEX.text, fontSize: 20, fontWeight: '700' },
  body: { color: NEX.text, fontSize: 14, lineHeight: 20 },
  label: { color: NEX.textSecondary, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', marginTop: 18, marginBottom: 8 },
  chips: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  input: { color: NEX.text, backgroundColor: NEX.surface, borderRadius: 14, paddingHorizontal: 14, minHeight: 48, fontSize: 15, borderWidth: StyleSheet.hairlineWidth, borderColor: NEX.border },
  hint: { color: NEX.textSecondary, fontSize: 12, marginTop: 8, lineHeight: 17 },
  disclosure: { color: NEX.warning, fontSize: 12, marginTop: 8, lineHeight: 17 },
  error: { color: NEX.danger, marginTop: 12 },
  result: { marginTop: 12, fontSize: 14 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 20 },
});
