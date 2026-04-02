import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import {
  Search, CheckCircle, Trash2,
  TrendingUp, TrendingDown, X, Box, Download, Flame, SlidersHorizontal
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ResponsiveContainer, Tooltip as ReTooltip,
  PieChart, Pie, Cell
} from "recharts";

import { safePrice, formatMoney } from "../utils/pricing";
import { useColumns } from "../utils/hooks";
import { useCountUp } from "../utils/countUp";
import { formatRarity } from "../utils/rarity";
import { getChartDataFromHistory } from "../utils/charts";
import { getEmailFromToken } from "../utils/auth";
import { PIE_COLORS } from "../constants/colors";

import DesktopNavbar from "../components/DesktopNavbar";
import MobileHeader from "../components/MobileHeader";
import BottomNav from "../components/BottomNav";
import RarityFilterSheet from "../components/RarityFilterSheet";
import SidebarFilters from "../components/SidebarFilters";
import VirtualCardGrid from "../components/VirtualCardGrid";
import SearchPalette from "../components/SearchPalette";
import SortSheet from "../components/SortSheet";
import AssetAnalyticsModal from "../components/AssetAnalyticsModal";
import CustomTooltip from "../components/CustomTooltip";
import KeyboardShortcutsModal, { useKeyboardShortcuts } from "../components/KeyboardShortcutsModal";

function usePullToRefresh(onRefresh) {
  const [pulling, setPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const pullingRef = useRef(false);
  const distanceRef = useRef(0);
  const onRefreshRef = useRef(onRefresh);

  useEffect(() => { onRefreshRef.current = onRefresh; }, [onRefresh]);

  useEffect(() => {
    const el = document.scrollingElement || document.documentElement;
    let startYVal = 0;

    const onTouchStart = (e) => {
      if (el.scrollTop <= 0) {
        startYVal = e.touches[0].clientY;
        pullingRef.current = true;
      }
    };
    const onTouchMove = (e) => {
      if (!pullingRef.current) return;
      const diff = e.touches[0].clientY - startYVal;
      if (diff > 0) {
        const dist = Math.min(diff * 0.5, 80);
        distanceRef.current = dist;
        setPulling(true);
        setPullDistance(dist);
      }
    };
    const onTouchEnd = () => {
      if (pullingRef.current && distanceRef.current > 50) {
        onRefreshRef.current();
      }
      pullingRef.current = false;
      distanceRef.current = 0;
      setPulling(false);
      setPullDistance(0);
    };

    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchmove", onTouchMove, { passive: true });
    document.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
    };
  }, []);

  return { pulling, pullDistance };
}

function AnimatedValue({ value, prefix = "", decimals = 2 }) {
  const animated = useCountUp(value, 600);
  return <>{prefix}{animated.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}</>;
}

