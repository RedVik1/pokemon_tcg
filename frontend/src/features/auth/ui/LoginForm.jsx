import React, { useState } from "react";
import { Loader2, Box, AlertCircle } from "lucide-react";

/**
 * Presentational login/register form.
 *
 * @param {{
 *   isLoginMode: boolean,
 *   email: string,
 *   password: string,
 *   isLoading: boolean,
 *   error: string,
 *   onEmailChange: (email: string) => void,
 *   onPasswordChange: (password: string) => void,
 *   onModeToggle: () => void,
 *   onSubmit: (e: React.FormEvent) => void,
 * }} props
 */
export default function LoginForm({
  isLoginMode,
  email,
  password,
  isLoading,
  error,
  onEmailChange,
  onPasswordChange,
  onModeToggle,
  onSubmit,
}) {
  return (
    <div className="bg-[#141414] border border-white/[0.06] p-6 md:p-10 rounded-[28px] md:rounded-[40px] w-full max-w-md z-10 shadow-2xl mx-4 my-8 md:my-0">
      <div className="flex items-center gap-3 mb-6 md:mb-8 justify-center">
        <div className="h-10 w-10 rounded-full bg-teal-500 shadow-[0_0_20px_rgba(20,184,166,0.4)] flex items-center justify-center">
          <Box size={20} className="text-black" />
        </div>
        <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white">COLLECTR</h2>
      </div>
      <div className="text-center mb-6 md:mb-8">
        <h3 className="text-lg md:text-xl font-bold text-white">
          {isLoginMode ? "Welcome Back" : "Create an Account"}
        </h3>
        <p className="text-sm text-slate-500 mt-2">
          {isLoginMode
            ? "Enter your credentials to access your vault."
            : "Start building your ultimate TCG portfolio today."}
        </p>
      </div>
      {error && (
        <div className="mb-4 md:mb-6 p-3 md:p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-3 text-rose-500 text-sm font-bold">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
      <form onSubmit={onSubmit} className="space-y-3 md:space-y-4">
        <input
          required
          type="email"
          className="w-full bg-black/50 border border-white/[0.08] rounded-xl px-4 py-4 text-white outline-none focus:border-teal-500 transition-colors"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          placeholder="Email address"
        />
        <input
          required
          minLength={isLoginMode ? 1 : 6}
          className="w-full bg-black/50 border border-white/[0.08] rounded-xl px-4 py-4 text-white outline-none focus:border-teal-500 transition-colors"
          type="password"
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
          placeholder="Password"
        />
        <button
          disabled={isLoading}
          className="w-full py-4 mt-1 md:mt-2 rounded-xl font-black bg-teal-500 text-black active:bg-teal-600 hover:bg-teal-400 transition-colors flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(20,184,166,0.2)]"
        >
          {isLoading ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            isLoginMode ? "Enter Vault" : "Create Account"
          )}
        </button>
      </form>
      <div className="mt-6 md:mt-8 text-center border-t border-white/[0.06] pt-5 md:pt-6">
        <p className="text-sm text-slate-500">
          {isLoginMode ? "Don't have an account?" : "Already have an account?"}
          <button
            type="button"
            onClick={onModeToggle}
            className="ml-2 text-teal-400 font-bold active:text-teal-300 hover:text-teal-300 transition-colors"
          >
            {isLoginMode ? "Sign Up" : "Log In"}
          </button>
        </p>
      </div>
    </div>
  );
}
