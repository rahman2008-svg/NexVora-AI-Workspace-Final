import {
  MD3DarkTheme,
  DefaultTheme as PaperLightTheme,
  configureFonts,
} from 'react-native-paper';
import { MD3BaseColors, SemanticColors, Theme, AnythingLLMColorways } from './types';
import { withOpacity, stateLayerOpacity } from './colorUtils';
import { StyleSheet } from 'react-native';

// MD3 key colors (seed colors)
const md3BaseColors: Partial<MD3BaseColors> = {
  primary: '#0E7490',
  secondary: '#8B5CF6',
  tertiary: '#22D3EE',
  error: '#FF653F',
};

const AnythingLLMColors = (_isDark: boolean = false) => {
  // TODO: add light theme colors
  const darkThemeColors = {
    text: {
      primary: '#F8FAFC',
      secondary: '#CBD5E1',
    },
    background: {
      primary: '#090B14',
      secondary: '#141827',
      ctaBlue: '#22D3EE',
      ctaBlueProgressBar: '#22D3EE',
      ctaLightBlue: '#67E8F9',
      violet: '#8B5CF6',
    },
  };

  return darkThemeColors;
};

type ApplicationColors = MD3BaseColors & { anythingllm: AnythingLLMColorways };
const createBaseColors = (isDark: boolean): ApplicationColors => {
  const baseTheme = isDark ? MD3DarkTheme : PaperLightTheme;

  if (isDark) {
    return {
      ...baseTheme.colors,
      anythingllm: AnythingLLMColors(isDark),
      primary: '#22D3EE',
      onPrimary: '#04202A',
      primaryContainer: '#0E4F5C',
      onPrimaryContainer: '#CFF8FF',
      secondary: '#8B5CF6',
      onSecondary: '#FFFFFF',
      secondaryContainer: '#2E2163',
      onSecondaryContainer: '#E4DAFF',
      tertiary: '#67E8F9',
      onTertiary: '#014C4C',
      tertiaryContainer: '#016665',
      onTertiaryContainer: '#9EE6E5',
      error: md3BaseColors.error!,
      onError: '#4C100D',
      errorContainer: '#661511',
      onErrorContainer: '#E6ACA9',
      background: '#090B14',
      onBackground: '#F8FAFC',
      surface: '#141827',
      onSurface: '#F8FAFC',
      surfaceVariant: '#1E2338',
      onSurfaceVariant: '#CBD5E1',
      outline: '#2A3050',
      outlineVariant: '#475069',
      // Additional required MD3 colors
      surfaceDisabled: withOpacity('#333333', 0.12),
      onSurfaceDisabled: withOpacity('#e5e5e6', 0.38),
      inverseSurface: '#F8FAFC',
      inverseOnSurface: '#090B14',
      inversePrimary: '#0E7490',
      inverseSecondary: md3BaseColors.secondary!,
      shadow: '#000000',
      scrim: 'rgba(0, 0, 0, 0.35)',
      backdrop: 'rgba(9, 11, 20, 0.8)',
    };
  }

  return {
    ...baseTheme.colors,
    anythingllm: AnythingLLMColors(isDark),
    primary: md3BaseColors.primary!,
    onPrimary: '#FFFFFF',
    primaryContainer: '#DEE0E6',
    onPrimaryContainer: '#2D2F33',
    secondary: md3BaseColors.secondary!,
    onSecondary: '#FFFFFF',
    secondaryContainer: '#E0E0E0',
    onSecondaryContainer: '#424242',
    tertiary: md3BaseColors.tertiary!,
    onTertiary: '#FFFFFF',
    tertiaryContainer: '#F1F3FF',
    onTertiaryContainer: '#013332',
    error: md3BaseColors.error!,
    onError: '#FFFFFF',
    errorContainer: '#E6ACA9',
    onErrorContainer: '#330B09',
    background: '#ffffff',
    onBackground: '#111111',
    surface: '#F9FAFB',
    onSurface: '#333333',
    surfaceVariant: '#e4e4e6',
    onSurfaceVariant: '#646466',
    outline: withOpacity(md3BaseColors.primary!, 0.05),
    outlineVariant: '#a1a1a1',
    // Additional required MD3 colors
    surfaceDisabled: withOpacity('#fcfcfc', 0.12),
    onSurfaceDisabled: withOpacity('#333333', 0.38),
    inverseSurface: '#858585',
    inverseOnSurface: '#fcfcfc',
    inversePrimary: '#DEE0E6',
    inverseSecondary: '#95ABE6',
    shadow: '#000000',
    scrim: 'rgba(0, 0, 0, 0.25)',
    backdrop: 'rgba(51, 51, 51, 0.6)',
  };
};

