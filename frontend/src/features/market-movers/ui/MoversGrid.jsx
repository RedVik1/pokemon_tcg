import React, { useMemo } from "react";
import { Flame } from "lucide-react";
import { getChartDataFromHistory } from "../../../shared/lib/charts";

/**
 * Market Movers section: mobile horizontal scroll + desktop grid.
 *
 * @param {{
 *   movers: Array<Object>,
 *   onSelect: (mover: Object) => void,
 * }} props
 */
export default function MoversGrid({ movers, onSelect }) {
  const sortedMovers = useMemo(() => {
    return [...movers].map((g) => {
      const c = g.card || g;
      const stat = getChartDataFromHistory(c.history, "1M", "Raw");
      return { ...g, computedStat: stat };
    }).sort((a, b) => {
      const valA = (a.computedStat.isUp ? 1 : -1) * parseFloat(a.computedStat.percent);
      const valB = (b.computedStat.isUp ? 1 : -1) * parseFloat(b.computedStat.percent);
      return valB - valA;
    });
  }, [movers]);

  if (sortedMovers.length === 0) return null;

  return (
    <div className="mb-6 md:mb-10">
      <div className="flex items-center gap-2 text-rose-500 font-bold mb-3 md:mb-4 text-sm md:text-base">
        <Flame size={18} /> Market Movers
      </div>

      {/* Mobile: horizontal scroll */}
      <div className="relative md:hidden">
        <div className="flex gap-3 overflow-x-auto custom-scrollbar pb-2 snap-x snap-mandatory">
          {sortedMovers.map((g, idx) => (
            <div
              key={`gainer-${idx}`}
              onClick={() => onSelect(g)}
              className="bg-gradient-to-tr from-[#161616] to-rose-500/10 border border-white/[0.06] active:border-rose-500/30 p-3.5 rounded-2xl cursor-pointer transition-colors flex items-center gap-3 min-w-[200px] snap-start"
            >
              <img
                src={(g.card || g).image_url}
                className="w-10 h-14 object-contain drop-shadow-md"
                loading="lazy"
              />
              <div className="overflow-hidden flex-1 min-w-0">
                <div className="text-white text-xs font-bold truncate">
                  {(g.card || g).name}
                </div>
                <div className="text-[9px] text-slate-500 truncate mb-0.5">
                  {(g.card || g).set_name?.split(" • ")[0]}
                </div>
                <div className="text-sm font-black text-rose-400">
                  {g.computedStat.isUp ? "+" : "-"}{g.computedStat.percent}%
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="absolute top-0 right-0 bottom-2 w-12 bg-gradient-to-l from-[#0a0a0a] to-transparent pointer-events-none" />
      </div>

      {/* Desktop: 4-column grid */}
      <div className="hidden md:grid md:grid-cols-4 gap-4">
        {sortedMovers.map((g, idx) => (
          <div
            key={`gainer-${idx}`}
            onClick={() => onSelect(g)}
            className="bg-gradient-to-tr from-[#161616] to-rose-500/10 border border-white/[0.06] hover:border-rose-500/30 p-4 rounded-2xl cursor-pointer transition-colors flex items-center gap-4"
          >
            <img
              src={(g.card || g).image_url}
              className="w-12 h-16 object-contain drop-shadow-md"
              loading="lazy"
            />
            <div className="overflow-hidden flex-1 min-w-0">
              <div className="text-white text-xs font-bold truncate">
                {(g.card || g).name}
              </div>
              <div className="text-[10px] text-slate-500 truncate mb-1">
                {(g.card || g).set_name?.split(" • ")[0]}
              </div>
              <div className="text-sm font-black text-rose-400">
                {g.computedStat.isUp ? "+" : "-"}{g.computedStat.percent}%
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
