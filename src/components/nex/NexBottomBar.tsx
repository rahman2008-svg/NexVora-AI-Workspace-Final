import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Cpu, FileText, Folders, House, MagnifyingGlass } from 'phosphor-react-native';
import { BOTTOM_TABS, BottomTabKey, resetTo } from '@/utils/nex/navigation';
import { NEX, NEX_BOTTOM_BAR_HEIGHT } from './tokens';

const ICONS = {
  home: House,
  workspaces: Folders,
  documents: FileText,
  models: Cpu,
  search: MagnifyingGlass,
} as const;

/**
 * Bottom navigation for the five main destinations. Other sections (Agents, Scheduled tasks, Chat
 * history, Settings, Profile, About) live in the drawer, which every screen opens from its header.
 */
export default function NexBottomBar({ active }: { active?: BottomTabKey }) {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingBottom: insets.bottom, height: NEX_BOTTOM_BAR_HEIGHT + insets.bottom }]}>
      {BOTTOM_TABS.map((tab) => {
        const Icon = ICONS[tab.key];
        const selected = tab.key === active;
        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tab}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={t(`nex.nav.${tab.key}`)}
            activeOpacity={0.7}
            onPress={() => {
              if (!selected) resetTo(navigation, tab.path);
            }}>
            <Icon size={24} weight={selected ? 'fill' : 'regular'} color={selected ? NEX.cyan : NEX.textSecondary} />
            <Text style={[styles.label, selected && { color: NEX.cyan }]} numberOfLines={1}>
              {t(`nex.nav.${tab.key}`)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: NEX.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: NEX.border,
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3, paddingTop: 6 },
  label: { color: NEX.textSecondary, fontSize: 11, fontWeight: '600' },
});
