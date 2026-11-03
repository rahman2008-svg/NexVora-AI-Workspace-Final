import React from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { NexButton, NexDivider, NexRow } from './primitives';
import { NEX, NEX_RADIUS } from './tokens';

export type PickerItem = { key: string; title: string; subtitle?: string };

/** Bottom-sheet style list picker (workspace chooser, provider chooser, ...). */
export default function NexPickerModal({
  visible,
  title,
  items,
  onSelect,
  onClose,
}: {
  visible: boolean;
  title: string;
  items: PickerItem[];
  onSelect: (item: PickerItem) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => { }}>
          <Text style={styles.title}>{title}</Text>
          <FlatList
            data={items}
            keyExtractor={(i) => i.key}
            ItemSeparatorComponent={NexDivider}
            style={{ maxHeight: 360 }}
            renderItem={({ item }) => <NexRow title={item.title} subtitle={item.subtitle} onPress={() => onSelect(item)} />}
          />
          <NexButton variant="ghost" label={t('common.cancel')} onPress={onClose} style={{ marginTop: 8 }} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: NEX.surface, borderTopLeftRadius: NEX_RADIUS.lg, borderTopRightRadius: NEX_RADIUS.lg, padding: 20, paddingBottom: 28 },
  title: { color: NEX.text, fontSize: 18, fontWeight: '700', marginBottom: 8 },
});
