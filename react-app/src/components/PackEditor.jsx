import { useState } from "react";
import { motion } from "framer-motion";

// 自製題庫編輯 Modal
// props:
//   pack: { id, label, emoji, desc, items }
//   onSave: (patch) => void
//   onCancel: () => void
//   onDelete?: () => void   （null 表示新增模式，無刪除按鈕）
export default function PackEditor({ pack, onSave, onCancel, onDelete }) {
  const [label, setLabel] = useState(pack.label || "");
  const [emoji, setEmoji] = useState(pack.emoji || "📦");
  const [desc, setDesc] = useState(pack.desc || "");
  const [items, setItems] = useState(() =>
    (pack.items || []).map(it => ({
      name: it.name || "",
      hint: it.hint || "",
      aliases: Array.isArray(it.aliases) ? it.aliases.join("、") : "",
    }))
  );
  const [error, setError] = useState("");

  const updateItem = (idx, key, value) => {
    setItems(prev => prev.map((it, i) => (i === idx ? { ...it, [key]: value } : it)));
  };

  const addItem = () => {
    setItems(prev => [...prev, { name: "", hint: "", aliases: "" }]);
  };

  const removeItem = (idx) => {
    setItems(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSave = () => {
    const trimLabel = label.trim();
    if (!trimLabel) {
      setError("分類名稱不可為空");
      return;
    }
    const cleaned = items
      .map(it => ({
        name: it.name.trim(),
        hint: it.hint.trim(),
        aliases: it.aliases
          .split(/[、，,;；]/)
          .map(a => a.trim())
          .filter(Boolean),
      }))
      .filter(it => it.name);
    if (cleaned.length === 0) {
      setError("至少要有一筆題目");
      return;
    }
    onSave({
      label: trimLabel,
      emoji: emoji.trim() || "📦",
      desc: desc.trim(),
      items: cleaned.map(it => {
        const out = { name: it.name };
        if (it.hint) out.hint = it.hint;
        if (it.aliases.length > 0) out.aliases = it.aliases;
        return out;
      }),
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-deep/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-auto">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="washi-card w-full max-w-2xl p-6 sm:p-8 my-8"
      >
        <div className="flex items-baseline gap-3 mb-6 pb-4 border-b border-[var(--color-ink)]/15">
          <span className="font-stamp text-3xl text-[var(--color-vermillion)] leading-none">
            {onDelete ? "改" : "新"}
          </span>
          <h3 className="font-display text-xl sm:text-2xl font-semibold tracking-[0.15em] text-[var(--color-ink)]">
            {onDelete ? "編輯題庫" : "新增題庫"}
          </h3>
          <span className="text-xs tracking-[0.3em] text-[var(--color-ink-soft)]/60 ml-1 uppercase">Deck</span>
          <span className="flex-1 h-px bg-gradient-to-r from-[var(--color-ink)]/30 to-transparent ml-2"></span>
        </div>

        {/* 分類資訊 */}
        <div className="grid grid-cols-[auto_1fr] sm:grid-cols-[auto_1fr_auto] gap-2 mb-4">
          <input
            value={emoji}
            onChange={e => setEmoji(e.target.value)}
            placeholder="📦"
            maxLength={4}
            className="w-14 text-center text-2xl border-2 border-[var(--color-ink)]/30 bg-[var(--color-washi-bright)] focus:outline-none focus:border-[var(--color-vermillion)] p-2"
          />
          <input
            value={label}
            onChange={e => setLabel(e.target.value)}
            placeholder="分類名稱（例：我家的物品）"
            maxLength={30}
            className="border-2 border-[var(--color-ink)]/30 bg-[var(--color-washi-bright)] focus:outline-none focus:border-[var(--color-vermillion)] p-2 font-bold"
          />
          <input
            value={desc}
            onChange={e => setDesc(e.target.value)}
            placeholder="說明（可空）"
            maxLength={50}
            className="col-span-2 sm:col-span-1 border-2 border-[var(--color-ink)]/30 bg-[var(--color-washi-bright)] focus:outline-none focus:border-[var(--color-vermillion)] p-2 text-sm"
          />
        </div>

        {/* 題目列表 */}
        <div className="border-2 border-[var(--color-ink)]/30 bg-[var(--color-washi-bright)] overflow-hidden mb-3">
          <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-1 px-2 py-1.5 bg-[var(--color-ink)]/5 font-display text-xs tracking-[0.2em] text-[var(--color-ink-soft)] sticky top-0">
            <div>題目</div>
            <div>別名（、分隔）</div>
            <div>提示</div>
            <div></div>
          </div>
          <div className="max-h-[40vh] overflow-y-auto">
            {items.length === 0 && (
              <div className="text-center text-[var(--color-ink-soft)]/50 py-8 text-sm font-display tracking-widest">尚無題目　·　按下方「新增題目」</div>
            )}
            {items.map((it, idx) => (
              <div key={idx} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-1 p-1 border-t border-[var(--color-ink)]/8">
                <input
                  value={it.name}
                  onChange={e => updateItem(idx, "name", e.target.value)}
                  placeholder="例：月亮"
                  className="border border-[var(--color-ink)]/20 focus:outline-none focus:border-[var(--color-vermillion)] px-2 py-1 text-sm font-display font-semibold bg-[var(--color-washi-bright)]"
                />
                <input
                  value={it.aliases}
                  onChange={e => updateItem(idx, "aliases", e.target.value)}
                  placeholder="月、月球"
                  className="border border-[var(--color-ink)]/20 focus:outline-none focus:border-[var(--color-vermillion)] px-2 py-1 text-sm bg-[var(--color-washi-bright)]"
                />
                <input
                  value={it.hint}
                  onChange={e => updateItem(idx, "hint", e.target.value)}
                  placeholder="圓形帶陰影"
                  className="border border-[var(--color-ink)]/20 focus:outline-none focus:border-[var(--color-vermillion)] px-2 py-1 text-sm bg-[var(--color-washi-bright)]"
                />
                <button
                  onClick={() => removeItem(idx)}
                  className="px-2 text-[var(--color-vermillion)] hover:bg-[var(--color-vermillion)]/10 font-display font-bold"
                  aria-label="刪除此題"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        <button onClick={addItem} className="btn-paper w-full mb-3 text-xs">＋ 新 增 題 目</button>

        {error && (
          <div className="font-display text-sm text-[var(--color-vermillion)] tracking-wider mb-2">⚠ {error}</div>
        )}

        {/* 動作 */}
        <div className="flex flex-wrap gap-2 justify-end pt-4 border-t border-[var(--color-ink)]/10">
          {onDelete && (
            <button
              onClick={() => {
                if (window.confirm(`確定要刪除「${pack.label}」？`)) onDelete();
              }}
              className="font-display text-xs tracking-widest px-3 py-2 border-2 border-[var(--color-vermillion)]/50 text-[var(--color-vermillion)] hover:bg-[var(--color-vermillion)] hover:text-[var(--color-washi-bright)] transition"
            >
              刪 除
            </button>
          )}
          <button onClick={onCancel} className="btn-paper text-xs">取 消</button>
          <button onClick={handleSave} className="btn-seal text-xs px-8 py-2">儲 存</button>
        </div>
      </motion.div>
    </div>
  );
}
