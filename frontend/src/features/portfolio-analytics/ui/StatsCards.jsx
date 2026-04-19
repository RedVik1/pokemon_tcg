import React from "react";
import { Download } from "lucide-react";

/**
 * Net Worth display card.
 *
 * @param {{
 *   value: number,
 *   AnimatedValue: React.ComponentType<{value: number, decimals?: number}>,
 * }} props
 */
export function NetWorthCard({ value, AnimatedValue }) {
  return (
    <div className="col-span-2 bg-gradient-to-br from-teal-500/10 to-transparent p-5 md:p-6 rounded-2xl md:rounded-[28px] border border-white/[0.06]">
      <div className="text-teal-500 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] mb-1.5 md:mb-2">
        Net Worth
      </div>
      <div className="text-3xl md:text-4xl font-black text-emerald-400">
        $<AnimatedValue value={value} />
      </div>
    </div>
  );
}

/**
 * Asset Count display card.
 *
 * @param {{
 *   count: number,
 *   AnimatedValue: React.ComponentType<{value: number, decimals?: number}>,
 * }} props
 */
export function AssetCountCard({ count, AnimatedValue }) {
  return (
    <div className="bg-[#141414] p-4 md:p-6 rounded-2xl md:rounded-[20px] border border-white/[0.06] flex flex-col justify-center">
      <div className="text-slate-500 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] mb-1">
        Assets
      </div>
      <div className="text-xl md:text-2xl font-black text-white">
        <AnimatedValue value={count} decimals={0} />
      </div>
    </div>
  );
}

/**
 * Export CSV button.
 *
 * @param {{
 *   onExport: () => void,
 * }} props
 */
export function ExportCSVButton({ onExport }) {
  return (
    <div
      onClick={onExport}
      className="bg-teal-500/10 active:bg-teal-500/20 md:hover:bg-teal-500/20 p-4 md:p-6 rounded-2xl md:rounded-[20px] border border-teal-500/20 cursor-pointer transition-colors flex flex-col items-center justify-center text-teal-500 active:scale-95 duration-75"
    >
      <Download size={20} className="mb-1.5 md:mb-2" />
      <div className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-center">
        Export CSV
      </div>
    </div>
  );
}
