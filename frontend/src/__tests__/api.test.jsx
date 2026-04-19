import { beforeEach, describe, expect, it, vi } from "vitest";

const post = vi.fn();
const del = vi.fn();

vi.mock("axios", () => ({
  default: {
    create: vi.fn(() => ({
      interceptors: {
        request: {
          use: vi.fn(),
        },
        response: {
          use: vi.fn(),
        },
      },
      post,
      delete: del,
    })),
  },
}));

describe("api helpers", () => {
  beforeEach(() => {
    post.mockReset();
    del.mockReset();
  });

  it("registers through the shared API client", async () => {
    const { registerUser } = await import("../api");
    post.mockResolvedValue({ data: { id: 1 } });

    await registerUser("collector@example.com", "password123");

    expect(post).toHaveBeenCalledWith("/users/register", {
      email: "collector@example.com",
      password: "password123",
    });
  });

  it("adds cards through the shared API client", async () => {
    const { addCardToVault } = await import("../api");

    await addCardToVault("base1-4");

    expect(post).toHaveBeenCalledWith("/collections/add", {
      pokemon_tcg_id: "base1-4",
      condition: "Mint",
    });
  });

  it("removes cards through the shared API client", async () => {
    const { removeCollectionItem } = await import("../api");

    await removeCollectionItem(42);

    expect(del).toHaveBeenCalledWith("/collections/42");
  });
});