export default function DashboardPage() {
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
  const [sortSheetOpen, setSortSheetOpen] = useState(false);
  const [rarityFilter, setRarityFilter] = useState("All");
  const [raritySheetOpen, setRaritySheetOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ visible: false, coll: null });
  const confirmDialogRef = useRef(null);
  useEffect(() => { confirmDialogRef.current = confirmDialog.coll; }, [confirmDialog.coll]);
  const [marketMovers, setMarketMovers] = useState([]);
  const [toast, setToast] = useState({ visible: false, message: "", type: "success" });
  const toastTimerRef = useRef(null);
  const [busyCardId, setBusyCardId] = useState(null);
  const [busyAction, setBusyAction] = useState(null);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const columns = useColumns();
  const userEmail = useMemo(() => getEmailFromToken(), []);

  const sortOptions = activeTab === "portfolio"
    ? ["Price: High to Low", "Price: Low to High"]
    : ["Newest", "Price: High to Low", "Price: Low to High", "Name: A-Z"];

  useKeyboardShortcuts({
    onOpenSearch: () => setPaletteOpen(true),
    onToggleShortcuts: () => setShortcutsOpen(v => !v),
  });

  useEffect(() => {
    if (!localStorage.getItem("token")) navigate("/login", { replace: true });
  }, [navigate]);

  const showToast = useCallback((message, type = "success") => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ visible: true, message, type });
    toastTimerRef.current = setTimeout(() => setToast({ visible: false, message: "", type: "success" }), 3000);
  }, []);

  useEffect(() => {
    return () => { if (toastTimerRef.current) clearTimeout(toastTimerRef.current); if (abortRef.current) abortRef.current.abort(); };
  }, []);

  useEffect(() => {
    if (activeTab === "portfolio") setSortBy("Price: High to Low");
    else if (activeTab === "explore") setSortBy("Newest");
    setExplorePage(1);
  }, [activeTab]);

  const abortRef = useRef(null);

  const fetchData = useCallback(async (pageToLoad = 1, append = false, currentRarity = "All", currentSort = "Newest") => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    if (!append) setLoading(true); else setLoadingMore(true);
    try {
      const rarityQuery = currentRarity === "All" ? "" : `&rarity=${encodeURIComponent(currentRarity)}`;
      const sortQuery = `&sort_by=${encodeURIComponent(currentSort)}`;
      const [s, c, exp] = await Promise.all([
        api.get("/portfolio/stats", { signal: controller.signal }),
        api.get("/collections/me", { signal: controller.signal }),
        api.get(`/search?query=&page=${pageToLoad}&limit=48${rarityQuery}${sortQuery}`, { signal: controller.signal })
      ]);
      if (controller.signal.aborted) return;
      setStats(s.data); setPortfolioCards(c.data || []);
      const newExplore = (exp.data || []).map(card => ({ id: `exp-${card.id}-${pageToLoad}`, card, condition: "Market" }));
      if (append) {
        setExploreCards(prev => {
          const prevIds = new Set(prev.filter(p => p.card).map(p => p.card.id));
          const uniqueNew = newExplore.filter(n => n.card && !prevIds.has(n.card.id));
          return [...prev, ...uniqueNew];
        });
      } else { setExploreCards(newExplore); }
    } catch (error) {
      if (error.name === 'CanceledError' || error.code === 'ERR_CANCELED' || controller.signal.aborted) return;
      if (error.response && error.response.status === 401) { localStorage.removeItem("token"); navigate("/login"); }
    } finally {
      if (!controller.signal.aborted) { setLoading(false); setLoadingMore(false); }
    }
  }, [navigate]);

  useEffect(() => { api.get("/market-movers").then(r => setMarketMovers(r.data || [])).catch(() => setMarketMovers([])); }, []);
  useEffect(() => { setExplorePage(1); fetchData(1, false, rarityFilter, sortBy); }, [rarityFilter, sortBy, fetchData]);

  const handleLoadMore = useCallback(() => {
    setExplorePage(prev => {
      fetchData(prev + 1, true, rarityFilter, sortBy);
      return prev + 1;
    });
  }, [rarityFilter, sortBy, fetchData]);

  const handleRefresh = useCallback(() => {
    fetchData(1, false, rarityFilter, sortBy);
  }, [fetchData, rarityFilter, sortBy]);

  const { pulling, pullDistance } = usePullToRefresh(handleRefresh);

  const handleAdd = useCallback(async (card) => {
    const cardId = card.pokemon_tcg_id || card.id;
    setBusyCardId(cardId); setBusyAction("add");
    const newItem = {
      id: `optimistic-${Date.now()}`,
      card: { ...card, pokemon_tcg_id: cardId },
      quantity: 1,
      instance_ids: [`optimistic-${Date.now()}`]
    };
    setPortfolioCards(prev => [...prev, newItem]);
    try {
      await api.post("/collections/add", { pokemon_tcg_id: String(cardId), condition: "Mint" });
      showToast(`${card.name} added to vault!`, "success");
      await fetchData(1, false, rarityFilter, sortBy);
    } catch (error) {
      setPortfolioCards(prev => prev.filter(item => item.id !== newItem.id));
      if (error.response?.status === 401) { localStorage.removeItem("token"); navigate("/login"); return; }
      showToast("Error adding card.", "error");
    } finally {
      setBusyCardId(null); setBusyAction(null);
    }
  }, [navigate, fetchData, rarityFilter, sortBy, showToast]);

  const confirmDelete = useCallback((coll) => setConfirmDialog({ visible: true, coll }), []);

  const executeDelete = useCallback(async () => {
    const coll = confirmDialogRef.current;
    if (!coll) return;

    const instanceId = coll.instance_ids?.[0] ?? coll.id;
    if (!instanceId && instanceId !== 0) {
      showToast("Error: could not identify card to remove.", "error");
      setConfirmDialog({ visible: false, coll: null });
      return;
    }

    const cardId = coll.card?.pokemon_tcg_id || coll.card?.id;
    setBusyCardId(cardId); setBusyAction("delete");
    const snapshot = portfolioCards;
    setPortfolioCards(prev => {
      const idx = prev.findIndex(item => item.id === coll.id);
      if (idx === -1) return prev;
      const existing = prev[idx];
      if ((existing.quantity || 1) > 1) {
        const updated = [...prev];
        updated[idx] = { ...existing, quantity: (existing.quantity || 1) - 1, instance_ids: (existing.instance_ids || []).slice(1) };
        return updated;
      }
      return prev.filter(item => item.id !== coll.id);
    });
    setConfirmDialog({ visible: false, coll: null });
    try {
      await api.delete(`/collections/${instanceId}`);
      showToast("Card removed.", "success");
      await fetchData(1, false, rarityFilter, sortBy);
    } catch {
      setPortfolioCards(snapshot);
      showToast("Error removing card.", "error");
    } finally {
      setBusyCardId(null); setBusyAction(null);
    }
  }, [fetchData, rarityFilter, sortBy, showToast]);

  const groupedPortfolio = useMemo(() => {
    const map = new Map();
    portfolioCards.forEach(item => {
      if (!item?.card?.pokemon_tcg_id) return;
      const id = item.card.pokemon_tcg_id;
      const qty = Math.max(1, item.quantity || 1);
      if (!map.has(id)) {
        map.set(id, { ...item, quantity: qty, instance_ids: [item.id] });
      } else {
        const existing = map.get(id);
        existing.quantity += qty;
        existing.instance_ids.push(item.id);
      }
    });
    return Array.from(map.values());
  }, [portfolioCards]);

  const handleExportCSV = useCallback(() => {
    let csvContent = "data:text/csv;charset=utf-8,Card Name,Set,Rarity,Quantity,Price (ea),Total Value\n";
    groupedPortfolio.forEach(item => {
      const c = item.card; const price = safePrice(c.price); const qty = item.quantity;
      const escapeCsv = (s) => { const str = String(s); return `"${str.replace(/"/g, '""')}"`; };
      csvContent += `${escapeCsv(c.name)},${escapeCsv(c.set_name)},${escapeCsv(formatRarity(c.rarity))},${qty},${price.toFixed(2)},${(price * qty).toFixed(2)}\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Pokemon_Portfolio_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
    showToast("Portfolio exported successfully!", "success");
  }, [groupedPortfolio, showToast]);

  const portfolioDistribution = useMemo(() => {
    const dist = {};
    groupedPortfolio.forEach(item => {
      const r = formatRarity(item.card.rarity || item.card.set_name?.split(" • ")[1]);
      const val = safePrice(item.card.price) * item.quantity;
      if (val > 0) { dist[r] = (dist[r] || 0) + val; }
    });
    return Object.entries(dist).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [groupedPortfolio]);

  const ownedIds = useMemo(() => new Set(portfolioCards.filter(c => c.card?.pokemon_tcg_id).map(c => c.card.pokemon_tcg_id)), [portfolioCards]);

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

  const handleDismissConfirm = useCallback(() => setConfirmDialog({ visible: false, coll: null }), []);

  const tabContent = useMemo(() => {
    if (activeTab === "explore") {
      return { key: "explore", content: (
        <>
          <div className="bg-[#141414] rounded-2xl md:rounded-xl p-4 md:p-6 mb-5 md:mb-8 border border-white/[0.06] shadow-lg">
            <h2 className="text-lg md:text-xl font-bold mb-3 md:mb-4">Explore Popular Cards</h2>
            <div onClick={() => setPaletteOpen(true)} className="flex items-center bg-[#0a0a0a] border border-white/[0.08] rounded-xl md:rounded-md px-4 py-3.5 cursor-pointer active:border-teal-500/50 md:hover:border-teal-500/50 transition-colors">
              <Search size={18} className="text-slate-600 mr-3 shrink-0" />
              <span className="text-slate-500 text-sm flex-1">Search any card...</span>
              <div className="hidden sm:flex px-2 py-1 bg-[#1a1a1a] border border-white/10 rounded text-[10px] font-bold text-slate-500">⌘K</div>
            </div>
          </div>
          {sortedMarketMovers.length > 0 && (
            <div className="mb-6 md:mb-10">
              <div className="flex items-center gap-2 text-rose-500 font-bold mb-3 md:mb-4 text-sm md:text-base">
                <Flame size={18} /> Market Movers
              </div>
              <div className="relative md:hidden">
                <div className="flex gap-3 overflow-x-auto custom-scrollbar pb-2 snap-x snap-mandatory">
                  {sortedMarketMovers.map((g, idx) => (
                    <div key={`gainer-${idx}`} onClick={() => setSelectedColl(g)} className="bg-gradient-to-tr from-[#161616] to-rose-500/10 border border-white/[0.06] active:border-rose-500/30 p-3.5 rounded-2xl cursor-pointer transition-colors flex items-center gap-3 min-w-[200px] snap-start">
                      <img src={(g.card || g).image_url} className="w-10 h-14 object-contain drop-shadow-md" loading="lazy" />
                      <div className="overflow-hidden flex-1 min-w-0">
                        <div className="text-white text-xs font-bold truncate">{(g.card || g).name}</div>
                        <div className="text-[9px] text-slate-500 truncate mb-0.5">{(g.card || g).set_name?.split(" • ")[0]}</div>
                        <div className="text-sm font-black text-rose-400">{g.computedStat.isUp ? '+' : '-'}{g.computedStat.percent}%</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="absolute top-0 right-0 bottom-2 w-12 bg-gradient-to-l from-[#0a0a0a] to-transparent pointer-events-none" />
              </div>
              <div className="hidden md:grid md:grid-cols-4 gap-4">
                {sortedMarketMovers.map((g, idx) => (
                  <div key={`gainer-${idx}`} onClick={() => setSelectedColl(g)} className="bg-gradient-to-tr from-[#161616] to-rose-500/10 border border-white/[0.06] hover:border-rose-500/30 p-4 rounded-2xl cursor-pointer transition-colors flex items-center gap-4">
                    <img src={(g.card || g).image_url} className="w-12 h-16 object-contain drop-shadow-md" loading="lazy" />
                    <div className="overflow-hidden flex-1 min-w-0">
                      <div className="text-white text-xs font-bold truncate">{(g.card || g).name}</div>
                      <div className="text-[10px] text-slate-500 truncate mb-1">{(g.card || g).set_name?.split(" • ")[0]}</div>
                      <div className="text-sm font-black text-rose-400">{g.computedStat.isUp ? '+' : '-'}{g.computedStat.percent}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )};
    }
    return { key: "portfolio", content: (
      <>
        {stats && (
          <div className="mb-5 md:mb-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 md:gap-6 mb-4 md:mb-6">
              <div className="col-span-2 bg-gradient-to-br from-teal-500/10 to-transparent p-5 md:p-6 rounded-2xl md:rounded-[28px] border border-white/[0.06]">
                <div className="text-teal-500 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] mb-1.5 md:mb-2">Net Worth</div>
                <div className="text-3xl md:text-4xl font-black text-emerald-400">
                  $<AnimatedValue value={stats.total_portfolio_value} />
                </div>
              </div>
              <div className="bg-[#141414] p-4 md:p-6 rounded-2xl md:rounded-[20px] border border-white/[0.06] flex flex-col justify-center">
                <div className="text-slate-500 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] mb-1">Assets</div>
                <div className="text-xl md:text-2xl font-black text-white">
                  <AnimatedValue value={stats.total_cards} decimals={0} />
                </div>
              </div>
              <div onClick={handleExportCSV} className="bg-teal-500/10 active:bg-teal-500/20 md:hover:bg-teal-500/20 p-4 md:p-6 rounded-2xl md:rounded-[20px] border border-teal-500/20 cursor-pointer transition-colors flex flex-col items-center justify-center text-teal-500 active:scale-95 duration-75">
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
      </>
    )};
  }, [activeTab, stats, sortedMarketMovers, portfolioDistribution, handleExportCSV]);

  return (
    <div className="min-h-[100dvh] bg-[#0a0a0a] text-white font-sans selection:bg-teal-500/30">
      <AnimatePresence>
        {toast.visible && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`fixed top-16 md:top-8 left-1/2 -translate-x-1/2 z-[999999] px-5 py-2.5 md:px-6 md:py-3 rounded-full flex items-center gap-2.5 shadow-2xl border backdrop-blur-xl font-bold text-sm ${toast.type === 'error' ? 'bg-rose-500/10 border-rose-500 text-rose-500' : 'bg-teal-500/10 border-teal-500 text-teal-400'}`}
          >
            {toast.type === 'error' ? <X size={15} /> : <CheckCircle size={15} />}
            {toast.message}
          </motion.div>
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
                <button className="flex-1 py-3.5 md:py-3 bg-white/5 active:bg-white/10 md:hover:bg-white/10 rounded-xl text-white font-bold transition-colors active:scale-95 duration-75" onClick={handleDismissConfirm}>Cancel</button>
                <button className="flex-1 py-3.5 md:py-3 bg-rose-500 active:bg-rose-600 md:hover:bg-rose-600 rounded-xl text-white font-bold transition-colors active:scale-95 duration-75" onClick={executeDelete}>Remove</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <DesktopNavbar onLogout={() => { localStorage.removeItem("token"); navigate("/login") }} onOpenPalette={() => setPaletteOpen(true)} userEmail={userEmail} activeTab={activeTab} setActiveTab={setActiveTab} />
      <MobileHeader onLogout={() => { localStorage.removeItem("token"); navigate("/login") }} userEmail={userEmail} />
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} onOpenPalette={() => setPaletteOpen(true)} />

      <AnimatePresence>
        {raritySheetOpen && <RarityFilterSheet open={raritySheetOpen} onClose={() => setRaritySheetOpen(false)} rarityFilter={rarityFilter} setRarityFilter={setRarityFilter} />}
      </AnimatePresence>
      <AnimatePresence>
        {sortSheetOpen && <SortSheet open={sortSheetOpen} onClose={() => setSortSheetOpen(false)} sortBy={sortBy} setSortBy={setSortBy} options={sortOptions} />}
      </AnimatePresence>
      <KeyboardShortcutsModal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />

      {pullDistance > 0 && (
        <div className="fixed top-0 left-0 right-0 z-[60] flex justify-center md:hidden" style={{ height: pullDistance }}>
          <div className="flex items-center">
            <svg className={`animate-spin h-5 w-5 text-teal-500 ${pullDistance > 50 ? 'opacity-100' : 'opacity-40'}`} viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        </div>
      )}

      <div className="max-w-[1600px] mx-auto flex flex-col lg:flex-row mt-4 md:mt-8 px-4 md:px-8 gap-4 md:gap-8 pb-24 md:pb-20">
        {activeTab !== "portfolio" && <SidebarFilters rarityFilter={rarityFilter} setRarityFilter={setRarityFilter} />}
        <main className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={tabContent.key}
              initial={{ opacity: 0, x: activeTab === "explore" ? -10 : 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: activeTab === "explore" ? 10 : -10 }}
              transition={{ duration: 0.2 }}
            >
              {tabContent.content}
            </motion.div>
          </AnimatePresence>

          {activeTab === "portfolio" && currentCards.length === 0 && !loading ? (
            <div className="flex flex-col items-center justify-center py-16 md:py-20 text-center">
              <div className="relative w-32 h-32 md:w-40 md:h-40 mb-6 md:mb-8">
                <motion.div initial={{ rotate: -15, opacity: 0, scale: 0.8 }} animate={{ rotate: -15, opacity: 0.3, scale: 0.8 }} transition={{ delay: 0.1, duration: 0.6 }} className="absolute inset-0 bg-gradient-to-br from-teal-500/20 to-teal-600/10 rounded-2xl border border-teal-500/20" style={{ transformOrigin: "bottom center" }} />
                <motion.div initial={{ rotate: 0, opacity: 0, scale: 0.8 }} animate={{ rotate: 0, opacity: 0.5, scale: 0.8 }} transition={{ delay: 0.2, duration: 0.6 }} className="absolute inset-0 bg-gradient-to-br from-teal-500/30 to-teal-600/10 rounded-2xl border border-teal-500/30" style={{ transformOrigin: "bottom center" }} />
                <motion.div initial={{ rotate: 15, opacity: 0, scale: 0.8 }} animate={{ rotate: 15, opacity: 0.7, scale: 0.8 }} transition={{ delay: 0.3, duration: 0.6 }} className="absolute inset-0 bg-gradient-to-br from-teal-500/40 to-teal-600/10 rounded-2xl border border-teal-500/40" style={{ transformOrigin: "bottom center" }} />
                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4, type: "spring", damping: 15 }} className="absolute inset-0 flex items-center justify-center">
                  <div className="w-20 h-28 md:w-24 md:h-32 bg-gradient-to-br from-[#1a1a1a] to-[#141414] rounded-xl border border-white/[0.08] shadow-2xl flex items-center justify-center">
                    <Box size={32} className="text-teal-500/60" />
                  </div>
                </motion.div>
                <motion.div animate={{ boxShadow: ["0 0 20px rgba(20,184,166,0.1)", "0 0 40px rgba(20,184,166,0.2)", "0 0 20px rgba(20,184,166,0.1)"] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} className="absolute inset-4 rounded-2xl pointer-events-none" />
              </div>
              <h2 className="text-xl md:text-2xl font-black text-white mb-2">Your Vault is Empty</h2>
              <p className="text-slate-500 mb-6 md:mb-8 max-w-md text-sm md:text-base px-4">Start building your ultimate Pokémon TCG collection. Go to the Explore tab to find and add your first assets.</p>
              <button onClick={() => setActiveTab("explore")} className="px-8 py-4 bg-teal-500 text-black font-black rounded-xl active:bg-teal-600 md:hover:bg-teal-400 transition-colors shadow-lg shadow-teal-500/20 active:scale-95 duration-75">Explore Cards</button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4 md:mb-6 gap-3">
                <div className="text-slate-500 text-xs md:text-sm font-semibold shrink-0">{currentCards.length} found</div>
                <div className="flex items-center gap-2">
                  {activeTab === "explore" && (
                    <button onClick={() => setRaritySheetOpen(true)} className="lg:hidden p-2.5 rounded-xl bg-[#141414] border border-white/[0.06] text-slate-400 active:bg-white/5 active:scale-95 transition-all duration-75">
                      <SlidersHorizontal size={18} />
                    </button>
                  )}
                  <div className="relative">
                    <div
                      onClick={() => {
                        if (window.matchMedia("(min-width: 768px)").matches) {
                          setSortOpen(!sortOpen);
                        } else {
                          setSortSheetOpen(true);
                        }
                      }}
                      className="bg-[#141414] border border-white/[0.06] text-xs md:text-sm text-slate-400 px-3 md:px-6 py-2.5 md:py-3 rounded-xl flex items-center gap-1.5 md:gap-2 cursor-pointer active:bg-white/5 md:hover:bg-white/5 transition-colors font-bold z-20 relative active:scale-95 duration-75"
                    >
                      <span className="hidden md:inline">Sort:</span> {sortBy} ▾
                    </div>
                    {sortOpen && (
                      <>
                        <div className="fixed inset-0 z-30" onClick={() => setSortOpen(false)} />
                        <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="absolute top-full right-0 mt-2 w-56 bg-[#141414] border border-white/[0.08] rounded-xl shadow-2xl z-40 py-1.5 overflow-hidden">
                          {sortOptions.map(opt => (
                            <div key={opt} onClick={() => { setSortBy(opt); setSortOpen(false); }} className="px-6 py-3 hover:bg-white/5 cursor-pointer text-sm text-slate-300 font-bold transition-colors">{opt}</div>
                          ))}
                        </motion.div>
                      </>
                    )}
                  </div>
                </div>
              </div>
              {loading && explorePage === 1 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 md:gap-6">
                  {Array.from({ length: columns * 2 }).map((_, i) => <div key={i} className="aspect-[3/4] bg-[#141414] rounded-[20px] md:rounded-2xl animate-pulse" />)}
                </div>
              ) : (
                <VirtualCardGrid
                  cards={currentCards}
                  onOpenAnalytics={setSelectedColl}
                  onAdd={handleAdd}
                  onDelete={confirmDelete}
                  isPortfolio={activeTab === "portfolio"}
                  ownedIds={ownedIds}
                  busyCardId={busyCardId}
                  busyAction={busyAction}
                  onLoadMore={handleLoadMore}
                  loadingMore={loadingMore}
                  showLoadMore={activeTab === "explore"}
                />
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
          <AssetAnalyticsModal coll={selectedColl} onClose={() => setSelectedColl(null)} onAdd={handleAdd} onDelete={confirmDelete} isPortfolio={activeTab === "portfolio" || Boolean(selectedColl?.user_id)} />
        )}
      </AnimatePresence>
    </div>
  );
}
