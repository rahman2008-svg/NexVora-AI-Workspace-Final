import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ChatCircleText, ClockCountdown, Cpu, FileText, Folders, GearSix, House, Info, MagnifyingGlass, Robot, Chats, UserCircle } from 'phosphor-react-native';
import { PATHS } from '@/utils/paths';
import { resolveDefaultChatRoute } from '@/utils/defaultChatRoute';
import { startNewChat } from '@/utils/nex/actions';
import { openChat, resetTo } from '@/utils/nex/navigation';
import { NEX } from './tokens';

/** Section list at the top of the drawer. Workspaces and their threads stay below it. */
export default function NexDrawerNav({ navigation, unseenJobRuns }: { navigation: any; unseenJobRuns: number }) {
  const { t } = useTranslation();

  const openLastChat = async () => {
    const route = await resolveDefaultChatRoute();
    if (route) return openChat(navigation, route.wsSlug, route.threadSlug);
    // No conversation yet: start one, or go Home (where a workspace can be created) when there is no workspace
    if (!(await startNewChat(navigation))) resetTo(navigation, PATHS.home);
  };

  const items = [
    { key: 'home', label: t('nex.nav.home'), icon: House, onPress: () => resetTo(navigation, PATHS.home) },
    { key: 'chat', label: t('nex.nav.ai_chat'), icon: ChatCircleText, onPress: openLastChat },
    { key: 'workspaces', label: t('nex.nav.workspaces'), icon: Folders, onPress: () => resetTo(navigation, PATHS.workspaces) },
    { key: 'documents', label: t('nex.nav.documents'), icon: FileText, onPress: () => resetTo(navigation, PATHS.documents) },
    { key: 'agents', label: t('nex.nav.agents'), icon: Robot, onPress: () => resetTo(navigation, PATHS.agents) },
    { key: 'models', label: t('nex.nav.models'), icon: Cpu, onPress: () => resetTo(navigation, PATHS.models) },
    { key: 'search', label: t('nex.nav.search'), icon: MagnifyingGlass, onPress: () => resetTo(navigation, PATHS.search) },
    { key: 'tasks', label: t('nex.nav.scheduled_tasks'), icon: ClockCountdown, badge: unseenJobRuns, onPress: () => resetTo(navigation, PATHS.scheduled_jobs) },
    { key: 'history', label: t('nex.nav.chat_history'), icon: Chats, onPress: () => resetTo(navigation, PATHS.chat_history) },
    { key: 'settings', label: t('nex.nav.settings'), icon: GearSix, onPress: () => resetTo(navigation, PATHS.user_settings) },
    { key: 'profile', label: t('nex.nav.profile'), icon: UserCircle, onPress: () => resetTo(navigation, PATHS.profile) },
    { key: 'about', label: t('nex.nav.about'), icon: Info, onPress: () => resetTo(navigation, PATHS.about) },
  ] as const;

  return (
    <View style={styles.wrap}>
      {items.map((item) => {
        const Icon = item.icon;
        const badge = 'badge' in item ? item.badge : 0;
        return (
          <TouchableOpacity
            key={item.key}
            accessibilityRole="button"
            accessibilityLabel={badge ? `${item.label} (${badge})` : item.label}
            activeOpacity={0.7}
            onPress={item.onPress}
            style={styles.item}>
            <Icon size={22} color={NEX.cyan} />
            <Text style={styles.label} numberOfLines={1}>{item.label}</Text>
            {badge ? <View style={styles.badge}><Text style={styles.badgeText}>{badge > 9 ? '9+' : badge}</Text></View> : null}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 2 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 11, paddingHorizontal: 8, borderRadius: 12 },
  label: { flex: 1, color: NEX.text, fontSize: 16, fontWeight: '500' },
  badge: { minWidth: 20, height: 20, borderRadius: 10, backgroundColor: NEX.cyan, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  badgeText: { color: NEX.onCyan, fontSize: 11, fontWeight: '700' },
});
