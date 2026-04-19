import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import SortControl from "../components/SortControl";

describe("SortControl", () => {
  it("lets the user pick a new sort option", () => {
    const onChange = vi.fn();

    render(
      <SortControl
        value="Newest"
        options={["Newest", "Price: High to Low", "Name: A-Z"]}
        onChange={onChange}
      />,
    );

    fireEvent.change(screen.getByRole("combobox", { name: /sort cards/i }), {
      target: { value: "Price: High to Low" },
    });

    expect(onChange).toHaveBeenCalledWith("Price: High to Low");
  });
});
