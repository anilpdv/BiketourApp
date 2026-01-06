import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSearchStore } from '../store/searchStore';
import { colors, spacing, borderRadius } from '../../../shared/design/tokens';

interface SearchBarProps {
  onFocus?: () => void;
  onBlur?: () => void;
  placeholder?: string;
}

export function SearchBar({ onFocus, onBlur, placeholder = 'Search places...' }: SearchBarProps) {
  const inputRef = useRef<TextInput>(null);
  const [isFocused, setIsFocused] = useState(false);

  const { query, isSearching, setQuery, search, clearResults } = useSearchStore();

  // Debounced search
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const handleChangeText = useCallback(
    (text: string) => {
      setQuery(text);

      // Clear previous timeout
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      // Debounce search
      debounceRef.current = setTimeout(() => {
        search(text);
      }, 300);
    },
    [setQuery, search]
  );

  const handleClear = useCallback(() => {
    setQuery('');
    clearResults();
    inputRef.current?.blur();
  }, [setQuery, clearResults]);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    onFocus?.();
  }, [onFocus]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    onBlur?.();
  }, [onBlur]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return (
    <View style={[styles.container, isFocused && styles.containerFocused]}>
      <MaterialCommunityIcons
        name="magnify"
        size={22}
        color={colors.neutral[400]}
        style={styles.searchIcon}
      />

      <TextInput
        ref={inputRef}
        style={styles.input}
        value={query}
        onChangeText={handleChangeText}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        placeholderTextColor={colors.neutral[400]}
        returnKeyType="search"
        autoCapitalize="none"
        autoCorrect={false}
        clearButtonMode="never"
      />

      {isSearching && (
        <ActivityIndicator size="small" color={colors.primary[500]} style={styles.loader} />
      )}

      {query.length > 0 && !isSearching && (
        <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
          <MaterialCommunityIcons name="close-circle" size={20} color={colors.neutral[400]} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[0],
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    height: 48,
    shadowColor: colors.neutral[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  containerFocused: {
    borderColor: colors.primary[500],
    shadowOpacity: 0.2,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.neutral[800],
    paddingVertical: 0,
  },
  loader: {
    marginLeft: spacing.sm,
  },
  clearButton: {
    marginLeft: spacing.sm,
    padding: spacing.xs,
  },
});
