import { create } from "../../../shared/lib/store";

/**
 * @typedef {Object} FilterState
 * @property {string} sortBy
 * @property {string} rarityFilter
 * @property {boolean} sortSheetOpen
 * @property {boolean} raritySheetOpen
 * @property {(sortBy: string) => void} setSortBy
 * @property {(rarity: string) => void} setRarityFilter
 * @property {() => void} toggleSortSheet
 * @property {() => void} toggleRaritySheet
 * @property {() => void} resetFilters
 */

export const useFilterStore = create((set) => ({
  sortBy: "Newest",
  rarityFilter: "All",
  sortSheetOpen: false,
  raritySheetOpen: false,

  setSortBy: (sortBy) => set({ sortBy }),

  setRarityFilter: (rarityFilter) => set({ rarityFilter }),

  toggleSortSheet: () => set((state) => ({ sortSheetOpen: !state.sortSheetOpen })),

  toggleRaritySheet: () => set((state) => ({ raritySheetOpen: !state.raritySheetOpen })),

  resetFilters: () => set({
    sortBy: "Newest",
    rarityFilter: "All",
    sortSheetOpen: false,
    raritySheetOpen: false,
  }),
}));
