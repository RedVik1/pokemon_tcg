import React from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip as ReTooltip } from "recharts";
import { PIE_COLORS } from "../../../shared/constants/colors";
import CustomTooltip from "../../../components/CustomTooltip";

/**
 * Donut chart showing portfolio value distribution by rarity.
 *
 * @param {{
 *   distribution: Array<{name: string, value: number}>,
 * }} props
 */
export default function AssetAllocationChart({ distribution }) {
  if (distribution.length === 0) {
    return (
      <div className="h-32 md:h-40 flex items-center justify-center text-sm font-bold text-slate-600">
        Not enough data
      </div>
    );
  }

  return (
    <div className="h-32 md:h-40 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={distribution}
            cx="50%"
            cy="50%"
            innerRadius={40}
            outerRadius={55}
            paddingAngle={5}
            dataKey="value"
            stroke="none"
          >
            {distribution.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
            ))}
          </Pie>
          <ReTooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
