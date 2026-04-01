import React, { useEffect, useMemo, useState, useCallback } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import api, { login } from "./api";
import {
  Plus, Search, Loader2, CheckCircle, LogOut, User, Trash2,
  TrendingUp, TrendingDown, ExternalLink, ShoppingBag, X, Box, Download, Flame, AlertCircle, Compass, ChevronDown
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ResponsiveContainer, AreaChart, Area, Tooltip as ReTooltip,
  PieChart, Pie, Cell
} from "recharts";

const styles = `
.custom-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; }
.custom-scrollbar::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.02); }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #14b8a6; border-radius: 10px; }
@media (max-width: 768px) {
  * { -webkit-tap-highlight-color: transparent !important; outline: none !important; }
}
.scrollable-modal { -webkit-overflow-scrolling: touch; overscroll-behavior-y: contain; }
`;

const PIE_COLORS = ['#14b8a6', '#8b5cf6', '#f43f5e', '#f59e0b', '#3b82f6', '#ec4899'];

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
      if (timeframe === "1W" || timeframe === "1M") { label = idx === arrLen - 1 ? "Today" : `${arrLen - 1 - idx}d ago`; } 
      else if (timeframe === "1Y") { label = idx === arrLen - 1 ? "This Mo" : `${arrLen - 1 - idx}mo ago`; }
      let wave = 0;
      if (grade !== "Raw" && idx !== arrLen - 1) { wave = Math.sin(idx * 0.9 + (grade === "PSA 10" ? 2 : 5)) * 0.05; }
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
        setEmail("test_demo@example.com"); setPassword("password123");
    } else if (!isLoginMode) {
        setEmail(""); setPassword(""); setError("");
    }
  }, [isLoginMode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setIsLoading(true);
    try {
      if (isLoginMode) {
        await login(email, password);
        navigate("/dashboard", { replace: true });
      } else {
        if (password.length < 6) throw new Error("Password must be at least 6 characters.");
        const res = await fetch("/users/register", {
            method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password })
        });
        if (!res.ok) { const data = await res.json(); throw new Error(data.detail || "Registration failed"); }
        await login(email, password);
        navigate("/dashboard", { replace: true });
      }
    } catch (err) { setError(err.message || "Authentication failed. Check your credentials."); } 
    finally { setIsLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#111111] text-white flex items-center justify-center overflow-hidden relative p-4">
      <div className="absolute w-96 h-96 bg-teal-600/10 rounded-full blur-3xl -left-20 -top-20" />
      <div className="absolute w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl -right-20 -bottom-20" />
      <div className="bg-[#1a1a1a] border border-white/5 p-8 md:p-10 rounded-[40px] w-full max-w-md z-10 shadow-2xl">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="h-10 w-10 rounded-full bg-teal-500 shadow-[0_0_20px_rgba(20,184,166,0.4)] flex items-center justify-center">
             <Box size={20} className="text-black" />
          </div>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white">COLLECTR</h2>
        </div>
        <div className="text-center mb-8">
            <h3 className="text-xl font-bold text-white">{isLoginMode ? "Welcome Back" : "Create an Account"}</h3>
            <p className="text-sm text-slate-400 mt-2">{isLoginMode ? "Enter your credentials to access your vault." : "Start building your ultimate TCG portfolio today."}</p>
        </div>
        {error && (
            <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-3 text-rose-500 text-sm font-bold">
                <AlertCircle size={18} className="shrink-0 mt-0.5" /><span>{error}</span>
            </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input required type="email" className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-4 text-white outline-none focus:border-teal-500 transition-colors" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address" />
          <input required minLength={isLoginMode ? 1 : 6} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-4 text-white outline-none focus:border-teal-500 transition-colors" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" />
          <button disabled={isLoading} className="w-full py-4 mt-2 rounded-xl font-black bg-teal-500 text-black hover:bg-teal-400 transition-colors flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(20,184,166,0.2)]">
              {isLoading ? <Loader2 size={20} className="animate-spin" /> : (isLoginMode ? "Enter Vault" : "Create Account")}
          </button>
        </form>
        <div className="mt-8 text-center border-t border-white/5 pt-6">
            <p className="text-sm text-slate-400">
                {isLoginMode ? "Don't have an account?" : "Already have an account?"} 
                <button type="button" onClick={() => setIsLoginMode(!isLoginMode)} className="ml-2 text-teal-400 font-bold hover:text-teal-300 transition-colors">
                    {isLoginMode ? "Sign Up" : "Log In"}
                </button>
            </p>
        </div>
      </div>
    </div>
  );
}

function MobileBottomNav({ activeTab, setActiveTab, onOpenPalette }) {
  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#111]/95 backdrop-blur-xl border-t border-white/10 z-[100] px-8 py-3 flex justify-between items-center pb-[calc(env(safe-area-inset-bottom)+12px)]">
      <button onClick={() => setActiveTab("explore")} className={`flex flex-col items-center gap-1 transition-colors ${activeTab === "explore" ? "text-teal-400" : "text-slate-500 hover:text-slate-300"}`}>
        <Compass size={24} className={activeTab === "explore" ? "fill-teal-500/20" : ""} />
        <span className="text-[10px] font-bold tracking-wider">Explore</span>
      </button>
      <button onClick={onOpenPalette} className="flex flex-col items-center gap-1 text-slate-500 hover:text-slate-300 transition-transform active:scale-95">
        <div className="bg-teal-500 text-black p-3 rounded-full shadow-[0_0_15px_rgba(20,184,166,0.4)] -mt-6 border-4 border-[#111]">
          <Search size={20} />
        </div>
        <span className="text-[10px] font-bold tracking-wider mt-1">Search</span>
      </button>
      <button onClick={() => setActiveTab("portfolio")} className={`flex flex-col items-center gap-1 transition-colors ${activeTab === "portfolio" ? "text-teal-400" : "text-slate-500 hover:text-slate-300"}`}>
        <Box size={24} className={activeTab === "portfolio" ? "fill-teal-500/20" : ""} />
        <span className="text-[10px] font-bold tracking-wider">Vault</span>
      </button>
    </div>
  );
}

