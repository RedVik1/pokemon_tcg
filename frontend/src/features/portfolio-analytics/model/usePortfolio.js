import { create } from "../../../shared/lib/store";

/**
 * @typedef {Object} PortfolioState
 * @property {Object | null} stats              - Raw stats response from API
 * @property {Array<{name: string, value: number}>} distribution - Value distribution by rarity
 * @property {boolean} loading
 * @property {(stats: Object | null) => void} setStats
 * @property {(distribution: Array<{name: string, value: number}>) => void} setDistribution
 */

export const usePortfolioStore = create((set) => ({
  stats: null,
  distribution: [],
  loading: false,

  setStats: (stats) => set({ stats }),

  setDistribution: (distribution) => set({ distribution }),
}));
