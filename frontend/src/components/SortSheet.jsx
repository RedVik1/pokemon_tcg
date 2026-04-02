import React from "react";
import { motion } from "framer-motion";
import { X, Check } from "lucide-react";

export default function SortSheet({ open, onClose, sortBy, setSortBy, options }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90] md:hidden" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="absolute bottom-0 left-0 right-0 bg-[#141414] rounded-t-3xl border-t border-white/[0.08] max-h-[70vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
          <h3 className="text-white font-bold text-lg">Sort By</h3>
          <button onClick={onClose} className="p-2 -mr-1 text-slate-500 active:text-white"><X size={20} /></button>
        </div>
        <div className="overflow-y-auto p-4 pb-8 space-y-1">
          {options.map(opt => (
            <button
              key={opt}
              onClick={() => { setSortBy(opt); onClose(); }}
              className={`w-full text-left px-5 py-3.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-between ${sortBy === opt ? 'bg-teal-500/15 text-teal-400' : 'text-slate-400 active:bg-white/5'}`}
            >
              {opt}
              {sortBy === opt && <Check size={16} className="text-teal-400" />}
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
