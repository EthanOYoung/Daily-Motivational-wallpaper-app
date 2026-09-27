/**
 * Fonts drawn onto wallpapers. Each face is registered with Skia under its own family name so
 * styles can pick regular or italic explicitly. The same file list is used on the phone (via
 * bundled assets) and in the Node sample renderer (via the file system).
 */
export const WALLPAPER_FONT_FILES = {
  Lora: 'Lora_400Regular.ttf',
  'Lora Italic': 'Lora_400Regular_Italic.ttf',
  'Playfair Display': 'PlayfairDisplay_400Regular.ttf',
  'Playfair Display Italic': 'PlayfairDisplay_400Regular_Italic.ttf',
  'Cormorant Garamond': 'CormorantGaramond_500Medium.ttf',
  Inter: 'Inter_500Medium.ttf',
} as const;

export type WallpaperFontFamily = keyof typeof WALLPAPER_FONT_FILES;

/** Family used for the author line on every style. */
export const AUTHOR_FONT: WallpaperFontFamily = 'Inter';
