import { STYLE_IDS } from '@/domain/styles';
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

  it('turns background styles on and off, keeping at least one', () => {
    const { toggleStyle } = useSettingsStore.getState();
    for (const id of STYLE_IDS) toggleStyle(id);
    expect(useSettingsStore.getState().enabledStyles).toEqual(['dusk']);
    toggleStyle('sage');
    toggleStyle('dawn');
    expect(useSettingsStore.getState().enabledStyles).toEqual(['dawn', 'sage', 'dusk']);
  });

  it('shows the introduction on a fresh install only', () => {
    expect(useSettingsStore.getState().onboarded).toBe(false);
    const { migrate } = useSettingsStore.persist.getOptions();
    // Settings saved by a version without the introduction: that person has used the app.
    expect(migrate!({ selectedCategories: ['family'] }, 1)).toEqual({
      selectedCategories: ['family'],
      onboarded: true,
    });
    expect(migrate!({ onboarded: false }, 2)).toEqual({ onboarded: false });
  });
});
