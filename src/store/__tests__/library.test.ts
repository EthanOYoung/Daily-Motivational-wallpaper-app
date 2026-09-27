import { selectIsFavourite, useLibraryStore } from '../library';

const bundled = {
  id: 'gratitude-001',
  text: 'Gratitude turns what we have into enough.',
  author: 'Anonymous',
  category: 'gratitude' as const,
};

beforeEach(() => {
  useLibraryStore.setState({ customQuotes: [], favourites: [] });
});

describe('custom quotes', () => {
  it('adds quotes newest first with tidy text', () => {
    const { addCustomQuote } = useLibraryStore.getState();
    const first = addCustomQuote({
      text: '  Keep   going. ',
      author: ' Me ',
      category: 'resilience',
    });
    const second = addCustomQuote({
      text: 'Rest is part of it.',
      author: '',
      category: 'self-love',
    });

    expect(first).toMatchObject({
      text: 'Keep going.',
      author: 'Me',
      category: 'resilience',
      isCustom: true,
    });
    expect(first.id).toMatch(/^custom-/);
    expect(first.id).not.toBe(second.id);
    expect(useLibraryStore.getState().customQuotes.map((q) => q.id)).toEqual([second.id, first.id]);
  });

  it('updates the quote and its favourite snapshot', () => {
    const { addCustomQuote, toggleFavourite, updateCustomQuote } = useLibraryStore.getState();
    const quote = addCustomQuote({ text: 'Old words', author: 'Me', category: 'ambition' });
    toggleFavourite(quote);
    updateCustomQuote(quote.id, { text: 'New words', author: 'Me', category: 'confidence' });

    const state = useLibraryStore.getState();
    expect(state.customQuotes[0]).toMatchObject({ text: 'New words', category: 'confidence' });
    expect(state.favourites[0]!.quote).toMatchObject({ text: 'New words', category: 'confidence' });
  });

  it('removes a deleted quote from favourites too', () => {
    const { addCustomQuote, toggleFavourite, deleteCustomQuote } = useLibraryStore.getState();
    const quote = addCustomQuote({ text: 'Temporary', author: '', category: 'family' });
    toggleFavourite(quote);
    toggleFavourite(bundled);
    deleteCustomQuote(quote.id);

    const state = useLibraryStore.getState();
    expect(state.customQuotes).toEqual([]);
    expect(state.favourites.map((f) => f.quote.id)).toEqual([bundled.id]);
  });
});

describe('favourites', () => {
  it('toggles a quote in and out, newest first', () => {
    const { toggleFavourite } = useLibraryStore.getState();
    const other = { ...bundled, id: 'gratitude-002' };

    expect(toggleFavourite(bundled)).toBe(true);
    expect(toggleFavourite(other)).toBe(true);
    expect(useLibraryStore.getState().favourites.map((f) => f.quote.id)).toEqual([
      other.id,
      bundled.id,
    ]);
    expect(selectIsFavourite(bundled.id)(useLibraryStore.getState())).toBe(true);

    expect(toggleFavourite(bundled)).toBe(false);
    expect(selectIsFavourite(bundled.id)(useLibraryStore.getState())).toBe(false);
    expect(selectIsFavourite(undefined)(useLibraryStore.getState())).toBe(false);
  });

  it('removes a favourite by id', () => {
    useLibraryStore.getState().toggleFavourite(bundled);
    useLibraryStore.getState().removeFavourite(bundled.id);
    expect(useLibraryStore.getState().favourites).toEqual([]);
  });
});
