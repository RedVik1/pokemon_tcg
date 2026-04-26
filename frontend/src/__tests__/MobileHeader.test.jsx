import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import MobileHeader from "../widgets/mobile-header/ui/MobileHeader";

describe("MobileHeader", () => {
  it("closes the profile menu when the user taps elsewhere on the page", async () => {
    render(<MobileHeader onLogout={vi.fn()} userEmail="ash@example.com" />);

    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByText(/signed in as/i)).toBeInTheDocument();

    fireEvent.mouseDown(document.body);

    await waitFor(() => {
      expect(screen.queryByText(/signed in as/i)).not.toBeInTheDocument();
    });
  });
});
