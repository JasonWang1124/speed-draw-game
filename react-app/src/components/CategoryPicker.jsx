import { useMemo } from "react";

// 多分類混選 chips
// props:
//   categories: [{ id, label, emoji?, desc, items }]
//   selected: string[]   被勾選的 category id
//   onChange: (string[]) => void
export default function CategoryPicker({ categories, selected, onChange }) {
  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const totalItems = useMemo(
    () => categories.filter(c => selectedSet.has(c.id)).reduce((sum, c) => sum + c.items.length, 0),
    [categories, selectedSet]
  );

  const toggle = (id) => {
    if (selectedSet.has(id)) {
      onChange(selected.filter(x => x !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  const selectAll = () => onChange(categories.map(c => c.id));
  const selectNone = () => onChange([]);
  const allSelected = selected.length === categories.length;

  return (
    <div>
      {/* 快捷操作列 */}
      <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
        <div className="text-sm font-bold text-deep/70">
          已選 <span className="text-coral text-base">{selected.length}</span> / {categories.length} 類
          <span className="text-deep/50">　共 {totalItems} 題可抽</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={selectAll}
            disabled={allSelected}
            className="px-3 py-1 text-xs font-bold rounded-full bg-deep/10 hover:bg-deep/20 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            全選
          </button>
          <button
            onClick={selectNone}
            disabled={selected.length === 0}
            className="px-3 py-1 text-xs font-bold rounded-full bg-deep/10 hover:bg-deep/20 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            全不選
          </button>
        </div>
      </div>

      {/* Chips */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {categories.map((cat) => {
          const checked = selectedSet.has(cat.id);
          return (
            <button
              key={cat.id}
              onClick={() => toggle(cat.id)}
              aria-pressed={checked}
              className={`rounded-2xl p-3 text-left border-2 transition-all ${
                checked
                  ? "bg-coral text-white border-deep shadow-[4px_4px_0_#2d1b4e] scale-[1.02]"
                  : "bg-white text-deep border-deep/15 hover:border-deep/40 hover:scale-[1.02] shadow-[2px_2px_0_rgba(45,27,78,0.1)]"
              }`}
            >
              <div className="font-black text-sm sm:text-base flex items-center gap-1">
                {cat.emoji && <span>{cat.emoji}</span>}
                <span>{cat.label}</span>
                {checked && <span className="ml-auto text-xs">✓</span>}
              </div>
              <div className={`text-xs mt-1 ${checked ? "text-white/85" : "text-deep/60"}`}>{cat.desc}</div>
              <div className={`text-xs mt-1 font-mono ${checked ? "text-white/70" : "text-deep/40"}`}>
                {cat.items.length} 題
              </div>
            </button>
          );
        })}
      </div>

      {/* 警告：完全沒選 */}
      {selected.length === 0 && (
        <p className="mt-3 text-coral font-bold text-sm">
          ⚠️ 至少選一類才能開始遊戲（不選就會抽不到題）
        </p>
      )}
    </div>
  );
}
