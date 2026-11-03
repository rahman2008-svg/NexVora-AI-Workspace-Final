import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNetInfo } from '@react-native-community/netinfo';
import { useTranslation } from 'react-i18next';
import { WifiSlash } from 'phosphor-react-native';
import { NEX } from './tokens';

/**
 * Shown while the phone reports no internet connection. Local features (on-device models, search, documents)
 * keep working offline; cloud providers, web search and downloads do not.
 */
export default function NexOfflineBanner() {
  const { t } = useTranslation();
  const net = useNetInfo();
  // `isConnected` is null until the first reading arrives - only show the banner on a definite "offline".
  if (net.isConnected !== false) return null;
  return (
    <View accessibilityRole="alert" style={styles.banner}>
      <WifiSlash size={18} color={NEX.warning} />
      <Text style={styles.text}>{t('nex.common.offline')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(251, 191, 36, 0.12)', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 14, marginHorizontal: 16, marginBottom: 8 },
  text: { flex: 1, color: NEX.warning, fontSize: 13, lineHeight: 18 },
});
