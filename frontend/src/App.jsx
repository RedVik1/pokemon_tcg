import React, { useEffect, useMemo, useState, useCallback } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import api, { login } from "./api";
import {
  Plus, Search, Loader2, CheckCircle, LogOut, User, Trash2,
  TrendingUp, TrendingDown, ExternalLink, ShoppingBag, X, Box, Download, Flame, AlertCircle,
  LayoutGrid, Briefcase, SlidersHorizontal, ChevronLeft
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ResponsiveContainer, AreaChart, Area, Tooltip as ReTooltip,
  PieChart, Pie, Cell
} from "recharts";

const PIE_COLORS = ['#14b8a6', '#8b5cf6', '#f43f5e', '#f59e0b', '#3b82f6', '#ec4899'];

const RARITIES = [
  { label: "All Rarities", value: "All" }, { label: "Common", value: "Common" },
  { label: "Uncommon", value: "Uncommon" }, { label: "Rare", value: "Rare" },
  { label: "Holo Rare", value: "Holo Rare" }, { label: "Double Rare / V", value: "Double Rare" },
  { label: "Ultra Rare", value: "Ultra Rare" }, { label: "Illustration Rare", value: "Illustration Rare" },
  { label: "Special Illustration", value: "Special Illustration Rare" },
  { label: "Secret / Hyper Rare", value: "Secret Rare" }, { label: "Promo", value: "Promo" }
];

function useDebounce(value, delay = 400) {
  const [v, setV] = useState(value);
  useEffect(() => { const t = setTimeout(() => setV(value), delay); return () => clearTimeout(t); }, [value, delay]);
  return v;
}

function safePrice(p) {
  if (p == null) return 0;
  const v = parseFloat(String(p).replace(/,/g, ""));
  return Number.isFinite(v) ? v : 0;
}

