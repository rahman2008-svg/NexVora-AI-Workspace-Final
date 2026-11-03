import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { NexButton } from './primitives';
import { NEX, NEX_RADIUS } from './tokens';

/** Small modal asking for one line of text (rename dialogs). */
export default function NexTextPrompt({
  visible,
  title,
  initialValue,
  confirmLabel,
  error,
  onCancel,
  onConfirm,
}: {
  visible: boolean;
  title: string;
  initialValue: string;
  confirmLabel: string;
  error?: string | null;
  onCancel: () => void;
  onConfirm: (value: string) => void;
}) {
  const { t } = useTranslation();
  const [value, setValue] = useState(initialValue);
  useEffect(() => { if (visible) setValue(initialValue); }, [visible, initialValue]);
  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onCancel} statusBarTranslucent>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <Pressable style={styles.backdrop} onPress={onCancel}>
          <Pressable style={styles.dialog} onPress={() => { }}>
            <Text style={styles.title}>{title}</Text>
            <TextInput
              value={value}
              onChangeText={setValue}
              autoFocus
              maxLength={100}
              style={styles.input}
              placeholderTextColor={NEX.textSecondary}
              returnKeyType="done"
              onSubmitEditing={() => onConfirm(value.trim())}
              accessibilityLabel={title}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <View style={styles.actions}>
              <NexButton variant="ghost" compact label={t('common.cancel')} onPress={onCancel} />
              <NexButton compact label={confirmLabel} onPress={() => onConfirm(value.trim())} />
            </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 24 },
  dialog: { backgroundColor: NEX.surface, borderRadius: NEX_RADIUS.lg, padding: 20, borderWidth: StyleSheet.hairlineWidth, borderColor: NEX.border },
  title: { color: NEX.text, fontSize: 18, fontWeight: '700', marginBottom: 14 },
  input: { color: NEX.text, backgroundColor: NEX.card, borderRadius: NEX_RADIUS.md, paddingHorizontal: 14, minHeight: 48, fontSize: 15 },
  error: { color: NEX.danger, fontSize: 13, marginTop: 8 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 16 },
});
