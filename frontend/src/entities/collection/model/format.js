import { safePrice } from "../../../shared/lib/pricing";
import { formatRarity } from "../../../shared/lib/rarity";

/**
 * Generates a CSV data URI for portfolio export.
 *
 * @param {Array<{
 *   card: {name: string, set_name?: string, rarity?: string, price?: number},
 *   quantity: number
 * }>} groupedItems
 * @returns {{url: string, filename: string}}
 */
export function generatePortfolioCSV(groupedItems) {
  let csvContent = "data:text/csv;charset=utf-8,Card Name,Set,Rarity,Quantity,Price (ea),Total Value\n";
  groupedItems.forEach((item) => {
    const c = item.card;
    const price = safePrice(c.price);
    const qty = item.quantity;
    const escapeCsv = (s) => {
      const str = String(s);
      return `"${str.replace(/"/g, '""')}"`;
    };
    csvContent += `${escapeCsv(c.name)},${escapeCsv(c.set_name)},${escapeCsv(formatRarity(c.rarity))},${qty},${price.toFixed(2)},${(price * qty).toFixed(2)}\n`;
  });

  const dateStr = new Date().toISOString().split("T")[0];
  const encodedUri = encodeURI(csvContent);

  return {
    url: encodedUri,
    filename: `Pokemon_Portfolio_${dateStr}.csv`,
  };
}

/**
 * Triggers a download of the generated CSV file.
 *
 * @param {{url: string, filename: string}} csv
 */
export function downloadCSV(csv) {
  const link = document.createElement("a");
  link.setAttribute("href", csv.url);
  link.setAttribute("download", csv.filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
