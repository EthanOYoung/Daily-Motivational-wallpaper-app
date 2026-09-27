import { CATEGORY_IDS } from '@/domain/types';

import { DEFAULT_SETTINGS, useSettingsStore } from '../settings';

beforeEach(() => {
  useSettingsStore.setState(DEFAULT_SETTINGS);
});

describe('settings store', () => {
  it('starts with every category selected and a 6am change time', () => {
    const state = useSettingsStore.getState();
    expect(state.selectedCategories).toEqual([...CATEGORY_IDS]);
    expect(state.dailyTime).toEqual({ hour: 6, minute: 0 });
  });

  it('toggles categories and keeps them in library order', () => {
    const { setCategories, toggleCategory } = useSettingsStore.getState();
    setCategories(['gratitude']);
    toggleCategory('self-love');
    expect(useSettingsStore.getState().selectedCategories).toEqual(['self-love', 'gratitude']);
    toggleCategory('gratitude');
    expect(useSettingsStore.getState().selectedCategories).toEqual(['self-love']);
  });

  it('never deselects the last category', () => {
    const { setCategories, toggleCategory } = useSettingsStore.getState();
    setCategories(['family']);
    toggleCategory('family');
    expect(useSettingsStore.getState().selectedCategories).toEqual(['family']);
    setCategories([]);
    expect(useSettingsStore.getState().selectedCategories).toEqual(['family']);
  });
});
