import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { X, ChevronLeft, Plus, Trash2, TrendingUp, ShoppingBag, ExternalLink, Box, Loader2 } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, Tooltip as ReTooltip } from "recharts";
import { safePrice, formatMoney } from "../utils/pricing";
import { formatRarity } from "../utils/rarity";
import { getChartDataFromHistory } from "../utils/charts";
import CustomTooltip from "./CustomTooltip";

export default function AssetAnalyticsModal({ coll, onClose, onAdd, onDelete, isPortfolio }) {
  const card = coll.card || coll;
  const basePrice = safePrice(card.price);
  const [timeframe, setTimeframe] = useState("1M");
  const [grade, setGrade] = useState("Raw");
  const [adding, setAdding] = useState(false);

  useEffect(() => { setTimeframe("1M"); setGrade("Raw"); setAdding(false); }, [coll]);

  const { data, percent, isUp, isEstimated } = useMemo(() => getChartDataFromHistory(card?.history, timeframe, grade), [card?.history, timeframe, grade]);
  const currentPrice = data.length > 0 ? data[data.length - 1].price : basePrice * (grade === "PSA 10" ? 4.2 : grade === "PSA 9" ? 1.8 : 1.0);
  const setParts = (card?.set_name || "").split(" • ");
  const setName = setParts[0];
  const rarity = formatRarity(card?.rarity || setParts[1]);

  const handleAdd = async () => {
    setAdding(true);
    try {
      await onAdd(card);
    } finally {
      setAdding(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[110] bg-black/95 backdrop-blur-xl overflow-y-auto custom-scrollbar"
    >
      <div className="min-h-full md:flex md:items-center md:justify-center md:p-4" onMouseDown={e => e.target === e.currentTarget && onClose()}>
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", damping: 28, stiffness: 300, delay: 0.05 }}
          className="w-full md:max-w-[1100px] bg-[#0f0f0f] md:border md:border-white/[0.08] md:rounded-[32px] shadow-2xl overflow-hidden flex flex-col"
        >
          <div className="sticky top-0 z-20 flex items-center justify-between px-4 md:hidden bg-[#0f0f0f]/90 backdrop-blur-xl border-b border-white/[0.04] h-14">
            <button onClick={onClose} className="flex items-center gap-1.5 text-teal-400 font-bold text-base py-3 px-2 -ml-2 active:opacity-70 min-h-[44px]">
              <ChevronLeft size={22} />
              <span>Back</span>
            </button>
            <span className="text-white font-bold text-sm truncate max-w-[45%]">{card.name}</span>
            <div className="w-[60px]" />
          </div>
          <button onClick={onClose} className="hidden md:flex fixed top-6 right-6 z-[99999] bg-white/10 hover:bg-white/20 text-white p-4 rounded-full transition-all border border-white/20 shadow-2xl cursor-pointer">
            <X size={24} />
          </button>
          <div className="px-5 md:px-10 pt-5 md:pt-10 pb-6 md:pb-10">
            <div className="mb-5 md:mb-8">
              <div className="text-teal-500 font-black text-[10px] md:text-xs mb-1.5 md:mb-2 uppercase tracking-[0.2em]">{setName} • {rarity}</div>
              <h1 className="text-2xl md:text-4xl lg:text-5xl font-black text-white leading-tight">{card.name}</h1>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
              <div className="relative bg-[#161616] rounded-2xl md:rounded-xl p-5 md:p-6 border border-white/[0.06] flex flex-col items-center justify-center overflow-hidden">
                {card.image_url ? (
                  <img src={card.image_url} className="w-full max-w-[200px] md:max-w-[300px] rounded-xl shadow-2xl mb-4 md:mb-6 relative z-10" loading="lazy" />
                ) : (
                  <div className="w-full max-w-[200px] md:max-w-[300px] aspect-[3/4] flex flex-col items-center justify-center mb-4 md:mb-6 relative z-10 bg-[#1a1a1a] rounded-xl border border-white/[0.04]">
                    <Box size={48} className="text-slate-700 mb-3" />
                    <span className="text-[10px] text-slate-600 font-bold">No Image</span>
                  </div>
                )}
                {!isPortfolio ? (
                  <button onClick={handleAdd} disabled={adding} className="w-full py-4 md:py-3.5 bg-teal-500 text-black font-bold rounded-xl active:bg-teal-600 md:hover:bg-teal-400 transition-colors relative z-10 shadow-[0_0_20px_rgba(20,184,166,0.3)] disabled:opacity-60 flex items-center justify-center gap-2">
                    {adding ? <Loader2 size={18} className="animate-spin" /> : "Add to Portfolio"}
                  </button>
                ) : (
                  <div className="flex gap-3 w-full relative z-10">
                    <button onClick={handleAdd} disabled={adding} className="flex-1 py-4 md:py-3.5 bg-teal-500/20 text-teal-500 font-bold rounded-xl active:bg-teal-500/30 md:hover:bg-teal-500/30 transition-colors border border-teal-500/20 flex items-center justify-center gap-2 disabled:opacity-60">
                      {adding ? <Loader2 size={18} className="animate-spin" /> : <><Plus size={18} /> Add Copy</>}
                    </button>
                    <button onClick={() => { onDelete(coll); onClose(); }} className="flex-1 py-4 md:py-3.5 bg-rose-500/20 text-rose-500 font-bold rounded-xl active:bg-rose-500/30 md:hover:bg-rose-500/30 transition-colors border border-rose-500/20 flex items-center justify-center gap-2">
                      <Trash2 size={18} /> Remove
                    </button>
                  </div>
                )}
              </div>
              <div className="lg:col-span-2 space-y-4 md:space-y-6">
                <div className="bg-[#161616] border border-white/[0.06] rounded-[20px] md:rounded-[28px] p-4 md:p-6 shadow-lg">
                  <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 md:mb-6 gap-3 md:gap-4">
                    <div className="flex items-center gap-2">
                      <div className="text-white font-bold flex items-center gap-2 text-sm md:text-base"><TrendingUp size={16} className="text-teal-500" /> Market History</div>
                      {isEstimated && <span className="text-[9px] md:text-[10px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full">Estimated</span>}
                    </div>
                    <div className="flex items-center justify-between w-full md:w-auto gap-3">
                      <div className="flex bg-black rounded-lg p-0.5 md:p-1 border border-white/10">
                        {['Raw', 'PSA 9', 'PSA 10'].map(g => (
                          <button key={g} onClick={() => setGrade(g)} className={`px-2.5 md:px-3 py-1.5 md:py-1 text-[10px] uppercase tracking-widest rounded-md font-bold transition-colors min-h-[36px] ${grade === g ? 'bg-teal-500 text-black' : 'text-slate-500 active:text-white md:hover:text-white'}`}>{g}</button>
                        ))}
                      </div>
                      <div className="flex gap-0.5 md:gap-1 bg-black rounded-lg p-0.5 md:p-1">
                        {['1W', '1M', '1Y'].map(t => (
                          <button key={t} onClick={() => setTimeframe(t)} className={`px-2.5 md:px-3 py-1.5 md:py-1 text-xs rounded-md font-bold transition-colors min-h-[36px] ${timeframe === t ? 'bg-[#333] text-white' : 'text-slate-500 active:text-white md:hover:text-white'}`}>{t}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-end gap-3 md:gap-4 mb-3 md:mb-4">
                    <div className="text-3xl md:text-4xl font-black text-white">${formatMoney(currentPrice)}</div>
                    <div className={`text-base md:text-lg font-bold mb-0.5 md:mb-1 ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isUp ? '▲' : '▼'} {percent}%
                    </div>
                  </div>
                  <div className="h-36 md:h-48 w-full relative">
                    {data.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data} style={{ zIndex: 10 }}>
                          <defs><linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3} /><stop offset="95%" stopColor="#14b8a6" stopOpacity={0} /></linearGradient></defs>
                          <Area type="monotone" dataKey="price" stroke="#14b8a6" strokeWidth={3} fill="url(#colorPrice)" />
                          <ReTooltip content={<CustomTooltip />} />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-sm font-bold text-slate-600">No price history available</div>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2.5 md:gap-4">
                  <div className="bg-[#161616] border border-white/[0.06] rounded-2xl p-3.5 md:p-4 text-center flex flex-col justify-center min-h-[64px]">
                    <div className="text-slate-500 text-[9px] md:text-[10px] font-bold uppercase tracking-widest mb-1">Condition</div>
                    <div className="text-teal-400 font-bold text-[11px] md:text-xs">{grade}</div>
                  </div>
                  <div onClick={() => window.open(`https://www.tcgplayer.com/search/all/product?q=${encodeURIComponent(card.name)}`, "_blank")} className="bg-teal-500/10 border border-teal-500/20 active:bg-teal-500/20 md:hover:bg-teal-500/20 rounded-2xl p-3.5 md:p-4 flex flex-col items-center justify-center cursor-pointer transition-colors text-teal-400 min-h-[64px]">
                    <ShoppingBag size={18} className="mb-1" />
                    <div className="font-bold text-[10px] md:text-xs">TCGPlayer</div>
                  </div>
                  <div onClick={() => window.open(`https://www.psacard.com/search#q=${encodeURIComponent(card.name)}`, "_blank")} className="bg-rose-500/10 border border-rose-500/20 active:bg-rose-500/20 md:hover:bg-rose-500/20 rounded-2xl p-3.5 md:p-4 flex flex-col items-center justify-center cursor-pointer transition-colors text-rose-400 min-h-[64px]">
                    <ExternalLink size={18} className="mb-1" />
                    <div className="font-bold text-[10px] md:text-xs">PSA Grade</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
