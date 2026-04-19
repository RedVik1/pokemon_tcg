import { create } from "../../../shared/lib/store";

/**
 * @typedef {Object} AuthState
 * @property {string | null} token
 * @property {string | null} email
 * @property {() => void} initFromStorage
 * @property {(token: string, email?: string) => void} setToken
 * @property {() => void} clearToken
 */

export const useAuthStore = create((set) => ({
  token: null,
  email: null,

  initFromStorage: () => {
    const stored = localStorage.getItem("token");
    if (stored) {
      set({ token: stored });
    }
  },

  setToken: (token, email) => {
    localStorage.setItem("token", token);
    set({ token, email: email || null });
  },

  clearToken: () => {
    localStorage.removeItem("token");
    set({ token: null, email: null });
  },
}));
