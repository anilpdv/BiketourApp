import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { useSearchStore } from '../store/searchStore';

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
      <View style={styles.searchIcon}>
        <Text style={styles.iconText}>🔍</Text>
      </View>

      <TextInput
        ref={inputRef}
        style={styles.input}
        value={query}
        onChangeText={handleChangeText}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        placeholderTextColor="#999"
        returnKeyType="search"
        autoCapitalize="none"
        autoCorrect={false}
        clearButtonMode="never"
      />

      {isSearching && (
        <ActivityIndicator size="small" color="#2196F3" style={styles.loader} />
      )}

      {query.length > 0 && !isSearching && (
        <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
          <Text style={styles.clearIcon}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  containerFocused: {
    borderColor: '#2196F3',
    shadowOpacity: 0.2,
  },
  searchIcon: {
    marginRight: 8,
  },
  iconText: {
    fontSize: 18,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 0,
  },
  loader: {
    marginLeft: 8,
  },
  clearButton: {
    marginLeft: 8,
    padding: 4,
  },
  clearIcon: {
    fontSize: 16,
    color: '#999',
  },
});