const createSemanticColors = (
  baseColors: MD3BaseColors,
  isDark: boolean,
): SemanticColors => ({
  // Surface variants
  surfaceContainerHighest: isDark
    ? withOpacity(baseColors.surface, 0.22)
    : withOpacity(baseColors.primary, 0.05),
  surfaceContainerHigh: isDark
    ? withOpacity(baseColors.surface, 0.16)
    : withOpacity(baseColors.primary, 0.03),
  surfaceContainer: isDark
    ? withOpacity(baseColors.surface, 0.12)
    : withOpacity(baseColors.primary, 0.02),
  surfaceContainerLow: isDark
    ? withOpacity(baseColors.surface, 0.08)
    : withOpacity(baseColors.primary, 0.01),
  surfaceContainerLowest: isDark
    ? withOpacity(baseColors.surface, 0.04)
    : baseColors.surface,
  surfaceDim: isDark
    ? withOpacity(baseColors.surface, 0.06)
    : withOpacity(baseColors.primary, 0.06),
  surfaceBright: isDark
    ? withOpacity(baseColors.surface, 0.24)
    : baseColors.surface,

  border: withOpacity(baseColors.onSurface, 0.05),
  placeholder: withOpacity(baseColors.onSurface, 0.3),
  text: baseColors.onBackground,
  textSecondary: withOpacity(baseColors.onSurface, 0.5),
  inverseText: baseColors.inverseOnSurface,
  inverseTextSecondary: withOpacity(baseColors.inverseOnSurface, 0.5),

  // Interactive states
  stateLayerOpacity: 0.12,
  hoverStateOpacity: stateLayerOpacity.hover,
  pressedStateOpacity: stateLayerOpacity.pressed,
  draggedStateOpacity: stateLayerOpacity.dragged,
  focusStateOpacity: stateLayerOpacity.focus,

  // Menu specific
  menuBackground: isDark ? '#2a2a2a' : baseColors.surface,
  menuBackgroundDimmed: withOpacity(baseColors.surface, 0.9),
  menuBackgroundActive: withOpacity(baseColors.primary, 0.08),
  menuSeparator: withOpacity(baseColors.primary, 0.5),
  menuGroupSeparator: isDark
    ? withOpacity('#FFFFFF', 0.08)
    : withOpacity('#000000', 0.08),
  menuText: baseColors.onSurface,
  menuDangerText: baseColors.error,

  // Message specific
  authorBubbleBackground: isDark ? '#212121' : '#f2f2f2',
  receivedMessageDocumentIcon: baseColors.primary,
  sentMessageDocumentIcon: baseColors.onSurface,
  userAvatarImageBackground: 'transparent',
  userAvatarNameColors: [
    baseColors.primary,
    baseColors.secondary,
    baseColors.tertiary,
    baseColors.error,
  ],
  searchBarBackground: isDark
    ? 'rgba(28, 28, 30, 0.92)'
    : 'rgba(118, 118, 128, 0.12)',

  // Thinking bubble specific
  thinkingBubbleBackground: isDark ? '#142e4d' : '#f0f5fa',
  thinkingBubbleText: isDark ? '#6abaff' : '#0a5999',
  thinkingBubbleBorder: isDark
    ? 'rgba(74, 140, 199, 0.6)'
    : 'rgba(10, 89, 153, 0.4)',
  thinkingBubbleShadow: isDark ? '#4a9fff' : '#0a5999',
  thinkingBubbleChevronBackground: isDark
    ? 'rgba(74, 140, 199, 0.15)'
    : 'rgba(10, 89, 153, 0.1)',
  thinkingBubbleChevronBorder: isDark
    ? 'rgba(74, 140, 199, 0.3)'
    : 'rgba(10, 89, 153, 0.2)',
});

export const fontStyles = {
  regular: { fontFamily: 'Inter-Regular' },
  medium: { fontFamily: 'Inter-Medium' },
  bold: { fontFamily: 'Inter-Bold' },
  thin: { fontFamily: 'Inter-Thin' },
  light: { fontFamily: 'Inter-Light' },
  semibold: { fontFamily: 'Inter-SemiBold' },
  extraBold: { fontFamily: 'Inter-ExtraBold' },
  // Brand display face - headlines only (e.g. the empty chat greeting).
  display: { fontFamily: 'ClashDisplay-Medium' },
};

const baseFontVariants = configureFonts({
  config: { ...fontStyles.regular },
});

