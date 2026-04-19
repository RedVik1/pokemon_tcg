import React, { useCallback } from "react";
import { motion } from "framer-motion";
import { Search, Loader2, Plus, X, Clock, TrendingUp } from "lucide-react";
import { safePrice, formatMoney } from "../../../shared/lib/pricing";
import { useSearch } from "../model/useSearch";

export default function SearchPalette({ open, onClose, onAdd, onOpenAnalytics }) {
  const [query, setQuery] = React.useState("");
  const {
    debounced,
    results,
    loading,
    recentSearches,
    popularSearches,
    addRecent,
    removeRecent,
    clearRecents,
  } = useSearch({ query, open });

  React.useEffect(() => {
    if (open) {
      setQuery("");
    }
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const handleSubmit = useCallback((value) => {
    addRecent(value);
    setQuery(value);
  }, [addRecent]);

  const handleRemoveRecent = useCallback((e, value) => {
    e.stopPropagation();
    removeRecent(value);
  }, [removeRecent]);

  const handleClearAll = useCallback(() => {
    clearRecents();
  }, [clearRecents]);

  const handleCardClick = useCallback((item) => {
    addRecent(item.name);
    onClose();
    onOpenAnalytics(item);
  }, [addRecent, onClose, onOpenAnalytics]);

  const handleAddClick = useCallback((e, item) => {
    e.stopPropagation();
    onAdd(item);
  }, [onAdd]);

  const showSuggestions = !debounced;
  const showResults = debounced && !loading;
  const showNoResults = debounced && !loading && results.length === 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex flex-col"
    >
      <div className="flex flex-col h-full pt-safe">
        <div className="px-4 md:px-8 pt-4 md:pt-8">
          <div className="max-w-[800px] mx-auto w-full bg-[#141414] border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (query.trim()) handleSubmit(query);
              }}
              className="p-4 flex items-center gap-3"
            >
              <Search className="text-teal-500 shrink-0" size={20} />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search any card..."
                className="flex-1 bg-transparent text-white text-base md:text-lg outline-none placeholder:text-slate-600"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="p-1 text-slate-500 active:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              )}
              <button
                onClick={onClose}
                type="button"
                className="md:hidden p-2 -mr-2 text-slate-500 active:text-white transition-colors"
              >
                <X size={20} />
              </button>
              <div
                className="hidden md:flex px-2 py-1 bg-black/50 rounded text-[10px] font-bold text-slate-500 border border-white/10 cursor-pointer"
                onClick={onClose}
              >
                ESC
              </div>
            </form>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar px-4 md:px-8 py-4">
          <div className="max-w-[800px] mx-auto w-full">
            {loading && debounced && (
              <div className="py-16 flex justify-center">
                <Loader2 className="animate-spin text-teal-500" />
              </div>
            )}

            {showSuggestions && (
              <div className="space-y-6">
                {recentSearches.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-widest">
                        <Clock size={14} /> Recent Searches
                      </div>
                      <button
                        onClick={handleClearAll}
                        className="text-slate-600 text-[10px] font-bold uppercase tracking-widest active:text-slate-400 transition-colors"
                      >
                        Clear All
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {recentSearches.map((s) => (
                        <button
                          key={s}
                          onClick={() => handleSubmit(s)}
                          className="group flex items-center gap-2 bg-[#141414] border border-white/[0.06] rounded-full px-4 py-2.5 text-sm text-slate-300 font-semibold active:bg-white/5 md:hover:bg-white/5 active:border-white/10 md:hover:border-white/10 transition-colors"
                        >
                          <span>{s}</span>
                          <span
                            onClick={(e) => handleRemoveRecent(e, s)}
                            className="text-slate-600 active:text-rose-400 md:hover:text-rose-400 transition-colors"
                          >
                            <X size={12} />
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-widest mb-3">
                    <TrendingUp size={14} /> Popular
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {popularSearches.map((s) => (
                      <button
                        key={s}
                        onClick={() => handleSubmit(s)}
                        className="bg-[#141414] border border-white/[0.06] rounded-full px-4 py-2.5 text-sm text-slate-300 font-semibold active:bg-teal-500/10 md:hover:bg-teal-500/10 active:border-teal-500/20 md:hover:border-teal-500/20 active:text-teal-400 md:hover:text-teal-400 transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {showNoResults && (
              <div className="py-16 text-center">
                <Search size={40} className="text-slate-700 mx-auto mb-3" />
                <p className="text-slate-500 text-sm font-semibold">
                  No cards found for &quot;{debounced}&quot;
                </p>
              </div>
            )}

            {showResults && results.length > 0 && (
              <div className="grid grid-cols-3 md:grid-cols-4 gap-2.5 md:gap-4">
                {results.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleCardClick(item)}
                    className="p-2 md:p-2.5 rounded-xl md:rounded-2xl border border-white/[0.06] active:bg-teal-500/10 md:hover:bg-teal-500/10 cursor-pointer text-center relative group transition-colors"
                  >
                    {item.image_url && (
                      <img
                        src={item.image_url}
                        className="w-full aspect-[3/4] object-contain mb-1.5 md:mb-2"
                        loading="lazy"
                      />
                    )}
                    <div className="text-[9px] md:text-[10px] text-white font-bold truncate">
                      {item.name}
                    </div>
                    <div className="text-[8px] md:text-[9px] text-teal-400 mt-0.5 md:mt-1">
                      ${formatMoney(safePrice(item.price))}
                    </div>
                    <div
                      onClick={(e) => handleAddClick(e, item)}
                      className="absolute top-2 right-2 bg-teal-500 text-black rounded-full p-1.5 md:opacity-0 md:group-hover:opacity-100 transition-all active:scale-90 md:hover:scale-110 shadow-lg"
                    >
                      <Plus size={13} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