function formatMoney(amount) {
  return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatRarity(r) {
  if (!r) return "Rare";
  if (r === "Rare Secret" || r === "Hyper Rare") return "Secret Rare";
  if (r === "Rare Ultra") return "Ultra Rare";
  if (r === "Rare Holo") return "Holo Rare";
  if (r === "Rare Holo V") return "Double Rare (V)";
  return r;
}

function getChartDataFromHistory(historyRaw, timeframe = "1M", grade = "Raw") {
  if (!historyRaw || !historyRaw[timeframe] || historyRaw[timeframe].length === 0) {
    return { data: [], percent: "0.00", isUp: true };
  }
  const arr = historyRaw[timeframe];
  const arrLen = arr.length;
  const multiplier = grade === "PSA 10" ? 4.2 : grade === "PSA 9" ? 1.8 : 1.0;
  const data = arr.map((val, idx) => {
    let label = "";
    if (timeframe === "1W" || timeframe === "1M") {
      label = idx === arrLen - 1 ? "Today" : `${arrLen - 1 - idx}d ago`;
    } else if (timeframe === "1Y") {
      label = idx === arrLen - 1 ? "This Mo" : `${arrLen - 1 - idx}mo ago`;
    }
    let wave = 0;
    if (grade !== "Raw" && idx !== arrLen - 1) {
      wave = Math.sin(idx * 0.9 + (grade === "PSA 10" ? 2 : 5)) * 0.05;
    }
    return { name: label, price: val * multiplier * (1 + wave) };
  });
  const firstPrice = data[0].price;
  const currentPrice = data[arrLen - 1].price;
  const change = currentPrice - firstPrice;
  const percent = firstPrice > 0 ? ((Math.abs(change) / firstPrice) * 100).toFixed(2) : "0.00";
  return { data, percent, isUp: change >= 0 };
}

function getEmailFromToken() {
  try {
    const token = localStorage.getItem("token");
    if (!token) return null;
    return JSON.parse(atob(token.split(".")[1]))?.sub || "Collector";
  } catch { return "Collector"; }
}

function EliteLoginPage() {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoginMode && !email) {
      setEmail("test_demo@example.com");
      setPassword("password123");
    } else if (!isLoginMode) {
      setEmail(""); setPassword(""); setError("");
    }
  }, [isLoginMode]);

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
        const res = await fetch("/users/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password })
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.detail || "Registration failed");
        }
        await login(email, password);
        navigate("/dashboard", { replace: true });
      }
    } catch (err) {
      setError(err.message || "Authentication failed. Check your credentials.");
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

function MobileHeader({ onLogout, userEmail }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <header className="md:hidden sticky top-0 z-40 w-full bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/[0.04] pt-safe">
      <div className="px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-full bg-teal-500 shadow-[0_0_10px_rgba(20,184,166,0.4)]" />
          <span className="text-lg font-black tracking-wider text-white">COLLECTR</span>
        </div>
        <div className="relative">
          <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 -mr-2 text-slate-400 active:text-white transition-colors">
            <User size={22} />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
              <div className="absolute top-full right-0 mt-2 w-56 bg-[#141414] border border-white/[0.08] rounded-xl shadow-2xl z-50 py-2 overflow-hidden">
                <div className="px-4 py-3 border-b border-white/[0.06]">
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Signed in as</div>
                  <div className="text-sm text-white font-bold truncate">{userEmail}</div>
                </div>
                <div className="bg-teal-500/10 border border-teal-500/20 mx-3 mt-3 p-3 rounded-xl flex items-center gap-2">
                  <div className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </div>
                  <span className="text-[10px] font-black text-emerald-400 tracking-widest uppercase">Live API</span>
                </div>
                <button onClick={() => { setMenuOpen(false); onLogout(); }} className="w-full text-left px-4 py-3.5 mt-2 flex items-center gap-3 text-rose-400 font-bold text-sm active:bg-rose-500/10 transition-colors">
                  <LogOut size={18} />
                  <span>Log Out</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function DesktopNavbar({ onLogout, onOpenPalette, userEmail, activeTab, setActiveTab }) {
  return (
    <header className="hidden md:block sticky top-0 z-40 w-full bg-[#111111] border-b border-white/5">
      <div className="max-w-[1600px] mx-auto px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab("explore")}>
          <div className="h-6 w-6 rounded-full bg-teal-500" />
          <span className="text-xl font-extrabold tracking-widest text-white">COLLECTR</span>
        </div>
        <nav className="flex items-center gap-8 text-sm font-semibold">
          <button onClick={() => setActiveTab("explore")} className={activeTab === "explore" ? "text-teal-400" : "text-slate-400 hover:text-white transition-colors"}>Explore</button>
          <button onClick={() => setActiveTab("portfolio")} className={activeTab === "portfolio" ? "text-teal-400" : "text-slate-400 hover:text-white transition-colors"}>Portfolio</button>
        </nav>
        <div className="flex items-center gap-4">
          <button onClick={onOpenPalette} className="p-2 text-slate-400 hover:text-white transition-colors"><Search size={20} /></button>
          <div className="bg-[#1a1a1a] px-3 py-1.5 rounded-md border border-white/5 flex items-center gap-2">
            <div className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </div>
            <span className="text-[10px] font-black text-emerald-400 tracking-widest uppercase">Live API</span>
          </div>
          <div className="flex items-center gap-2 text-slate-400 text-sm border-l border-white/10 pl-4 ml-2"><User size={16} /> {userEmail}</div>
          <button onClick={onLogout} className="p-2 text-slate-400 hover:text-white transition-colors" title="Logout"><LogOut size={20} /></button>
        </div>
      </div>
    </header>
  );
}

function BottomNav({ activeTab, setActiveTab, onOpenPalette }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[#0a0a0a]/95 backdrop-blur-xl border-t border-white/[0.06] pb-safe">
      <div className="flex items-center justify-around px-2">
        <button onClick={() => setActiveTab("explore")} className={`flex flex-col items-center gap-1 py-2.5 px-5 rounded-2xl transition-colors min-w-[64px] ${activeTab === "explore" ? "text-teal-400" : "text-slate-600"}`}>
          <LayoutGrid size={22} />
          <span className="text-[10px] font-bold tracking-wide">Explore</span>
        </button>
        <button onClick={onOpenPalette} className="flex flex-col items-center gap-1 py-2.5 px-5 rounded-2xl transition-colors min-w-[64px] -mt-4">
          <div className="w-14 h-14 bg-teal-500 rounded-full flex items-center justify-center shadow-[0_4px_20px_rgba(20,184,166,0.4)] active:scale-95 transition-transform">
            <Search size={26} className="text-black" />
          </div>
        </button>
        <button onClick={() => setActiveTab("portfolio")} className={`flex flex-col items-center gap-1 py-2.5 px-5 rounded-2xl transition-colors min-w-[64px] ${activeTab === "portfolio" ? "text-teal-400" : "text-slate-600"}`}>
          <Briefcase size={22} />
          <span className="text-[10px] font-bold tracking-wide">Vault</span>
        </button>
      </div>
    </div>
  );
}

function RarityFilterSheet({ open, onClose, rarityFilter, setRarityFilter }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90] md:hidden" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="absolute bottom-0 left-0 right-0 bg-[#141414] rounded-t-3xl border-t border-white/[0.08] max-h-[70vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
          <h3 className="text-white font-bold text-lg">Filter by Rarity</h3>
          <button onClick={onClose} className="p-2 -mr-1 text-slate-500 active:text-white"><X size={20} /></button>
        </div>
        <div className="overflow-y-auto p-4 pb-8 space-y-1">
          {RARITIES.map(r => (
            <button
              key={r.value}
              onClick={() => { setRarityFilter(r.value); onClose(); }}
              className={`w-full text-left px-5 py-3.5 rounded-xl text-sm font-semibold transition-colors ${rarityFilter === r.value ? 'bg-teal-500/15 text-teal-400' : 'text-slate-400 active:bg-white/5'}`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

function SidebarFilters({ rarityFilter, setRarityFilter }) {
  return (
    <div className="hidden lg:block w-64 shrink-0 space-y-8 pr-6 border-r border-white/5">
      <div>
        <h3 className="text-white font-bold mb-4 text-sm uppercase tracking-widest">Database Rarity</h3>
        <div className="space-y-3">
          {RARITIES.map(r => (
            <label key={r.value} className="flex items-center gap-3 text-slate-400 text-sm cursor-pointer hover:text-white transition-colors">
              <input type="radio" name="rarity" checked={rarityFilter === r.value} onChange={() => setRarityFilter(r.value)} className="text-teal-500 bg-black border-white/10" />
              {r.label}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

function VaultCard({ coll, onOpenAnalytics, onAdd, onDelete, isPortfolio, quantity, inPortfolio }) {
  const card = coll?.card || coll;
  const basePrice = safePrice(card?.price);
  const displayPrice = isPortfolio ? basePrice * quantity : basePrice;
  const { percent, isUp } = useMemo(() => getChartDataFromHistory(card?.history, "1M", "Raw"), [card?.history]);
  const setParts = useMemo(() => (card?.set_name || "").split(" • "), [card?.set_name]);
  const setName = setParts[0];
  const rarity = formatRarity(card?.rarity || setParts[1]);

  const [isHovered, setIsHovered] = useState(false);
  const [transformStyle, setTransformStyle] = useState("rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)");
  const [foilPos, setFoilPos] = useState({ x: "50%", y: "50%" });
  const onMouseMove = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const maxTilt = 8;
    const rotateX = ((y - centerY) / centerY) * -maxTilt;
    const rotateY = ((x - centerX) / centerX) * maxTilt;
    setTransformStyle(`rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`);
    setFoilPos({ x: `${(x / rect.width) * 100}%`, y: `${(y / rect.height) * 100}%` });
  }, []);
  const onMouseLeave = useCallback(() => {
    setIsHovered(false);
    setTransformStyle("rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)");
  }, []);

  const cardImageFilter = isHovered ? "drop-shadow(0 15px 20px rgba(0,0,0,0.5))" : "drop-shadow(0 8px 12px rgba(0,0,0,0.3))";
  const cardImageTransform = isHovered ? "translateZ(20px)" : "translateZ(0px)";
  const foilOpacity = isHovered ? 0.25 : 0;
  const foilBg = `radial-gradient(circle at ${foilPos.x} ${foilPos.y}, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 60%)`;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="relative w-full h-full" style={{ perspective: "1500px" }}>
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={onMouseLeave}
        onMouseMove={onMouseMove}
        onClick={() => onOpenAnalytics(coll)}
        style={{ transform: transformStyle, transition: isHovered ? "transform 0.1s ease-out" : "transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)", transformStyle: "preserve-3d", willChange: "transform" }}
        className="group bg-[#141414] rounded-[20px] md:rounded-2xl border border-white/[0.06] overflow-hidden cursor-pointer shadow-xl flex flex-col h-full relative z-10 active:scale-[0.98] transition-transform md:active:scale-100"
      >
        <div className="relative p-3 md:p-4 bg-[#1a1a1a] flex-1 flex items-center justify-center overflow-hidden min-h-[160px] md:min-h-[220px]">
          {card?.image_url && (
            <img src={card.image_url} alt={card?.name} className="w-full max-w-[140px] md:max-w-[180px] object-contain relative z-10 transition-all duration-500 ease-out" style={{ transform: cardImageTransform, filter: cardImageFilter }} />
          )}
          <div className="absolute inset-0 pointer-events-none z-20 mix-blend-overlay transition-opacity duration-500" style={{ opacity: foilOpacity, background: foilBg }} />
          {inPortfolio && !isPortfolio && (
            <div className="absolute top-2.5 left-2.5 md:top-3 md:left-3 bg-teal-500 text-black text-[9px] md:text-[10px] font-black uppercase tracking-widest px-2 py-0.5 md:py-1 rounded shadow-lg flex items-center gap-1 z-30 transition-transform duration-500" style={{ transform: isHovered ? "translateZ(10px)" : "translateZ(0)" }}>
              <CheckCircle size={10} className="md:w-3 md:h-3" /> Owned
            </div>
          )}
          {quantity > 1 && (
            <div className="absolute top-2.5 right-2.5 md:top-3 md:right-3 bg-teal-500 text-black font-black text-[10px] md:text-xs h-6 w-6 md:h-7 md:w-7 rounded-full flex items-center justify-center shadow-2xl border-2 border-black z-30 transition-transform duration-500" style={{ transform: isHovered ? "translateZ(10px)" : "translateZ(0)" }}>
              x{quantity}
            </div>
          )}
        </div>
        <div className="p-3 md:p-4 border-t border-white/[0.06] bg-[#141414] relative z-30 transition-transform duration-500" style={{ transform: isHovered ? "translateZ(8px)" : "translateZ(0)" }}>
          <div className="text-white font-bold truncate text-[13px] md:text-sm mb-0.5 md:mb-1">{card?.name}</div>
          <div className="text-[8px] md:text-[9px] text-teal-400/70 font-bold uppercase tracking-widest mb-2 md:mb-3 truncate">{setName} • {rarity}</div>
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <div className="text-base md:text-lg font-black text-white">${formatMoney(displayPrice)}</div>
              {isPortfolio && quantity > 1 && <div className="text-[8px] md:text-[9px] text-slate-500 font-bold">${formatMoney(basePrice)} / ea</div>}
            </div>
            <div className={`flex items-center gap-1 text-[10px] font-bold ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
              {isUp ? '+' : '-'}{percent}%
            </div>
          </div>
        </div>
        <div className="flex border-t border-white/[0.06] bg-black/20 relative z-40 transition-transform duration-500" style={{ transform: isHovered ? "translateZ(4px)" : "translateZ(0)" }}>
          {!isPortfolio ? (
            <button onClick={(e) => { e.stopPropagation(); onAdd(card); }} className="flex-1 py-3.5 md:py-3 flex justify-center text-teal-500 active:bg-teal-500/10 md:hover:bg-teal-500/10 transition-colors"><Plus size={18} /></button>
          ) : (
            <>
              <button onClick={(e) => { e.stopPropagation(); onAdd(card); }} className="flex-1 py-3.5 md:py-3 flex justify-center text-teal-500 active:bg-teal-500/10 md:hover:bg-teal-500/10 transition-colors border-r border-white/[0.06]" title="Add another copy"><Plus size={18} /></button>
              <button onClick={(e) => { e.stopPropagation(); onDelete(coll); }} className="flex-1 py-3.5 md:py-3 flex justify-center text-rose-500 active:bg-rose-500/10 md:hover:bg-rose-500/10 transition-colors" title="Remove copy"><Trash2 size={18} /></button>
            </>
          )}
        </div>
      </div>
      <div className="absolute -inset-2 bg-teal-500/20 blur-2xl rounded-3xl -z-10 transition-opacity duration-500 pointer-events-none" style={{ opacity: isHovered ? 0.4 : 0 }} />
    </motion.div>
  );
}

function SearchPalette({ open, onClose, onAdd, onOpenAnalytics }) {
  const [query, setQuery] = useState("");
  const debounced = useDebounce(query, 600);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!open) return;
    let active = true; setLoading(true);
    api.get(`/search?query=${encodeURIComponent(debounced)}&limit=50`)
      .then(r => { if (active) setResults(r.data || []); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [debounced, open]);

  useEffect(() => { if (open) setQuery(""); }, [open]);

  if (!open) return null;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex flex-col"
    >
      <div className="flex flex-col h-full pt-safe">
        <div className="px-4 md:px-8 pt-4 md:pt-8">
          <div className="max-w-[800px] mx-auto w-full bg-[#141414] border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-4 flex items-center gap-3">
              <Search className="text-teal-500 shrink-0" size={20} />
              <input
                autoFocus
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search any card..."
                className="flex-1 bg-transparent text-white text-base md:text-lg outline-none placeholder:text-slate-600"
              />
              <button onClick={onClose} className="md:hidden p-2 -mr-2 text-slate-500 active:text-white transition-colors">
                <X size={20} />
              </button>
              <div className="hidden md:flex px-2 py-1 bg-black/50 rounded text-[10px] font-bold text-slate-500 border border-white/10">ESC</div>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar px-4 md:px-8 py-4">
          <div className="max-w-[800px] mx-auto w-full">
            <div className="grid grid-cols-3 md:grid-cols-4 gap-2.5 md:gap-4">
              {loading ? (
                <div className="col-span-full py-16 flex justify-center"><Loader2 className="animate-spin text-teal-500" /></div>
              ) : results.length === 0 && debounced ? (
                <div className="col-span-full py-16 text-center">
                  <Search size={40} className="text-slate-700 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm font-semibold">No cards found</p>
                </div>
              ) : results.length === 0 && !debounced ? (
                <div className="col-span-full py-16 text-center">
                  <Search size={40} className="text-slate-700 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm font-semibold">Type to search cards</p>
                </div>
              ) : (
                results.map((item) => (
                  <div key={item.id} onClick={() => { onOpenAnalytics(item); }} className="p-2 md:p-2.5 rounded-xl md:rounded-2xl border border-white/[0.06] active:bg-teal-500/10 md:hover:bg-teal-500/10 cursor-pointer text-center relative group transition-colors">
                    {item.image_url && <img src={item.image_url} className="w-full aspect-[3/4] object-contain mb-1.5 md:mb-2" loading="lazy" />}
                    <div className="text-[9px] md:text-[10px] text-white font-bold truncate">{item.name}</div>
                    <div className="text-[8px] md:text-[9px] text-teal-400 mt-0.5 md:mt-1">${formatMoney(safePrice(item.price))}</div>
                    <div onClick={(e) => { e.stopPropagation(); onAdd(item); }} className="absolute top-2 right-2 bg-teal-500 text-black rounded-full p-1.5 md:opacity-0 md:group-hover:opacity-100 transition-all active:scale-90 md:hover:scale-110 shadow-lg">
                      <Plus size={13} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function CustomTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    const dataPoint = payload[0].payload;
    return (
      <div className="bg-[#1a1a1a] border border-white/10 text-white text-sm p-3 rounded-lg shadow-xl" style={{ zIndex: 9999, position: 'relative' }}>
        <div className="text-slate-400 mb-1">{dataPoint.name}</div>
        <div className="font-bold text-teal-400">${formatMoney(Number(dataPoint.value || dataPoint.price))}</div>
      </div>
    );
  }
  return null;
}

function AssetAnalyticsModal({ coll, onClose, onAdd, onDelete, isPortfolio }) {
  const card = coll.card || coll;
  const basePrice = safePrice(card.price);
  const [timeframe, setTimeframe] = useState("1M");
  const [grade, setGrade] = useState("Raw");
  const gradeMultiplier = grade === "PSA 10" ? 4.2 : grade === "PSA 9" ? 1.8 : 1.0;
  const { data, percent, isUp } = useMemo(() => getChartDataFromHistory(card?.history, timeframe, grade), [card?.history, timeframe, grade]);
  const currentPrice = basePrice * gradeMultiplier;
  const setParts = (card?.set_name || "").split(" • ");
  const setName = setParts[0];
  const rarity = formatRarity(card?.rarity || setParts[1]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[110] bg-black/95 backdrop-blur-xl overflow-y-auto custom-scrollbar"
    >
      <div className="min-h-full md:flex md:items-center md:justify-center md:p-4" onMouseDown={e => e.target === e.currentTarget && onClose()}>
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", damping: 28, stiffness: 300, delay: 0.05 }}
          className="w-full md:max-w-[1100px] bg-[#0f0f0f] md:border md:border-white/[0.08] md:rounded-[32px] shadow-2xl overflow-hidden flex flex-col"
        >
          <div className="sticky top-0 z-20 flex items-center justify-between px-4 md:hidden bg-[#0f0f0f]/90 backdrop-blur-xl border-b border-white/[0.04] h-14">
            <button onClick={onClose} className="flex items-center gap-1.5 text-teal-400 font-bold text-base py-3 px-2 -ml-2 active:opacity-70 min-h-[44px]">
              <ChevronLeft size={22} />
              <span>Back</span>
            </button>
            <span className="text-white font-bold text-sm truncate max-w-[45%]">{card.name}</span>
            <div className="w-[60px]" />
          </div>
          <button onClick={onClose} className="hidden md:flex fixed top-6 right-6 z-[99999] bg-white/10 hover:bg-white/20 text-white p-4 rounded-full transition-all border border-white/20 shadow-2xl cursor-pointer">
            <X size={24} />
          </button>
          <div className="px-5 md:px-10 pt-5 md:pt-10 pb-6 md:pb-10">
            <div className="mb-5 md:mb-8">
              <div className="text-teal-500 font-black text-[10px] md:text-xs mb-1.5 md:mb-2 uppercase tracking-[0.2em]">{setName} • {rarity}</div>
              <h1 className="text-2xl md:text-4xl lg:text-5xl font-black text-white leading-tight">{card.name}</h1>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
              <div className="relative bg-[#161616] rounded-2xl md:rounded-xl p-5 md:p-6 border border-white/[0.06] flex flex-col items-center justify-center overflow-hidden">
                {card.image_url && <img src={card.image_url} className="w-full max-w-[200px] md:max-w-[300px] rounded-xl shadow-2xl mb-4 md:mb-6 relative z-10" loading="lazy" />}
                {!isPortfolio ? (
                  <button onClick={() => { onAdd(card); onClose(); }} className="w-full py-4 md:py-3.5 bg-teal-500 text-black font-bold rounded-xl active:bg-teal-600 md:hover:bg-teal-400 transition-colors relative z-10 shadow-[0_0_20px_rgba(20,184,166,0.3)]">Add to Portfolio</button>
                ) : (
                  <div className="flex gap-3 w-full relative z-10">
                    <button onClick={() => { onAdd(card); }} className="flex-1 py-4 md:py-3.5 bg-teal-500/20 text-teal-500 font-bold rounded-xl active:bg-teal-500/30 md:hover:bg-teal-500/30 transition-colors border border-teal-500/20 flex items-center justify-center gap-2">
                      <Plus size={18} /> Add Copy
                    </button>
                    <button onClick={() => { onDelete(coll); onClose(); }} className="flex-1 py-4 md:py-3.5 bg-rose-500/20 text-rose-500 font-bold rounded-xl active:bg-rose-500/30 md:hover:bg-rose-500/30 transition-colors border border-rose-500/20 flex items-center justify-center gap-2">
                      <Trash2 size={18} /> Remove
                    </button>
                  </div>
                )}
              </div>
              <div className="lg:col-span-2 space-y-4 md:space-y-6">
                <div className="bg-[#161616] border border-white/[0.06] rounded-[20px] md:rounded-[28px] p-4 md:p-6 shadow-lg">
                  <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 md:mb-6 gap-3 md:gap-4">
                    <div className="text-white font-bold flex items-center gap-2 text-sm md:text-base"><TrendingUp size={16} className="text-teal-500" /> Market History</div>
                    <div className="flex items-center justify-between w-full md:w-auto gap-3">
                      <div className="flex bg-black rounded-lg p-0.5 md:p-1 border border-white/10">
                        {['Raw', 'PSA 9', 'PSA 10'].map(g => (
                          <button key={g} onClick={() => setGrade(g)} className={`px-2.5 md:px-3 py-1.5 md:py-1 text-[10px] uppercase tracking-widest rounded-md font-bold transition-colors min-h-[36px] ${grade === g ? 'bg-teal-500 text-black' : 'text-slate-500 active:text-white md:hover:text-white'}`}>{g}</button>
                        ))}
                      </div>
                      <div className="flex gap-0.5 md:gap-1 bg-black rounded-lg p-0.5 md:p-1">
                        {['1W', '1M', '1Y'].map(t => (
                          <button key={t} onClick={() => setTimeframe(t)} className={`px-2.5 md:px-3 py-1.5 md:py-1 text-xs rounded-md font-bold transition-colors min-h-[36px] ${timeframe === t ? 'bg-[#333] text-white' : 'text-slate-500 active:text-white md:hover:text-white'}`}>{t}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-end gap-3 md:gap-4 mb-3 md:mb-4">
                    <div className="text-3xl md:text-4xl font-black text-white">${formatMoney(currentPrice)}</div>
                    <div className={`text-base md:text-lg font-bold mb-0.5 md:mb-1 ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isUp ? '▲' : '▼'} {percent}%
                    </div>
                  </div>
                  <div className="h-36 md:h-48 w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={data} style={{ zIndex: 10 }}>
                        <defs><linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3} /><stop offset="95%" stopColor="#14b8a6" stopOpacity={0} /></linearGradient></defs>
                        <Area type="monotone" dataKey="price" stroke="#14b8a6" strokeWidth={3} fill="url(#colorPrice)" />
                        <ReTooltip content={<CustomTooltip />} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2.5 md:gap-4">
                  <div className="bg-[#161616] border border-white/[0.06] rounded-2xl p-3.5 md:p-4 text-center flex flex-col justify-center min-h-[64px]">
                    <div className="text-slate-500 text-[9px] md:text-[10px] font-bold uppercase tracking-widest mb-1">Condition</div>
                    <div className="text-teal-400 font-bold text-[11px] md:text-xs">{grade}</div>
                  </div>
                  <div onClick={() => window.open(`https://www.tcgplayer.com/search/all/product?q=${encodeURIComponent(card.name)}`, "_blank")} className="bg-teal-500/10 border border-teal-500/20 active:bg-teal-500/20 md:hover:bg-teal-500/20 rounded-2xl p-3.5 md:p-4 flex flex-col items-center justify-center cursor-pointer transition-colors text-teal-400 min-h-[64px]">
                    <ShoppingBag size={18} className="mb-1" />
                    <div className="font-bold text-[10px] md:text-xs">TCGPlayer</div>
                  </div>
                  <div onClick={() => window.open(`https://www.psacard.com/search#q=${encodeURIComponent(card.name)}`, "_blank")} className="bg-rose-500/10 border border-rose-500/20 active:bg-rose-500/20 md:hover:bg-rose-500/20 rounded-2xl p-3.5 md:p-4 flex flex-col items-center justify-center cursor-pointer transition-colors text-rose-400 min-h-[64px]">
                    <ExternalLink size={18} className="mb-1" />
                    <div className="font-bold text-[10px] md:text-xs">PSA Grade</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

function MainApp() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState("explore");
  const [exploreCards, setExploreCards] = useState([]);
  const [portfolioCards, setPortfolioCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [explorePage, setExplorePage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [selectedColl, setSelectedColl] = useState(null);
  const [sortBy, setSortBy] = useState("Newest");
  const [sortOpen, setSortOpen] = useState(false);
  const [rarityFilter, setRarityFilter] = useState("All");
  const [raritySheetOpen, setRaritySheetOpen] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: "", type: "success" });
  const [confirmDialog, setConfirmDialog] = useState({ visible: false, coll: null });
  const [marketMovers, setMarketMovers] = useState([]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setPaletteOpen(true); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (activeTab === "portfolio") setSortBy("Price: High to Low");
    else if (activeTab === "explore") setSortBy("Newest");
    setExplorePage(1);
  }, [activeTab]);

  const showToast = useCallback((message, type = "success") => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast({ visible: false, message: "", type: "success" }), 3000);
  }, []);

  const fetchData = useCallback(async (pageToLoad = 1, append = false, currentRarity = "All", currentSort = "Newest") => {
    if (!append) setLoading(true); else setLoadingMore(true);
    try {
      const rarityQuery = currentRarity === "All" ? "" : `&rarity=${encodeURIComponent(currentRarity)}`;
      const sortQuery = `&sort_by=${encodeURIComponent(currentSort)}`;
      const [s, c, exp] = await Promise.all([
        api.get("/portfolio/stats"), api.get("/collections/me"),
        api.get(`/search?query=&page=${pageToLoad}&limit=48${rarityQuery}${sortQuery}`)
      ]);
      setStats(s.data); setPortfolioCards(c.data || []);
      const newExplore = (exp.data || []).map(card => ({ id: `exp-${card.id}-${pageToLoad}`, card, condition: "Market" }));
      if (append) {
        setExploreCards(prev => {
          const prevIds = new Set(prev.map(p => p.card.id));
          const uniqueNew = newExplore.filter(n => !prevIds.has(n.card.id));
          return [...prev, ...uniqueNew];
        });
      } else { setExploreCards(newExplore); }
    } catch (error) {
      if (error.response && error.response.status === 401) { localStorage.removeItem("token"); navigate("/login"); }
    } finally { setLoading(false); setLoadingMore(false); }
  }, [navigate]);

  useEffect(() => { api.get("/market-movers").then(r => setMarketMovers(r.data || [])).catch(() => {}); }, []);
  useEffect(() => { setExplorePage(1); fetchData(1, false, rarityFilter, sortBy); }, [rarityFilter, sortBy, fetchData]);

  const handleLoadMore = useCallback(() => {
    const nextPage = explorePage + 1; setExplorePage(nextPage); fetchData(nextPage, true, rarityFilter, sortBy);
  }, [explorePage, rarityFilter, sortBy, fetchData]);

  const handleAdd = useCallback(async (card) => {
    try {
      const targetId = card.pokemon_tcg_id || card.id;
      const token = localStorage.getItem("token");
      const response = await fetch("/collections/add", {
        method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ pokemon_tcg_id: String(targetId), condition: "Mint" })
      });
      if (response.status === 401) { localStorage.removeItem("token"); navigate("/login"); return; }
      if (!response.ok) throw new Error("Validation Failed");
      await fetchData(1, false, rarityFilter, sortBy);
      showToast(`${card.name} added to vault!`, "success");
    } catch { showToast("Error adding card.", "error"); }
  }, [navigate, fetchData, rarityFilter, sortBy, showToast]);

  const confirmDelete = useCallback((coll) => setConfirmDialog({ visible: true, coll }), []);

  const executeDelete = useCallback(async () => {
    if (!confirmDialog.coll) return;
    const instanceId = confirmDialog.coll.instance_ids ? confirmDialog.coll.instance_ids[0] : confirmDialog.coll.id;
    try {
      await api.delete(`/collections/${instanceId}`);
      await fetchData(1, false, rarityFilter, sortBy);
      setConfirmDialog({ visible: false, coll: null });
      showToast("Card removed.", "success");
    } catch { showToast("Error removing card.", "error"); }
  }, [confirmDialog.coll, fetchData, rarityFilter, sortBy, showToast]);

  const handleExportCSV = useCallback(() => {
    let csvContent = "data:text/csv;charset=utf-8,Card Name,Set,Rarity,Quantity,Price (ea),Total Value\n";
    groupedPortfolio.forEach(item => {
      const c = item.card; const price = safePrice(c.price); const qty = item.quantity;
      csvContent += `"${c.name}","${c.set_name}","${formatRarity(c.rarity)}",${qty},$${price.toFixed(2)},$${(price * qty).toFixed(2)}\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Pokemon_Portfolio_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
    showToast("Portfolio exported successfully!", "success");
  }, [showToast]);

  const groupedPortfolio = useMemo(() => {
    const map = new Map();
    portfolioCards.forEach(item => {
      const id = item.card.pokemon_tcg_id;
      if (!map.has(id)) map.set(id, { ...item, quantity: item.quantity || 1, instance_ids: [item.id] });
      else {
        const existing = map.get(id); existing.quantity += (item.quantity || 1); existing.instance_ids.push(item.id);
      }
    });
    return Array.from(map.values());
  }, [portfolioCards]);

  const portfolioDistribution = useMemo(() => {
    const dist = {};
    groupedPortfolio.forEach(item => {
      const r = formatRarity(item.card.rarity || item.card.set_name?.split(" • ")[1]);
      const val = safePrice(item.card.price) * item.quantity;
      if (val > 0) { dist[r] = (dist[r] || 0) + val; }
    });
    return Object.entries(dist).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [groupedPortfolio]);

  const ownedIds = useMemo(() => new Set(portfolioCards.map(c => c.card?.pokemon_tcg_id)), [portfolioCards]);

  const sortedMarketMovers = useMemo(() => {
    return [...marketMovers].map(g => {
      const c = g.card || g;
      const stat = getChartDataFromHistory(c.history, "1M", "Raw");
      return { ...g, computedStat: stat };
    }).sort((a, b) => {
      const valA = (a.computedStat.isUp ? 1 : -1) * parseFloat(a.computedStat.percent);
      const valB = (b.computedStat.isUp ? 1 : -1) * parseFloat(b.computedStat.percent);
      return valB - valA;
    });
  }, [marketMovers]);

  const currentCards = useMemo(() => {
    let cards = activeTab === "explore" ? [...exploreCards] : [...groupedPortfolio];
    if (activeTab === "portfolio") {
      if (sortBy === "Price: High to Low") cards.sort((a, b) => safePrice((b.card || b).price) - safePrice((a.card || a).price));
      else if (sortBy === "Price: Low to High") cards.sort((a, b) => safePrice((a.card || a).price) - safePrice((b.card || b).price));
    }
    return cards;
  }, [activeTab, exploreCards, groupedPortfolio, sortBy]);

  const handleDismissToast = useCallback(() => setToast({ visible: false, message: "", type: "success" }), []);

  const handleDismissConfirm = useCallback(() => setConfirmDialog({ visible: false, coll: null }), []);

  return (
    <div className="min-h-[100dvh] bg-[#0a0a0a] text-white font-sans selection:bg-teal-500/30">
      <AnimatePresence>
        {toast.visible && (
          <div className={`fixed top-4 md:top-8 left-1/2 -translate-x-1/2 z-[999999] px-5 py-2.5 md:px-6 md:py-3 rounded-full flex items-center gap-2.5 shadow-2xl border backdrop-blur-xl font-bold text-sm transition-opacity duration-300 ${toast.type === 'error' ? 'bg-rose-500/10 border-rose-500 text-rose-500' : 'bg-teal-500/10 border-teal-500 text-teal-400'}`}>
            {toast.type === 'error' ? <X size={15} /> : <CheckCircle size={15} />}
            {toast.message}
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirmDialog.visible && (
          <div className="fixed inset-0 z-[999999] flex items-end md:items-center justify-center bg-black/80 backdrop-blur-sm" onMouseDown={handleDismissConfirm}>
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-[#141414] p-6 md:p-8 rounded-t-3xl md:rounded-3xl border border-white/[0.08] shadow-2xl max-w-sm w-full"
              onMouseDown={e => e.stopPropagation()}
            >
              <h3 className="text-lg md:text-xl font-black text-white mb-2">Remove Asset?</h3>
              <p className="text-sm text-slate-400 mb-6 md:mb-8">Remove 1 copy of <span className="text-white font-bold">{confirmDialog.coll?.card?.name || confirmDialog.coll?.name}</span>?</p>
              <div className="flex gap-3 md:gap-4">
                <button className="flex-1 py-3.5 md:py-3 bg-white/5 active:bg-white/10 md:hover:bg-white/10 rounded-xl text-white font-bold transition-colors" onClick={handleDismissConfirm}>Cancel</button>
                <button className="flex-1 py-3.5 md:py-3 bg-rose-500 active:bg-rose-600 md:hover:bg-rose-600 rounded-xl text-white font-bold transition-colors" onClick={executeDelete}>Remove</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <DesktopNavbar onLogout={() => { localStorage.removeItem("token"); navigate("/login") }} onOpenPalette={() => setPaletteOpen(true)} userEmail={getEmailFromToken()} activeTab={activeTab} setActiveTab={setActiveTab} />
      <MobileHeader onLogout={() => { localStorage.removeItem("token"); navigate("/login") }} userEmail={getEmailFromToken()} />
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} onOpenPalette={() => setPaletteOpen(true)} />

      <AnimatePresence>
        {raritySheetOpen && <RarityFilterSheet open={raritySheetOpen} onClose={() => setRaritySheetOpen(false)} rarityFilter={rarityFilter} setRarityFilter={setRarityFilter} />}
      </AnimatePresence>

      <div className="max-w-[1600px] mx-auto flex flex-col lg:flex-row mt-4 md:mt-8 px-4 md:px-8 gap-4 md:gap-8 pb-28 md:pb-20">
        {activeTab !== "portfolio" && <SidebarFilters rarityFilter={rarityFilter} setRarityFilter={setRarityFilter} />}
        <main className="flex-1 min-w-0">
          {activeTab === "explore" && (
            <div className="bg-[#141414] rounded-2xl md:rounded-xl p-4 md:p-6 mb-5 md:mb-8 border border-white/[0.06] shadow-lg">
              <h2 className="text-lg md:text-xl font-bold mb-3 md:mb-4">Explore Popular Cards</h2>
              <div onClick={() => setPaletteOpen(true)} className="flex items-center bg-[#0a0a0a] border border-white/[0.08] rounded-xl md:rounded-md px-4 py-3.5 cursor-pointer active:border-teal-500/50 md:hover:border-teal-500/50 transition-colors">
                <Search size={18} className="text-slate-600 mr-3 shrink-0" />
                <span className="text-slate-500 text-sm flex-1">Search any card...</span>
                <div className="hidden sm:flex px-2 py-1 bg-[#1a1a1a] border border-white/10 rounded text-[10px] font-bold text-slate-500">⌘K</div>
              </div>
            </div>
          )}

          {activeTab === "explore" && sortedMarketMovers.length > 0 && (
            <div className="mb-6 md:mb-10">
              <div className="flex items-center gap-2 text-rose-500 font-bold mb-3 md:mb-4 text-sm md:text-base">
                <Flame size={18} /> Market Movers
              </div>
              <div className="flex md:grid md:grid-cols-4 gap-3 md:gap-4 overflow-x-auto custom-scrollbar pb-2 -mx-4 px-4 md:mx-0 md:px-0 snap-x snap-mandatory">
                {sortedMarketMovers.map((g, idx) => (
                  <div key={`gainer-${idx}`} onClick={() => setSelectedColl(g)} className="bg-gradient-to-tr from-[#161616] to-rose-500/10 border border-white/[0.06] active:border-rose-500/30 md:hover:border-rose-500/30 p-3.5 md:p-4 rounded-2xl cursor-pointer transition-colors flex items-center gap-3 md:gap-4 min-w-[200px] md:min-w-0 snap-start">
                    <img src={(g.card || g).image_url} className="w-10 h-14 md:w-12 md:h-16 object-contain drop-shadow-md" loading="lazy" />
                    <div className="overflow-hidden flex-1 min-w-0">
                      <div className="text-white text-xs font-bold truncate">{(g.card || g).name}</div>
                      <div className="text-[9px] md:text-[10px] text-slate-500 truncate mb-0.5 md:mb-1">{(g.card || g).set_name?.split(" • ")[0]}</div>
                      <div className="text-sm font-black text-rose-400">{g.computedStat.isUp ? '+' : '-'}{g.computedStat.percent}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "portfolio" && stats && (
            <div className="mb-5 md:mb-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 md:gap-6 mb-4 md:mb-6">
                <div className="col-span-2 bg-gradient-to-br from-teal-500/10 to-transparent p-5 md:p-6 rounded-2xl md:rounded-[28px] border border-white/[0.06]">
                  <div className="text-teal-500 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] mb-1.5 md:mb-2">Net Worth</div>
                  <div className="text-3xl md:text-4xl font-black text-emerald-400">${formatMoney(stats.total_portfolio_value)}</div>
                </div>
                <div className="bg-[#141414] p-4 md:p-6 rounded-2xl md:rounded-[20px] border border-white/[0.06] flex flex-col justify-center">
                  <div className="text-slate-500 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] mb-1">Assets</div>
                  <div className="text-xl md:text-2xl font-black text-white">{stats.total_cards}</div>
                </div>
                <div onClick={handleExportCSV} className="bg-teal-500/10 active:bg-teal-500/20 md:hover:bg-teal-500/20 p-4 md:p-6 rounded-2xl md:rounded-[20px] border border-teal-500/20 cursor-pointer transition-colors flex flex-col items-center justify-center text-teal-500">
                  <Download size={20} className="mb-1.5 md:mb-2" />
                  <div className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-center">Export CSV</div>
                </div>
              </div>
              <div className="bg-[#141414] p-4 md:p-6 rounded-2xl md:rounded-[28px] border border-white/[0.06]">
                <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
                  <div className="flex-1 w-full">
                    <div className="text-slate-500 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] mb-3 md:mb-4">Asset Allocation</div>
                    {portfolioDistribution.length > 0 ? (
                      <div className="h-32 md:h-40 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={portfolioDistribution} cx="50%" cy="50%" innerRadius={40} outerRadius={55} paddingAngle={5} dataKey="value" stroke="none">
                              {portfolioDistribution.map((entry, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                            </Pie>
                            <ReTooltip content={<CustomTooltip />} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    ) : <div className="h-32 md:h-40 flex items-center justify-center text-sm font-bold text-slate-600">Not enough data</div>}
                  </div>
                  <div className="flex-1 w-full">
                    <div className="text-slate-500 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] mb-3 md:mb-4">Top Holdings</div>
                    <div className="space-y-2 md:space-y-3">
                      {portfolioDistribution.slice(0, 3).map((item, i) => (
                        <div key={i} className="flex justify-between items-center bg-[#0a0a0a] p-2.5 md:p-3 rounded-xl border border-white/[0.04]">
                          <div className="flex items-center gap-2.5 md:gap-3">
                            <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                            <span className="text-xs md:text-sm font-bold text-white">{item.name}</span>
                          </div>
                          <span className="text-xs md:text-sm font-black text-teal-400">${formatMoney(item.value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "portfolio" && currentCards.length === 0 && !loading ? (
            <div className="flex flex-col items-center justify-center py-16 md:py-20 text-center">
              <div className="w-20 h-20 md:w-24 md:h-24 bg-teal-500/10 text-teal-500 rounded-full flex items-center justify-center mb-5 md:mb-6"><Box size={40} /></div>
              <h2 className="text-xl md:text-2xl font-black text-white mb-2">Your Vault is Empty</h2>
              <p className="text-slate-500 mb-6 md:mb-8 max-w-md text-sm md:text-base px-4">Start building your ultimate Pokémon TCG collection. Go to the Explore tab to find and add your first assets.</p>
              <button onClick={() => setActiveTab("explore")} className="px-8 py-4 bg-teal-500 text-black font-black rounded-xl active:bg-teal-600 md:hover:bg-teal-400 transition-colors shadow-lg shadow-teal-500/20">Explore Cards</button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4 md:mb-6 gap-3">
                <div className="text-slate-500 text-xs md:text-sm font-semibold shrink-0">{currentCards.length} found</div>
                <div className="flex items-center gap-2">
                  {activeTab === "explore" && (
                    <button onClick={() => setRaritySheetOpen(true)} className="lg:hidden p-2.5 rounded-xl bg-[#141414] border border-white/[0.06] text-slate-400 active:bg-white/5 transition-colors">
                      <SlidersHorizontal size={18} />
                    </button>
                  )}
                  <div className="relative">
                    <div onClick={() => setSortOpen(!sortOpen)} className="bg-[#141414] border border-white/[0.06] text-xs md:text-sm text-slate-400 px-3 md:px-6 py-2.5 md:py-3 rounded-xl flex items-center gap-1.5 md:gap-2 cursor-pointer active:bg-white/5 md:hover:bg-white/5 transition-colors font-bold z-20 relative">
                      <span className="hidden md:inline">⇅ Sort:</span> {sortBy} ▾
                    </div>
                    {sortOpen && (
                      <>
                        <div className="fixed inset-0 z-30" onClick={() => setSortOpen(false)} />
                        <div className="absolute top-full right-0 mt-2 w-52 md:w-56 bg-[#141414] border border-white/[0.08] rounded-xl shadow-2xl z-40 py-1.5 overflow-hidden">
                          {(activeTab === "portfolio"
                            ? ["Price: High to Low", "Price: Low to High"]
                            : ["Newest", "Price: High to Low", "Price: Low to High", "Name: A-Z"]
                          ).map(opt => (
                            <div key={opt} onClick={() => { setSortBy(opt); setSortOpen(false); }} className="px-5 md:px-6 py-3 active:bg-white/5 md:hover:bg-white/5 cursor-pointer text-sm text-slate-300 font-bold transition-colors">{opt}</div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
              {loading && explorePage === 1 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 md:gap-6">
                  {Array.from({ length: 12 }).map((_, i) => <div key={i} className="aspect-[3/4] bg-[#141414] rounded-[20px] md:rounded-2xl animate-pulse" />)}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 md:gap-6 lg:gap-8">
                    {currentCards.map(c => {
                      const cardObj = c.card || c; const targetId = cardObj.pokemon_tcg_id || cardObj.id;
                      return (<VaultCard key={c.id || targetId} coll={c} onOpenAnalytics={setSelectedColl} onAdd={handleAdd} onDelete={confirmDelete} isPortfolio={activeTab === "portfolio"} quantity={c.quantity} inPortfolio={ownedIds.has(targetId)} />);
                    })}
                  </div>
                  {activeTab === "explore" && (
                    <div className="mt-8 md:mt-12 flex justify-center pb-4">
                      <button onClick={handleLoadMore} disabled={loadingMore} className="px-6 md:px-8 py-3.5 md:py-4 bg-[#141414] active:bg-white/5 md:hover:bg-white/5 border border-white/[0.08] rounded-full font-black text-teal-500 transition-all flex items-center gap-3">
                        {loadingMore ? <Loader2 className="animate-spin" /> : "Load More"}
                      </button>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </main>
      </div>

      <AnimatePresence>
        {paletteOpen && <SearchPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} onAdd={handleAdd} onOpenAnalytics={setSelectedColl} />}
      </AnimatePresence>

      <AnimatePresence>
        {selectedColl && (
          <AssetAnalyticsModal
            coll={selectedColl}
            onClose={() => setSelectedColl(null)}
            onAdd={handleAdd}
            onDelete={confirmDelete}
            isPortfolio={activeTab === "portfolio" || Boolean(selectedColl?.user_id)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<EliteLoginPage />} />
        <Route path="/dashboard" element={<MainApp />} />
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </BrowserRouter>
  );
}