const customVariants = {
  // Add custom variants:
  bold: {
    ...baseFontVariants.bodyMedium,
    ...fontStyles.bold,
  },
  medium: {
    ...baseFontVariants.bodyMedium,
    ...fontStyles.medium,
  },
  thin: {
    ...baseFontVariants.bodyMedium,
    ...fontStyles.thin,
  },
  light: {
    ...baseFontVariants.bodyMedium,
    ...fontStyles.light,
  },
  semibold: {
    ...baseFontVariants.bodyMedium,
    ...fontStyles.semibold,
  },
} as const;

const configuredFonts = configureFonts({
  config: {
    ...baseFontVariants,
    ...customVariants,
    displayMedium: {
      ...baseFontVariants.displayMedium,
      ...fontStyles.bold,
    },
    titleSmall: {
      ...baseFontVariants.titleSmall,
      ...fontStyles.medium,
    },
  },
});

const createTheme = (isDark: boolean): Theme & { colors: ApplicationColors } => {
  const baseTheme = isDark ? MD3DarkTheme : PaperLightTheme;
  const baseColors = createBaseColors(isDark);
  const semanticColors = createSemanticColors(baseColors, isDark);

  return {
    ...baseTheme,
    colors: {
      ...baseColors,
      ...semanticColors,
    },
    borders: {
      inputBorderRadius: 16,
      messageBorderRadius: 15,
      default: 12,
    },
    fonts: {
      ...baseTheme.fonts,
      ...configuredFonts,
      titleMediumLight: {
        ...fontStyles.regular,
        fontSize: 16,
        lineHeight: 22,
      },
      dateDividerTextStyle: {
        ...fontStyles.extraBold,
        color: baseColors.onSurface,
        fontSize: 12,
        lineHeight: 16,
        opacity: 0.4,
      },
      emptyChatPlaceholderTextStyle: {
        color: baseColors.onSurface,
        fontSize: 16,
        lineHeight: 24,
        ...fontStyles.medium,
      },
      inputTextStyle: {
        fontSize: 16,
        lineHeight: 24,
        ...fontStyles.medium,
      },
      receivedMessageBodyTextStyle: {
        color: baseColors.onPrimary,
        fontSize: 16,
        lineHeight: 24,
        ...fontStyles.medium,
      },
      receivedMessageCaptionTextStyle: {
        color: baseColors.onSurfaceVariant,
        fontSize: 12,
        lineHeight: 16,
        ...fontStyles.medium,
      },
      receivedMessageLinkDescriptionTextStyle: {
        color: baseColors.onPrimary,
        fontSize: 14,
        lineHeight: 20,
        ...fontStyles.regular,
      },
      receivedMessageLinkTitleTextStyle: {
        color: baseColors.onPrimary,
        fontSize: 16,
        lineHeight: 22,
        ...fontStyles.extraBold,
      },
      sentMessageBodyTextStyle: {
        color: baseColors.onSurface,
        fontSize: 16,
        lineHeight: 24,
        ...fontStyles.medium,
      },
      sentMessageCaptionTextStyle: {
        color: baseColors.onSurfaceVariant,
        fontSize: 12,
        lineHeight: 16,
        ...fontStyles.medium,
      },
      sentMessageLinkDescriptionTextStyle: {
        color: baseColors.onSurface,
        fontSize: 14,
        lineHeight: 20,
        ...fontStyles.regular,
      },
      sentMessageLinkTitleTextStyle: {
        color: baseColors.onSurface,
        fontSize: 16,
        lineHeight: 22,
        ...fontStyles.extraBold,
      },
      userAvatarTextStyle: {
        color: baseColors.onSurface,
        fontSize: 12,
        lineHeight: 16,
        ...fontStyles.extraBold,
      },
      userNameTextStyle: {
        fontSize: 12,
        lineHeight: 16,
        ...fontStyles.extraBold,
      },
    },
    insets: {
      messageInsetsHorizontal: 20,
      messageInsetsVertical: 10,
    },
    spacing: {
      default: 16,
    },
    icons: {},
  };
};

export const lightTheme = createTheme(false);
export const darkTheme = createTheme(true);
export const rootStyles = (theme: Theme) =>
  StyleSheet.create({
    root: {
      flex: 1,
    },
    headerWithoutDivider: {
      elevation: 0,
      shadowOpacity: 0,
      borderBottomWidth: 0,
      backgroundColor: theme.colors.background,
    },
    headerWithDivider: {
      backgroundColor: theme.colors.background,
    },
    headerTitle: {
      ...theme.fonts.titleSmall,
    },
  });