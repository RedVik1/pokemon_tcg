import { useState, useEffect, useCallback } from "react";
import api from "../../../shared/api/axios";
import { useDebounce } from "../../../shared/lib/hooks";

const RECENT_KEY = "collectr_recent_searches";
const MAX_RECENT = 5;

const POPULAR_SEARCHES = [
  "Charizard",
  "Pikachu",
  "Mewtwo",
  "Lugia",
  "Umbreon",
  "Rayquaza",
];

function getRecentSearches() {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY)) || [];
  } catch {
    return [];
  }
}

function addRecentSearch(query) {
  const q = query.trim();
  if (!q) return;
  const prev = getRecentSearches().filter((s) => s.toLowerCase() !== q.toLowerCase());
  const next = [q, ...prev].slice(0, MAX_RECENT);
  localStorage.setItem(RECENT_KEY, JSON.stringify(next));
}

function removeRecentSearch(query) {
  const next = getRecentSearches().filter((s) => s !== query);
  localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  return next;
}

function clearRecentSearches() {
  localStorage.removeItem(RECENT_KEY);
}

/**
 * Hook that encapsulates card search logic.
 *
 * @param {{ query: string, open: boolean }} opts
 * @returns {{
 *   debounced: string,
 *   results: Array<Object>,
 *   loading: boolean,
 *   recentSearches: Array<string>,
 *   popularSearches: string[],
 *   setQuery: (q: string) => void,
 *   addRecent: (q: string) => void,
 *   removeRecent: (q: string) => void,
 *   clearRecents: () => void,
 *   reset: () => void,
 * }}
 */
export function useSearch({ query, open }) {
  const debounced = useDebounce(query, 600);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);

  // Initialize recent searches when palette opens
  useEffect(() => {
    if (open) {
      setRecentSearches(getRecentSearches());
    }
  }, [open]);

  // Fetch results when debounced query changes
  useEffect(() => {
    if (!open || !debounced) {
      setResults([]);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    api
      .get(`/search?query=${encodeURIComponent(debounced)}&limit=50`, { signal: controller.signal })
      .then((r) => setResults(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [debounced, open]);

  const setQuery = useCallback((q) => {
    // This is handled by the component's local state.
    // This hook exposes nothing for setting the raw query.
  }, []);

  const addRecent = useCallback((q) => {
    addRecentSearch(q);
    setRecentSearches(getRecentSearches());
  }, []);

  const removeRecent = useCallback((q) => {
    const next = removeRecentSearch(q);
    setRecentSearches(next);
  }, []);

  const clearRecents = useCallback(() => {
    clearRecentSearches();
    setRecentSearches([]);
  }, []);

  const reset = useCallback(() => {
    setResults([]);
    setLoading(false);
  }, []);

  return {
    debounced,
    results,
    loading,
    recentSearches,
    popularSearches: POPULAR_SEARCHES,
    addRecent,
    removeRecent,
    clearRecents,
    reset,
  };
}
