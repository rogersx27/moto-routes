export const colors = {
  primary: '#FF6B00',
  danger: '#e53935',
  success: '#4CAF50',
  info: '#2196F3',
  surface: '#ffffff',
  background: '#f5f5f5',
  textPrimary: '#1a1a1a',
  textSecondary: '#666666',
  textMuted: '#999999',
  border: '#dddddd',
  overlay: 'rgba(0,0,0,0.4)',
  overlayLight: 'rgba(0,0,0,0.55)',
} as const;

export const typography = {
  size: {
    xs: 10,
    sm: 12,
    base: 14,
    md: 16,
    lg: 18,
    xl: 22,
    xxl: 26,
  },
  weight: {
    regular: '400' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 20,
  full: 999,
} as const;
