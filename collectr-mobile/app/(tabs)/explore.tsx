import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Dimensions,
  Image,
  Animated,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import api from '../../src/api';
import { useAuth } from '../../src/context/AuthContext';
import { safePrice, formatMoney, formatRarity, getChartDataFromHistory } from '../../src/utils';
import { PIE_COLORS } from '../../src/constants';
import VaultCard from '../../src/components/VaultCard';
import SearchModal from '../../src/components/SearchModal';
import AnalyticsModal from '../../src/components/AnalyticsModal';
import ConfirmDialog from '../../src/components/ConfirmDialog';
import StatsCard from '../../src/components/StatsCard';
import EmptyState from '../../src/components/EmptyState';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_GAP = 12;
const CARD_WIDTH = (SCREEN_WIDTH - 32 - CARD_GAP) / 2;

interface CardData {
  id?: string | number;
  pokemon_tcg_id?: string;
  name: string;
  set_name: string;
  rarity?: string;
  price?: number | string;
  image_url?: string;
  history?: Record<string, number[]>;
  user_id?: string;
}

interface CollectionItem {
  id: string | number;
  card: CardData;
  quantity?: number;
  instance_ids?: (string | number)[];
}

interface MarketMover {
  card: CardData;
  computedStat?: { isUp: boolean; percent: string };
  image_url?: string;
  name: string;
  set_name?: string;
}

interface PortfolioStats {
  total_portfolio_value: number;
  total_cards: number;
}

