import React from "react";
import { RARITIES } from "../shared/constants/rarities";

export default function SidebarFilters({ rarityFilter, setRarityFilter }) {
  return (
    <div className="hidden lg:block w-64 shrink-0 space-y-8 pr-6 border-r border-white/5">
      <div>
        <h3 className="text-white font-bold mb-4 text-sm uppercase tracking-widest">Database Rarity</h3>
        <div className="space-y-3">
          {RARITIES.map(r => (
            <label key={r.value} className="flex items-center gap-3 text-slate-400 text-sm cursor-pointer hover:text-white transition-colors">
              <input type="radio" name="rarity" checked={rarityFilter === r.value} onChange={() => setRarityFilter(r.value)} className="text-teal-500 bg-black border-white/10" />
              {r.label}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
