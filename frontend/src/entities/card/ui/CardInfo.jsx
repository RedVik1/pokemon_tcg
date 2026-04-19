import React, { useMemo } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { formatRarity } from "../../../shared/lib/rarity";
import { getChartDataFromHistory } from "../../../shared/lib/charts";

/**
 * Renders card metadata: set name, rarity, and optional price trend indicator.
 *
 * @param {{
 *   set_name: string,
 *   rarity: string,
 *   history?: object,
 *   showTrend?: boolean,
 * }} props
 */
export default function CardInfo({ set_name, rarity, history, showTrend = false }) {
  const setParts = useMemo(
    () => (set_name || "").split(" • "),
    [set_name],
  );
  const setName = setParts[0];
  const displayRarity = formatRarity(rarity || setParts[1]);

  const trend = useMemo(
    () => (showTrend && history ? getChartDataFromHistory(history, "1M", "Raw") : null),
    [showTrend, history],
  );

  return (
    <div className="flex items-center justify-between">
      <div className="text-[8px] md:text-[9px] text-teal-400/70 font-bold uppercase tracking-widest truncate">
        {setName} • {displayRarity}
      </div>
      {trend && (
        <div className={`flex items-center gap-1 text-[10px] font-bold shrink-0 ml-2 ${trend.isUp ? "text-emerald-400" : "text-rose-400"}`}>
          {trend.isUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
          {trend.isUp ? "+" : "-"}{trend.percent}%
        </div>
      )}
    </div>
  );
}
