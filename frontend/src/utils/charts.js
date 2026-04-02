export function getChartDataFromHistory(historyRaw, timeframe = "1M", grade = "Raw") {
  if (!historyRaw || !historyRaw[timeframe] || historyRaw[timeframe].length === 0) {
    return { data: [], percent: "0.00", isUp: true, isEstimated: false };
  }
  const arr = historyRaw[timeframe];
  const arrLen = arr.length;
  const multiplier = grade === "PSA 10" ? 4.2 : grade === "PSA 9" ? 1.8 : 1.0;
  const isEstimated = grade !== "Raw";

  const data = arr.map((val, idx) => {
    let label = "";
    if (timeframe === "1W" || timeframe === "1M") {
      label = idx === arrLen - 1 ? "Today" : `${arrLen - 1 - idx}d ago`;
    } else if (timeframe === "1Y") {
      label = idx === arrLen - 1 ? "This Mo" : `${arrLen - 1 - idx}mo ago`;
    }
    const price = Number.isFinite(val) ? val * multiplier : 0;
    return { name: label, price };
  });
  const firstPrice = data[0]?.price ?? 0;
  const currentPrice = data[arrLen - 1]?.price ?? 0;
  const change = currentPrice - firstPrice;
  const percent = firstPrice > 0 ? ((Math.abs(change) / firstPrice) * 100).toFixed(2) : "0.00";
  return { data, percent, isUp: change >= 0, isEstimated };
}
