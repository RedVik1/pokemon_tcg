import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Keyboard } from "lucide-react";

const SHORTCUTS = [
  { keys: ["⌘", "K"], action: "Open search" },
  { keys: ["?"], action: "Show keyboard shortcuts" },
  { keys: ["Esc"], action: "Close modal / search" },
];

export default function KeyboardShortcutsModal({ open, onClose }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="shortcuts-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center px-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 20, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-[#141414] border border-white/[0.08] rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
              <div className="flex items-center gap-2 text-white font-bold">
                <Keyboard size={18} className="text-teal-500" />
                Keyboard Shortcuts
              </div>
              <button onClick={onClose} className="p-1 text-slate-500 active:text-white transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="p-4 space-y-1">
              {SHORTCUTS.map((s, i) => (
                <div key={i} className="flex items-center justify-between py-2.5 px-3 rounded-lg">
                  <span className="text-sm text-slate-400">{s.action}</span>
                  <div className="flex items-center gap-1">
                    {s.keys.map((k, j) => (
                      <kbd key={j} className="min-w-[28px] h-7 flex items-center justify-center px-2 bg-black/50 border border-white/10 rounded text-[11px] font-mono text-slate-400">{k}</kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function useKeyboardShortcuts({ onOpenSearch, onToggleShortcuts }) {
  const onOpenSearchRef = useRef(onOpenSearch);
  const onToggleShortcutsRef = useRef(onToggleShortcuts);
  useEffect(() => { onOpenSearchRef.current = onOpenSearch; });
  useEffect(() => { onToggleShortcutsRef.current = onToggleShortcuts; });

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onOpenSearchRef.current?.();
      }
      if (e.key === "?" && !e.metaKey && !e.ctrlKey) {
        const tag = e.target.tagName;
        if (tag !== "INPUT" && tag !== "TEXTAREA" && tag !== "SELECT") {
          e.preventDefault();
          onToggleShortcutsRef.current?.();
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
}
