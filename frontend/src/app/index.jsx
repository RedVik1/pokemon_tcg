import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import AppProviders from "./providers/AppProviders";
import Router from "./router/Router";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AppProviders>
      <Router />
    </AppProviders>
  </StrictMode>,
);
