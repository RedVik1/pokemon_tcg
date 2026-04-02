import React from "react";
import { motion } from "framer-motion";
import { Search, LayoutGrid, Briefcase } from "lucide-react";

export default function BottomNav({ activeTab, setActiveTab, onOpenPalette }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[#0a0a0a]/95 backdrop-blur-xl border-t border-white/[0.06] pb-safe">
      <div className="flex items-center justify-around px-2 h-16">
        <button onClick={() => setActiveTab("explore")} className="relative flex flex-col items-center gap-1 py-2 px-5 rounded-2xl transition-colors min-w-[64px]">
          <LayoutGrid size={22} className={activeTab === "explore" ? "text-teal-400" : "text-slate-600"} />
          <span className={`text-[10px] font-bold tracking-wide ${activeTab === "explore" ? "text-teal-400" : "text-slate-600"}`}>Explore</span>
          {activeTab === "explore" && (
            <motion.div layoutId="nav-indicator" className="absolute -bottom-0.5 w-8 h-0.5 bg-teal-400 rounded-full" transition={{ type: "spring", stiffness: 400, damping: 30 }} />
          )}
        </button>
        <button onClick={onOpenPalette} className="flex flex-col items-center justify-center transition-colors -mt-1">
          <div className="w-12 h-12 bg-teal-500 rounded-full flex items-center justify-center shadow-[0_4px_20px_rgba(20,184,166,0.4)] active:scale-90 transition-transform duration-75">
            <Search size={22} className="text-black" />
          </div>
        </button>
        <button onClick={() => setActiveTab("portfolio")} className="relative flex flex-col items-center gap-1 py-2 px-5 rounded-2xl transition-colors min-w-[64px]">
          <Briefcase size={22} className={activeTab === "portfolio" ? "text-teal-400" : "text-slate-600"} />
          <span className={`text-[10px] font-bold tracking-wide ${activeTab === "portfolio" ? "text-teal-400" : "text-slate-600"}`}>Vault</span>
          {activeTab === "portfolio" && (
            <motion.div layoutId="nav-indicator" className="absolute -bottom-0.5 w-8 h-0.5 bg-teal-400 rounded-full" transition={{ type: "spring", stiffness: 400, damping: 30 }} />
          )}
        </button>
      </div>
    </div>
  );
}
