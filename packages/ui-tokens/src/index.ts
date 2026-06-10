export const colors = {
  ink: "#0c0e1a",
  night: "#111827",
  panel: "#141729",
  panelRaised: "#181c32",
  panelInteractive: "#232846",
  border: "rgba(255, 255, 255, 0.07)",
  borderStrong: "rgba(255, 255, 255, 0.15)",
  ricePaper: "#e8e4d9",
  ashText: "#8b90b0",
  mist: "#6b7194",
  shadow: "rgba(0, 0, 0, 0.4)",
  jade: "#10b981",
  cyan: "#4cc7d8",
  ember: "#ef4444",
  gold: "#d4a017",
  orange: "#f7a516",
  violet: "#8b5cf6",
  blue: "#2196f3",
  slate: "#6f7f98",
  // 暗色主题
  pageBg: "#0c0e1a",
  pageBgAlt: "#111827",
  surface: "#141729",
  surfaceRaised: "#181c32",
  lightBorder: "rgba(255, 255, 255, 0.07)",
  lightBorderStrong: "rgba(255, 255, 255, 0.15)",
  lightShadow: "rgba(0, 0, 0, 0.4)",
  textPrimary: "#e8e4d9",
  textSecondary: "#8b90b0",
  textMuted: "#6b7194"
} as const;

export const spacing = {
  none: 0,
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 40
} as const;

export const radii = {
  none: 0,
  xs: 2,
  sm: 4,
  md: 8,
  lg: 12,
  pill: 999
} as const;

export const borders = {
  hairline: 1,
  thin: 2,
  thick: 4,
  pixel: 6
} as const;

export const typography = {
  fontFamily:
    "'FZHei-B01', '方正黑体_GBK', '方正黑体', 'FounderType Hei', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif",
  displayFontFamily:
    "'FZHei-B01', '方正黑体_GBK', '方正黑体', 'FounderType Hei', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif",
  pixelFontFamily:
    "'FZHei-B01', '方正黑体_GBK', '方正黑体', 'FounderType Hei', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif",
  headingWeight: 700,
  bodyWeight: 400,
  sizes: {
    caption: 11,
    body: 13,
    bodyLarge: 15,
    title: 20,
    display: 28,
    amount: 36
  },
  lineHeights: {
    tight: 1.15,
    normal: 1.4,
    relaxed: 1.6
  }
} as const;

export const semanticTokens = {
  pageBackground: colors.pageBg,
  pageBackgroundAlt: colors.pageBgAlt,
  surfaceBackground: colors.surface,
  surfaceRaised: colors.surfaceRaised,
  surfaceInteractive: colors.surfaceRaised,
  surfaceDisabled: "rgba(240, 242, 245, 0.8)",
  surfaceLocked: "rgba(240, 242, 245, 0.9)",
  primaryText: colors.textPrimary,
  secondaryText: colors.textSecondary,
  mutedText: colors.textMuted,
  inverseText: colors.ricePaper,
  border: colors.lightBorder,
  borderStrong: colors.lightBorderStrong,
  borderHighlight: colors.gold,
  focusRing: colors.cyan,
  accent: colors.jade,
  danger: colors.ember,
  reward: colors.gold,
  warning: colors.orange,
  rare: colors.violet,
  energy: colors.blue,
  success: colors.jade,
  shadow: colors.lightShadow,
  // 深色核心元素
  darkSurface: colors.panel,
  darkText: colors.ricePaper
} as const;

export const stateTokens = {
  earnings: {
    text: colors.gold,
    background: "rgba(154, 106, 22, 0.14)",
    border: "rgba(154, 106, 22, 0.56)"
  },
  coin: {
    text: colors.gold,
    background: "rgba(154, 106, 22, 0.16)",
    border: "rgba(154, 106, 22, 0.48)"
  },
  energy: {
    text: colors.blue,
    background: "rgba(95, 141, 247, 0.14)",
    border: "rgba(95, 141, 247, 0.48)"
  },
  experience: {
    text: colors.violet,
    background: "rgba(155, 108, 246, 0.14)",
    border: "rgba(155, 108, 246, 0.48)"
  },
  level: {
    text: colors.cyan,
    background: "rgba(76, 199, 216, 0.14)",
    border: "rgba(76, 199, 216, 0.48)"
  },
  reward: {
    text: colors.gold,
    background: "rgba(154, 106, 22, 0.18)",
    border: colors.gold
  },
  locked: {
    text: colors.mist,
    background: semanticTokens.surfaceLocked,
    border: "rgba(138, 164, 184, 0.34)"
  },
  pinned: {
    text: colors.orange,
    background: "rgba(154, 106, 22, 0.16)",
    border: "rgba(154, 106, 22, 0.5)"
  },
  new: {
    text: colors.jade,
    background: "rgba(85, 194, 143, 0.16)",
    border: "rgba(85, 194, 143, 0.5)"
  },
  selected: {
    text: colors.ricePaper,
    background: colors.panelInteractive,
    border: colors.cyan
  },
  disabled: {
    text: colors.slate,
    background: semanticTokens.surfaceDisabled,
    border: "rgba(111, 127, 152, 0.26)"
  }
} as const;

