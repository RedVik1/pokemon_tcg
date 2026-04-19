import { create } from "../../../shared/lib/store";

/**
 * @typedef {Object} MarketMoversState
 * @property {Array<Object>} movers       - Raw market movers from API
 * @property {boolean} loading
 * @property {(movers: Array<Object>) => void} setMovers
 */

export const useMoversStore = create((set) => ({
  movers: [],
  loading: false,

  setMovers: (movers) => set({ movers }),
}));
