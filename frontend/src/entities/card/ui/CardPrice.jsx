import React from "react";
import { safePrice, formatMoney } from "../../../shared/lib/pricing";

/**
 * Renders a formatted price for a card.
 * Supports optional per-unit label when quantity > 1.
 *
 * @param {{
 *   price: number | string,
 *   quantity?: number,
 *   className?: string,
 * }} props
 */
export default function CardPrice({ price, quantity, className = "" }) {
  const unitPrice = safePrice(price);
  const displayTotal = quantity && quantity > 1 ? unitPrice * quantity : unitPrice;

  return (
    <div className={`flex flex-col ${className}`}>
      <div className="text-base md:text-lg font-black text-white">
        ${formatMoney(displayTotal)}
      </div>
      {quantity && quantity > 1 && (
        <div className="text-[8px] md:text-[9px] text-slate-500 font-bold">
          ${formatMoney(unitPrice)} / ea
        </div>
      )}
    </div>
  );
}
