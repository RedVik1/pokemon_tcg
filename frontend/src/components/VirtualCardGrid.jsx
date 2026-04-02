import React from "react";
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
  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 md:gap-6 lg:gap-8">
        {cards.map((c) => {
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
