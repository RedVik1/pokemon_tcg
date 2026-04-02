import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Box, AlertCircle } from "lucide-react";
import { login, register } from "../api";

export default function LoginPage() {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem("token")) { navigate("/dashboard", { replace: true }); return; }
    if (import.meta.env.DEV && isLoginMode && !email) {
      setEmail("test_demo@example.com");
      setPassword("password123");
    }
    setError("");
  }, [isLoginMode, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      if (isLoginMode) {
        await login(email, password);
        navigate("/dashboard", { replace: true });
      } else {
        if (password.length < 6) throw new Error("Password must be at least 6 characters.");
        await register(email, password);
        await login(email, password);
        navigate("/dashboard", { replace: true });
      }
    } catch (err) {
      const msg = err.response?.data?.detail;
      setError(typeof msg === "string" ? msg : err.message || "Authentication failed. Check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#0a0a0a] text-white flex items-center justify-center relative overflow-y-auto pt-safe pb-safe">
      <div className="absolute w-[250px] h-[250px] md:w-96 md:h-96 bg-teal-600/10 rounded-full blur-3xl -left-10 -top-10 pointer-events-none" />
      <div className="absolute w-[250px] h-[250px] md:w-96 md:h-96 bg-emerald-600/10 rounded-full blur-3xl -right-10 -bottom-10 pointer-events-none" />
      <div className="bg-[#141414] border border-white/[0.06] p-6 md:p-10 rounded-[28px] md:rounded-[40px] w-full max-w-md z-10 shadow-2xl mx-4 my-8 md:my-0">
        <div className="flex items-center gap-3 mb-6 md:mb-8 justify-center">
          <div className="h-10 w-10 rounded-full bg-teal-500 shadow-[0_0_20px_rgba(20,184,166,0.4)] flex items-center justify-center">
            <Box size={20} className="text-black" />
          </div>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white">COLLECTR</h2>
        </div>
        <div className="text-center mb-6 md:mb-8">
          <h3 className="text-lg md:text-xl font-bold text-white">{isLoginMode ? "Welcome Back" : "Create an Account"}</h3>
          <p className="text-sm text-slate-500 mt-2">{isLoginMode ? "Enter your credentials to access your vault." : "Start building your ultimate TCG portfolio today."}</p>
        </div>
        {error && (
          <div className="mb-4 md:mb-6 p-3 md:p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-3 text-rose-500 text-sm font-bold">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
          <input required type="email" className="w-full bg-black/50 border border-white/[0.08] rounded-xl px-4 py-4 text-white outline-none focus:border-teal-500 transition-colors" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address" />
          <input required minLength={isLoginMode ? 1 : 6} className="w-full bg-black/50 border border-white/[0.08] rounded-xl px-4 py-4 text-white outline-none focus:border-teal-500 transition-colors" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" />
          <button disabled={isLoading} className="w-full py-4 mt-1 md:mt-2 rounded-xl font-black bg-teal-500 text-black active:bg-teal-600 hover:bg-teal-400 transition-colors flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(20,184,166,0.2)]">
            {isLoading ? <Loader2 size={20} className="animate-spin" /> : (isLoginMode ? "Enter Vault" : "Create Account")}
          </button>
        </form>
        <div className="mt-6 md:mt-8 text-center border-t border-white/[0.06] pt-5 md:pt-6">
          <p className="text-sm text-slate-500">
            {isLoginMode ? "Don't have an account?" : "Already have an account?"}
            <button type="button" onClick={() => setIsLoginMode(!isLoginMode)} className="ml-2 text-teal-400 font-bold active:text-teal-300 hover:text-teal-300 transition-colors">
              {isLoginMode ? "Sign Up" : "Log In"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
