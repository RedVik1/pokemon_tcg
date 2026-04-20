import React from "react";
import { Check } from "lucide-react";
import { RARITIES } from "../shared/constants/rarities";

export default function SidebarFilters({ rarityFilter, setRarityFilter }) {
  return (
    <div className="hidden lg:block w-56 shrink-0 pr-6 border-r border-white/5">
      <h3 className="text-white font-bold mb-4 text-sm uppercase tracking-widest">Database Rarity</h3>
      <div className="bg-[#141414] rounded-xl border border-white/[0.08] overflow-hidden">
        {RARITIES.map((r, i) => (
          <button
            key={r.value}
            onClick={() => setRarityFilter(r.value)}
            className={`w-full text-left px-4 py-3 text-sm font-semibold transition-colors flex items-center justify-between ${
              rarityFilter === r.value 
                ? 'bg-teal-500/15 text-teal-400' 
                : 'text-slate-400 hover:bg-white/5 hover:text-white'
            } ${i !== RARITIES.length - 1 ? 'border-b border-white/[0.06]' : ''}`}
          >
            {r.label}
            {rarityFilter === r.value && <Check size={14} className="text-teal-400" />}
          </button>
        ))}
      </div>
    </div>
  );
}
