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

// 🔥 ИСПРАВЛЕНО: Убраны синие рамки фокуса, настроен скролл для iOS
const styles = `
  * { -webkit-tap-highlight-color: transparent !important; outline: none !important; }
  ::-webkit-scrollbar { display: none; }
  body { 
    overscroll-behavior-y: none; 
    background-color: #050505; 
    color: #ffffff;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  }
  .glass-panel {
    background: rgba(20, 20, 20, 0.6);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.05);
  }
  .recharts-wrapper { outline: none !important; }
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
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });
        if (!res.ok) { const data = await res.json(); throw new Error(data.detail || "Registration failed"); }
        await login(email, password);
        navigate("/dashboard", { replace: true });
      }
    } catch (err) { setError(err.message || "Authentication failed. Check credentials."); } 
    finally { setIsLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center overflow-hidden relative px-4">
      <div className="absolute w-[500px] h-[500px] bg-teal-600/20 rounded-full blur-[100px] -left-32 -top-32" />
      
      <div className="glass-panel p-8 md:p-12 rounded-[40px] w-full max-w-md z-10 shadow-2xl relative">
        <div className="flex items-center gap-3 mb-10 justify-center">
          <div className="h-12 w-12 rounded-2xl bg-teal-500 shadow-[0_0_30px_rgba(20,184,166,0.4)] flex items-center justify-center">
             <Box size={24} className="text-black" />
          </div>
          <h2 className="text-4xl font-black tracking-tighter text-white">COLLECTR</h2>
        </div>

        {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-start gap-3 text-rose-500 text-sm font-bold">
                <AlertCircle size={18} className="shrink-0 mt-0.5" /><span>{error}</span>
            </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input required type="email" className="w-full bg-black/50 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-white/30 outline-none focus:border-teal-500 transition-colors text-lg" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address" />
          <input required minLength={isLoginMode ? 1 : 6} className="w-full bg-black/50 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-white/30 outline-none focus:border-teal-500 transition-colors text-lg" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" />
          
          <button disabled={isLoading} className="w-full py-4 mt-4 rounded-2xl font-black text-lg bg-teal-500 text-black hover:bg-teal-400 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(20,184,166,0.2)]">
              {isLoading ? <Loader2 size={24} className="animate-spin" /> : (isLoginMode ? "Enter Vault" : "Create Account")}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-white/5 pt-6">
            <button type="button" onClick={() => setIsLoginMode(!isLoginMode)} className="text-sm text-slate-400 font-bold hover:text-white transition-colors">
                {isLoginMode ? "Need an account? Sign Up" : "Already have an account? Log In"}
            </button>
        </div>
      </div>
    </div>
  );
}

function MobileBottomNav({ activeTab, setActiveTab, onOpenPalette }) {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#050505]/90 backdrop-blur-xl border-t border-white/10 z-[40] px-8 py-2 flex justify-between items-center pb-[calc(env(safe-area-inset-bottom)+8px)]">
      <button onClick={() => setActiveTab("explore")} className={`flex flex-col items-center gap-1.5 transition-colors p-2 ${activeTab === "explore" ? "text-teal-400" : "text-white/40 hover:text-white"}`}>
        <Compass size={24} className={activeTab === "explore" ? "fill-teal-500/20" : ""} />
        <span className="text-[10px] font-bold tracking-wider">Explore</span>
      </button>

      <button onClick={onOpenPalette} className="relative -top-6 flex flex-col items-center gap-1 group active:scale-95 transition-transform">
        <div className="bg-teal-500 text-black p-4 rounded-full shadow-[0_8px_20px_rgba(20,184,166,0.4)] border-4 border-[#050505]">
          <Search size={22} strokeWidth={3} />
        </div>
      </button>

      <button onClick={() => setActiveTab("portfolio")} className={`flex flex-col items-center gap-1.5 transition-colors p-2 ${activeTab === "portfolio" ? "text-teal-400" : "text-white/40 hover:text-white"}`}>
        <Box size={24} className={activeTab === "portfolio" ? "fill-teal-500/20" : ""} />
        <span className="text-[10px] font-bold tracking-wider">Vault</span>
      </button>
    </div>
  );
}

function Navbar({ onLogout, onOpenPalette, userEmail, activeTab, setActiveTab }) {
  return (
    <header className="fixed top-0 z-[40] w-full glass-panel border-b border-white/5 pt-[env(safe-area-inset-top)]">
      <div className="max-w-[1600px] mx-auto px-4 md:px-8 h-14 md:h-16 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab("explore")}>
          <div className="h-7 w-7 rounded-xl bg-teal-500 shadow-[0_0_15px_rgba(20,184,166,0.4)] flex items-center justify-center">
              <Box size={14} className="text-black" />
          </div>
          <span className="text-xl font-black tracking-tighter text-white">COLLECTR</span>
        </div>
        
        <nav className="hidden md:flex items-center gap-8 text-sm font-bold bg-black/40 px-6 py-2 rounded-full border border-white/5">
          <button onClick={() => setActiveTab("explore")} className={activeTab === "explore" ? "text-teal-400" : "text-slate-400 hover:text-white transition-colors"}>Explore</button>
          <button onClick={() => setActiveTab("portfolio")} className={activeTab === "portfolio" ? "text-teal-400" : "text-slate-400 hover:text-white transition-colors"}>Portfolio</button>
        </nav>

        <div className="flex items-center gap-4">
          <button onClick={onOpenPalette} className="hidden md:block p-2 text-slate-400 hover:text-white transition-colors bg-white/5 rounded-full"><Search size={18}/></button>
          <div className="hidden sm:flex items-center gap-2 text-slate-400 text-xs font-bold pl-2"><User size={14}/> {userEmail?.split('@')[0]}</div>
          <button onClick={onLogout} className="p-2 text-rose-500/80 hover:text-rose-500 bg-rose-500/10 rounded-full transition-colors active:scale-95"><LogOut size={16}/></button>
        </div>
      </div>
    </header>
  );
}

function SidebarFilters({ rarityFilter, setRarityFilter }) {
  const rarities = [
    { label: "All Rarities", value: "All" }, { label: "Common", value: "Common" },
    { label: "Rare", value: "Rare" }, { label: "Holo Rare", value: "Holo Rare" },
    { label: "Double Rare / V", value: "Double Rare" }, { label: "Ultra Rare", value: "Ultra Rare" },
    { label: "Illustration", value: "Illustration Rare" }, { label: "Special Illus.", value: "Special Illustration Rare" },
    { label: "Secret / Hyper", value: "Secret Rare" }, { label: "Promo", value: "Promo" }
  ];
  return (
    <div className="hidden lg:block w-64 shrink-0 space-y-6 pr-6 border-r border-white/5 sticky top-28 h-fit">
      <h3 className="text-white font-black text-xs uppercase tracking-[0.2em]">Database Filter</h3>
      <div className="space-y-1">
        {rarities.map(r => (
          <button key={r.value} onClick={() => setRarityFilter(r.value)} className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all ${rarityFilter === r.value ? 'bg-teal-500 text-black shadow-[0_0_15px_rgba(20,184,166,0.3)]' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
            {r.label}
          </button>
        ))}
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

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="group relative w-full h-full cursor-pointer active:scale-[0.97] transition-transform" onClick={() => onOpenAnalytics(coll)}>
      <div className="bg-[#0f0f0f] rounded-2xl md:rounded-[24px] border border-white/5 overflow-hidden flex flex-col h-full shadow-lg relative z-10">
        <div className="relative p-3 md:p-6 flex-1 flex items-center justify-center overflow-hidden bg-gradient-to-b from-white/5 to-transparent min-h-[160px] md:min-h-[220px]">
          {card?.image_url && (
            <img src={card.image_url} alt={card?.name} className="w-full max-w-[140px] md:max-w-[180px] object-contain drop-shadow-2xl transition-transform duration-500 group-hover:scale-105" />
          )}
          {inPortfolio && !isPortfolio && (
            <div className="absolute top-2 md:top-3 left-2 md:left-3 bg-teal-500/20 backdrop-blur-md border border-teal-500/30 text-teal-400 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md flex items-center gap-1">
              <CheckCircle size={10} /> Owned
            </div>
          )}
          {quantity > 1 && (
            <div className="absolute top-2 md:top-3 right-2 md:right-3 bg-teal-500 text-black font-black text-xs md:text-sm h-6 w-6 md:h-8 md:w-8 rounded-full flex items-center justify-center shadow-lg">
              {quantity}
            </div>
          )}
        </div>
        
        <div className="p-3 md:p-4 border-t border-white/5 bg-[#0a0a0a]">
          <div className="text-white font-bold truncate text-xs md:text-sm mb-0.5">{card?.name}</div>
          <div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-3 truncate">{setName}</div>
          
          <div className="flex items-end justify-between">
            <div className="overflow-hidden pr-2">
              <div className="text-sm md:text-lg font-black text-white leading-none truncate">${formatMoney(displayPrice)}</div>
              {isPortfolio && quantity > 1 && <div className="text-[9px] text-slate-500 font-bold mt-1">${formatMoney(basePrice)} ea</div>}
            </div>
            <div className={`flex items-center gap-0.5 text-[10px] md:text-xs font-black bg-white/5 px-1.5 py-1 rounded-md shrink-0 ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isUp ? <TrendingUp size={10}/> : <TrendingDown size={10}/>} {percent}%
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// 🔥 ИСПРАВЛЕНО: Удален плюс на мобилках, открытие по первому клику, центрировано, оставляет место для тапа снаружи
function SearchPalette({ open, onClose, onAdd, onOpenAnalytics }) {
  const [query, setQuery] = useState("");
  const debounced = useDebounce(query, 600);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    let active = true; setLoading(true);
    api.get(`/search?query=${encodeURIComponent(debounced)}&limit=20`)
      .then(r => { if (active) setResults(r.data || []); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [debounced, open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xl" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ opacity: 0, scale: 0.95, y: -20 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="w-full max-w-[800px] glass-panel rounded-3xl overflow-hidden shadow-2xl flex flex-col h-auto max-h-[60dvh] md:max-h-[70vh]" onMouseDown={e => e.stopPropagation()}>
        <div className="p-4 border-b border-white/10 flex items-center gap-4 bg-black/40">
          <Search className="text-teal-500" />
          <input autoFocus value={query} onChange={e => setQuery(e.target.value)} placeholder="Search any card..." className="flex-1 bg-transparent text-white text-lg font-bold outline-none placeholder-white/30" />
          <button onClick={onClose} className="p-2 bg-white/5 rounded-full text-slate-400 active:scale-90"><X size={18}/></button>
        </div>
        <div className="overflow-y-auto flex-1 p-4 grid grid-cols-2 md:grid-cols-4 gap-4 pb-[calc(env(safe-area-inset-bottom)+20px)] scrollable-modal">
          {loading ? <div className="col-span-full py-20 flex justify-center"><Loader2 className="animate-spin text-teal-500 w-8 h-8"/></div> : 
            results.map((item) => (
              <div key={item.id} onClick={() => { onOpenAnalytics(item); onClose(); }} className="bg-black/40 p-3 rounded-2xl border border-white/5 active:scale-95 cursor-pointer text-center transition-all">
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
      <div className="glass-panel text-white p-3 rounded-xl shadow-2xl">
        <div className="text-[10px] text-slate-400 font-bold uppercase mb-1">{dataPoint.name}</div>
        <div className="font-black text-teal-400 text-sm">${formatMoney(Number(dataPoint.value || dataPoint.price))}</div>
      </div>
    );
  }
  return null;
}

// 🔥 ИСПРАВЛЕНО: Скролл починен через dvh, картинка больше не выдавливает кнопки вниз
function AssetAnalyticsModal({ coll, onClose, onAdd, onDelete, isPortfolio }) {
  const card = coll.card || coll;
  const basePrice = safePrice(card.price);
  const [timeframe, setTimeframe] = useState("1M");
  const [grade, setGrade] = useState("Raw");
  const gradeMultiplier = grade === "PSA 10" ? 4.2 : grade === "PSA 9" ? 1.8 : 1.0;
  const { data, percent, isUp } = useMemo(() => getChartDataFromHistory(card?.history, timeframe, grade), [card?.history, timeframe, grade]);
  const currentPrice = basePrice * gradeMultiplier;
  const setParts = (card?.set_name || "").split(" • ");

  return (
    <div className="fixed inset-0 z-[110] flex items-end md:items-center justify-center bg-black/80 backdrop-blur-sm" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      
      <motion.div 
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="w-full max-w-[1000px] bg-[#0a0a0a] rounded-t-[40px] md:rounded-[40px] border-t md:border border-white/10 p-5 md:p-10 shadow-2xl overflow-y-auto max-h-[85dvh] md:max-h-[85vh] relative pb-[calc(env(safe-area-inset-bottom)+40px)] scrollable-modal" 
        onMouseDown={e => e.stopPropagation()}
      >
        <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-6 md:hidden" onClick={onClose} />
        
        <button onClick={onClose} className="hidden md:flex absolute top-6 right-6 bg-white/5 hover:bg-white/10 text-white p-3 rounded-full transition-all active:scale-90">
          <X size={20} />
        </button>

        <div className="mb-6 md:mb-8">
          <div className="text-teal-500 font-black text-[10px] mb-2 uppercase tracking-[0.2em]">{setParts[0]} • {formatRarity(card?.rarity || setParts[1])}</div>
          <h1 className="text-2xl md:text-4xl font-black text-white leading-tight pr-8">{card.name}</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2 flex flex-col items-center">
            {card.image_url && <img src={card.image_url} className="w-full max-w-[200px] md:max-w-[300px] max-h-[30dvh] md:max-h-none object-contain drop-shadow-2xl mb-6" />}
            
            <div className="w-full bg-white/5 p-2 rounded-2xl flex flex-col sm:flex-row gap-2 shrink-0">
              {!isPortfolio ? (
                  <button onClick={() => { onAdd(card); onClose(); }} className="w-full py-4 bg-teal-500 text-black font-black text-sm rounded-xl active:scale-95 transition-transform flex justify-center items-center gap-2">
                    <Plus size={18}/> Add to Vault
                  </button>
              ) : (
                  <>
                      <button onClick={() => { onAdd(card); }} className="flex-1 py-4 bg-white/10 text-white font-black text-sm rounded-xl active:scale-95 transition-transform flex justify-center items-center gap-2">
                          <Plus size={16} /> Add Copy
                      </button>
                      <button onClick={() => { onDelete(coll); onClose(); }} className="flex-1 py-4 bg-rose-500/20 text-rose-500 font-black text-sm rounded-xl active:scale-95 transition-transform flex justify-center items-center gap-2">
                          <Trash2 size={16} /> Remove
                      </button>
                  </>
              )}
            </div>
          </div>

          <div className="lg:col-span-3 space-y-4 shrink-0">
            <div className="bg-[#141414] border border-white/5 rounded-[24px] p-5 md:p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Market Value</div>
                  <div className="flex items-end gap-3">
                    <div className="text-3xl font-black text-white">${formatMoney(currentPrice)}</div>
                    <div className={`text-sm font-black mb-1 ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>{isUp ? '▲' : '▼'} {percent}%</div>
                  </div>
                </div>
                
                <div className="flex bg-black/50 rounded-xl p-1 border border-white/5 w-full sm:w-auto">
                  {['1W', '1M', '1Y'].map(t => (
                    <button key={t} onClick={() => setTimeframe(t)} className={`flex-1 sm:flex-none px-4 py-1.5 text-xs rounded-lg font-bold transition-all ${timeframe === t ? 'bg-white/10 text-white' : 'text-slate-500'}`}>{t}</button>
                  ))}
                </div>
              </div>

              <div className="h-40 w-full relative -ml-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data}>
                    <defs><linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={isUp ? "#10b981" : "#f43f5e"} stopOpacity={0.4}/><stop offset="95%" stopColor={isUp ? "#10b981" : "#f43f5e"} stopOpacity={0}/></linearGradient></defs>
                    <Area type="monotone" dataKey="price" stroke={isUp ? "#10b981" : "#f43f5e"} strokeWidth={3} fill="url(#colorPrice)" />
                    <ReTooltip content={<CustomTooltip />} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-[#141414] border border-white/5 rounded-2xl p-3 flex flex-col justify-center items-center">
                <div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-2">Condition</div>
                <select value={grade} onChange={(e) => setGrade(e.target.value)} className="bg-black/50 text-teal-400 text-xs font-black px-2 py-1.5 rounded-lg outline-none border border-white/10 text-center w-full appearance-none">
                  <option value="Raw">Raw</option><option value="PSA 9">PSA 9</option><option value="PSA 10">PSA 10</option>
                </select>
              </div>
              <div onClick={() => window.open(`https://www.tcgplayer.com/search/all/product?q=${encodeURIComponent(card.name)}`, "_blank")} className="bg-white/5 active:bg-white/10 rounded-2xl p-3 flex flex-col items-center justify-center cursor-pointer transition-colors text-white">
                <ShoppingBag size={16} className="mb-1" />
                <div className="font-bold text-[10px]">TCGPlayer</div>
              </div>
              <div onClick={() => window.open(`https://www.psacard.com/search#q=${encodeURIComponent(card.name)}`, "_blank")} className="bg-white/5 active:bg-white/10 rounded-2xl p-3 flex flex-col items-center justify-center cursor-pointer transition-colors text-white">
                <ExternalLink size={16} className="mb-1" />
                <div className="font-bold text-[10px]">PSA Grade</div>
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

  useEffect(() => {
    const handleKeyDown = (e) => { if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setPaletteOpen(true); } };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (activeTab === "portfolio") setSortBy("Price: High to Low");
    else if (activeTab === "explore") setSortBy("Newest");
    setExplorePage(1); window.scrollTo({ top: 0, behavior: "smooth" });
  }, [activeTab]);

  const showToast = (message, type = "success") => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast({ visible: false, message: "", type: "success" }), 3000);
  };

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

  useEffect(() => { api.get("/market-movers").then(r => setMarketMovers(r.data || [])).catch(e => console.log(e)); }, []);
  useEffect(() => { setExplorePage(1); fetchData(1, false, rarityFilter, sortBy); }, [rarityFilter, sortBy, fetchData]);

  const handleLoadMore = () => { const nextPage = explorePage + 1; setExplorePage(nextPage); fetchData(nextPage, true, rarityFilter, sortBy); };

  const handleAdd = async (card) => {
    try {
      const response = await fetch("/collections/add", {
          method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem("token")}` },
          body: JSON.stringify({ pokemon_tcg_id: String(card.pokemon_tcg_id || card.id), condition: "Mint" })
      });
      if (response.status === 401) { localStorage.removeItem("token"); navigate("/login"); return; }
      if (!response.ok) throw new Error("Validation Failed");
      await fetchData(1, false, rarityFilter, sortBy); showToast(`Added to vault!`, "success");
    } catch (err) { showToast("Error adding card.", "error"); }
  };

  const confirmDelete = (coll) => setConfirmDialog({ visible: true, coll });
  const executeDelete = async () => {
    if (!confirmDialog.coll) return;
    try {
      await api.delete(`/collections/${confirmDialog.coll.instance_ids ? confirmDialog.coll.instance_ids[0] : confirmDialog.coll.id}`);
      await fetchData(1, false, rarityFilter, sortBy); setConfirmDialog({ visible: false, coll: null }); showToast("Card removed.", "success");
    } catch { showToast("Error removing card.", "error"); }
  };

  const groupedPortfolio = useMemo(() => {
    const map = new Map();
    portfolioCards.forEach(item => {
      const id = item.card.pokemon_tcg_id;
      if (!map.has(id)) map.set(id, { ...item, quantity: item.quantity || 1, instance_ids: [item.id] });
      else { const ext = map.get(id); ext.quantity += (item.quantity || 1); ext.instance_ids.push(item.id); }
    });
    return Array.from(map.values());
  }, [portfolioCards]);

  const ownedIds = useMemo(() => new Set(portfolioCards.map(c => c.card?.pokemon_tcg_id)), [portfolioCards]);
  let currentCards = activeTab === "explore" ? [...exploreCards] : [...groupedPortfolio];
  if (activeTab === "portfolio") {
      if (sortBy === "Price: High to Low") currentCards.sort((a, b) => safePrice((b.card || b).price) - safePrice((a.card || a).price));
      else if (sortBy === "Price: Low to High") currentCards.sort((a, b) => safePrice((a.card || a).price) - safePrice((b.card || b).price));
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-teal-500/30">
      <style>{styles}</style>
      
      <AnimatePresence>
        {toast.visible && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className={`fixed top-[env(safe-area-inset-top,20px)] mt-16 left-1/2 -translate-x-1/2 z-[999999] px-6 py-3 rounded-full flex items-center gap-3 shadow-2xl glass-panel font-bold text-sm ${toast.type === 'error' ? 'text-rose-400' : 'text-teal-400'}`}>
            {toast.type === 'error' ? <X size={16} /> : <CheckCircle size={16} />} {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      <Navbar onLogout={() => {localStorage.removeItem("token"); navigate("/login")}} onOpenPalette={() => setPaletteOpen(true)} userEmail={getEmailFromToken()} activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <div className="max-w-[1600px] mx-auto flex flex-col lg:flex-row pt-20 md:pt-28 px-4 md:px-8 gap-8 pb-32 md:pb-10">
        
        {activeTab !== "portfolio" && <SidebarFilters rarityFilter={rarityFilter} setRarityFilter={setRarityFilter} />}
        
        <main className="flex-1 w-full max-w-full overflow-hidden">
          
          {activeTab === "explore" && marketMovers.length > 0 && (
              <div className="mb-8">
                  <div className="flex items-center gap-2 text-rose-500 font-black text-xs uppercase tracking-widest mb-4"><Flame size={16} /> Hot Market</div>
                  <div className="flex overflow-x-auto gap-4 pb-4 -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-4 snap-x">
                      {[...marketMovers].map((g, idx) => {
                          const stat = getChartDataFromHistory((g.card || g).history, "1M", "Raw");
                          return (
                              <div key={`gainer-${idx}`} onClick={() => setSelectedColl(g)} className="min-w-[200px] md:min-w-0 bg-[#0f0f0f] border border-white/5 active:scale-95 p-4 rounded-2xl cursor-pointer transition-transform flex flex-col gap-3 snap-center shadow-lg">
                                  <div className="flex justify-between items-start">
                                      <div className="bg-rose-500/10 text-rose-500 text-[10px] font-black px-2 py-1 rounded-md">+{stat.percent}%</div>
                                      <img src={(g.card || g).image_url} className="w-10 h-14 object-contain drop-shadow-md" />
                                  </div>
                                  <div>
                                      <div className="text-white text-xs font-bold truncate">{(g.card || g).name}</div>
                                      <div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest truncate">{(g.card || g).set_name?.split(" • ")[0]}</div>
                                  </div>
                              </div>
                          )
                      })}
                  </div>
              </div>
          )}

          {activeTab === "portfolio" && stats && (
            <div className="bg-gradient-to-br from-teal-500/10 to-[#0a0a0a] rounded-[32px] border border-white/5 p-6 md:p-10 mb-8 flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl relative overflow-hidden">
                <div className="absolute -right-20 -top-20 w-64 h-64 bg-teal-500/10 rounded-full blur-[80px] pointer-events-none" />
                <div className="w-full md:w-auto text-center md:text-left z-10">
                    <div className="text-teal-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Net Worth</div>
                    <div className="text-4xl md:text-6xl font-black text-white tracking-tighter">${formatMoney(stats.total_portfolio_value)}</div>
                    <div className="text-sm text-slate-400 font-bold mt-2">{stats.total_cards} Assets inside Vault</div>
                </div>
            </div>
          )}

          {/* 🔥 ИСПРАВЛЕНО: Меню сортировки теперь открывается корректно (z-index, origin) */}
          {(!loading || currentCards.length > 0) && activeTab === "explore" && (
            <div className="flex justify-between items-center mb-6 z-30 relative">
              <div className="text-slate-500 text-xs font-black uppercase tracking-widest">{currentCards.length} Cards</div>
              <div className="relative">
                <button onClick={() => setSortOpen(!sortOpen)} className="bg-white/5 border border-white/5 text-xs text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 active:scale-95 transition-transform">
                    {sortBy} <ChevronDown size={14} className="text-slate-400"/>
                </button>
                <AnimatePresence>
                  {sortOpen && (
                    <motion.div initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} exit={{opacity:0, scale:0.95}} className="absolute top-full right-0 mt-2 w-[180px] md:w-48 origin-top-right bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl py-2 overflow-hidden z-[100]">
                      {["Newest", "Price: High to Low", "Price: Low to High", "Name: A-Z"].map(opt => (
                        <div key={opt} onClick={() => { setSortBy(opt); setSortOpen(false); }} className={`px-4 py-3 text-xs font-bold active:bg-white/10 ${sortBy === opt ? 'text-teal-400' : 'text-slate-300'}`}>{opt}</div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}

          {loading && explorePage === 1 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-6">
              {Array.from({length:10}).map((_, i) => <div key={i} className="aspect-[3/4.5] bg-white/5 rounded-[24px] animate-pulse" />)}
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
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-6">
                {currentCards.map(c => <VaultCard key={c.id || (c.card||c).pokemon_tcg_id} coll={c} onOpenAnalytics={setSelectedColl} onAdd={handleAdd} onDelete={confirmDelete} isPortfolio={activeTab === "portfolio"} quantity={c.quantity} inPortfolio={ownedIds.has((c.card||c).pokemon_tcg_id)} />)}
              </div>
              
              {activeTab === "explore" && (
                <div className="mt-10 flex justify-center">
                  <button onClick={handleLoadMore} disabled={loadingMore} className="px-8 py-4 bg-white/5 active:bg-white/10 rounded-full font-black text-sm text-white transition-transform active:scale-95 flex items-center gap-2">
                    {loadingMore ? <Loader2 className="animate-spin" size={18}/> : "Load More"}
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
      <AnimatePresence>
        {confirmDialog.visible && (
          <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/80 backdrop-blur-md px-4" onMouseDown={() => setConfirmDialog({visible: false, coll: null})}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-[#141414] p-6 md:p-8 rounded-[32px] border border-white/10 shadow-2xl max-w-sm w-full" onMouseDown={e => e.stopPropagation()}>
              <h3 className="text-xl font-black text-white mb-2">Remove Asset?</h3>
              <p className="text-sm text-slate-400 mb-8">Delete <span className="text-white font-bold">{confirmDialog.coll?.card?.name || confirmDialog.coll?.name}</span>?</p>
              <div className="flex gap-3 w-full">
                <button className="flex-1 py-3 bg-white/5 active:bg-white/10 rounded-xl text-white font-bold text-sm transition-colors" onClick={() => setConfirmDialog({visible: false, coll: null})}>Cancel</button>
                <button className="flex-1 py-3 bg-rose-500 active:bg-rose-600 rounded-xl text-white font-bold text-sm transition-colors" onClick={executeDelete}>Remove</button>
              </div>
            </motion.div>
          </div>
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