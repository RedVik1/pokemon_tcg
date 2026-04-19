import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../shared/api/axios";
import { useAuthStore } from "../../../features/auth/model/authStore";
import { useCollectionStore } from "../../../features/collection-management/model/collectionStore";
import { usePortfolioStore } from "../../../features/portfolio-analytics/model/usePortfolio";
import { useMoversStore } from "../../../features/market-movers/model/useMovers";
import { useFilterStore } from "../../../features/sort-filter/model/filterStore";
import { groupPortfolioItems, calcPortfolioDistribution, getOwnedIds } from "../../../entities/collection";

/**
 * Dashboard orchestration hook.
 * Coordinates all feature stores, handles data fetching, and exposes
 * page-level state and actions.
 */
export function useDashboard() {
  const navigate = useNavigate();
  const initAuth = useAuthStore((s) => s.initFromStorage);
  const token = useAuthStore((s) => s.token);
  const clearToken = useAuthStore((s) => s.clearToken);

  const collectionItems = useCollectionStore((s) => s.items);
  const setCollectionItems = useCollectionStore((s) => s.setItems);
  const setCollectionPage = useCollectionStore((s) => s.setPage);
  const collectionPage = useCollectionStore((s) => s.page);
  const computeOwnedIds = useCollectionStore((s) => s.computeOwnedIds);

  const setPortfolioStats = usePortfolioStore((s) => s.setStats);
  const setPortfolioDistribution = usePortfolioStore((s) => s.setDistribution);
  const portfolioStats = usePortfolioStore((s) => s.stats);

  const setMarketMovers = useMoversStore((s) => s.setMovers);
  const marketMovers = useMoversStore((s) => s.movers);

  const sortBy = useFilterStore((s) => s.sortBy);
  const rarityFilter = useFilterStore((s) => s.rarityFilter);
  const setSortBy = useFilterStore((s) => s.setSortBy);
  const setRarityFilter = useFilterStore((s) => s.setRarityFilter);

  const [activeTab, setActiveTab] = useState("explore");
  const [exploreCards, setExploreCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [selectedColl, setSelectedColl] = useState(null);

  // Initialize auth from localStorage
  useEffect(() => {
    initAuth();
  }, [initAuth]);

  // Redirect to login if no token
  useEffect(() => {
    if (!token) {
      navigate("/login", { replace: true });
    }
  }, [token, navigate]);

  // Reset sort when tab changes
  useEffect(() => {
    if (activeTab === "portfolio") setSortBy("Price: High to Low");
    else if (activeTab === "explore") setSortBy("Newest");
    setCollectionPage(1);
  }, [activeTab, setSortBy, setCollectionPage]);

  // Abort controller for fetch cancellation
  const abortRef = useRef(null);

  const fetchData = useCallback(
    async (pageToLoad = 1, append = false) => {
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      if (!append) setLoading(true);
      else setLoadingMore(true);

      try {
        const rarityQuery = rarityFilter === "All" ? "" : `&rarity=${encodeURIComponent(rarityFilter)}`;
        const sortQuery = `&sort_by=${encodeURIComponent(sortBy)}`;
        const [statsRes, collRes, exploreRes] = await Promise.all([
          api.get("/portfolio/stats", { signal: controller.signal }),
          api.get("/collections/me", { signal: controller.signal }),
          api.get(`/search?query=&page=${pageToLoad}&limit=48${rarityQuery}${sortQuery}`, {
            signal: controller.signal,
          }),
        ]);

        if (controller.signal.aborted) return;

        setPortfolioStats(statsRes.data);
        setCollectionItems(collRes.data || []);
        computeOwnedIds();

        const newExplore = (exploreRes.data || []).map((card) => {
          // Find if user owns this card to set the initial quantity
          const ownedItem = collectionItems.find(item => item.card?.pokemon_tcg_id === card.pokemon_tcg_id);
          return {
            id: `exp-${card.id}-${pageToLoad}`,
            card,
            condition: "Market",
            quantity: ownedItem ? ownedItem.quantity : 0,
          };
        });

        if (append) {
          setExploreCards((prev) => {
            const prevIds = new Set(prev.filter((p) => p.card).map((p) => p.card.id));
            const uniqueNew = newExplore.filter((n) => n.card && !prevIds.has(n.card.id));
            return [...prev, ...uniqueNew];
          });
        } else {
          setExploreCards(newExplore);
        }
      } catch (error) {
        if (error.name === "CanceledError" || error.code === "ERR_CANCELED" || controller.signal.aborted)
          return;
        if (error.response && error.response.status === 401) {
          clearToken();
          navigate("/login");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [
      rarityFilter,
      sortBy,
      setPortfolioStats,
      setCollectionItems,
      computeOwnedIds,
      clearToken,
      navigate,
    ],
  );

  // Fetch market movers once
  useEffect(() => {
    api.get("/market-movers").then((r) => setMarketMovers(r.data || [])).catch(() => setMarketMovers([]));
  }, [setMarketMovers]);

  // Fetch data when filters change
  useEffect(() => {
    setCollectionPage(1);
    fetchData(1, false);
  }, [rarityFilter, sortBy, fetchData, setCollectionPage]);

  const handleLoadMore = useCallback(() => {
    setCollectionPage((prev) => {
      fetchData(prev + 1, true);
      return prev + 1;
    });
  }, [fetchData, setCollectionPage]);

  const handleRefresh = useCallback(() => {
    fetchData(1, false);
  }, [fetchData]);

  // Grouped portfolio
  const groupedPortfolio = groupPortfolioItems(collectionItems);
  const portfolioDistribution = calcPortfolioDistribution(groupedPortfolio);
  const ownedIds = getOwnedIds(collectionItems);

  // Sorted cards for current tab
  const currentCards = (() => {
    let cards = activeTab === "explore" ? [...exploreCards] : [...groupedPortfolio];
    if (activeTab === "portfolio") {
      if (sortBy === "Price: High to Low")
        cards.sort((a, b) => parseFloat(b?.card?.price || 0) - parseFloat(a?.card?.price || 0));
      else if (sortBy === "Price: Low to High")
        cards.sort((a, b) => parseFloat(a?.card?.price || 0) - parseFloat(b?.card?.price || 0));
    }
    return cards;
  })();

  return {
    // State
    activeTab,
    setActiveTab,
    exploreCards,
    groupedPortfolio,
    currentCards,
    portfolioStats,
    portfolioDistribution,
    marketMovers,
    loading,
    loadingMore,
    paletteOpen,
    setPaletteOpen,
    selectedColl,
    setSelectedColl,
    sortBy,
    rarityFilter,
    setSortBy,
    setRarityFilter,
    ownedIds,
    collectionItems,

    // Actions
    handleLoadMore,
    handleRefresh,
    fetchData,
  };
}