export type MiniappVisualMode = "workplace" | "hermit";

export const miniappVisualModeTokens = {
  workplace: {
    page: "#f5efe4",
    background: "#f7f0e6",
    surfaceLow: "#fffdf8",
    surface: "#fffaf1",
    surfaceHigh: "#f0e4d2",
    surfaceHighest: "#e6d8c2",
    card: "#fffdf8",
    text: "#34302a",
    textStrong: "#17130f",
    textMuted: "#665c50",
    textSoft: "#8a7d6d",
    border: "#d8c9b4",
    borderBright: "#b99a64",
    primary: "#2f6f73",
    primaryHot: "#1f5b62",
    cyan: "#248d92",
    gold: "#9a6a16",
    danger: "#b33f32",
    success: "#2f7d55",
    shadow: "rgba(17, 24, 39, 0.16)",
    overlay: "rgba(17, 24, 39, 0.4)",
    button: {
      background: "#f7a516",
      pressedBackground: "#f7a516",
      text: "#111827",
      border: "#111827",
      shadow: "rgba(17, 24, 39, 0.38)",
      ghostBackground: "rgba(47, 111, 115, 0.08)",
      ghostBorder: "rgba(47, 111, 115, 0.32)",
      ghostText: "#2f6f73"
    },
    nativeChrome: {
      navigationBarBackground: "#f7f3ea",
      navigationBarForeground: "#000000",
      tabBarBackground: "#fbf8f1",
      tabBarText: "#6f655a",
      tabBarSelectedText: "#9a6a16",
      tabBarBorderStyle: "white"
    }
  },
  hermit: {
    page: "#050508",
    background: "#13131b",
    surfaceLow: "#1b1b23",
    surface: "#1f1f27",
    surfaceHigh: "#292932",
    surfaceHighest: "#34343d",
    card: "#1a1a2e",
    text: "#e4e1ed",
    textStrong: "#ffffff",
    textMuted: "#d4c0d7",
    textSoft: "#9d8ba0",
    border: "#514255",
    borderBright: "#9d8ba0",
    primary: "#ecb2ff",
    primaryHot: "#bd00ff",
    cyan: "#00dbe9",
    gold: "#e9c400",
    danger: "#ffb4ab",
    success: "#47d18c",
    shadow: "rgba(0, 0, 0, 0.4)",
    overlay: "rgba(0, 0, 0, 0.62)",
    button: {
      background: "#f7a516",
      pressedBackground: "#f7a516",
      text: "#101217",
      border: "#0a1018",
      shadow: "rgba(17, 24, 39, 0.78)",
      ghostBackground: "rgba(247, 165, 22, 0.1)",
      ghostBorder: "rgba(247, 165, 22, 0.58)",
      ghostText: "#f7a516"
    },
    nativeChrome: {
      navigationBarBackground: "#050508",
      navigationBarForeground: "#ffffff",
      tabBarBackground: "#050508",
      tabBarText: "#9d8ba0",
      tabBarSelectedText: "#ecb2ff",
      tabBarBorderStyle: "black"
    }
  }
} as const satisfies Record<MiniappVisualMode, Record<string, unknown>>;

export const miniappTokens = {
  colors,
  spacing,
  radii,
  borders,
  typography,
  semantic: semanticTokens,
  states: stateTokens,
  visualModes: miniappVisualModeTokens,
  rpx: {
    minText: 24,
    bodyText: 26,
    titleText: 40,
    touchTarget: 88,
    pagePadding: 32,
    safeGap: 16,
    panelRadius: 16
  }
} as const;
