import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, View } from 'react-native';

import { CATEGORIES } from '@/domain/categories';
import type { CategoryId } from '@/domain/types';
import { radii, spacing, useAppTheme } from '@/theme';

import { AppText } from './AppText';

interface CategoryPickerProps {
  selected: readonly CategoryId[];
  onToggle: (id: CategoryId) => void;
  counts?: Partial<Record<CategoryId, number>>;
}

export function CategoryPicker({ selected, onToggle, counts }: CategoryPickerProps) {
  const { colors } = useAppTheme();
  const selectedSet = new Set(selected);
  const onlyOneLeft = selected.length === 1;

  return (
    <View style={styles.grid}>
      {CATEGORIES.map((category) => {
        const isOn = selectedSet.has(category.id);
        const locked = isOn && onlyOneLeft;
        const count = counts?.[category.id];
        return (
          <Pressable
            key={category.id}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: isOn }}
            accessibilityLabel={category.label}
            accessibilityHint={
              locked ? 'At least one category has to stay selected' : category.description
            }
            onPress={() => onToggle(category.id)}
            style={({ pressed }) => [
              styles.tile,
              {
                backgroundColor: isOn ? colors.accentSoft : colors.surface,
                borderColor: isOn ? colors.accent : colors.border,
                opacity: pressed ? 0.75 : 1,
              },
            ]}
          >
            <View style={styles.tileTop}>
              <Ionicons
                name={category.icon}
                size={22}
                color={isOn ? colors.accent : colors.textSecondary}
              />
              <Ionicons
                name={isOn ? 'checkmark-circle' : 'ellipse-outline'}
                size={20}
                color={isOn ? colors.accent : colors.textTertiary}
              />
            </View>
            <AppText variant="heading">{category.label}</AppText>
            <AppText variant="caption" tone="secondary" numberOfLines={2}>
              {category.description}
            </AppText>
            {count !== undefined ? (
              <AppText variant="caption" tone="tertiary">
                {count} quotes
              </AppText>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  tile: {
    flexGrow: 1,
    flexBasis: '45%',
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: spacing.xs,
    minHeight: 124,
  },
  tileTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
});
