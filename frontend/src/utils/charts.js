export function getChartDataFromHistory(historyRaw, timeframe = "1M", grade = "Raw") {
  if (!historyRaw || !historyRaw[timeframe] || historyRaw[timeframe].length === 0) {
    return { data: [], percent: "0.00", isUp: true, isEstimated: false };
  }
  const arr = historyRaw[timeframe];
  const arrLen = arr.length;
  const isEstimated = grade !== "Raw";

  const gradeConfig = {
    "Raw":    { multiplier: 1.0, sinAmplitude: 0,    sinFrequency: 0, phaseShift: 0 },
    "PSA 9":  { multiplier: 1.8, sinAmplitude: 0.08, sinFrequency: (2 * Math.PI) / arrLen, phaseShift: Math.PI / 3 },
    "PSA 10": { multiplier: 4.2, sinAmplitude: 0.12, sinFrequency: (2 * Math.PI) / (arrLen * 0.7), phaseShift: Math.PI / 6 },
  };

  const config = gradeConfig[grade] ?? gradeConfig["Raw"];

  const data = arr.map((val, idx) => {
    let label = "";
    if (timeframe === "1W" || timeframe === "1M") {
      label = idx === arrLen - 1 ? "Today" : `${arrLen - 1 - idx}d ago`;
    } else if (timeframe === "1Y") {
      label = idx === arrLen - 1 ? "This Mo" : `${arrLen - 1 - idx}mo ago`;
    }

    let price = 0;
    if (Number.isFinite(val)) {
      const basePrice = val * config.multiplier;
      if (grade === "Raw") {
        price = basePrice;
      } else {
        const sinModulation = 1 + config.sinAmplitude * Math.sin(config.sinFrequency * idx + config.phaseShift);
        const trendBias = 1 + (config.multiplier - 1) * 0.02 * (idx / Math.max(arrLen - 1, 1));
        price = basePrice * sinModulation * trendBias;
      }
    }
    return { name: label, price };
  });

  const firstPrice = data[0]?.price ?? 0;
  const currentPrice = data[arrLen - 1]?.price ?? 0;
  const change = currentPrice - firstPrice;
  const percent = firstPrice > 0 ? ((Math.abs(change) / firstPrice) * 100).toFixed(2) : "0.00";
  return { data, percent, isUp: change >= 0, isEstimated };
}