function Navbar({ onLogout, onOpenPalette, userEmail, activeTab, setActiveTab }) {
  return (
    <header className="sticky top-0 z-40 w-full bg-[#111111] border-b border-white/5">
      <div className="max-w-[1600px] mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab("explore")}>
          <div className="h-6 w-6 rounded-full bg-teal-500" />
          <span className="text-xl font-extrabold tracking-widest text-white">COLLECTR</span>
        </div>
        <nav className="hidden lg:flex items-center gap-8 text-sm font-semibold">
          <button onClick={() => setActiveTab("explore")} className={activeTab === "explore" ? "text-teal-400" : "text-slate-400 hover:text-white transition-colors"}>Explore</button>
          <button onClick={() => setActiveTab("portfolio")} className={activeTab === "portfolio" ? "text-teal-400" : "text-slate-400 hover:text-white transition-colors"}>Portfolio</button>
        </nav>
        <div className="hidden lg:flex items-center gap-4">
          <button onClick={onOpenPalette} className="p-2 text-slate-400 hover:text-white transition-colors"><Search size={20}/></button>
          <div className="bg-[#1a1a1a] px-3 py-1.5 rounded-md border border-white/5 flex items-center gap-2">
            <div className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </div>
            <span className="text-[10px] font-black text-emerald-400 tracking-widest uppercase">Live API</span>
          </div>
          <div className="flex items-center gap-2 text-slate-400 text-sm border-l border-white/10 pl-4 ml-2"><User size={16}/> <span className="max-w-[120px] truncate">{userEmail}</span></div>
          <button onClick={onLogout} className="p-2 text-slate-400 hover:text-white transition-colors" title="Logout"><LogOut size={20}/></button>
        </div>
        <div className="lg:hidden flex items-center gap-4">
            <button onClick={onLogout} className="p-2 text-slate-400 hover:text-white transition-colors"><LogOut size={20}/></button>
        </div>
      </div>
    </header>
  );
}

