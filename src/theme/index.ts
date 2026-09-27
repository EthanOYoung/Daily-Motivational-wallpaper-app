import { useColorScheme } from 'react-native';

import { useSettingsStore } from '@/store/settings';

import { darkColors, lightColors, type ColorTokens } from './colors';

export type { ColorTokens } from './colors';

/** Font families registered in the root layout (bundled OFL fonts). */
export const fonts = {
  serif: 'Lora_400Regular',
  serifItalic: 'Lora_400Regular_Italic',
  serifSemiBold: 'Lora_600SemiBold',
} as const;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 } as const;
export const radii = { sm: 8, md: 12, lg: 18, xl: 28, pill: 999 } as const;

export const typography = {
  display: { fontSize: 30, lineHeight: 36, fontWeight: '600' },
  title: { fontSize: 22, lineHeight: 28, fontWeight: '600' },
  heading: { fontSize: 17, lineHeight: 22, fontWeight: '600' },
  body: { fontSize: 16, lineHeight: 22, fontWeight: '400' },
  callout: { fontSize: 15, lineHeight: 20, fontWeight: '400' },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '400' },
  label: { fontSize: 12, lineHeight: 16, fontWeight: '600', letterSpacing: 1.1 },
  quote: { fontSize: 24, lineHeight: 34, fontFamily: fonts.serif },
} as const;

export interface AppTheme {
  scheme: 'light' | 'dark';
  colors: ColorTokens;
}

export function useAppTheme(): AppTheme {
  const preference = useSettingsStore((s) => s.themePreference);
  const system = useColorScheme();
  const scheme = preference === 'system' ? (system === 'dark' ? 'dark' : 'light') : preference;
  return { scheme, colors: scheme === 'dark' ? darkColors : lightColors };
}
