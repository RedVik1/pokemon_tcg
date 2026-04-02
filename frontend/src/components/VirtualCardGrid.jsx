import React, { useRef, useMemo } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useColumns } from "../utils/hooks";
import VaultCard from "./VaultCard";

export default function VirtualCardGrid({
  cards,
  onOpenAnalytics,
  onAdd,
  onDelete,
  isPortfolio,
  ownedIds,
  busyCardId,
  busyAction,
  onLoadMore,
  loadingMore,
  showLoadMore,
}) {
  const parentRef = useRef(null);
  const columns = useColumns();

  const rows = useMemo(() => {
    const result = [];
    for (let i = 0; i < cards.length; i += columns) {
      result.push(cards.slice(i, i + columns));
    }
    return result;
  }, [cards, columns]);

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => {
      if (typeof document === "undefined") return null;
      return document.scrollingElement || document.documentElement;
    },
    estimateSize: () => {
      if (typeof window === "undefined") return 380;
      const w = parentRef.current?.clientWidth || window.innerWidth * 0.9;
      const isMd = window.matchMedia("(min-width: 768px)").matches;
      const gap = isMd ? 48 : 12;
      const colWidth = (w - gap * (columns - 1)) / columns;
      const imageHeight = colWidth * (4 / 3);
      return Math.round(imageHeight + 120);
    },
    overscan: 4,
    scrollMargin: () => {
      if (!parentRef.current) return 0;
      return parentRef.current.getBoundingClientRect().top + window.scrollY;
    },
  });

  const gapClass = "gap-3 md:gap-6 lg:gap-8";
  const colClass = columns === 5
    ? "grid-cols-5"
    : columns === 4
      ? "grid-cols-4"
      : columns === 3
        ? "grid-cols-3"
        : "grid-cols-2";

  return (
    <div ref={parentRef}>
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const row = rows[virtualRow.index];
          if (!row) return null;
          return (
            <div
              key={virtualRow.key}
              data-index={virtualRow.index}
              ref={virtualizer.measureElement}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <div className={`grid ${colClass} ${gapClass}`}>
                {row.map((c) => {
                  const cardObj = c.card || c;
                  const targetId = cardObj.pokemon_tcg_id || cardObj.id;
                  return (
                    <VaultCard
                      key={c.id || targetId}
                      coll={c}
                      onOpenAnalytics={onOpenAnalytics}
                      onAdd={onAdd}
                      onDelete={onDelete}
                      isPortfolio={isPortfolio}
                      quantity={c.quantity}
                      inPortfolio={ownedIds.has(targetId)}
                      isAdding={busyCardId === targetId && busyAction === "add"}
                      isDeleting={busyCardId === targetId && busyAction === "delete"}
                    />
                  );
                })}
                {row.length < columns &&
                  Array.from({ length: columns - row.length }).map((_, i) => (
                    <div key={`spacer-${i}`} />
                  ))}
              </div>
            </div>
          );
        })}
      </div>
      {showLoadMore && (
        <div className="mt-8 md:mt-12 flex justify-center pb-4">
          <button
            onClick={onLoadMore}
            disabled={loadingMore}
            className="px-6 md:px-8 py-3.5 md:py-4 bg-[#141414] active:bg-white/5 md:hover:bg-white/5 border border-white/[0.08] rounded-full font-black text-teal-500 transition-all flex items-center gap-3"
          >
            {loadingMore ? (
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              "Load More"
            )}
          </button>
        </div>
      )}
    </div>
  );
}
