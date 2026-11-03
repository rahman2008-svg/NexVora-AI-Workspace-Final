/**
 * NexVora AI Workspace design tokens (Phase 2).
 * Keep in sync with `global.css` (:root variables) and `src/utils/theme.ts`.
 */
export const NEX = {
  cyan: '#22D3EE',
  violet: '#8B5CF6',
  background: '#090B14',
  surface: '#141827',
  card: '#1B2233',
  cardPressed: '#222B40',
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  border: 'rgba(148, 163, 184, 0.16)',
  danger: '#F87171',
  success: '#34D399',
  warning: '#FBBF24',
  onCyan: '#04202A',
} as const;

export const NEX_GRADIENT = {
  /** Brand gradient: cyan -> violet */
  brand: [NEX.cyan, NEX.violet],
  /** Soft header glow */
  glow: ['rgba(34, 211, 238, 0.16)', 'rgba(139, 92, 246, 0.10)', 'rgba(9, 11, 20, 0)'],
} as const;

export const NEX_RADIUS = { sm: 10, md: 14, lg: 20, pill: 999 } as const;
export const NEX_SPACE = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

/** Height of the bottom navigation bar, excluding the system inset. */
export const NEX_BOTTOM_BAR_HEIGHT = 64;
