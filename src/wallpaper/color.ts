/** Small colour helpers used to design the styles and to check text contrast in tests. */

export type RGB = [number, number, number];

export function parseHex(hex: string): RGB {
  const clean = hex.replace('#', '');
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean.slice(0, 6);
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function toHex([r, g, b]: RGB): string {
  return `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`;
}

export function mix(a: RGB, b: RGB, t: number): RGB {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

/** Colour of a multi-stop gradient at `t` in [0, 1]. */
export function sampleGradient(
  colors: readonly string[],
  positions: readonly number[] | undefined,
  t: number
): RGB {
  const stops = positions ?? colors.map((_, i) => i / (colors.length - 1));
  const rgb = colors.map(parseHex);
  if (t <= stops[0]!) return rgb[0]!;
  for (let i = 1; i < stops.length; i++) {
    if (t <= stops[i]!) {
      const span = stops[i]! - stops[i - 1]!;
      return mix(rgb[i - 1]!, rgb[i]!, span === 0 ? 0 : (t - stops[i - 1]!) / span);
    }
  }
  return rgb[rgb.length - 1]!;
}

function channel(v: number): number {
  const s = v / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance([r, g, b]: RGB): number {
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** WCAG contrast ratio between two colours (1–21). */
export function contrastRatio(a: RGB, b: RGB): number {
  const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x) as [
    number,
    number,
  ];
  return (hi + 0.05) / (lo + 0.05);
}
