import React from "react";
import ErrorBoundary from "../../components/ErrorBoundary";
import "../styles/global.css";

/**
 * Application-level providers.
 *
 * Wraps the entire app with:
 * - Global styles (Tailwind + custom utilities)
 * - Error boundary
 *
 * Future providers (theme, query client, etc.) go here.
 */
export default function AppProviders({ children }) {
  return (
    <ErrorBoundary>
      {children}
    </ErrorBoundary>
  );
}
