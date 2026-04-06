export function safePrice(p: unknown): number {
  if (p == null) return 0;
  const v = parseFloat(String(p).replace(/,/g, ''));
  return Number.isFinite(v) ? v : 0;
}

export function formatMoney(amount: number): string {
  const n = Number(amount);
  if (!Number.isFinite(n)) return '0.00';
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatRarity(r?: string): string {
  if (!r) return 'Rare';
  if (r === 'Rare Secret' || r === 'Hyper Rare') return 'Secret Rare';
  if (r === 'Rare Ultra') return 'Ultra Rare';
  if (r === 'Rare Holo') return 'Holo Rare';
  if (r === 'Rare Holo V') return 'Double Rare (V)';
  return r;
}

interface ChartPoint {
  name: string;
  price: number;
}

interface ChartResult {
  data: ChartPoint[];
  percent: string;
  isUp: boolean;
  isEstimated: boolean;
}

export function getChartDataFromHistory(
  historyRaw: Record<string, number[]> | null | undefined,
  timeframe = '1M',
  grade = 'Raw'
): ChartResult {
  if (!historyRaw || !historyRaw[timeframe] || historyRaw[timeframe].length === 0) {
    return { data: [], percent: '0.00', isUp: true, isEstimated: false };
  }
  const arr = historyRaw[timeframe];
  const arrLen = arr.length;
  const isEstimated = grade !== 'Raw';

  const gradeConfig: Record<string, { multiplier: number; sinAmplitude: number; sinFrequency: number; phaseShift: number }> = {
    'Raw':    { multiplier: 1.0, sinAmplitude: 0,    sinFrequency: 0, phaseShift: 0 },
    'PSA 9':  { multiplier: 1.8, sinAmplitude: 0.08, sinFrequency: (2 * Math.PI) / arrLen, phaseShift: Math.PI / 3 },
    'PSA 10': { multiplier: 4.2, sinAmplitude: 0.12, sinFrequency: (2 * Math.PI) / (arrLen * 0.7), phaseShift: Math.PI / 6 },
  };

  const config = gradeConfig[grade] ?? gradeConfig['Raw'];

  const data: ChartPoint[] = arr.map((val, idx) => {
    let label = '';
    if (timeframe === '1W' || timeframe === '1M') {
      label = idx === arrLen - 1 ? 'Today' : `${arrLen - 1 - idx}d ago`;
    } else if (timeframe === '1Y') {
      label = idx === arrLen - 1 ? 'This Mo' : `${arrLen - 1 - idx}mo ago`;
    }

    let price = 0;
    if (Number.isFinite(val)) {
      const basePrice = val * config.multiplier;
      if (grade === 'Raw') {
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
  const percent = firstPrice > 0 ? ((Math.abs(change) / firstPrice) * 100).toFixed(2) : '0.00';
  return { data, percent, isUp: change >= 0, isEstimated };
}

export function getEmailFromToken(token: string | null): string | null {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const payload = JSON.parse(atobOrPolyfill(padded));
    return payload?.sub || 'Collector';
  } catch {
    return 'Collector';
  }
}

function atobOrPolyfill(str: string): string {
  if (typeof atob === 'function') return atob(str);
  return decodeBase64(str);
}

function decodeBase64(str: string): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let result = '';
  let i = 0;
  while (i < str.length) {
    const a = chars.indexOf(str[i++]);
    const b = chars.indexOf(str[i++]);
    const c = chars.indexOf(str[i++]);
    const d = chars.indexOf(str[i++]);
    const chunk = (a << 18) | (b << 12) | (c >> 6) | d;
    const e = (chunk >> 16) & 0xff;
    const f = (chunk >> 8) & 0xff;
    const g = chunk & 0xff;
    if (c !== 64) result += String.fromCharCode(e, f);
    else result += String.fromCharCode(e);
    if (d !== 64) result += String.fromCharCode(g);
  }
  return result;
}
