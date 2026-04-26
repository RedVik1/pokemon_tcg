import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import MobileFilterSortBar from "../components/MobileFilterSortBar";

describe("MobileFilterSortBar", () => {
  it("shows filter and sort controls together and opens the filter sheet", () => {
    const setRaritySheetOpen = vi.fn();
    const setSortSheetOpen = vi.fn();

    render(
      <MobileFilterSortBar
        activeTab="explore"
        sortBy="Newest"
        setSortSheetOpen={setSortSheetOpen}
        raritySheetOpen={false}
        setRaritySheetOpen={setRaritySheetOpen}
        sortSheetOpen={false}
        rarityFilter="All"
        setRarityFilter={vi.fn()}
        sortOptions={["Newest", "Price: High to Low"]}
        setSortBy={vi.fn()}
      />,
    );

    const filterButton = screen.getByRole("button", { name: /filter cards/i });
    const sortButton = screen.getByRole("button", { name: /sort cards/i });

    expect(filterButton.compareDocumentPosition(sortButton) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    fireEvent.click(filterButton);

    expect(setRaritySheetOpen).toHaveBeenCalledWith(true);
  });
});
