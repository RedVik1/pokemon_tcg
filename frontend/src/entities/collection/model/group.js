import { formatRarity } from "../../../shared/lib/rarity";
import { safePrice } from "../../../shared/lib/pricing";

/**
 * Groups individual collection items by pokemon_tcg_id,
 * merging quantities and collecting instance IDs.
 *
 * @param {Array<{id: string|number, card: {pokemon_tcg_id?: string}, quantity?: number}>} items
 * @returns {Array<{
 *   id: string,
 *   card: Object,
 *   quantity: number,
 *   instance_ids: Array<string|number>
 * }>}
 */
export function groupPortfolioItems(items) {
  if (!Array.isArray(items)) return [];
  const map = new Map();
  items.forEach((item) => {
    if (!item?.card?.pokemon_tcg_id) return;
    const id = item.card.pokemon_tcg_id;
    const qty = Math.max(1, item.quantity || 1);
    if (!map.has(id)) {
      map.set(id, { ...item, quantity: qty, instance_ids: [item.id] });
    } else {
      const existing = map.get(id);
      existing.quantity += qty;
      existing.instance_ids.push(item.id);
    }
  });
  return Array.from(map.values());
}

/**
 * Calculates portfolio value distribution by rarity.
 *
 * @param {Array<{card: Object, quantity: number}>} groupedItems
 * @returns {Array<{name: string, value: number}>}
 */
export function calcPortfolioDistribution(groupedItems) {
  const dist = {};
  groupedItems.forEach((item) => {
    const r = formatRarity(item.card?.rarity || item.card?.set_name?.split(" • ")[1] || "Unknown");
    const val = safePrice(item.card?.price) * (item.quantity || 1);
    if (val > 0) {
      dist[r] = (dist[r] || 0) + val;
    }
  });
  return Object.entries(dist)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

/**
 * Extracts the set of owned card pokemon_tcg_ids for quick lookup.
 *
 * @param {Array<{card: {pokemon_tcg_id?: string}}>} items
 * @returns {Set<string>}
 */
export function getOwnedIds(items) {
  if (!Array.isArray(items)) return new Set();
  return new Set(
    items.filter((c) => c.card?.pokemon_tcg_id).map((c) => c.card.pokemon_tcg_id)
  );
}
