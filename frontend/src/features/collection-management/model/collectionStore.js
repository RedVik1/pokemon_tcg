import { create } from "../../../shared/lib/store";

/**
 * @typedef {Object} CollectionState
 * @property {Array<Object>} items           - Raw collection items from API
 * @property {boolean} loading
 * @property {string | null} error
 * @property {number} page                   - Current pagination page for explore
 * @property {Set<string>} ownedIds          - Set of owned pokemon_tcg_ids
 * @property {string | null} busyCardId      - Card currently being added/removed
 * @property {'add' | 'delete' | null} busyAction
 * @property {(items: Array<Object>) => void} setItems
 * @property {(page: number) => void} setPage
 * @property {(id: string | null) => void} setBusyCardId
 * @property {(action: 'add' | 'delete' | null) => void} setBusyAction
 * @property {() => void} computeOwnedIds
 */

export const useCollectionStore = create((set, get) => ({
  items: [],
  loading: false,
  error: null,
  page: 1,
  ownedIds: new Set(),
  busyCardId: null,
  busyAction: null,

  setItems: (items) => set({ items }),

  setPage: (page) => set({ page }),

  setBusyCardId: (busyCardId) => set({ busyCardId }),

  setBusyAction: (busyAction) => set({ busyAction }),

  computeOwnedIds: () => {
    const { items } = get();
    const ids = new Set(
      items.filter((c) => c.card?.pokemon_tcg_id).map((c) => c.card.pokemon_tcg_id)
    );
    set({ ownedIds: ids });
  },
}));
