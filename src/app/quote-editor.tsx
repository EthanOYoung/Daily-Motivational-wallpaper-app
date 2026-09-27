import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useHeaderHeight } from 'expo-router/react-navigation';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { SectionHeader } from '@/components/Card';
import { CategoryChips } from '@/components/CategoryChips';
import { ListGroup, SwitchRow } from '@/components/ListGroup';
import { TextAction } from '@/components/TextAction';
import { showToast } from '@/components/Toast';
import { getCategory } from '@/domain/categories';
import {
  MAX_AUTHOR_LENGTH,
  MAX_QUOTE_LENGTH,
  normalizeQuoteText,
  validateQuoteInput,
  type QuoteInputErrors,
} from '@/domain/quotes';
import type { CategoryId } from '@/domain/types';
import { showQuoteToday } from '@/services/quoteActions';
import { useLibraryStore } from '@/store/library';
import { useSettingsStore } from '@/store/settings';
import { radii, spacing, typography, useAppTheme } from '@/theme';

/** Leaves the editor; falls back to My Quotes when opened directly (e.g. a web reload). */
function close() {
  if (router.canGoBack()) router.back();
  else router.replace('/my-quotes');
}

export default function QuoteEditorScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const existing = useLibraryStore((s) => s.customQuotes.find((q) => q.id === id));
  const { addCustomQuote, updateCustomQuote, deleteCustomQuote } = useLibraryStore.getState();
  const selectedCategories = useSettingsStore((s) => s.selectedCategories);
  const toggleCategory = useSettingsStore((s) => s.toggleCategory);
  const { colors } = useAppTheme();
  const headerHeight = useHeaderHeight();

  const [text, setText] = useState(existing?.text ?? '');
  const [author, setAuthor] = useState(existing?.author ?? '');
  const [category, setCategory] = useState<CategoryId | null>(existing?.category ?? null);
  const [useToday, setUseToday] = useState(false);
  const [errors, setErrors] = useState<QuoteInputErrors>({});

  const categoryOff = !!category && !selectedCategories.includes(category);
  const remaining = MAX_QUOTE_LENGTH - normalizeQuoteText(text).length;

  const onSave = () => {
    const found = validateQuoteInput({ text, author, category });
    setErrors(found);
    if (Object.keys(found).length > 0 || !category) return;

    const input = { text, author, category };
    let quote = existing;
    if (existing) {
      updateCustomQuote(existing.id, input);
      quote = useLibraryStore.getState().customQuotes.find((q) => q.id === existing.id);
    } else {
      quote = addCustomQuote(input);
    }
    close();
    if (useToday && quote) showQuoteToday(quote);
    else showToast(existing ? 'Quote updated' : `Added to ${getCategory(category).label}`);
  };

  const onDelete = () => {
    if (!existing) return;
    Alert.alert('Delete this quote?', 'It will be removed from the rotation and favourites.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteCustomQuote(existing.id);
          close();
          showToast('Quote deleted');
        },
      },
    ]);
  };

  const inputStyle = [
    styles.input,
    { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text },
  ];

  return (
    <KeyboardAvoidingView
      // iOS: the ScrollView insets itself (reliable inside sheets). Android draws edge to edge, so
      // the screen isn't resized for the keyboard and the content is padded instead.
      behavior={Platform.OS === 'android' ? 'padding' : undefined}
      keyboardVerticalOffset={headerHeight}
      style={[styles.root, { backgroundColor: colors.background }]}
    >
      <Stack.Screen
        options={{
          title: existing ? 'Edit quote' : 'New quote',
          // iOS sheets have no back arrow, so give them a way out besides swiping down.
          headerLeft:
            Platform.OS === 'ios' ? () => <TextAction label="Cancel" onPress={close} /> : undefined,
        }}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        automaticallyAdjustKeyboardInsets
      >
        <SectionHeader first title="Quote" detail={`${remaining} characters left`} />
        <TextInput
          accessibilityLabel="Quote"
          value={text}
          onChangeText={setText}
          placeholder="Write something you want to see every morning"
          placeholderTextColor={colors.textTertiary}
          multiline
          maxLength={MAX_QUOTE_LENGTH + 20}
          style={[inputStyle, styles.quoteInput]}
          autoFocus={!existing}
        />
        {errors.text ? (
          <AppText variant="caption" tone="danger" style={styles.error}>
            {errors.text}
          </AppText>
        ) : null}

        <SectionHeader title="Author" detail="Optional" />
        <TextInput
          accessibilityLabel="Author"
          value={author}
          onChangeText={setAuthor}
          placeholder="Who said it?"
          placeholderTextColor={colors.textTertiary}
          maxLength={MAX_AUTHOR_LENGTH}
          style={inputStyle}
          returnKeyType="done"
        />
        {errors.author ? (
          <AppText variant="caption" tone="danger" style={styles.error}>
            {errors.author}
          </AppText>
        ) : null}

        <SectionHeader title="Category" />
        <CategoryChips
          value={category}
          onChange={(value) => {
            setCategory(value);
            setErrors((e) => ({ ...e, category: undefined }));
          }}
        />
        {errors.category ? (
          <AppText variant="caption" tone="danger" style={styles.error}>
            {errors.category}
          </AppText>
        ) : null}
        {categoryOff && category ? (
          <View style={[styles.notice, { backgroundColor: colors.surfaceAlt }]}>
            <AppText variant="caption" tone="secondary" style={styles.noticeText}>
              {getCategory(category).label} is turned off in Settings, so this quote won&apos;t come
              up in the rotation.
            </AppText>
            <Button
              size="small"
              variant="secondary"
              label={`Turn on ${getCategory(category).label}`}
              onPress={() => toggleCategory(category)}
            />
          </View>
        ) : null}

        <View style={styles.spacerSmall} />
        <ListGroup>
          <SwitchRow
            label="Show it on today's wallpaper"
            detail="Otherwise it joins the rotation for future days"
            value={useToday}
            onValueChange={setUseToday}
          />
        </ListGroup>

        <Button
          label={existing ? 'Save changes' : 'Add quote'}
          onPress={onSave}
          style={styles.save}
        />
        {existing ? (
          <Button
            label="Delete quote"
            variant="ghost"
            destructive
            icon="trash-outline"
            onPress={onDelete}
            style={styles.delete}
          />
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: spacing.xl, paddingBottom: spacing.xxxl * 2 },
  input: {
    ...typography.body,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  quoteInput: {
    ...typography.quote,
    fontSize: 20,
    lineHeight: 28,
    minHeight: 132,
    textAlignVertical: 'top',
  },
  error: { marginTop: spacing.xs, paddingHorizontal: spacing.xs },
  notice: { marginTop: spacing.md, padding: spacing.md, borderRadius: radii.md, gap: spacing.sm },
  noticeText: {},
  spacerSmall: { height: spacing.xxl },
  save: { marginTop: spacing.xxl },
  delete: { marginTop: spacing.sm },
});
