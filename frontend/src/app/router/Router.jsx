import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ErrorBoundary from "../../components/ErrorBoundary";
import NotFoundPage from "../../pages/NotFoundPage";

// New FSD pages — now active
import { LoginPage } from "../../pages/login";
import { DashboardPage } from "../../pages/dashboard";

export default function Router() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
