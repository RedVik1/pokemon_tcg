import { useRef, useEffect } from "react";
import { RARITIES } from "../shared/constants/rarities";

export default function RarityFilterSheet({ open, onClose, rarityFilter, setRarityFilter }) {
  const ref = useRef(null);
  
  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [open, onClose]);
  
  if (!open) return null;
  
  return (
    <div ref={ref} className="absolute top-full mt-2 left-0 w-48 bg-[#141414] rounded-xl border border-white/[0.08] shadow-xl z-50">
      <div className="p-1.5 space-y-0.5">
        {RARITIES.map(r => (
          <button
            key={r.value}
            onClick={() => { setRarityFilter(r.value); onClose(); }}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${rarityFilter === r.value ? 'bg-teal-500/15 text-teal-400' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
          >
            {r.label}
          </button>
        ))}
      </div>
    </div>
  );
}
