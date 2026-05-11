import { useMemo } from "react";

// 多分類混選 chips（浮世繪版）
// props:
//   categories: [{ id, label, emoji?, desc, items }]
//   selected: string[]
//   onChange: (string[]) => void
export default function CategoryPicker({ categories, selected, onChange }) {
  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const totalItems = useMemo(
    () => categories.filter(c => selectedSet.has(c.id)).reduce((sum, c) => sum + c.items.length, 0),
    [categories, selectedSet]
  );

  const toggle = (id) => {
    if (selectedSet.has(id)) onChange(selected.filter(x => x !== id));
    else onChange([...selected, id]);
  };

  const selectAll = () => onChange(categories.map(c => c.id));
  const selectNone = () => onChange([]);
  const allSelected = selected.length === categories.length;

  return (
    <div>
      {/* 統計列：和紙橫條 */}
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="font-display text-sm text-[var(--color-ink-soft)] tracking-wider">
          已選 <span className="font-stamp text-base text-[var(--color-vermillion)]">{selected.length}</span>
          <span className="mx-1 text-[var(--color-ink)]/30">／</span>
          {categories.length} 類
          <span className="mx-3 text-[var(--color-ink)]/20">·</span>
          共 <span className="font-stamp text-base text-[var(--color-indigo)]">{totalItems}</span> 題可抽
        </div>
        <div className="flex gap-2">
          <button
            onClick={selectAll}
            disabled={allSelected}
            className="font-display text-xs tracking-widest px-3 py-1.5 border border-[var(--color-ink)]/30 hover:border-[var(--color-ink)] hover:bg-[var(--color-ink)] hover:text-[var(--color-washi-bright)] disabled:opacity-30 disabled:cursor-not-allowed transition"
          >
            全 選
          </button>
          <button
            onClick={selectNone}
            disabled={selected.length === 0}
            className="font-display text-xs tracking-widest px-3 py-1.5 border border-[var(--color-ink)]/30 hover:border-[var(--color-ink)] hover:bg-[var(--color-ink)] hover:text-[var(--color-washi-bright)] disabled:opacity-30 disabled:cursor-not-allowed transition"
          >
            全 不 選
          </button>
        </div>
      </div>

      {/* Chips 網格 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {categories.map((cat) => {
          const checked = selectedSet.has(cat.id);
          return (
            <button
              key={cat.id}
              onClick={() => toggle(cat.id)}
              aria-pressed={checked}
              className={`relative text-left p-3 pl-4 border-2 transition-all overflow-hidden ${
                checked
                  ? "bg-[var(--color-indigo)] border-[var(--color-indigo-dark)] text-[var(--color-washi-bright)]"
                  : "bg-[var(--color-washi-bright)] border-[var(--color-ink)]/25 text-[var(--color-ink)] hover:border-[var(--color-ink)] hover:-translate-y-0.5 hover:shadow-[3px_3px_0_var(--color-ink)]"
              }`}
            >
              {/* 左側裝飾豎線 */}
              <span
                className={`absolute left-0 top-0 bottom-0 w-1 ${
                  checked ? "bg-[var(--color-vermillion)]" : "bg-[var(--color-vermillion)]/40"
                }`}
              ></span>

              {/* 選中時的紅章 */}
              {checked && (
                <span
                  className="absolute top-1.5 right-1.5 font-stamp text-xs text-[var(--color-washi-bright)] bg-[var(--color-vermillion)] px-1.5 py-0.5 leading-none"
                  style={{ transform: "rotate(-4deg)", boxShadow: "inset 0 0 0 1.5px var(--color-washi-bright), inset 0 0 0 2px var(--color-vermillion-dark)" }}
                >
                  選
                </span>
              )}

              <div className="font-display font-semibold text-sm sm:text-base tracking-wider flex items-center gap-1.5">
                {cat.emoji && <span className="text-base">{cat.emoji}</span>}
                <span>{cat.label}</span>
              </div>
              <div className={`text-xs mt-1 leading-relaxed ${checked ? "text-[var(--color-washi-bright)]/75" : "text-[var(--color-ink-soft)]/70"}`}>
                {cat.desc}
              </div>
              <div
                className={`font-stamp text-xs mt-1.5 tracking-widest ${
                  checked ? "text-[var(--color-vermillion-soft)]" : "text-[var(--color-vermillion)]/70"
                }`}
              >
                {cat.items.length} 題
              </div>
            </button>
          );
        })}
      </div>

      {/* 警告：完全沒選 */}
      {selected.length === 0 && (
        <p className="mt-3 font-display text-sm text-[var(--color-vermillion)] tracking-wider">
          ⚠ 至少選一類才能開席（不選就會無題可抽）
        </p>
      )}
    </div>
  );
}
