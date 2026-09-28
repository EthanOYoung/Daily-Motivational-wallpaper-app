export interface ColorTokens {
  background: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  accent: string;
  accentSoft: string;
  onAccent: string;
  danger: string;
  heart: string;
  overlay: string;
}

export const lightColors: ColorTokens = {
  background: '#F6F3EE',
  surface: '#FFFFFF',
  surfaceAlt: '#EFEAE2',
  border: '#E4DDD3',
  text: '#1F1E1C',
  textSecondary: '#55514C',
  textTertiary: '#736E67',
  accent: '#56766A',
  accentSoft: '#E0E9E4',
  onAccent: '#FFFFFF',
  danger: '#B3523E',
  heart: '#CC5B59',
  overlay: 'rgba(20, 20, 18, 0.45)',
};

export const darkColors: ColorTokens = {
  background: '#131416',
  surface: '#1C1D20',
  surfaceAlt: '#25272B',
  border: '#303237',
  text: '#EEEAE3',
  textSecondary: '#A6A097',
  textTertiary: '#8A857E',
  accent: '#8FB5A6',
  accentSoft: '#233029',
  onAccent: '#0F1D18',
  danger: '#E3876F',
  heart: '#EC8B87',
  overlay: 'rgba(0, 0, 0, 0.6)',
};
