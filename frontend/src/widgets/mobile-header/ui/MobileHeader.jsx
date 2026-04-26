import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, LogOut } from "lucide-react";

/**
 * Mobile header with user menu dropdown.
 * Shown only on <md screens.
 */
export default function MobileHeader({ onLogout, userEmail }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;

    const handlePointerDown = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [menuOpen]);

  return (
    <header className="md:hidden sticky top-0 z-40 w-full bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/[0.04] pt-safe">
      <div className="px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-full bg-teal-500 shadow-[0_0_10px_rgba(20,184,166,0.4)]" />
          <span className="text-lg font-black tracking-wider text-white">COLLECTR</span>
        </div>
        <div ref={containerRef} className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 -mr-2 text-slate-400 active:text-white transition-colors"
            aria-label="Open profile menu"
          >
            <User size={22} />
          </button>
          <AnimatePresence>
            {menuOpen && (
              <>
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  className="absolute top-full right-0 mt-2 w-56 bg-[#141414] border border-white/[0.08] rounded-xl shadow-2xl z-50 py-2 overflow-hidden"
                >
                  <div className="px-4 py-3 border-b border-white/[0.06]">
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">
                      Signed in as
                    </div>
                    <div className="text-sm text-white font-bold truncate">{userEmail}</div>
                  </div>
                  <div className="bg-teal-500/10 border border-teal-500/20 mx-3 mt-3 p-3 rounded-xl flex items-center gap-2">
                    <div className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </div>
                    <span className="text-[10px] font-black text-emerald-400 tracking-widest uppercase">
                      Live API
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onLogout();
                    }}
                    className="w-full text-left px-4 py-3.5 mt-2 flex items-center gap-3 text-rose-400 font-bold text-sm active:bg-rose-500/10 transition-colors"
                  >
                    <LogOut size={18} />
                    <span>Log Out</span>
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
