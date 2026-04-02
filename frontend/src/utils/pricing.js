export function safePrice(p) {
  if (p == null) return 0;
  const v = parseFloat(String(p).replace(/,/g, ""));
  return Number.isFinite(v) ? v : 0;
}

export function formatMoney(amount) {
  return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
