import React from "react";

/**
 * Renders a card's display name.
 *
 * @param {{
 *   name: string,
 *   className?: string,
 * }} props
 */
export default function CardName({ name, className = "" }) {
  return (
    <div className={`text-white font-bold truncate text-[13px] md:text-sm mb-0.5 md:mb-1 ${className}`}>
      {name}
    </div>
  );
}
