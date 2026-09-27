import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, View } from 'react-native';

import { CATEGORIES } from '@/domain/categories';
import type { CategoryId } from '@/domain/types';
import { radii, spacing, useAppTheme } from '@/theme';

import { AppText } from './AppText';

interface CategoryChipsProps {
  value: CategoryId | null;
  onChange: (id: CategoryId) => void;
}

/** Single-choice category picker as wrapping chips. */
export function CategoryChips({ value, onChange }: CategoryChipsProps) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.wrap} accessibilityRole="radiogroup" accessibilityLabel="Category">
      {CATEGORIES.map((category) => {
        const selected = category.id === value;
        return (
          <Pressable
            key={category.id}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            accessibilityLabel={category.label}
            onPress={() => onChange(category.id)}
            style={({ pressed }) => [
              styles.chip,
              {
                backgroundColor: selected ? colors.accent : colors.surface,
                borderColor: selected ? colors.accent : colors.border,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <Ionicons
              name={category.icon}
              size={15}
              color={selected ? colors.onAccent : colors.textSecondary}
            />
            <AppText variant="callout" style={{ color: selected ? colors.onAccent : colors.text }}>
              {category.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
});
