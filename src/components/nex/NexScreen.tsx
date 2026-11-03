import React, { useCallback } from 'react';
import { BackHandler, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { DrawerActions, useFocusEffect, useNavigation } from '@react-navigation/native';
import { useDrawerStatus } from '@react-navigation/drawer';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { List } from 'phosphor-react-native';
import { useTranslation } from 'react-i18next';
import { PATHS } from '@/utils/paths';
import useRedirect from '@/hooks/useRedirect';
import { BottomTabKey, resetTo } from '@/utils/nex/navigation';
import NexBottomBar from './NexBottomBar';
import NexOfflineBanner from './NexOfflineBanner';
import { NEX, NEX_GRADIENT } from './tokens';

/**
 * Frame shared by every NexVora screen: brand background, header with the drawer button, optional
 * pull-to-refresh, optional bottom navigation. Android back goes to Home unless this screen IS Home.
 */
export default function NexScreen({
  title,
  subtitle,
  children,
  headerRight,
  activeTab,
  showBottomBar = true,
  scroll = true,
  isHome = false,
  refreshing,
  onRefresh,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  headerRight?: React.ReactNode;
  activeTab?: BottomTabKey;
  showBottomBar?: boolean;
  /** false when the body is its own FlatList/ScrollView */
  scroll?: boolean;
  isHome?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
}) {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const drawerOpen = useDrawerStatus() === 'open';
  // Same app-wide REDIRECT events every screen of the original app listens for
  useRedirect();

  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        // Back first closes the drawer, then (on sub-screens) returns Home; on Home it exits the app as usual.
        if (drawerOpen) {
          navigation.dispatch(DrawerActions.closeDrawer());
          return true;
        }
        if (isHome) return false;
        resetTo(navigation, PATHS.home);
        return true;
      });
      return () => sub.remove();
    }, [isHome, navigation, drawerOpen]),
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <LinearGradient
        pointerEvents="none"
        colors={[...NEX_GRADIENT.glow]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.glow}
      />
      <View style={styles.header}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={t('nex.nav.menu')}
          hitSlop={10}
          onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
          style={styles.menuButton}>
          <List size={24} color={NEX.text} />
        </TouchableOpacity>
        <View style={styles.titleWrap}>
          <Text style={styles.title} numberOfLines={1} accessibilityRole="header">
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        <View style={styles.headerRight}>{headerRight}</View>
      </View>

      <NexOfflineBanner />

      {scroll ? (
        <ScrollView
          style={styles.body}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          refreshControl={
            onRefresh ? (
              <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={NEX.cyan} colors={[NEX.cyan]} />
            ) : undefined
          }>
          {children}
        </ScrollView>
      ) : (
        <View style={styles.body}>{children}</View>
      )}

      {showBottomBar ? <NexBottomBar active={activeTab} /> : <View style={{ height: insets.bottom }} />}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: NEX.background },
  glow: { position: 'absolute', top: 0, left: 0, right: 0, height: 260 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  menuButton: {
    width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    backgroundColor: NEX.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: NEX.border,
  },
  titleWrap: { flex: 1 },
  title: { color: NEX.text, fontSize: 22, fontWeight: '700' },
  subtitle: { color: NEX.textSecondary, fontSize: 13, marginTop: 1 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  body: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 32 },
});
