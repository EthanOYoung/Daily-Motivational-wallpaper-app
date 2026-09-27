import type { CategoryId } from './types';

export interface CategoryInfo {
  id: CategoryId;
  label: string;
  description: string;
  /** Ionicons glyph name. */
  icon:
    | 'heart-outline'
    | 'sunny-outline'
    | 'trending-up-outline'
    | 'home-outline'
    | 'leaf-outline'
    | 'flower-outline'
    | 'water-outline'
    | 'star-outline';
}

export const CATEGORIES: readonly CategoryInfo[] = [
  {
    id: 'self-love',
    label: 'Self Love',
    description: 'Kindness and respect for who you are',
    icon: 'heart-outline',
  },
  {
    id: 'happiness',
    label: 'Happiness',
    description: 'Joy, laughter and lightness of heart',
    icon: 'sunny-outline',
  },
  {
    id: 'ambition',
    label: 'Ambition',
    description: 'Goals, effort and bold beginnings',
    icon: 'trending-up-outline',
  },
  {
    id: 'family',
    label: 'Family',
    description: 'Home, children and the people we love',
    icon: 'home-outline',
  },
  {
    id: 'resilience',
    label: 'Resilience',
    description: 'Hope and strength through hard times',
    icon: 'leaf-outline',
  },
  {
    id: 'gratitude',
    label: 'Gratitude',
    description: 'Thankfulness for what you already have',
    icon: 'flower-outline',
  },
  {
    id: 'mindfulness',
    label: 'Mindfulness',
    description: 'Presence, calm and the here and now',
    icon: 'water-outline',
  },
  {
    id: 'confidence',
    label: 'Confidence',
    description: 'Courage and trust in yourself',
    icon: 'star-outline',
  },
];

const byId = new Map(CATEGORIES.map((c) => [c.id, c]));

export function getCategory(id: CategoryId): CategoryInfo {
  const info = byId.get(id);
  if (!info) throw new Error(`Unknown category: ${id}`);
  return info;
}
