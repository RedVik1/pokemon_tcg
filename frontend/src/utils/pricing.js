export function safePrice(p) {
  if (p == null) return 0;
  const v = parseFloat(String(p).replace(/,/g, ""));
  return Number.isFinite(v) ? v : 0;
}

export function formatMoney(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return "0.00";
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
