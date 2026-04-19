export function formatRarity(r) {
  if (!r) return "Rare";
  if (r === "Rare Secret" || r === "Hyper Rare") return "Secret Rare";
  if (r === "Rare Ultra") return "Ultra Rare";
  if (r === "Rare Holo") return "Holo Rare";
  if (r === "Rare Holo V") return "Double Rare (V)";
  return r;
}
