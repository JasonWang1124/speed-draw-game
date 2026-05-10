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
        className="bg-cream w-full max-w-2xl rounded-3xl shadow-[6px_6px_0_#2d1b4e] border-3 border-deep p-5 sm:p-6 my-8"
      >
        <h3 className="text-xl sm:text-2xl font-black mb-4 flex items-center gap-2">
          <span className="text-2xl">📝</span>
          {onDelete ? "編輯題庫" : "新增題庫"}
        </h3>

        {/* 分類資訊 */}
        <div className="grid grid-cols-[auto_1fr] sm:grid-cols-[auto_1fr_auto] gap-2 mb-4">
          <input
            value={emoji}
            onChange={e => setEmoji(e.target.value)}
            placeholder="📦"
            maxLength={4}
            className="w-14 text-center text-2xl rounded-xl border-2 border-deep/15 bg-white p-2"
          />
          <input
            value={label}
            onChange={e => setLabel(e.target.value)}
            placeholder="分類名稱（例：我家的物品）"
            maxLength={30}
            className="rounded-xl border-2 border-deep/15 bg-white p-2 font-bold"
          />
          <input
            value={desc}
            onChange={e => setDesc(e.target.value)}
            placeholder="說明（可空）"
            maxLength={50}
            className="col-span-2 sm:col-span-1 rounded-xl border-2 border-deep/15 bg-white p-2 text-sm"
          />
        </div>

        {/* 題目列表 */}
        <div className="border-2 border-deep/10 rounded-2xl bg-white overflow-hidden mb-3">
          <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-1 px-2 py-1 bg-deep/5 text-xs font-bold text-deep/60 sticky top-0">
            <div>題目名稱</div>
            <div>別名（、分隔）</div>
            <div>提示</div>
            <div></div>
          </div>
          <div className="max-h-[40vh] overflow-y-auto">
            {items.length === 0 && (
              <div className="text-center text-deep/50 py-6 text-sm">尚無題目，按下方「+ 新增題目」</div>
            )}
            {items.map((it, idx) => (
              <div key={idx} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-1 p-1 border-t border-deep/5">
                <input
                  value={it.name}
                  onChange={e => updateItem(idx, "name", e.target.value)}
                  placeholder="例：月亮"
                  className="rounded-lg border border-deep/15 px-2 py-1 text-sm font-bold bg-white"
                />
                <input
                  value={it.aliases}
                  onChange={e => updateItem(idx, "aliases", e.target.value)}
                  placeholder="月、月球"
                  className="rounded-lg border border-deep/15 px-2 py-1 text-sm bg-white"
                />
                <input
                  value={it.hint}
                  onChange={e => updateItem(idx, "hint", e.target.value)}
                  placeholder="圓形帶陰影"
                  className="rounded-lg border border-deep/15 px-2 py-1 text-sm bg-white"
                />
                <button
                  onClick={() => removeItem(idx)}
                  className="px-2 text-coral hover:bg-coral/10 rounded-lg font-bold"
                  aria-label="刪除此題"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        <button onClick={addItem} className="btn-soft w-full mb-3 text-sm">+ 新增題目</button>

        {error && (
          <div className="text-coral font-bold text-sm mb-2">⚠️ {error}</div>
        )}

        {/* 動作 */}
        <div className="flex flex-wrap gap-2 justify-end">
          {onDelete && (
            <button
              onClick={() => {
                if (window.confirm(`確定要刪除「${pack.label}」？`)) onDelete();
              }}
              className="btn-soft text-sm text-coral border-coral/30"
            >
              🗑 刪除
            </button>
          )}
          <button onClick={onCancel} className="btn-soft text-sm">取消</button>
          <button onClick={handleSave} className="btn-pop text-sm px-5">儲存</button>
        </div>
      </motion.div>
    </div>
  );
}
