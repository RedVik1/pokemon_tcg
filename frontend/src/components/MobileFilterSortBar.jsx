import { SlidersHorizontal } from "lucide-react";

import RarityFilterSheet from "./RarityFilterSheet";
import SortSheet from "./SortSheet";

export default function MobileFilterSortBar({
  activeTab,
  sortBy,
  sortOptions,
  sortSheetOpen,
  setSortSheetOpen,
  raritySheetOpen,
  setRaritySheetOpen,
  rarityFilter,
  setRarityFilter,
  setSortBy,
}) {
  const showFilter = activeTab !== "portfolio";

  return (
    <div className="flex items-center justify-end gap-2 mb-6">
      {showFilter && (
        <div className="relative lg:hidden">
          <button
            onClick={() => setRaritySheetOpen(true)}
            aria-label="Filter cards"
            className="p-2.5 rounded-xl bg-[#141414] border border-white/[0.06] text-slate-400 active:bg-white/5 active:scale-95 transition-all duration-75"
          >
            <SlidersHorizontal size={18} />
          </button>
          {raritySheetOpen && (
            <RarityFilterSheet
              open={raritySheetOpen}
              onClose={() => setRaritySheetOpen(false)}
              rarityFilter={rarityFilter}
              setRarityFilter={setRarityFilter}
            />
          )}
        </div>
      )}

      <div className="relative">
        <button
          onClick={() => setSortSheetOpen(true)}
          aria-label="Sort cards"
          className="flex items-center gap-2 px-5 py-3 bg-[#141414] border border-white/[0.06] rounded-xl text-base font-bold"
        >
          <span className="text-teal-400">Sort:</span>
          <span className="text-white">{sortBy}</span> ▾
        </button>
        {sortSheetOpen && (
          <SortSheet
            open={sortSheetOpen}
            onClose={() => setSortSheetOpen(false)}
            sortBy={sortBy}
            setSortBy={setSortBy}
            options={sortOptions}
          />
        )}
      </div>
    </div>
  );
}
