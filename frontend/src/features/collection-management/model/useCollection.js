import { useCallback } from "react";
import api from "../../../shared/api/axios";
import { useCollectionStore } from "./collectionStore";
import { useAuthStore } from "../../auth/model/authStore";

/**
 * Hook that encapsulates collection mutation logic (add/remove with optimistic updates).
 *
 * @param {{
 *   onRefresh: () => Promise<void>,
 *   onToast: (message: string, type: 'success' | 'error') => void,
 *   onNavigateLogin: () => void,
 * }} hooks
 * @returns {{
 *   handleAdd: (card: Object) => Promise<void>,
 *   handleRemove: (collectionItem: Object) => Promise<void>,
 * }}
 */
export function useCollection({ onRefresh, onToast, onNavigateLogin }) {
  const clearToken = useAuthStore((s) => s.clearToken);
  const busyCardId = useCollectionStore((s) => s.busyCardId);
  const setBusyCardId = useCollectionStore((s) => s.setBusyCardId);
  const setBusyAction = useCollectionStore((s) => s.setBusyAction);
  const collectionItems = useCollectionStore((s) => s.items);
  const setCollectionItems = useCollectionStore((s) => s.setItems);

  /**
   * Add a card to the user's collection with optimistic update.
   */
  const handleAdd = useCallback(
    async (card) => {
      const cardId = card.pokemon_tcg_id || card.id;
      setBusyCardId(cardId);
      setBusyAction("add");

      const newItem = {
        id: `optimistic-${Date.now()}`,
        card: { ...card, pokemon_tcg_id: cardId },
        quantity: 1,
        instance_ids: [`optimistic-${Date.now()}`],
      };

      // Optimistic add
      setCollectionItems((prev) => [...prev, newItem]);

      try {
        await api.post("/collections/add", {
          pokemon_tcg_id: String(cardId),
          condition: "Mint",
        });
        onToast(`${card.name} added to vault!`, "success");
        await onRefresh();
      } catch (error) {
        // Rollback
        setCollectionItems((prev) => prev.filter((item) => item.id !== newItem.id));
        if (error.response?.status === 401) {
          clearToken();
          onNavigateLogin();
          return;
        }
        onToast("Error adding card.", "error");
      } finally {
        setBusyCardId(null);
        setBusyAction(null);
      }
    },
    [setBusyCardId, setBusyAction, setCollectionItems, onToast, onRefresh, clearToken, onNavigateLogin],
  );

  /**
   * Remove a card from the user's collection with optimistic update.
   * Handles both quantity decrement and full deletion.
   */
  const handleRemove = useCallback(
    async (collectionItem) => {
      const instanceId = collectionItem.instance_ids?.[0] ?? collectionItem.id;
      if (!instanceId && instanceId !== 0) {
        onToast("Error: could not identify card to remove.", "error");
        return;
      }

      const cardId = collectionItem.card?.pokemon_tcg_id || collectionItem.card?.id;
      setBusyCardId(cardId);
      setBusyAction("delete");

      // Snapshot for rollback
      const snapshot = collectionItems;

      // Optimistic remove
      setCollectionItems((prev) => {
        const idx = prev.findIndex((item) => item.id === collectionItem.id);
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
        return prev.filter((item) => item.id !== collectionItem.id);
      });

      try {
        await api.delete(`/collections/${instanceId}`);
        onToast("Card removed.", "success");
        await onRefresh();
      } catch {
        // Rollback
        setCollectionItems(snapshot);
        onToast("Error removing card.", "error");
      } finally {
        setBusyCardId(null);
        setBusyAction(null);
      }
    },
    [collectionItems, setBusyCardId, setBusyAction, setCollectionItems, onToast, onRefresh],
  );

  return { handleAdd, handleRemove };
}
