import { useRef, useEffect } from "react";
import { Check } from "lucide-react";

export default function SortSheet({ open, onClose, sortBy, setSortBy, options }) {
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
    <div ref={ref} className="absolute top-full mt-2 right-0 w-56 bg-[#141414] rounded-xl border border-white/[0.08] shadow-xl z-50">
      <div className="p-1.5 space-y-0.5">
        {options.map(opt => (
          <button
            key={opt}
            onClick={() => { setSortBy(opt); onClose(); }}
            className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center justify-between ${sortBy === opt ? 'bg-teal-500/20 text-teal-400' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`}
          >
            {opt}
            {sortBy === opt && <Check size={14} className="text-teal-400" />}
          </button>
        ))}
      </div>
    </div>
  );
}
