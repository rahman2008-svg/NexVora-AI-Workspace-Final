import React from 'react';
import {
  ActivityIndicator,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { MagnifyingGlass, X } from 'phosphor-react-native';
import { NEX, NEX_GRADIENT, NEX_RADIUS } from './tokens';

/** Rounded surface used for every grouped block of content. */
export function NexCard({
  children,
  style,
  onPress,
  accessibilityLabel,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  accessibilityLabel?: string;
}) {
  if (onPress) {
    return (
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        activeOpacity={0.8}
        onPress={onPress}
        style={[styles.card, style]}>
        {children}
      </TouchableOpacity>
    );
  }
  return <View style={[styles.card, style]}>{children}</View>;
}

/** Section title with an optional action ("See all"). */
export function NexSectionHeader({
  title,
  actionLabel,
  onAction,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle} accessibilityRole="header">
        {title}
      </Text>
      {actionLabel && onAction ? (
        <TouchableOpacity onPress={onAction} hitSlop={10} accessibilityRole="button">
          <Text style={styles.sectionAction}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

/** Primary buttons use the brand gradient; every button has a visible loading state. */
export function NexButton({
  label,
  onPress,
  icon,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  compact = false,
}: {
  label: string;
  onPress: () => void;
  icon?: React.ReactNode;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  compact?: boolean;
}) {
  const inactive = disabled || loading;
  const textColor =
    variant === 'primary' ? NEX.onCyan : variant === 'danger' ? NEX.danger : NEX.text;
  const content = (
    <View style={[styles.buttonInner, compact && styles.buttonCompact]}>
      {loading ? <ActivityIndicator size="small" color={textColor} /> : icon}
      <Text style={[styles.buttonLabel, { color: textColor }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: inactive, busy: loading }}
      activeOpacity={0.85}
      disabled={inactive}
      onPress={onPress}
      style={[{ opacity: inactive ? 0.55 : 1 }, style]}>
      {variant === 'primary' ? (
        <LinearGradient
          colors={[...NEX_GRADIENT.brand]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.buttonShape}>
          {content}
        </LinearGradient>
      ) : (
        <View
          style={[
            styles.buttonShape,
            variant === 'secondary' && styles.buttonSecondary,
            variant === 'danger' && styles.buttonDanger,
            variant === 'ghost' && styles.buttonGhost,
          ]}>
          {content}
        </View>
      )}
    </TouchableOpacity>
  );
}

/** Small rounded label: "Embedded", "Connected", "PDF", ... */
export function NexBadge({
  label,
  tone = 'neutral',
}: {
  label: string;
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'brand';
}) {
  const color =
    tone === 'success' ? NEX.success
      : tone === 'warning' ? NEX.warning
        : tone === 'danger' ? NEX.danger
          : tone === 'brand' ? NEX.cyan
            : NEX.textSecondary;
  return (
    <View style={[styles.badge, { borderColor: color }]}>
      <Text style={[styles.badgeText, { color }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

/** Icon in a soft tinted square, used at the start of rows and shortcut tiles. */
export function NexIconTile({
  children,
  tint = NEX.cyan,
  size = 40,
}: {
  children: React.ReactNode;
  tint?: string;
  size?: number;
}) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: NEX_RADIUS.md,
        backgroundColor: `${tint}22`,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      {children}
    </View>
  );
}

/** List row: icon, title + subtitle, optional trailing element. */
export function NexRow({
  icon,
  title,
  subtitle,
  trailing,
  onPress,
  onLongPress,
  accessibilityLabel,
}: {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  trailing?: React.ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  accessibilityLabel?: string;
}) {
  const body = (
    <View style={styles.row}>
      {icon}
      <View style={styles.rowText}>
        <Text style={styles.rowTitle} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.rowSubtitle} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {trailing}
    </View>
  );
  if (!onPress && !onLongPress) return body;
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      activeOpacity={0.75}
      onPress={onPress}
      onLongPress={onLongPress}>
      {body}
    </TouchableOpacity>
  );
}

export function NexDivider() {
  return <View style={styles.divider} />;
}

/** Search field with a clear button. */
export function NexSearchInput({
  value,
  onChangeText,
  placeholder,
  autoFocus,
  ...rest
}: { value: string; onChangeText: (text: string) => void; placeholder: string } & Omit<TextInputProps, 'value' | 'onChangeText' | 'placeholder'>) {
  return (
    <View style={styles.search}>
      <MagnifyingGlass size={18} color={NEX.textSecondary} />
      <TextInput
        {...rest}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={NEX.textSecondary}
        autoFocus={autoFocus}
        autoCorrect={false}
        returnKeyType="search"
        style={styles.searchInput}
        accessibilityLabel={placeholder}
      />
      {value.length > 0 ? (
        <TouchableOpacity onPress={() => onChangeText('')} hitSlop={10} accessibilityLabel="Clear">
          <X size={16} color={NEX.textSecondary} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

/** Horizontally scrolling-friendly filter chip. */
export function NexChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      activeOpacity={0.8}
      style={[styles.chip, selected && styles.chipSelected]}>
      <Text style={[styles.chipText, selected && { color: NEX.onCyan }]}>{label}</Text>
    </TouchableOpacity>
  );
}

/** Centered empty / error / loading state. */
export function NexEmptyState({
  icon,
  title,
  message,
  actionLabel,
  onAction,
  loading,
}: {
  icon?: React.ReactNode;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  loading?: boolean;
}) {
  return (
    <View style={styles.empty}>
      {loading ? <ActivityIndicator size="large" color={NEX.cyan} /> : icon}
      <Text style={styles.emptyTitle}>{title}</Text>
      {message ? <Text style={styles.emptyMessage}>{message}</Text> : null}
      {actionLabel && onAction ? <NexButton label={actionLabel} onPress={onAction} compact /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: NEX.card,
    borderRadius: NEX_RADIUS.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: NEX.border,
    padding: 16,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 24, marginBottom: 10 },
  sectionTitle: { color: NEX.text, fontSize: 17, fontWeight: '600' },
  sectionAction: { color: NEX.cyan, fontSize: 14, fontWeight: '500' },
  buttonShape: { borderRadius: NEX_RADIUS.md, minHeight: 48, justifyContent: 'center' },
  buttonInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 18, paddingVertical: 12 },
  buttonCompact: { paddingVertical: 8, paddingHorizontal: 14 },
  buttonLabel: { fontSize: 15, fontWeight: '600' },
  buttonSecondary: { backgroundColor: NEX.card, borderWidth: StyleSheet.hairlineWidth, borderColor: NEX.border },
  buttonDanger: { backgroundColor: 'rgba(248, 113, 113, 0.12)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(248, 113, 113, 0.4)' },
  buttonGhost: { backgroundColor: 'transparent' },
  badge: { borderWidth: 1, borderRadius: NEX_RADIUS.pill, paddingHorizontal: 8, paddingVertical: 2, alignSelf: 'flex-start' },
  badgeText: { fontSize: 11, fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  rowText: { flex: 1 },
  rowTitle: { color: NEX.text, fontSize: 15, fontWeight: '500' },
  rowSubtitle: { color: NEX.textSecondary, fontSize: 13, marginTop: 2 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: NEX.border },
  search: {
    flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: NEX.surface, borderRadius: NEX_RADIUS.md,
    borderWidth: StyleSheet.hairlineWidth, borderColor: NEX.border, paddingHorizontal: 14, minHeight: 48,
  },
  searchInput: { flex: 1, color: NEX.text, fontSize: 15, paddingVertical: 10 },
  chip: { borderRadius: NEX_RADIUS.pill, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: NEX.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: NEX.border },
  chipSelected: { backgroundColor: NEX.cyan, borderColor: NEX.cyan },
  chipText: { color: NEX.textSecondary, fontSize: 13, fontWeight: '600' },
  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, paddingHorizontal: 24, gap: 12 },
  emptyTitle: { color: NEX.text, fontSize: 17, fontWeight: '600', textAlign: 'center' },
  emptyMessage: { color: NEX.textSecondary, fontSize: 14, textAlign: 'center', lineHeight: 20 },
});
