import { router } from 'expo-router';
import { Share } from 'react-native';

import { showToast } from '@/components/Toast';
import { toDateKey } from '@/domain/dates';
import type { Quote } from '@/domain/types';
import { useDailyStore } from '@/store/daily';

/** Puts a quote on today's wallpaper and shows the Today tab. */
export function showQuoteToday(quote: Quote) {
  useDailyStore.getState().assign(toDateKey(new Date()), quote);
  router.navigate('/');
  showToast("It's on today's wallpaper");
}

/** Shares a quote as text. */
export async function shareQuoteText(quote: Quote) {
  const author = quote.author.trim();
  const message = author ? `“${quote.text}” — ${author}` : `“${quote.text}”`;
  try {
    await Share.share({ message });
  } catch {
    showToast("Couldn't open the share sheet");
  }
}
