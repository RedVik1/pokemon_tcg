import { useState, useEffect, useCallback } from "react";

export function useDebounce(value, delay = 400) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

export function useColumns() {
  const getCols = useCallback(() => {
    if (typeof window === "undefined") return 2;
    if (window.matchMedia("(min-width: 1536px)").matches) return 5;
    if (window.matchMedia("(min-width: 1280px)").matches) return 4;
    if (window.matchMedia("(min-width: 768px)").matches) return 3;
    return 2;
  }, []);

  const [columns, setColumns] = useState(getCols);

  useEffect(() => {
    const queries = [
      window.matchMedia("(min-width: 1536px)"),
      window.matchMedia("(min-width: 1280px)"),
      window.matchMedia("(min-width: 768px)"),
    ];
    const handler = () => setColumns(getCols());
    queries.forEach(q => q.addEventListener("change", handler));
    return () => queries.forEach(q => q.removeEventListener("change", handler));
  }, [getCols]);

  return columns;
}