function SidebarFilters({ rarityFilter, setRarityFilter }) {
  const rarities = [
    { label: "All Rarities", value: "All" }, { label: "Common", value: "Common" },
    { label: "Uncommon", value: "Uncommon" }, { label: "Rare", value: "Rare" },
    { label: "Holo Rare", value: "Holo Rare" }, { label: "Double Rare / V", value: "Double Rare" },
    { label: "Ultra Rare", value: "Ultra Rare" }, { label: "Illustration Rare", value: "Illustration Rare" },
    { label: "Special Illustration", value: "Special Illustration Rare" },
    { label: "Secret / Hyper Rare", value: "Secret Rare" }, { label: "Promo", value: "Promo" }
  ];
  return (
    <div className="hidden lg:block w-64 shrink-0 space-y-8 pr-6 border-r border-white/5">
      <div>
        <h3 className="text-white font-bold mb-4 text-sm uppercase tracking-widest">Database Rarity</h3>
        <div className="space-y-3">
          {rarities.map(r => (
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
  
  const setParts = (card?.set_name || "").split(" • ");
  const setName = setParts[0];
  const rarity = formatRarity(card?.rarity || setParts[1]);

  const [isHovered, setIsHovered] = useState(false);
  const [transformStyle, setTransformStyle] = useState("rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)");
  const [foilPos, setFoilPos] = useState({ x: "50%", y: "50%" });

  const onMouseMove = (e) => {
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
  };

  const onMouseLeave = () => {
    setIsHovered(false);
    setTransformStyle("rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)");
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
      className="relative w-full h-full" style={{ perspective: "1500px" }}
    >
      <div 
        onMouseEnter={() => setIsHovered(true)} onMouseLeave={onMouseLeave} onMouseMove={onMouseMove} onClick={() => onOpenAnalytics(coll)} 
        style={{ transform: transformStyle, transition: isHovered ? "transform 0.1s ease-out" : "transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)", transformStyle: "preserve-3d", willChange: "transform" }}
        className="group bg-[#1a1a1a] rounded-2xl border border-white/5 overflow-hidden cursor-pointer shadow-xl flex flex-col h-full relative z-10"
      >
        <div className="relative p-4 bg-[#222] flex-1 flex items-center justify-center overflow-hidden min-h-[160px] md:min-h-[220px]">
          {card?.image_url && (
            <img src={card.image_url} alt={card?.name} className="w-full max-w-[120px] md:max-w-[180px] object-contain relative z-10 transition-all duration-500 ease-out" style={{ transform: isHovered ? "translateZ(20px)" : "translateZ(0px)", filter: isHovered ? "drop-shadow(0 15px 20px rgba(0,0,0,0.5))" : "drop-shadow(0 8px 12px rgba(0,0,0,0.3))" }} />
          )}
          <div className="absolute inset-0 pointer-events-none z-20 mix-blend-overlay transition-opacity duration-500" style={{ opacity: isHovered ? 0.25 : 0, background: `radial-gradient(circle at ${foilPos.x} ${foilPos.y}, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 60%)` }} />

          {inPortfolio && !isPortfolio && (
            <div className="absolute top-2 left-2 md:top-3 md:left-3 bg-teal-500 text-black text-[9px] md:text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded shadow-lg flex items-center gap-1 z-30 transition-transform duration-500" style={{ transform: isHovered ? "translateZ(10px)" : "translateZ(0)" }}>
              <CheckCircle size={12} /> Owned
            </div>
          )}
          {quantity > 1 && (
            <div className="absolute top-2 right-2 md:top-3 md:right-3 bg-teal-500 text-black font-black text-xs h-6 w-6 md:h-7 md:w-7 rounded-full flex items-center justify-center shadow-2xl border-2 border-black z-30 transition-transform duration-500" style={{ transform: isHovered ? "translateZ(10px)" : "translateZ(0)" }}>
              x{quantity}
            </div>
          )}
        </div>
        
        <div className="p-3 md:p-4 border-t border-white/5 bg-[#1a1a1a] relative z-30 transition-transform duration-500" style={{ transform: isHovered ? "translateZ(8px)" : "translateZ(0)" }}>
          <div className="text-white font-bold truncate text-xs md:text-sm mb-1">{card?.name}</div>
          <div className="text-[8px] md:text-[9px] text-teal-400/80 font-bold uppercase tracking-widest mb-3 truncate">{setName} • {rarity}</div>
          <div className="flex items-center justify-between">
            <div className="flex flex-col overflow-hidden pr-2">
              <div className="text-sm md:text-lg font-black text-white truncate">${formatMoney(displayPrice)}</div>
              {isPortfolio && quantity > 1 && <div className="text-[8px] md:text-[9px] text-slate-500 font-bold">${formatMoney(basePrice)} / ea</div>}
            </div>
            <div className={`flex items-center gap-1 text-[9px] md:text-[10px] font-bold shrink-0 ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isUp ? <TrendingUp size={10}/> : <TrendingDown size={10}/>}
              {isUp ? '+' : '-'}{percent}%
            </div>
          </div>
        </div>

        <div className="flex border-t border-white/5 bg-black/20 relative z-40 transition-transform duration-500" style={{ transform: isHovered ? "translateZ(4px)" : "translateZ(0)" }}>
          {!isPortfolio ? (
            <button onClick={(e) => { e.stopPropagation(); onAdd(card); }} className="flex-1 py-2 md:py-3 flex justify-center text-teal-500 hover:bg-teal-500/10 transition-colors"><Plus size={16}/></button>
          ) : (
            <>
              <button onClick={(e) => { e.stopPropagation(); onAdd(card); }} className="flex-1 py-2 md:py-3 flex justify-center text-teal-500 hover:bg-teal-500/10 transition-colors border-r border-white/5" title="Add another copy"><Plus size={16}/></button>
              <button onClick={(e) => { e.stopPropagation(); onDelete(coll); }} className="flex-1 py-2 md:py-3 flex justify-center text-rose-500 hover:bg-rose-500/10 transition-colors" title="Remove copy"><Trash2 size={16}/></button>
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
    let active = true;
    setLoading(true);
    api.get(`/search?query=${encodeURIComponent(debounced)}&limit=20`)
      .then(r => { if (active) setResults(r.data || []); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [debounced, open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ opacity: 0, scale: 0.95, y: -20 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="w-full max-w-[800px] bg-[#111] border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-auto max-h-[60dvh] md:max-h-[70vh]" onMouseDown={e => e.stopPropagation()}>
        <div className="p-4 border-b border-white/10 flex items-center gap-4 bg-[#1a1a1a]">
          <Search className="text-teal-500" />
          <input autoFocus value={query} onChange={e => setQuery(e.target.value)} placeholder="Search any card..." className="flex-1 bg-transparent text-white text-lg font-bold outline-none placeholder-white/30" />
          <button onClick={onClose} className="p-2 bg-white/5 rounded-full text-slate-400 active:scale-90"><X size={18}/></button>
        </div>
        <div className="overflow-y-auto flex-1 p-4 grid grid-cols-2 md:grid-cols-4 gap-4 scrollable-modal bg-[#111]">
          {loading ? <div className="col-span-full py-20 flex justify-center"><Loader2 className="animate-spin text-teal-500 w-8 h-8"/></div> : 
            results.map((item) => (
              <div key={item.id} onClick={() => { onOpenAnalytics(item); onClose(); }} className="bg-[#1a1a1a] p-3 rounded-2xl border border-white/5 active:scale-95 cursor-pointer text-center transition-all hover:border-teal-500/30">
                {item.image_url && <img src={item.image_url} className="w-full aspect-[3/4] object-contain mb-3 drop-shadow-md" />}
                <div className="text-[10px] text-white font-bold truncate">{item.name}</div>
                <div className="text-[10px] font-black text-teal-400 mt-1">${formatMoney(safePrice(item.price))}</div>
              </div>
            ))}
        </div>
      </motion.div>
    </div>
  );
}

function CustomTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    const dataPoint = payload[0].payload;
    return (
      <div className="bg-[#1a1a1a] border border-white/10 text-white p-3 rounded-xl shadow-2xl z-[9999] relative">
        <div className="text-[10px] text-slate-400 font-bold uppercase mb-1">{dataPoint.name}</div>
        <div className="font-black text-teal-400 text-sm">${formatMoney(Number(dataPoint.value || dataPoint.price))}</div>
      </div>
    );
  }
  return null;
}

// 🔥 ИСПРАВЛЕННАЯ МОДАЛКА АНАЛИТИКИ (Убраны лаги, фикс высоты, явное меню Condition)
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
    <div className="fixed inset-0 z-[110] flex items-end md:items-center justify-center bg-black/80 backdrop-blur-sm px-0 md:px-4" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <button onClick={onClose} className="hidden md:flex fixed top-8 right-8 z-[99999] bg-white/10 hover:bg-white/20 text-white p-4 rounded-full transition-all border border-white/20 shadow-2xl cursor-pointer">
        <X size={28} />
      </button>

      {/* 🔥 Заменили spring анимацию на легкую tween (easeOut), чтобы убрать лаги на смартфонах */}
      <motion.div 
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} 
        transition={{ duration: 0.35, ease: "easeOut" }} style={{ willChange: "transform" }}
        className="w-full max-w-[1200px] bg-[#111] border-t md:border border-white/10 rounded-t-[30px] md:rounded-[40px] p-6 md:p-12 shadow-2xl overflow-y-auto max-h-[85dvh] md:max-h-[90vh] relative pb-[calc(env(safe-area-inset-bottom)+20px)] scrollable-modal" 
        onMouseDown={e => e.stopPropagation()}
      >
        <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-6 md:hidden" onClick={onClose} />

        <div className="flex justify-between items-start mb-6 md:mb-8 pr-4 md:pr-12">
          <div>
            <div className="text-teal-500 font-black text-[10px] md:text-xs mb-1 md:mb-2 uppercase tracking-[0.2em]">{setName} • {rarity}</div>
            <h1 className="text-2xl md:text-5xl font-black text-white pr-4">{card.name}</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="relative bg-[#1a1a1a] rounded-xl p-4 md:p-6 border border-white/5 flex flex-col items-center justify-center overflow-hidden">
            {/* Ограничиваем высоту картинки на мобилках (max-h-[30dvh]), чтобы кнопки всегда влезали */}
            {card.image_url && <img src={card.image_url} className="w-full max-w-[200px] md:max-w-[300px] max-h-[30dvh] md:max-h-[50vh] object-contain rounded-xl shadow-2xl mb-6 relative z-10" />}
            
            <div className="w-full relative z-10 flex flex-col sm:flex-row gap-3">
                {!isPortfolio ? (
                    <button onClick={() => { onAdd(card); onClose(); }} className="w-full py-4 md:py-3 bg-teal-500 text-black font-black md:font-bold rounded-xl hover:bg-teal-400 active:scale-95 transition-transform md:transition-colors shadow-[0_0_20px_rgba(20,184,166,0.3)]">Add to Portfolio</button>
                ) : (
                    <>
                        <button onClick={() => { onAdd(card); }} className="flex-1 py-4 md:py-3 bg-teal-500/20 text-teal-500 font-black md:font-bold rounded-xl active:scale-95 transition-transform md:transition-colors border border-teal-500/20 flex items-center justify-center gap-2">
                            <Plus size={18} /> Add Copy
                        </button>
                        <button onClick={() => { onDelete(coll); onClose(); }} className="flex-1 py-4 md:py-3 bg-rose-500/20 text-rose-500 font-black md:font-bold rounded-xl active:scale-95 transition-transform md:transition-colors border border-rose-500/20 flex items-center justify-center gap-2">
                            <Trash2 size={18} /> Remove
                        </button>
                    </>
                )}
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[#1a1a1a] border border-white/5 rounded-[24px] md:rounded-[30px] p-5 md:p-6 mb-6 shadow-lg">
              <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
                <div className="text-white font-bold flex items-center gap-2"><TrendingUp size={18} className="text-teal-500"/> Market History</div>
                
                <div className="flex flex-col sm:flex-row items-center justify-between w-full md:w-auto gap-4">
                  <div className="flex bg-black rounded-lg p-1 border border-white/10 w-full sm:w-auto">
                    {['1W', '1M', '1Y'].map(t => (
                      <button key={t} onClick={() => setTimeframe(t)} className={`flex-1 sm:flex-none px-3 py-1.5 md:py-1 text-xs uppercase tracking-widest rounded-md font-bold transition-colors ${timeframe === t ? 'bg-[#333] text-white' : 'text-slate-500 hover:text-white'}`}>{t}</button>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex items-end gap-4 mb-4">
                  <div className="text-3xl md:text-4xl font-black text-white">${formatMoney(currentPrice)}</div>
                  <div className={`text-base md:text-lg font-bold mb-1 ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {isUp ? '▲' : '▼'} {percent}%
                  </div>
              </div>

              <div className="h-40 md:h-48 w-full relative -ml-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data} style={{ zIndex: 10 }}>
                    <defs><linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3}/><stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/></linearGradient></defs>
                    <Area type="monotone" dataKey="price" stroke="#14b8a6" strokeWidth={3} fill="url(#colorPrice)" />
                    <ReTooltip content={<CustomTooltip />} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4">
              <div className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-4 text-center flex flex-col justify-center">
                <div className="text-slate-500 text-[9px] font-bold uppercase tracking-widest mb-2">Select Condition</div>
                {/* 🔥 ИСПРАВЛЕНО: Явная стилизация под выпадающее меню */}
                <div className="relative w-full">
                    <select value={grade} onChange={(e) => setGrade(e.target.value)} className="bg-white/5 hover:bg-white/10 transition-colors text-teal-400 text-xs font-black px-3 py-2.5 md:py-2 rounded-xl outline-none border border-white/10 text-left w-full appearance-none cursor-pointer pr-8">
                      <option value="Raw" className="bg-[#111]">Raw</option>
                      <option value="PSA 9" className="bg-[#111]">PSA 9</option>
                      <option value="PSA 10" className="bg-[#111]">PSA 10</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>
              <div onClick={() => window.open(`https://www.tcgplayer.com/search/all/product?q=${encodeURIComponent(card.name)}`, "_blank")} className="bg-teal-500/10 border border-teal-500/20 hover:bg-teal-500/20 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition-colors text-teal-400">
                <ShoppingBag size={20} className="mb-1" />
                <div className="font-bold text-xs">TCGPlayer</div>
              </div>
              <div onClick={() => window.open(`https://www.psacard.com/search#q=${encodeURIComponent(card.name)}`, "_blank")} className="bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition-colors text-rose-400 hidden sm:flex">
                <ExternalLink size={20} className="mb-1" />
                <div className="font-bold text-xs">PSA Grade</div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
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

  const [toast, setToast] = useState({ visible: false, message: "", type: "success" });
  const [confirmDialog, setConfirmDialog] = useState({ visible: false, coll: null });
  
  const [marketMovers, setMarketMovers] = useState([]);

  // 🔥 МАССИВ ДЛЯ МОБИЛЬНЫХ ФИЛЬТРОВ
  const mobileRarities = [ "All", "Common", "Rare", "Holo Rare", "Double Rare", "Ultra Rare", "Illustration Rare", "Special Illustration Rare", "Secret Rare", "Promo" ];

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
    setExplorePage(1); window.scrollTo({top:0, behavior:"smooth"});
  }, [activeTab]);

  const showToast = (message, type = "success") => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast({ visible: false, message: "", type: "success" }), 3000);
  };

  const fetchData = useCallback(async (pageToLoad = 1, append = false, currentRarity = "All", currentSort = "Newest") => {
    if (!append) setLoading(true);
    else setLoadingMore(true);

    try {
      const rarityQuery = currentRarity === "All" ? "" : `&rarity=${encodeURIComponent(currentRarity)}`;
      const sortQuery = `&sort_by=${encodeURIComponent(currentSort)}`;
      
      const [s, c, exp] = await Promise.all([
        api.get("/portfolio/stats"), 
        api.get("/collections/me"),
        api.get(`/search?query=&page=${pageToLoad}&limit=48${rarityQuery}${sortQuery}`) 
      ]);
      setStats(s.data); 
      setPortfolioCards(c.data || []);
      
      const newExplore = (exp.data || []).map(card => ({ id: `exp-${card.id}-${pageToLoad}`, card, condition: "Market" }));
      
      if (append) {
        setExploreCards(prev => {
          const prevIds = new Set(prev.map(p => p.card.id));
          const uniqueNew = newExplore.filter(n => !prevIds.has(n.card.id));
          return [...prev, ...uniqueNew];
        });
      } else {
        setExploreCards(newExplore);
      }

    } catch (error) { 
        if (error.response && error.response.status === 401) {
            localStorage.removeItem("token");
            navigate("/login");
        }
    } finally { 
        setLoading(false); 
        setLoadingMore(false); 
    }
  }, [navigate]);

  useEffect(() => {
      api.get("/market-movers").then(r => setMarketMovers(r.data || [])).catch(e => console.log(e));
  }, []);

  useEffect(() => { 
      setExplorePage(1);
      fetchData(1, false, rarityFilter, sortBy); 
  }, [rarityFilter, sortBy, fetchData]);

  const handleLoadMore = () => {
    const nextPage = explorePage + 1;
    setExplorePage(nextPage);
    fetchData(nextPage, true, rarityFilter, sortBy);
  };

  const handleAdd = async (card) => {
    try {
      const targetId = card.pokemon_tcg_id || card.id;
      const response = await fetch("/collections/add", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem("token")}` },
          body: JSON.stringify({ pokemon_tcg_id: String(targetId), condition: "Mint" })
      });

      if (response.status === 401) {
          localStorage.removeItem("token"); navigate("/login"); return;
      }
      if (!response.ok) throw new Error("Validation Failed");

      await fetchData(1, false, rarityFilter, sortBy); 
      showToast(`${card.name} added to vault!`, "success");
    } catch (err) { showToast("Error adding card.", "error"); }
  };

  const confirmDelete = (coll) => setConfirmDialog({ visible: true, coll });

  const executeDelete = async () => {
    if (!confirmDialog.coll) return;
    const instanceId = confirmDialog.coll.instance_ids ? confirmDialog.coll.instance_ids[0] : confirmDialog.coll.id;
    try {
      await api.delete(`/collections/${instanceId}`);
      await fetchData(1, false, rarityFilter, sortBy);
      setConfirmDialog({ visible: false, coll: null });
      showToast("Card removed.", "success");
    } catch { showToast("Error removing card.", "error"); }
  };

  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Card Name,Set,Rarity,Quantity,Price (ea),Total Value\n";
    
    groupedPortfolio.forEach(item => {
      const c = item.card;
      const price = safePrice(c.price);
      const qty = item.quantity;
      const row = `"${c.name}","${c.set_name}","${formatRarity(c.rarity)}",${qty},$${price.toFixed(2)},$${(price * qty).toFixed(2)}`;
      csvContent += row + "\n";
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Pokemon_Portfolio_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Portfolio exported successfully!", "success");
  };

  const groupedPortfolio = useMemo(() => {
    const map = new Map();
    portfolioCards.forEach(item => {
      const id = item.card.pokemon_tcg_id;
      if (!map.has(id)) map.set(id, { ...item, quantity: item.quantity || 1, instance_ids: [item.id] });
      else {
        const existing = map.get(id);
        existing.quantity += (item.quantity || 1);
        existing.instance_ids.push(item.id);
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

  let currentCards = activeTab === "explore" ? [...exploreCards] : [...groupedPortfolio];

  if (activeTab === "portfolio") {
      if (sortBy === "Price: High to Low") currentCards.sort((a, b) => safePrice((b.card || b).price) - safePrice((a.card || a).price));
      else if (sortBy === "Price: Low to High") currentCards.sort((a, b) => safePrice((a.card || a).price) - safePrice((b.card || b).price));
  }

  return (
    <div className="min-h-screen bg-[#111] text-white font-sans selection:bg-teal-500/30 pb-24 md:pb-0">
      <style>{styles}</style>
      
      <AnimatePresence>
        {toast.visible && (
          <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[999999] px-6 py-3 rounded-full flex items-center gap-3 shadow-2xl border backdrop-blur-md font-bold text-sm transition-opacity duration-300 ${toast.type === 'error' ? 'bg-rose-500/10 border-rose-500 text-rose-500' : 'bg-teal-500/10 border-teal-500 text-teal-400'}`}>
            {toast.type === 'error' ? <X size={16} /> : <CheckCircle size={16} />}
            {toast.message}
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirmDialog.visible && (
          <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4" onMouseDown={() => setConfirmDialog({visible: false, coll: null})}>
            <div className="bg-[#111] p-6 md:p-8 rounded-3xl border border-white/10 shadow-2xl max-w-sm w-full mx-auto" onMouseDown={e => e.stopPropagation()}>
              <h3 className="text-xl font-black text-white mb-2">Remove Asset?</h3>
              <p className="text-sm text-slate-400 mb-8">Remove 1 copy of <span className="text-white font-bold">{confirmDialog.coll?.card?.name || confirmDialog.coll?.name}</span>?</p>
              <div className="flex gap-4">
                <button className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-white font-bold transition-colors" onClick={() => setConfirmDialog({visible: false, coll: null})}>Cancel</button>
                <button className="flex-1 py-3 bg-rose-500 hover:bg-rose-600 rounded-xl text-white font-bold transition-colors" onClick={executeDelete}>Remove</button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      <Navbar onLogout={() => {localStorage.removeItem("token"); navigate("/login")}} onOpenPalette={() => setPaletteOpen(true)} userEmail={getEmailFromToken()} activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <div className="max-w-[1600px] mx-auto flex flex-col lg:flex-row mt-6 md:mt-8 px-4 md:px-8 gap-8 pb-20">
        
        {/* Фильтры для ПК */}
        {activeTab !== "portfolio" && <SidebarFilters rarityFilter={rarityFilter} setRarityFilter={setRarityFilter} />}
        
        <main className="flex-1 min-w-0">
          
          {activeTab === "explore" && (
              <div className="bg-[#1a1a1a] rounded-xl p-4 md:p-6 mb-6 md:mb-8 border border-white/5 shadow-lg hidden md:block">
                <h2 className="text-xl font-bold mb-4">Explore Popular Cards</h2>
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 flex items-center justify-between bg-[#111] border border-white/10 rounded-md px-4 py-3 cursor-pointer hover:border-teal-500/50 transition-colors" onClick={() => setPaletteOpen(true)}>
                      <div className="flex items-center">
                        <Search size={18} className="text-slate-400 mr-3" />
                        <span className="text-slate-400 text-sm">Search any card...</span>
                      </div>
                      <div className="hidden sm:flex px-2 py-1 bg-[#222] border border-white/10 rounded text-[10px] font-bold text-slate-400">Ctrl + K</div>
                    </div>
                    <button onClick={() => setPaletteOpen(true)} className="bg-teal-500 text-black px-6 py-3 rounded-md font-bold hover:bg-teal-400 transition-colors">Search</button>
                </div>
              </div>
          )}

          {/* 🔥 ИСПРАВЛЕНО: Свайпаемые фильтры для мобильных (появляются только на телефоне) */}
          {activeTab === "explore" && (
            <div className="lg:hidden flex overflow-x-auto gap-2 pb-4 -mx-4 px-4 snap-x custom-scrollbar mb-2 mt-2">
              {mobileRarities.map(r => (
                <button key={r} onClick={() => setRarityFilter(r)} className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold border transition-colors ${rarityFilter === r ? 'bg-teal-500 border-teal-500 text-black' : 'bg-[#1a1a1a] border-white/5 text-slate-400'}`}>
                  {r}
                </button>
              ))}
            </div>
          )}

          {activeTab === "explore" && marketMovers.length > 0 && (
              <div className="mb-8 md:mb-10 animate-in fade-in duration-500">
                  <div className="flex items-center gap-2 text-rose-500 font-bold mb-4">
                      <Flame size={20} /> Hot Market
                  </div>
                  {/* Горизонтальный скролл на мобилках, сетка на ПК */}
                  <div className="flex overflow-x-auto md:grid md:grid-cols-4 gap-4 pb-4 md:pb-0 snap-x custom-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
                      {[...marketMovers]
                          .map(g => {
                              const c = g.card || g;
                              const stat = getChartDataFromHistory(c.history, "1M", "Raw");
                              return { ...g, computedStat: stat };
                          })
                          .sort((a, b) => {
                              const valA = (a.computedStat.isUp ? 1 : -1) * parseFloat(a.computedStat.percent);
                              const valB = (b.computedStat.isUp ? 1 : -1) * parseFloat(b.computedStat.percent);
                              return valB - valA;
                          })
                          .map((g, idx) => (
                              <div key={`gainer-${idx}`} onClick={() => setSelectedColl(g)} className="min-w-[240px] md:min-w-0 snap-center shrink-0 bg-gradient-to-tr from-[#1a1a1a] to-rose-500/10 border border-white/5 hover:border-rose-500/30 p-4 rounded-2xl cursor-pointer transition-colors flex items-center gap-4">
                                  <img src={(g.card || g).image_url} className="w-12 h-16 object-contain drop-shadow-md" />
                                  <div className="overflow-hidden w-full">
                                      <div className="text-white text-xs font-bold truncate">{(g.card || g).name}</div>
                                      <div className="text-[10px] text-slate-400 truncate mb-1">{(g.card || g).set_name?.split(" • ")[0]}</div>
                                      <div className="text-sm font-black text-rose-400">{g.computedStat.isUp ? '+' : '-'}{g.computedStat.percent}%</div>
                                  </div>
                              </div>
                          ))
                      }
                  </div>
              </div>
          )}

          {/* 🔥 ИСПРАВЛЕНО: Вернул оригинальное портфолио с графиками (Pie Chart) и Топ холдингами */}
          {activeTab === "portfolio" && stats && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8 animate-in fade-in duration-500">
              <div className="lg:col-span-1 flex flex-col gap-6">
                  <div className="bg-gradient-to-br from-teal-500/10 to-transparent p-6 rounded-[30px] border border-white/5 shadow-2xl flex-1 flex flex-col justify-center">
                    <div className="text-teal-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Net Worth</div>
                    <div className="text-4xl md:text-5xl font-black text-emerald-400 truncate">${formatMoney(stats.total_portfolio_value)}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 flex-1">
                      <div className="bg-[#1a1a1a] p-6 rounded-[20px] border border-white/5 flex flex-col justify-center">
                        <div className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Assets</div>
                        <div className="text-2xl font-black text-white">{stats.total_cards}</div>
                      </div>
                      <div onClick={handleExportCSV} className="bg-teal-500/10 hover:bg-teal-500/20 p-6 rounded-[20px] border border-teal-500/20 cursor-pointer transition-colors flex flex-col items-center justify-center text-teal-500 group">
                        <Download size={24} className="mb-2 group-hover:-translate-y-1 transition-transform" />
                        <div className="text-[10px] font-black uppercase tracking-widest text-center">Export<br/>CSV</div>
                      </div>
                  </div>
              </div>

              <div className="lg:col-span-3 bg-[#1a1a1a] p-6 rounded-[30px] border border-white/5 flex flex-col md:flex-row items-center gap-8">
                  <div className="flex-1 w-full relative">
                      <div className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-4">Asset Allocation (By Rarity)</div>
                      {portfolioDistribution.length > 0 ? (
                          <div className="h-40 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie data={portfolioDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value" stroke="none">
                                  {portfolioDistribution.map((entry, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                                </Pie>
                                <ReTooltip content={<CustomTooltip />} />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                      ) : (
                          <div className="h-40 flex items-center justify-center text-sm font-bold text-slate-500">Not enough data</div>
                      )}
                  </div>
                  <div className="flex-1 w-full">
                       <div className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-4">Top Holdings</div>
                       <div className="space-y-3">
                           {portfolioDistribution.slice(0, 3).map((item, i) => (
                               <div key={i} className="flex justify-between items-center bg-[#111] p-3 rounded-xl border border-white/5">
                                   <div className="flex items-center gap-3 overflow-hidden">
                                       <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                                       <span className="text-sm font-bold text-white truncate max-w-[150px] md:max-w-[200px]">{item.name}</span>
                                   </div>
                                   <span className="text-sm font-black text-teal-400 pl-2">${formatMoney(item.value)}</span>
                               </div>
                           ))}
                       </div>
                  </div>
              </div>
            </div>
          )}

          {/* 🔥 ИСПРАВЛЕНО: Меню сортировки теперь выровнено справа, не дергается и не обрезается экраном */}
          {(!loading || currentCards.length > 0) && (
            <div className="flex justify-between items-center mb-6 z-30 relative">
              <div className="text-slate-500 text-xs font-black uppercase tracking-widest">{currentCards.length} Cards</div>
              <div className="relative">
                <button onClick={() => setSortOpen(!sortOpen)} className="bg-[#1a1a1a] border border-white/5 text-xs text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 active:scale-95 transition-transform">
                    {sortBy} <ChevronDown size={14} className="text-slate-400"/>
                </button>
                <AnimatePresence>
                  {sortOpen && (
                    <motion.div initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} exit={{opacity:0, scale:0.95}} className="absolute top-full right-0 mt-2 w-[200px] origin-top-right bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl py-2 overflow-hidden z-[100]">
                      {(activeTab === "portfolio" ? ["Price: High to Low", "Price: Low to High"] : ["Newest", "Price: High to Low", "Price: Low to High", "Name: A-Z"]).map(opt => (
                        <div key={opt} onClick={() => { setSortBy(opt); setSortOpen(false); }} className={`px-4 py-3 text-xs font-bold hover:bg-white/5 cursor-pointer ${sortBy === opt ? 'text-teal-400' : 'text-slate-300'}`}>{opt}</div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}

          {loading && explorePage === 1 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 md:gap-6">
              {Array.from({length:12}).map((_, i) => <div key={i} className="aspect-[3/4.5] bg-[#1a1a1a] rounded-2xl animate-pulse" />)}
            </div>
          ) : currentCards.length === 0 && activeTab === "portfolio" ? (
             <div className="py-20 text-center flex flex-col items-center">
                 <div className="w-20 h-20 bg-teal-500/10 text-teal-500 rounded-full flex items-center justify-center mb-6"><Box size={32} /></div>
                 <h2 className="text-xl font-black text-white mb-2">Vault is Empty</h2>
                 <p className="text-slate-500 text-sm mb-6">Find and add assets from Explore.</p>
                 <button onClick={() => setActiveTab("explore")} className="px-6 py-3 bg-teal-500 text-black font-black text-sm rounded-xl active:scale-95">Explore Cards</button>
             </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 md:gap-8 animate-in fade-in duration-500">
                {currentCards.map(c => <VaultCard key={c.id || (c.card||c).pokemon_tcg_id} coll={c} onOpenAnalytics={setSelectedColl} onAdd={handleAdd} onDelete={confirmDelete} isPortfolio={activeTab === "portfolio"} quantity={c.quantity} inPortfolio={ownedIds.has((c.card||c).pokemon_tcg_id)} />)}
              </div>
              
              {activeTab === "explore" && (
                <div className="mt-10 flex justify-center">
                  <button onClick={handleLoadMore} disabled={loadingMore} className="px-8 py-4 bg-[#1a1a1a] hover:bg-white/5 active:bg-white/10 border border-white/10 rounded-full font-black text-sm text-teal-500 transition-transform active:scale-95 flex items-center gap-2">
                    {loadingMore ? <Loader2 className="animate-spin" size={18}/> : "Load More Cards"}
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      <MobileBottomNav activeTab={activeTab} setActiveTab={setActiveTab} onOpenPalette={() => setPaletteOpen(true)} />
      <SearchPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} onAdd={handleAdd} onOpenAnalytics={setSelectedColl} />
      
      <AnimatePresence>
        {selectedColl && <AssetAnalyticsModal coll={selectedColl} onClose={() => setSelectedColl(null)} onAdd={handleAdd} onDelete={confirmDelete} isPortfolio={activeTab === "portfolio" || Boolean(selectedColl?.user_id)} />}
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