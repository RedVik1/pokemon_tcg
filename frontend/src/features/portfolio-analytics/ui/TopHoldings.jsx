import React from "react";
import { PIE_COLORS } from "../../../shared/constants/colors";

/**
 * Shows the top 3 holdings by value.
 *
 * @param {{
 *   distribution: Array<{name: string, value: number}>,
 * }} props
 */
export default function TopHoldingsList({ distribution }) {
  const top3 = distribution.slice(0, 3);

  if (top3.length === 0) {
    return (
      <div className="h-32 md:h-40 flex items-center justify-center text-sm font-bold text-slate-600">
        No holdings
      </div>
    );
  }

  return (
    <div className="space-y-2 md:space-y-3">
      {top3.map((item, i) => (
        <div
          key={i}
          className="flex justify-between items-center bg-[#0a0a0a] p-2.5 md:p-3 rounded-xl border border-white/[0.04]"
        >
          <div className="flex items-center gap-2.5 md:gap-3">
            <div
              className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full shrink-0"
              style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
            />
            <span className="text-xs md:text-sm font-bold text-white">{item.name}</span>
          </div>
          <span className="text-xs md:text-sm font-black text-teal-400">
            ${item.value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      ))}
    </div>
  );
}
