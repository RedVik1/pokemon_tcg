import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { Box } from "lucide-react";

/**
 * Renders a card's image with loading/placeholder state.
 * Accepts optional tilt/transform props for use within interactive parents.
 *
 * @param {{
 *   image_url: string | null,
 *   name: string,
 *   tiltActive?: boolean,
 * }} props
 */
export default function CardImage({ image_url, name, tiltActive = false }) {
  const cardImageFilter = useMemo(
    () =>
      tiltActive
        ? "drop-shadow(0 15px 20px rgba(0,0,0,0.5))"
        : "drop-shadow(0 8px 12px rgba(0,0,0,0.3))",
    [tiltActive],
  );

  const cardImageTransform = useMemo(
    () => (tiltActive ? "translateZ(20px)" : "translateZ(0px)"),
    [tiltActive],
  );

  if (!image_url) {
    return (
      <div className="w-full max-w-[140px] md:max-w-[180px] aspect-[3/4] flex items-center justify-center relative z-10">
        <Box size={40} className="text-slate-700" />
      </div>
    );
  }

  return (
    <img
      src={image_url}
      alt={name}
      className="w-full max-w-[140px] md:max-w-[180px] object-contain relative z-10 transition-all duration-500 ease-out"
      style={
        tiltActive
          ? { transform: cardImageTransform, filter: cardImageFilter }
          : undefined
      }
    />
  );
}
