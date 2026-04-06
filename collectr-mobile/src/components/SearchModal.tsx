import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api';
import { safePrice, formatMoney } from '../utils';

const RECENT_KEY = 'collectr_recent_searches';
const MAX_RECENT = 5;

const POPULAR_SEARCHES = ['Charizard', 'Pikachu', 'Mewtwo', 'Lugia', 'Umbreon', 'Rayquaza'];

interface CardData {
  id?: string | number;
  pokemon_tcg_id?: string;
  name: string;
  set_name: string;
  rarity?: string;
  price?: number | string;
  image_url?: string;
  history?: Record<string, number[]>;
}

interface SearchModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (card: CardData) => void;
  onOpenAnalytics: (card: CardData) => void;
}

async function getRecentSearches(): Promise<string[]> {
  try {
    const stored = await AsyncStorage.getItem(RECENT_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return [];
}

async function addRecentSearch(query: string) {
  const q = query.trim();
  if (!q) return;
  const prev = await getRecentSearches();
  const filtered = prev.filter((s) => s.toLowerCase() !== q.toLowerCase());
  const next = [q, ...filtered].slice(0, MAX_RECENT);
  await AsyncStorage.setItem(RECENT_KEY, JSON.stringify(next));
}

async function removeRecentSearch(query: string): Promise<string[]> {
  const prev = await getRecentSearches();
  const next = prev.filter((s) => s !== query);
  await AsyncStorage.setItem(RECENT_KEY, JSON.stringify(next));
  return next;
}

async function clearRecentSearches() {
  await AsyncStorage.removeItem(RECENT_KEY);
}

export default function SearchModal({ visible, onClose, onAdd, onOpenAnalytics }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CardData[]>([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<TextInput>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (visible) {
      setQuery('');
      setResults([]);
      getRecentSearches().then(setRecentSearches);
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [visible]);

  const searchCards = useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    api
      .get(`/search?query=${encodeURIComponent(searchQuery)}&limit=50`)
      .then((r) => setResults(r.data || []))
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, []);

  const handleQueryChange = useCallback(
    (text: string) => {
      setQuery(text);
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
        searchCards(text);
      }, 600);
    },
    [searchCards]
  );

  const handleSubmit = useCallback(
    async (value: string) => {
      await addRecentSearch(value);
      const recents = await getRecentSearches();
      setRecentSearches(recents);
      setQuery(value);
      searchCards(value);
    },
    [searchCards]
  );

  const handleRemoveRecent = useCallback(async (value: string) => {
    const recents = await removeRecentSearch(value);
    setRecentSearches(recents);
  }, []);

  const handleClearAll = useCallback(async () => {
    await clearRecentSearches();
    setRecentSearches([]);
  }, []);

  const handleCardClick = useCallback(
    (item: CardData) => {
      addRecentSearch(item.name);
      onClose();
      onOpenAnalytics(item);
    },
    [onClose, onOpenAnalytics]
  );

  const handleAddClick = useCallback(
    (e: any, item: CardData) => {
      e.stopPropagation();
      onAdd(item);
    },
    [onAdd]
  );

  const showSuggestions = !query.trim();
  const showResults = query.trim() && !loading;
  const showNoResults = query.trim() && !loading && results.length === 0;

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          <View style={styles.searchBarContainer}>
            <View style={styles.searchBar}>
              <Feather name="search" size={20} color="#14b8a6" style={styles.searchIcon} />
              <TextInput
                ref={inputRef}
                value={query}
                onChangeText={handleQueryChange}
                placeholder="Search any card..."
                placeholderTextColor="#475569"
                style={styles.searchInput}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
                onSubmitEditing={() => {
                  if (query.trim()) handleSubmit(query);
                }}
              />
              {query.length > 0 && (
                <TouchableOpacity onPress={() => setQuery('')} style={styles.clearButton}>
                  <Feather name="x" size={16} color="#64748b" />
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Feather name="x" size={20} color="#64748b" />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.content}>
            {loading && query.trim() && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#14b8a6" />
              </View>
            )}
            {showSuggestions && (
              <View style={styles.suggestionsContainer}>
                {recentSearches.length > 0 && (
                  <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                      <View style={styles.sectionTitleRow}>
                        <Feather name="clock" size={14} color="#64748b" />
                        <Text style={styles.sectionTitle}>Recent Searches</Text>
                      </View>
                      <TouchableOpacity onPress={handleClearAll}>
                        <Text style={styles.clearAllText}>Clear All</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={styles.chipRow}>
                      {recentSearches.map((s) => (
                        <View key={s} style={styles.chip}>
                          <TouchableOpacity style={styles.chipContent} onPress={() => handleSubmit(s)}>
                            <Text style={styles.chipText}>{s}</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.chipRemove}
                            onPress={() => handleRemoveRecent(s)}
                          >
                            <Feather name="x" size={12} color="#64748b" />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
                <View style={styles.section}>
                  <View style={styles.sectionTitleRow}>
                    <Feather name="trending-up" size={14} color="#64748b" />
                    <Text style={styles.sectionTitle}>Popular</Text>
                  </View>
                  <View style={styles.chipRow}>
                    {POPULAR_SEARCHES.map((s) => (
                      <TouchableOpacity
                        key={s}
                        style={[styles.chip, styles.popularChip]}
                        onPress={() => handleSubmit(s)}
                      >
                        <Text style={styles.popularChipText}>{s}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            )}
            {showNoResults && (
              <View style={styles.noResultsContainer}>
                <Feather name="search" size={40} color="#334155" />
                <Text style={styles.noResultsText}>No cards found for "{query}"</Text>
              </View>
            )}
            {showResults && results.length > 0 && (
              <FlatList
                data={results}
                keyExtractor={(item) => String(item.id || item.pokemon_tcg_id || Math.random())}
                numColumns={3}
                columnWrapperStyle={styles.gridRow}
                contentContainerStyle={styles.gridContainer}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.gridItem}
                    onPress={() => handleCardClick(item)}
                    activeOpacity={0.7}
                  >
                    {item.image_url && (
                      <View style={styles.gridItemImageContainer}>
                        <Image source={{ uri: item.image_url }} style={styles.gridItemImage} resizeMode="contain" />
                      </View>
                    )}
                    <Text style={styles.gridItemName} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.gridItemPrice}>${formatMoney(safePrice(item.price))}</Text>
                    <TouchableOpacity
                      style={styles.gridItemAddButton}
                      onPress={(e) => handleAddClick(e, item)}
                      activeOpacity={0.7}
                    >
                      <Feather name="plus" size={13} color="#0a0a0a" />
                    </TouchableOpacity>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
  },
  keyboardView: {
    flex: 1,
  },
  searchBarContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141414',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    paddingVertical: 0,
  },
  clearButton: {
    padding: 8,
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestionsContainer: {
    gap: 24,
  },
  section: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  clearAllText: {
    color: '#475569',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  chipContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chipText: {
    color: '#cbd5e1',
    fontSize: 14,
    fontWeight: '600',
  },
  chipRemove: {
    marginLeft: 8,
    padding: 2,
  },
  popularChip: {
    borderColor: 'rgba(255,255,255,0.06)',
  },
  popularChipText: {
    color: '#cbd5e1',
    fontSize: 14,
    fontWeight: '600',
  },
  noResultsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  noResultsText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '600',
  },
  gridContainer: {
    paddingBottom: 20,
  },
  gridRow: {
    justifyContent: 'space-between',
    gap: 10,
  },
  gridItem: {
    flex: 1,
    maxWidth: '32%',
    backgroundColor: '#141414',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: 8,
    alignItems: 'center',
    position: 'relative',
  },
  gridItemImageContainer: {
    width: '100%',
    aspectRatio: 3 / 4,
    marginBottom: 6,
  },
  gridItemImage: {
    width: '100%',
    height: '100%',
  },
  gridItemName: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
    width: '100%',
  },
  gridItemPrice: {
    color: 'rgba(20,184,166,0.8)',
    fontSize: 9,
    marginTop: 4,
  },
  gridItemAddButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#14b8a6',
    borderRadius: 999,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
});
