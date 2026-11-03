import React from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import DeviceInfo from 'react-native-device-info';
import LinearGradient from 'react-native-linear-gradient';
import { useTranslation } from 'react-i18next';
import { EnvelopeSimple, FacebookLogo, InstagramLogo, ShieldCheck, WhatsappLogo } from 'phosphor-react-native';
import NexScreen from '@/components/nex/NexScreen';
import { NexCard, NexDivider, NexIconTile, NexRow, NexSectionHeader } from '@/components/nex/primitives';
import { NEX, NEX_GRADIENT } from '@/components/nex/tokens';
import { resetTo } from '@/utils/nex/navigation';
import { PATHS } from '@/utils/paths';
import { showToast } from '@/utils/Notification';
import { BRAND } from '@/utils/nex/brand';

async function open(url: string, failed: string) {
  try {
    await Linking.openURL(url);
  } catch {
    showToast(failed);
  }
}

export default function About() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const version = DeviceInfo.getVersion();
  const fail = t('nex.about.cannot_open');

  return (
    <NexScreen title={t('nex.nav.about')}>
      <LinearGradient colors={[...NEX_GRADIENT.brand]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
        <Text style={styles.heroName}>{BRAND.appName}</Text>
        <Text style={styles.heroTag}>{BRAND.tagline}</Text>
        <Text style={styles.heroVersion}>{t('nex.about.version', { version })}</Text>
      </LinearGradient>

      <NexSectionHeader title={t('nex.about.app_info')} />
      <NexCard>
        <NexRow title={t('nex.about.developer')} subtitle={BRAND.developer} />
        <NexDivider />
        <NexRow title={t('nex.about.company')} subtitle={BRAND.company} />
        <NexDivider />
        <NexRow title={t('nex.about.package')} subtitle={DeviceInfo.getBundleId()} />
      </NexCard>

      <NexSectionHeader title={t('nex.about.contact')} />
      <NexCard>
        {BRAND.whatsapp.map((number) => (
          <View key={number}>
            <NexRow icon={<NexIconTile size={36}><WhatsappLogo size={18} color={NEX.cyan} /></NexIconTile>} title={`WhatsApp: ${number}`} onPress={() => open(`https://wa.me/${BRAND.whatsappIntl(number)}`, fail)} />
            <NexDivider />
          </View>
        ))}
        <NexRow icon={<NexIconTile size={36}><FacebookLogo size={18} color={NEX.cyan} /></NexIconTile>} title="Facebook" subtitle={BRAND.facebook} onPress={() => open(BRAND.facebook, fail)} />
        <NexDivider />
        <NexRow icon={<NexIconTile size={36}><InstagramLogo size={18} color={NEX.cyan} /></NexIconTile>} title="Instagram" subtitle={BRAND.instagram} onPress={() => open(BRAND.instagram, fail)} />
        <NexDivider />
        <NexRow icon={<NexIconTile size={36}><EnvelopeSimple size={18} color={NEX.cyan} /></NexIconTile>} title={t('nex.about.email')} subtitle={BRAND.email} onPress={() => open(`mailto:${BRAND.email}`, fail)} />
      </NexCard>

      <NexSectionHeader title={t('nex.about.credits')} />
      <NexCard>
        <Text style={styles.body}>{t('nex.about.developed_by', { name: BRAND.developer })}</Text>
        <Text style={styles.body}>{t('nex.about.published_by', { company: BRAND.company })}</Text>
        <Text style={styles.body}>{BRAND.copyright}</Text>
      </NexCard>

      <NexSectionHeader title={t('nex.about.license')} />
      <NexCard>
        <Text style={styles.body}>{t('nex.about.license_text')}</Text>
        <Text style={[styles.body, { marginTop: 10 }]}>{t('nex.about.upstream_text')}</Text>
        <NexDivider />
        <NexRow title={t('nex.about.gpl_link')} subtitle="gnu.org/licenses/gpl-3.0" onPress={() => open('https://www.gnu.org/licenses/gpl-3.0.html', fail)} />
        <NexDivider />
        <NexRow title={t('nex.about.upstream_link')} subtitle="github.com/Mintplex-Labs/anythingllm-mobile" onPress={() => open('https://github.com/Mintplex-Labs/anythingllm-mobile', fail)} />
        <NexDivider />
        <Text style={[styles.body, { marginTop: 10 }]}>{t('nex.about.source_text')}</Text>
      </NexCard>

      <NexSectionHeader title={t('nex.about.privacy')} />
      <NexCard>
        <NexRow icon={<NexIconTile size={36}><ShieldCheck size={18} color={NEX.cyan} /></NexIconTile>} title={t('nex.profile.external_services')} subtitle={t('nex.about.privacy_hint')} onPress={() => resetTo(navigation, PATHS.profile)} />
      </NexCard>
    </NexScreen>
  );
}

const styles = StyleSheet.create({
  hero: { borderRadius: 20, padding: 22, marginTop: 4 },
  heroName: { color: NEX.onCyan, fontSize: 24, fontWeight: '800' },
  heroTag: { color: NEX.onCyan, fontSize: 14, marginTop: 4, fontWeight: '500' },
  heroVersion: { color: NEX.onCyan, fontSize: 13, marginTop: 10, opacity: 0.8 },
  body: { color: NEX.text, fontSize: 14, lineHeight: 21 },
});
