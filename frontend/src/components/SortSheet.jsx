import React from "react";
import { motion } from "framer-motion";
import { X, Check } from "lucide-react";

export default function SortSheet({ open, onClose, sortBy, setSortBy, options }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90]" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -10 }}
        transition={{ duration: 0.2 }}
        className="absolute top-20 right-4 md:right-8 w-64 bg-[#141414] rounded-2xl border border-white/[0.08] shadow-2xl overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
          <h3 className="text-white font-bold text-sm">Sort By</h3>
          <button onClick={onClose} className="p-1 text-slate-500 hover:text-white transition-colors"><X size={16} /></button>
        </div>
        <div className="p-2 space-y-1">
          {options.map(opt => (
            <button
              key={opt}
              onClick={() => { setSortBy(opt); onClose(); }}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center justify-between ${sortBy === opt ? 'bg-teal-500/15 text-teal-400' : 'text-slate-400 hover:bg-white/5'}`}
            >
              {opt}
              {sortBy === opt && <Check size={14} className="text-teal-400" />}
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
