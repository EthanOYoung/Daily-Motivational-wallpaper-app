import { contrastRatio, parseHex } from '@/wallpaper/color';

import { darkColors, lightColors, type ColorTokens } from '../colors';

type Token = keyof ColorTokens;

/** Text colours and the surfaces they're used on. WCAG AA asks for 4.5:1 for normal text. */
const TEXT_PAIRS: [Token, Token][] = [
  ['text', 'background'],
  ['text', 'surface'],
  ['textSecondary', 'background'],
  ['textSecondary', 'surface'],
  ['textSecondary', 'surfaceAlt'],
  ['textTertiary', 'background'],
  ['textTertiary', 'surface'],
  ['accent', 'background'],
  ['accent', 'surface'],
  ['onAccent', 'accent'],
  ['danger', 'background'],
  ['danger', 'surface'],
];

describe.each([
  ['light', lightColors],
  ['dark', darkColors],
])('%s theme', (_name, colors) => {
  it.each(TEXT_PAIRS)('%s on %s is readable', (fg, bg) => {
    expect(contrastRatio(parseHex(colors[fg]), parseHex(colors[bg]))).toBeGreaterThanOrEqual(4.5);
  });
});
