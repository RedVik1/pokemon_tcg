import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle } from "lucide-react";

/**
 * Confirmation dialog for removing a card from the collection.
 *
 * @param {{
 *   visible: boolean,
 *   collectionItem: Object | null,
 *   onConfirm: () => void,
 *   onDismiss: () => void,
 * }} props
 */
export default function RemoveDialog({ visible, collectionItem, onConfirm, onDismiss }) {
  if (!visible) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[999999] flex items-end md:items-center justify-center bg-black/80 backdrop-blur-sm"
        onMouseDown={onDismiss}
      >
        <motion.div
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 60, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="bg-[#141414] p-6 md:p-8 rounded-t-3xl md:rounded-3xl border border-white/[0.08] shadow-2xl max-w-sm w-full"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <h3 className="text-lg md:text-xl font-black text-white mb-2">
            Remove Asset?
          </h3>
          <p className="text-sm text-slate-400 mb-6 md:mb-8">
            Remove 1 copy of{" "}
            <span className="text-white font-bold">
              {collectionItem?.card?.name || collectionItem?.name}
            </span>
            ?
          </p>
          <div className="flex gap-3 md:gap-4">
            <button
              className="flex-1 py-3.5 md:py-3 bg-white/5 active:bg-white/10 md:hover:bg-white/10 rounded-xl text-white font-bold transition-colors active:scale-95 duration-75"
              onClick={onDismiss}
            >
              Cancel
            </button>
            <button
              className="flex-1 py-3.5 md:py-3 bg-rose-500 active:bg-rose-600 md:hover:bg-rose-600 rounded-xl text-white font-bold transition-colors active:scale-95 duration-75"
              onClick={onConfirm}
            >
              Remove
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

/**
 * Toast notification component.
 *
 * @param {{
 *   visible: boolean,
 *   message: string,
 *   type: 'success' | 'error',
 * }} props
 */
export function Toast({ visible, message, type = "success" }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className={`fixed top-16 md:top-8 left-1/2 -translate-x-1/2 z-[999999] px-5 py-2.5 md:px-6 md:py-3 rounded-full flex items-center gap-2.5 shadow-2xl border backdrop-blur-xl font-bold text-sm ${
            type === "error"
              ? "bg-rose-500/10 border-rose-500 text-rose-500"
              : "bg-teal-500/10 border-teal-500 text-teal-400"
          }`}
        >
          {type === "error" ? <X size={15} /> : <CheckCircle size={15} />}
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
