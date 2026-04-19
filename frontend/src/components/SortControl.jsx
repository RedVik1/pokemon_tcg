export default function SortControl({ value, options, onChange }) {
  return (
    <label className="relative block">
      <span className="sr-only">Sort cards</span>
      <select
        aria-label="Sort cards"
        className="appearance-none bg-[#141414] border border-white/[0.06] text-xs md:text-sm text-slate-300 px-3 md:px-6 py-2.5 md:py-3 rounded-xl font-bold pr-10 outline-none focus:border-teal-500 transition-colors"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-500">
        ▾
      </span>
    </label>
  );
}
