/**
 * Euricio Brand Colors
 */
export const Colors = {
  primary: '#1B4D3E',      // Euricio-Grün (dunkel)
  primaryLight: '#2D7A5F',
  primaryDark: '#0F2E25',
  secondary: '#D4A843',    // Gold-Akzent
  secondaryLight: '#E8C76A',

  background: '#FFFFFF',
  backgroundSecondary: '#F5F7FA',
  surface: '#FFFFFF',

  text: '#1A1A2E',
  textSecondary: '#6B7280',
  textInverse: '#FFFFFF',
  textMuted: '#9CA3AF',

  border: '#E5E7EB',
  borderLight: '#F3F4F6',

  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  // Call-spezifisch
  callActive: '#10B981',
  callEnd: '#EF4444',
  callMuted: '#6B7280',
  callHold: '#F59E0B',
} as const;

export type ColorKey = keyof typeof Colors;
