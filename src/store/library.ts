import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { normalizeQuoteText } from '@/domain/quotes';
import type { CategoryId, Quote } from '@/domain/types';

import { deviceStorage } from './storage';

export interface FavouriteEntry {
  /** Snapshot, so favourites keep working if a custom quote is later edited or deleted. */
  quote: Quote;
  addedAt: number;
}

export interface CustomQuoteInput {
  text: string;
  author: string;
  category: CategoryId;
}

interface LibraryState {
  customQuotes: Quote[];
  /** Newest first. */
  favourites: FavouriteEntry[];
  addCustomQuote: (input: CustomQuoteInput) => Quote;
  updateCustomQuote: (id: string, input: CustomQuoteInput) => void;
  deleteCustomQuote: (id: string) => void;
  toggleFavourite: (quote: Quote) => boolean;
  removeFavourite: (id: string) => void;
}

function newId(): string {
  return `custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function toQuote(id: string, input: CustomQuoteInput): Quote {
  return {
    id,
    text: normalizeQuoteText(input.text),
    author: normalizeQuoteText(input.author),
    category: input.category,
    isCustom: true,
  };
}

export const useLibraryStore = create<LibraryState>()(
  persist(
    (set, get) => ({
      customQuotes: [],
      favourites: [],

      addCustomQuote: (input) => {
        const quote = toQuote(newId(), input);
        set((s) => ({ customQuotes: [quote, ...s.customQuotes] }));
        return quote;
      },

      updateCustomQuote: (id, input) => {
        const quote = toQuote(id, input);
        set((s) => ({
          customQuotes: s.customQuotes.map((q) => (q.id === id ? quote : q)),
          favourites: s.favourites.map((f) => (f.quote.id === id ? { ...f, quote } : f)),
        }));
      },

      deleteCustomQuote: (id) =>
        set((s) => ({
          customQuotes: s.customQuotes.filter((q) => q.id !== id),
          favourites: s.favourites.filter((f) => f.quote.id !== id),
        })),

      /** Returns true when the quote is now a favourite. */
      toggleFavourite: (quote) => {
        const exists = get().favourites.some((f) => f.quote.id === quote.id);
        set((s) => ({
          favourites: exists
            ? s.favourites.filter((f) => f.quote.id !== quote.id)
            : [{ quote, addedAt: Date.now() }, ...s.favourites],
        }));
        return !exists;
      },

      removeFavourite: (id) =>
        set((s) => ({ favourites: s.favourites.filter((f) => f.quote.id !== id) })),
    }),
    {
      name: 'library',
      version: 1,
      storage: deviceStorage,
      partialize: ({ customQuotes, favourites }) => ({ customQuotes, favourites }),
    }
  )
);

export function selectIsFavourite(id: string | undefined) {
  return (state: LibraryState) => !!id && state.favourites.some((f) => f.quote.id === id);
}