export default function ExploreScreen() {
  const router = useRouter();
  const { token, setToken, logout: authLogout } = useAuth();
  const insets = useSafeAreaInsets();
  const [stats, setStats] = useState<PortfolioStats | null>(null);
  const [exploreCards, setExploreCards] = useState<CollectionItem[]>([]);
  const [portfolioCards, setPortfolioCards] = useState<CollectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [explorePage, setExplorePage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<CollectionItem | CardData | null>(null);
  const [activeTab, setActiveTab] = useState<'explore' | 'portfolio'>('explore');
  const [rarityFilter, setRarityFilter] = useState('All');
  const [sortBy, setSortBy] = useState('Newest');
  const [sortSheetOpen, setSortSheetOpen] = useState(false);
  const [raritySheetOpen, setRaritySheetOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{ visible: boolean; coll: CollectionItem | null }>({
    visible: false,
    coll: null,
  });
  const confirmDialogRef = useRef<CollectionItem | null>(null);
  const [marketMovers, setMarketMovers] = useState<MarketMover[]>([]);
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' }>({
    visible: false,
    message: '',
    type: 'success',
  });
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [busyCardId, setBusyCardId] = useState<string | number | null>(null);
  const [busyAction, setBusyAction] = useState<'add' | 'delete' | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    confirmDialogRef.current = confirmDialog.coll;
  }, [confirmDialog.coll]);

  const sortOptions = activeTab === 'portfolio'
    ? ['Price: High to Low', 'Price: Low to High']
    : ['Newest', 'Price: High to Low', 'Price: Low to High', 'Name: A-Z'];

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ visible: true, message, type });
    toastTimerRef.current = setTimeout(() => setToast({ visible: false, message: '', type: 'success' }), 3000);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  useEffect(() => {
    if (activeTab === 'portfolio') setSortBy('Price: High to Low');
    else if (activeTab === 'explore') setSortBy('Newest');
    setExplorePage(1);
  }, [activeTab]);

  const fetchData = useCallback(
    async (pageToLoad = 1, append = false, currentRarity = 'All', currentSort = 'Newest') => {
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      if (!append) setLoading(true);
      else setLoadingMore(true);
      try {
        const rarityQuery = currentRarity === 'All' ? '' : `&rarity=${encodeURIComponent(currentRarity)}`;
        const sortQuery = `&sort_by=${encodeURIComponent(currentSort)}`;
        const [s, c, exp] = await Promise.all([
          api.get('/portfolio/stats', { signal: controller.signal }),
          api.get('/collections/me', { signal: controller.signal }),
          api.get(`/search?query=&page=${pageToLoad}&limit=48${rarityQuery}${sortQuery}`, { signal: controller.signal }),
        ]);
        if (controller.signal.aborted) return;
        setStats(s.data);
        setPortfolioCards(c.data || []);
        const newExplore = (exp.data || []).map((card: CardData) => ({
          id: `exp-${card.id}-${pageToLoad}`,
          card,
          condition: 'Market',
        }));
        if (append) {
          setExploreCards((prev) => {
            const prevIds = new Set(prev.filter((p) => p.card).map((p) => p.card.id));
            const uniqueNew = newExplore.filter((n: CollectionItem) => n.card && !prevIds.has(n.card.id));
            return [...prev, ...uniqueNew];
          });
        } else {
          setExploreCards(newExplore);
        }
      } catch (error: any) {
        if (error.name === 'CanceledError' || error.code === 'ERR_CANCELED' || controller.signal.aborted) return;
        if (error.response && error.response.status === 401) {
          await authLogout();
          setToken(null);
          router.replace('/(auth)/login');
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [setToken, router]
  );

  useEffect(() => {
    api.get('/market-movers')
      .then((r) => setMarketMovers(r.data || []))
      .catch(() => setMarketMovers([]));
  }, []);

  useEffect(() => {
    setExplorePage(1);
    fetchData(1, false, rarityFilter, sortBy);
  }, [rarityFilter, sortBy, fetchData]);

  const handleLoadMore = useCallback(() => {
    setExplorePage((prev) => {
      fetchData(prev + 1, true, rarityFilter, sortBy);
      return prev + 1;
    });
  }, [rarityFilter, sortBy, fetchData]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData(1, false, rarityFilter, sortBy).finally(() => setRefreshing(false));
  }, [fetchData, rarityFilter, sortBy]);

  const handleAdd = useCallback(
    async (card: CardData) => {
      const cardId = card.pokemon_tcg_id || card.id;
      setBusyCardId(cardId);
      setBusyAction('add');
      const newItem: CollectionItem = {
        id: `optimistic-${Date.now()}`,
        card: { ...card, pokemon_tcg_id: cardId },
        quantity: 1,
        instance_ids: [`optimistic-${Date.now()}`],
      };
      setPortfolioCards((prev) => [...prev, newItem]);
      try {
        await api.post('/collections/add', { pokemon_tcg_id: String(cardId), condition: 'Mint' });
        showToast(`${card.name} added to vault!`, 'success');
        await fetchData(1, false, rarityFilter, sortBy);
      } catch (error: any) {
        setPortfolioCards((prev) => prev.filter((item) => item.id !== newItem.id));
        if (error.response?.status === 401) {
          await authLogout();
          setToken(null);
          router.replace('/(auth)/login');
          return;
        }
        showToast('Error adding card.', 'error');
      } finally {
        setBusyCardId(null);
        setBusyAction(null);
      }
    },
    [fetchData, rarityFilter, sortBy, showToast, setToken, router]
  );

  const confirmDelete = useCallback((coll: CollectionItem) => {
    setConfirmDialog({ visible: true, coll });
  }, []);

  const executeDelete = useCallback(async () => {
    const coll = confirmDialogRef.current;
    if (!coll) return;

    const instanceId = coll.instance_ids?.[0] ?? coll.id;
    if (!instanceId && instanceId !== 0) {
      showToast('Error: could not identify card to remove.', 'error');
      setConfirmDialog({ visible: false, coll: null });
      return;
    }

    const cardId = coll.card?.pokemon_tcg_id || coll.card?.id;
    setBusyCardId(cardId);
    setBusyAction('delete');
    const snapshot = portfolioCards;
    setPortfolioCards((prev) => {
      const idx = prev.findIndex((item) => item.id === coll.id);
      if (idx === -1) return prev;
      const existing = prev[idx];
      if ((existing.quantity || 1) > 1) {
        const updated = [...prev];
        updated[idx] = {
          ...existing,
          quantity: (existing.quantity || 1) - 1,
          instance_ids: (existing.instance_ids || []).slice(1),
        };
        return updated;
      }
      return prev.filter((item) => item.id !== coll.id);
    });
    setConfirmDialog({ visible: false, coll: null });
    try {
      await api.delete(`/collections/${instanceId}`);
      showToast('Card removed.', 'success');
      await fetchData(1, false, rarityFilter, sortBy);
    } catch {
      setPortfolioCards(snapshot);
      showToast('Error removing card.', 'error');
    } finally {
      setBusyCardId(null);
      setBusyAction(null);
    }
  }, [fetchData, rarityFilter, sortBy, showToast]);

  const groupedPortfolio = useMemo(() => {
    const map = new Map<string, CollectionItem>();
    portfolioCards.forEach((item) => {
      if (!item?.card?.pokemon_tcg_id) return;
      const id = item.card.pokemon_tcg_id;
      const qty = Math.max(1, item.quantity || 1);
      if (!map.has(id)) {
        map.set(id, { ...item, quantity: qty, instance_ids: [item.id] });
      } else {
        const existing = map.get(id)!;
        existing.quantity += qty;
        existing.instance_ids!.push(item.id);
      }
    });
    return Array.from(map.values());
  }, [portfolioCards]);

  const sortedMarketMovers = useMemo(() => {
    return [...marketMovers]
      .map((g) => {
        const c = g.card || g;
        const stat = getChartDataFromHistory(c.history, '1M', 'Raw');
        return { ...g, computedStat: stat };
      })
      .sort((a, b) => {
        const valA = (a.computedStat?.isUp ? 1 : -1) * parseFloat(a.computedStat?.percent || '0');
        const valB = (b.computedStat?.isUp ? 1 : -1) * parseFloat(b.computedStat?.percent || '0');
        return valB - valA;
      });
  }, [marketMovers]);

  const ownedIds = useMemo(
    () => new Set(portfolioCards.filter((c) => c.card?.pokemon_tcg_id).map((c) => c.card.pokemon_tcg_id!)),
    [portfolioCards]
  );

  const currentCards = useMemo(() => {
    let cards = activeTab === 'explore' ? [...exploreCards] : [...groupedPortfolio];
    if (activeTab === 'portfolio') {
      if (sortBy === 'Price: High to Low')
        cards.sort((a, b) => safePrice((b.card || b).price) - safePrice((a.card || a).price));
      else if (sortBy === 'Price: Low to High')
        cards.sort((a, b) => safePrice((a.card || a).price) - safePrice((b.card || b).price));
    }
    return cards;
  }, [activeTab, exploreCards, groupedPortfolio, sortBy]);

  const handleLogout = useCallback(async () => {
    await authLogout();
    setToken(null);
    router.replace('/(auth)/login');
  }, [authLogout, setToken, router]);

  const handleDismissConfirm = useCallback(() => setConfirmDialog({ visible: false, coll: null }), []);

  const portfolioDistribution = useMemo(() => {
    const dist: Record<string, number> = {};
    groupedPortfolio.forEach((item) => {
      const r = formatRarity(item.card.rarity || item.card.set_name?.split(' • ')[1]);
      const val = safePrice(item.card.price) * item.quantity;
      if (val > 0) {
        dist[r] = (dist[r] || 0) + val;
      }
    });
    return Object.entries(dist)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [groupedPortfolio]);

  const renderExploreTab = () => (
    <>
      <View style={styles.exploreHeader}>
        <Text style={styles.exploreTitle}>Explore Popular Cards</Text>
        <TouchableOpacity style={styles.searchBar} onPress={() => setSearchOpen(true)} activeOpacity={0.7}>
          <Feather name="search" size={18} color="#475569" />
          <Text style={styles.searchPlaceholder}>Search any card...</Text>
        </TouchableOpacity>
      </View>
      {sortedMarketMovers.length > 0 && (
        <View style={styles.moversSection}>
          <View style={styles.moversHeader}>
            <Feather name="trending-up" size={18} color="#f43f5e" />
            <Text style={styles.moversTitle}>Market Movers</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.moversScroll}>
            {sortedMarketMovers.map((g, idx) => {
              const c = g.card || g;
              return (
                <TouchableOpacity
                  key={`gainer-${idx}`}
                  style={styles.moverCard}
                  onPress={() => setSelectedCard(g)}
                  activeOpacity={0.7}
                >
                  {c.image_url && (
                    <Image source={{ uri: c.image_url }} style={styles.moverImage} resizeMode="contain" />
                  )}
                  <View style={styles.moverInfo}>
                    <Text style={styles.moverName} numberOfLines={1}>
                      {c.name}
                    </Text>
                    <Text style={styles.moverSet} numberOfLines={1}>
                      {(c.set_name || '').split(' • ')[0]}
                    </Text>
                    <Text
                      style={[
                        styles.moverPercent,
                        { color: g.computedStat?.isUp ? '#fb7185' : '#fb7185' },
                      ]}
                    >
                      {g.computedStat?.isUp ? '+' : '-'}
                      {g.computedStat?.percent}%
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}
    </>
  );

  const renderPortfolioTab = () => (
    <>
      {stats && (
        <View style={styles.statsSection}>
          <View style={styles.statsGrid}>
            <View style={styles.netWorthCard}>
              <Text style={styles.netWorthLabel}>Net Worth</Text>
              <Text style={styles.netWorthValue}>${formatMoney(stats.total_portfolio_value)}</Text>
            </View>
            <View style={styles.assetsCard}>
              <Text style={styles.assetsLabel}>Assets</Text>
              <Text style={styles.assetsValue}>{stats.total_cards}</Text>
            </View>
          </View>
          <View style={styles.distributionCard}>
            <View style={styles.distributionHeader}>
              <Text style={styles.distributionTitle}>Asset Allocation</Text>
            </View>
            {portfolioDistribution.length > 0 ? (
              <View style={styles.distributionContent}>
                <View style={styles.pieContainer}>
                  {portfolioDistribution.slice(0, 6).map((item, i) => (
                    <View key={i} style={[styles.pieSlice, { backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }]} />
                  ))}
                </View>
                <View style={styles.topHoldings}>
                  <Text style={styles.topHoldingsTitle}>Top Holdings</Text>
                  {portfolioDistribution.slice(0, 3).map((item, i) => (
                    <View key={i} style={styles.holdingRow}>
                      <View style={styles.holdingLeft}>
                        <View style={[styles.holdingDot, { backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }]} />
                        <Text style={styles.holdingName}>{item.name}</Text>
                      </View>
                      <Text style={styles.holdingValue}>${formatMoney(item.value)}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : (
              <View style={styles.noDataContainer}>
                <Text style={styles.noDataText}>Not enough data</Text>
              </View>
            )}
          </View>
        </View>
      )}
    </>
  );

  const renderCard = useCallback(
    ({ item }: { item: CollectionItem }) => {
      const cardObj = item.card || item;
      const targetId = cardObj.pokemon_tcg_id || cardObj.id;
      return (
        <View key={String(targetId || item.id)} style={{ width: CARD_WIDTH }}>
          <VaultCard
            coll={item}
            onOpenAnalytics={setSelectedCard}
            onAdd={handleAdd}
            onDelete={confirmDelete}
            isPortfolio={activeTab === 'portfolio'}
            quantity={item.quantity}
            inPortfolio={ownedIds.has(targetId as string)}
            isAdding={busyCardId === targetId && busyAction === 'add'}
            isDeleting={busyCardId === targetId && busyAction === 'delete'}
          />
        </View>
      );
    },
    [activeTab, ownedIds, busyCardId, busyAction, handleAdd, confirmDelete]
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerLeft}>
          <View style={styles.headerLogo} />
          <Text style={styles.headerTitle}>COLLECTR</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => setUserMenuOpen(!userMenuOpen)}
            activeOpacity={0.7}
          >
            <Feather name="user" size={22} color="#94a3b8" />
          </TouchableOpacity>
          {userMenuOpen && (
            <>
              <TouchableOpacity style={styles.menuOverlay} onPress={() => setUserMenuOpen(false)} activeOpacity={1} />
              <View style={styles.userMenu}>
                <View style={styles.userMenuHeader}>
                  <Text style={styles.userMenuLabel}>Signed in as</Text>
                  <Text style={styles.userMenuEmail} numberOfLines={1}>
                    {token ? 'Collector' : ''}
                  </Text>
                </View>
                <View style={styles.liveBadge}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveText}>Live API</Text>
                </View>
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.7}>
                  <Feather name="log-out" size={18} color="#fb7185" />
                  <Text style={styles.logoutText}>Log Out</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'explore' && styles.tabButtonActive]}
          onPress={() => setActiveTab('explore')}
          activeOpacity={0.7}
        >
          <Feather
            name="grid"
            size={20}
            color={activeTab === 'explore' ? '#2dd4bf' : '#475569'}
          />
          <Text
            style={[
              styles.tabButtonText,
              activeTab === 'explore' && styles.tabButtonTextActive,
            ]}
          >
            Explore
          </Text>
          {activeTab === 'explore' && <View style={styles.tabIndicator} />}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'portfolio' && styles.tabButtonActive]}
          onPress={() => setActiveTab('portfolio')}
          activeOpacity={0.7}
        >
          <Feather
            name="briefcase"
            size={20}
            color={activeTab === 'portfolio' ? '#2dd4bf' : '#475569'}
          />
          <Text
            style={[
              styles.tabButtonText,
              activeTab === 'portfolio' && styles.tabButtonTextActive,
            ]}
          >
            Vault
          </Text>
          {activeTab === 'portfolio' && <View style={styles.tabIndicator} />}
        </TouchableOpacity>
      </View>

      {toast.visible && (
        <View
          style={[
            styles.toast,
            toast.type === 'error' ? styles.toastError : styles.toastSuccess,
          ]}
        >
          <Feather
            name={toast.type === 'error' ? 'x' : 'check-circle'}
            size={15}
            color={toast.type === 'error' ? '#f43f5e' : '#2dd4bf'}
          />
          <Text
            style={[
              styles.toastText,
              { color: toast.type === 'error' ? '#f43f5e' : '#2dd4bf' },
            ]}
          >
            {toast.message}
          </Text>
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#14b8a6"
            colors={['#14b8a6']}
          />
        }
      >
        {activeTab === 'explore' ? renderExploreTab() : renderPortfolioTab()}

        {activeTab === 'portfolio' && currentCards.length === 0 && !loading ? (
          <EmptyState onGoExplore={() => setActiveTab('explore')} />
        ) : (
          <>
            <View style={styles.listHeader}>
              <Text style={styles.listCount}>{currentCards.length} found</Text>
              <View style={styles.listActions}>
                {activeTab === 'explore' && (
                  <TouchableOpacity
                    style={styles.filterButton}
                    onPress={() => setRaritySheetOpen(true)}
                    activeOpacity={0.7}
                  >
                    <Feather name="sliders" size={18} color="#94a3b8" />
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.sortButton}
                  onPress={() => setSortSheetOpen(true)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.sortButtonText}>Sort: {sortBy}</Text>
                  <Feather name="chevron-down" size={14} color="#94a3b8" />
                </TouchableOpacity>
              </View>
            </View>

            {loading && explorePage === 1 ? (
              <View style={styles.grid}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <View key={i} style={[styles.skeletonCard, { width: CARD_WIDTH }]} />
                ))}
              </View>
            ) : (
              <View style={styles.grid}>
                {currentCards.map((item) => renderCard({ item } as { item: CollectionItem }))}
              </View>
            )}

            {activeTab === 'explore' && (
              <View style={styles.loadMoreContainer}>
                <TouchableOpacity
                  style={styles.loadMoreButton}
                  onPress={handleLoadMore}
                  disabled={loadingMore}
                  activeOpacity={0.7}
                >
                  {loadingMore ? (
                    <ActivityIndicator size="small" color="#14b8a6" />
                  ) : (
                    <Text style={styles.loadMoreText}>Load More</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </ScrollView>

      <SearchModal
        visible={searchOpen}
        onClose={() => setSearchOpen(false)}
        onAdd={handleAdd}
        onOpenAnalytics={setSelectedCard}
      />

      {selectedCard && (
        <AnalyticsModal
          coll={selectedCard}
          onClose={() => setSelectedCard(null)}
          onAdd={handleAdd}
          onDelete={confirmDelete}
          isPortfolio={activeTab === 'portfolio' || Boolean((selectedCard as CollectionItem | CardData).user_id)}
        />
      )}

      <ConfirmDialog
        visible={confirmDialog.visible}
        title="Remove Asset?"
        message={`Remove 1 copy of ${confirmDialog.coll?.card?.name || confirmDialog.coll?.name}?`}
        onCancel={handleDismissConfirm}
        onConfirm={executeDelete}
        confirmText="Remove"
        confirmColor="#f43f5e"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 56,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerLogo: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#14b8a6',
    shadowColor: '#14b8a6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 2,
  },
  headerRight: {
    position: 'relative',
  },
  menuButton: {
    padding: 8,
  },
  menuOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  userMenu: {
    position: 'absolute',
    top: 44,
    right: 0,
    width: 220,
    backgroundColor: '#141414',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 100,
  },
  userMenuHeader: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    paddingBottom: 12,
    marginBottom: 12,
  },
  userMenuLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 4,
  },
  userMenuEmail: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(20,184,166,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(20,184,166,0.2)',
    borderRadius: 8,
    padding: 8,
    marginHorizontal: 4,
    marginBottom: 8,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
  },
  liveText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#34d399',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fb7185',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#0a0a0a',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    gap: 4,
  },
  tabButtonActive: {
    backgroundColor: 'rgba(20,184,166,0.05)',
  },
  tabButtonText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#475569',
    letterSpacing: 1,
  },
  tabButtonTextActive: {
    color: '#2dd4bf',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    width: 32,
    height: 2,
    backgroundColor: '#2dd4bf',
    borderRadius: 1,
  },
  toast: {
    position: 'absolute',
    top: 80,
    left: '50%',
    transform: [{ translateX: -120 }],
    width: 240,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1,
    zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  toastSuccess: {
    backgroundColor: 'rgba(20,184,166,0.1)',
    borderColor: '#14b8a6',
  },
  toastError: {
    backgroundColor: 'rgba(244,63,94,0.1)',
    borderColor: '#f43f5e',
  },
  toastText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  exploreHeader: {
    backgroundColor: '#141414',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  exploreTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  searchPlaceholder: {
    color: '#64748b',
    fontSize: 14,
  },
  moversSection: {
    marginBottom: 24,
  },
  moversHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  moversTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#f43f5e',
  },
  moversScroll: {
    gap: 12,
    paddingRight: 16,
  },
  moverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#161616',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    padding: 14,
    minWidth: 200,
  },
  moverImage: {
    width: 40,
    height: 56,
  },
  moverInfo: {
    flex: 1,
    minWidth: 0,
  },
  moverName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  moverSet: {
    fontSize: 9,
    color: '#64748b',
    marginBottom: 4,
  },
  moverPercent: {
    fontSize: 14,
    fontWeight: '900',
  },
  statsSection: {
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  netWorthCard: {
    flex: 2,
    backgroundColor: 'rgba(20,184,166,0.1)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  netWorthLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: '#14b8a6',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 8,
  },
  netWorthValue: {
    fontSize: 28,
    fontWeight: '900',
    color: '#34d399',
  },
  assetsCard: {
    flex: 1,
    backgroundColor: '#141414',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
  },
  assetsLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 4,
  },
  assetsValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#fff',
  },
  distributionCard: {
    backgroundColor: '#141414',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  distributionHeader: {
    marginBottom: 12,
  },
  distributionTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  distributionContent: {
    flexDirection: 'row',
    gap: 16,
  },
  pieContainer: {
    flex: 1,
    height: 128,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pieSlice: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  topHoldings: {
    flex: 1,
  },
  topHoldingsTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 12,
  },
  holdingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  holdingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  holdingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  holdingName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  holdingValue: {
    fontSize: 12,
    fontWeight: '900',
    color: '#2dd4bf',
  },
  noDataContainer: {
    height: 128,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noDataText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#334155',
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  listCount: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  listActions: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    padding: 10,
    backgroundColor: '#141414',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#141414',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  sortButtonText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: 'bold',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CARD_GAP,
  },
  skeletonCard: {
    aspectRatio: 3 / 4,
    backgroundColor: '#141414',
    borderRadius: 20,
    marginBottom: CARD_GAP,
  },
  loadMoreContainer: {
    marginTop: 32,
    alignItems: 'center',
    paddingBottom: 16,
  },
  loadMoreButton: {
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 999,
    paddingHorizontal: 24,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  loadMoreText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#14b8a6',
  },
});
