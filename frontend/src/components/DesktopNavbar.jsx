import React from "react";
import { Search, User, LogOut } from "lucide-react";

export default function DesktopNavbar({ onLogout, onOpenPalette, userEmail, activeTab, setActiveTab }) {
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
