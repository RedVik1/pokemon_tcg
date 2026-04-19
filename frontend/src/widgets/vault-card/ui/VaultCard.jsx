import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, CheckCircle, TrendingUp, TrendingDown, Trash2, Box, Loader2 } from "lucide-react";
import { safePrice, formatMoney } from "../../../shared/lib/pricing";
import { formatRarity } from "../../../shared/lib/rarity";
import { getChartDataFromHistory } from "../../../shared/lib/charts";

export default function VaultCard({ coll, onOpenAnalytics, onAdd, onDelete, isPortfolio, quantity, inPortfolio, isAdding, isDeleting }) {
  if (!coll) return null;
  const card = coll?.card || coll;
  const basePrice = safePrice(card?.price);
  const displayPrice = isPortfolio ? basePrice * quantity : basePrice;
  const { percent, isUp } = useMemo(() => getChartDataFromHistory(card?.history, "1M", "Raw"), [card?.history]);
  const setParts = useMemo(() => (card?.set_name || "").split(" • "), [card?.set_name]);
  const setName = setParts[0];
  const rarity = formatRarity(card?.rarity || setParts[1]);

  const canHover = useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(hover: hover)").matches;
  }, []);

  const [isHovered, setIsHovered] = useState(false);
  const [transformStyle, setTransformStyle] = useState("rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)");
  const [foilPos, setFoilPos] = useState({ x: "50%", y: "50%" });

  const onMouseMove = useCallback((e) => {
    if (!canHover) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const maxTilt = 8;
    const rotateX = ((y - centerY) / centerY) * -maxTilt;
    const rotateY = ((x - centerX) / centerX) * maxTilt;
    setTransformStyle(`rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`);
    setFoilPos({ x: `${(x / rect.width) * 100}%`, y: `${(y / rect.height) * 100}%` });
  }, []);

  const onMouseLeave = useCallback(() => {
    setIsHovered(false);
    setTransformStyle("rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)");
  }, []);

  const tiltActive = canHover && isHovered;
  const cardImageFilter = tiltActive ? "drop-shadow(0 15px 20px rgba(0,0,0,0.5))" : "drop-shadow(0 8px 12px rgba(0,0,0,0.3))";
  const cardImageTransform = tiltActive ? "translateZ(20px)" : "translateZ(0px)";
  const foilOpacity = tiltActive ? 0.25 : 0;
  const foilBg = `radial-gradient(circle at ${foilPos.x} ${foilPos.y}, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 60%)`;
  const busy = isAdding || isDeleting;

  const handleAdd = (e) => {
    e.stopPropagation();
    if (!busy) onAdd(card);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="relative w-full h-full" style={canHover ? { perspective: "1500px" } : undefined}>
      <div
        onMouseEnter={() => canHover && setIsHovered(true)}
        onMouseLeave={onMouseLeave}
        onMouseMove={onMouseMove}
        onClick={() => !busy && onOpenAnalytics(coll)}
        style={canHover ? { transform: transformStyle, transition: isHovered ? "transform 0.1s ease-out" : "transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)", transformStyle: "preserve-3d", willChange: "transform" } : undefined}
        className={`group bg-[#141414] rounded-[20px] md:rounded-2xl border border-white/[0.06] overflow-hidden cursor-pointer shadow-xl flex flex-col h-full relative z-10 active:scale-[0.98] active:brightness-110 transition-all duration-75 md:active:scale-100 md:active:brightness-100 ${busy ? 'opacity-70 pointer-events-none' : ''}`}
      >
        <div className="relative p-3 md:p-4 bg-[#1a1a1a] flex-1 flex items-center justify-center overflow-hidden min-h-[160px] md:min-h-[220px]">
          {card?.image_url ? (
            <img src={card.image_url} alt={card?.name} className="w-full max-w-[140px] md:max-w-[180px] object-contain relative z-10 transition-all duration-500 ease-out" style={canHover ? { transform: cardImageTransform, filter: cardImageFilter } : undefined} />
          ) : (
            <div className="w-full max-w-[140px] md:max-w-[180px] aspect-[3/4] flex items-center justify-center relative z-10">
              <Box size={40} className="text-slate-700" />
            </div>
          )}
          {canHover && <div className="absolute inset-0 pointer-events-none z-20 mix-blend-overlay transition-opacity duration-500" style={{ opacity: foilOpacity, background: foilBg }} />}
          {inPortfolio && !isPortfolio && (
            <div className="absolute top-2.5 left-2.5 md:top-3 md:left-3 bg-teal-500 text-black text-[9px] md:text-[10px] font-black uppercase tracking-widest px-2 py-0.5 md:py-1 rounded shadow-lg flex items-center gap-1 z-30 transition-transform duration-500" style={canHover ? { transform: tiltActive ? "translateZ(10px)" : "translateZ(0)" } : undefined}>
              <CheckCircle size={10} className="md:w-3 md:h-3" /> Owned
            </div>
          )}
          {quantity > 0 && (
            <div className="absolute top-2.5 right-2.5 md:top-3 md:right-3 bg-teal-500 text-black font-black text-[10px] md:text-xs h-6 w-6 md:h-7 md:w-7 rounded-full flex items-center justify-center shadow-2xl border-2 border-black z-30 transition-transform duration-500" style={canHover ? { transform: tiltActive ? "translateZ(10px)" : "translateZ(0)" } : undefined}>
              x{quantity}
            </div>
          )}
        </div>
        <div className="p-3 md:p-4 border-t border-white/[0.06] bg-[#141414] relative z-30 transition-transform duration-500" style={canHover ? { transform: tiltActive ? "translateZ(8px)" : "translateZ(0)" } : undefined}>
          <div className="text-white font-bold truncate text-[13px] md:text-sm mb-0.5 md:mb-1">{card?.name}</div>
          <div className="text-[8px] md:text-[9px] text-teal-400/70 font-bold uppercase tracking-widest mb-2 md:mb-3 truncate">{setName} • {rarity}</div>
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <div className="text-base md:text-lg font-black text-white">${formatMoney(displayPrice)}</div>
              {isPortfolio && quantity > 1 && <div className="text-[8px] md:text-[9px] text-slate-500 font-bold">${formatMoney(basePrice)} / ea</div>}
            </div>
            <div className={`flex items-center gap-1 text-[10px] font-bold ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
              {isUp ? '+' : '-'}{percent}%
            </div>
          </div>
        </div>
        <div className="flex border-t border-white/[0.06] bg-black/20 relative z-40 transition-transform duration-500" style={canHover ? { transform: tiltActive ? "translateZ(4px)" : "translateZ(0)" } : undefined}>
          {!isPortfolio ? (
            <button onClick={handleAdd} disabled={busy} className="flex-1 py-3.5 md:py-3 flex justify-center text-teal-500 active:bg-teal-500/10 md:hover:bg-teal-500/10 transition-colors disabled:opacity-40 active:scale-95 duration-75">
              {isAdding ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
            </button>
          ) : (
            <>
              <button onClick={handleAdd} disabled={busy} className="flex-1 py-3.5 md:py-3 flex justify-center text-teal-500 active:bg-teal-500/10 md:hover:bg-teal-500/10 transition-colors border-r border-white/[0.06] disabled:opacity-40 active:scale-95 duration-75" title="Add another copy">
                {isAdding ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
              </button>
              <button onClick={(e) => { e.stopPropagation(); if (!busy) onDelete(coll); }} disabled={busy} className="flex-1 py-3.5 md:py-3 flex justify-center text-rose-500 active:bg-rose-500/10 md:hover:bg-rose-500/10 transition-colors disabled:opacity-40 active:scale-95 duration-75" title="Remove copy">
                {isDeleting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
              </button>
            </>
          )}
        </div>
      </div>
      {canHover && <div className="absolute -inset-2 bg-teal-500/20 blur-2xl rounded-3xl -z-10 transition-opacity duration-500 pointer-events-none" style={{ opacity: isHovered ? 0.4 : 0 }} />}
    </motion.div>
  );
}
