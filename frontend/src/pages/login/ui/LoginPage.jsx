import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { LoginForm, useAuthStore } from "../../../features/auth";
import { login, register } from "../../../features/auth/lib/api";

export default function LoginPage() {
  const navigate = useNavigate();
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const setToken = useAuthStore((s) => s.setToken);

  useEffect(() => {
    const stored = localStorage.getItem("token");
    if (stored) {
      navigate("/dashboard", { replace: true });
      return;
    }
    if (import.meta.env.DEV && isLoginMode && !email) {
      setEmail("test_demo@example.com");
      setPassword("password123");
    }
    setError("");
  }, [isLoginMode, navigate, email]);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setError("");
      setIsLoading(true);
      try {
        if (isLoginMode) {
          const res = await login(email, password);
          setToken(res.access_token, email);
          navigate("/dashboard", { replace: true });
        } else {
          if (password.length < 6)
            throw new Error("Password must be at least 6 characters.");
          await register(email, password);
          const res = await login(email, password);
          setToken(res.access_token, email);
          navigate("/dashboard", { replace: true });
        }
      } catch (err) {
        const msg = err.response?.data?.detail;
        setError(
          typeof msg === "string"
            ? msg
            : err.message || "Authentication failed. Check your credentials.",
        );
      } finally {
        setIsLoading(false);
      }
    },
    [isLoginMode, email, password, navigate, setToken],
  );

  return (
    <div className="min-h-[100dvh] bg-[#0a0a0a] text-white flex items-center justify-center relative overflow-y-auto pt-safe pb-safe">
      <div className="absolute w-[250px] h-[250px] md:w-96 md:h-96 bg-teal-600/10 rounded-full blur-3xl -left-10 -top-10 pointer-events-none" />
      <div className="absolute w-[250px] h-[250px] md:w-96 md:h-96 bg-emerald-600/10 rounded-full blur-3xl -right-10 -bottom-10 pointer-events-none" />
      <LoginForm
        isLoginMode={isLoginMode}
        email={email}
        password={password}
        isLoading={isLoading}
        error={error}
        onEmailChange={setEmail}
        onPasswordChange={setPassword}
        onModeToggle={() => setIsLoginMode((v) => !v)}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
