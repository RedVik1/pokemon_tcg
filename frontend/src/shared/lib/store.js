import { create } from "zustand";

// Zustand's `create` is the single factory for all stores.
// Each store is created in its feature module (e.g. features/auth/model/authStore.js).
// This barrel re-export provides a canonical import path:
//   import { create } from "../../shared/lib/store";
export { create };
