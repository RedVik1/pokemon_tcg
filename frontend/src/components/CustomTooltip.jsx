import React from "react";
import { formatMoney } from "../shared/lib/pricing";

export default function CustomTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    const dataPoint = payload[0].payload;
    return (
      <div className="bg-[#1a1a1a] border border-white/10 text-white text-sm p-3 rounded-lg shadow-xl" style={{ zIndex: 9999, position: 'relative' }}>
        <div className="text-slate-400 mb-1">{dataPoint.name}</div>
        <div className="font-bold text-teal-400">${formatMoney(Number(dataPoint.value ?? dataPoint.price ?? 0))}</div>
      </div>
    );
  }
  return null;
}
