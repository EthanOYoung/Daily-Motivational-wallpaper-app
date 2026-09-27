import { Text, type TextProps } from 'react-native';

import { typography, useAppTheme, type ColorTokens } from '@/theme';

type Variant = keyof typeof typography;
type Tone = 'primary' | 'secondary' | 'tertiary' | 'accent' | 'danger' | 'onAccent';

const toneColor = (colors: ColorTokens, tone: Tone) =>
  ({
    primary: colors.text,
    secondary: colors.textSecondary,
    tertiary: colors.textTertiary,
    accent: colors.accent,
    danger: colors.danger,
    onAccent: colors.onAccent,
  })[tone];

export interface AppTextProps extends TextProps {
  variant?: Variant;
  tone?: Tone;
  uppercase?: boolean;
}

export function AppText({
  variant = 'body',
  tone = 'primary',
  uppercase,
  style,
  ...rest
}: AppTextProps) {
  const { colors } = useAppTheme();
  return (
    <Text
      {...rest}
      style={[
        typography[variant],
        { color: toneColor(colors, tone) },
        uppercase && { textTransform: 'uppercase' },
        style,
      ]}
    />
  );
}
