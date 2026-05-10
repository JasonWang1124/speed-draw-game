import { useState } from "react";
import {
  getCustomCategories,
  addCustomCategory,
  updateCustomCategory,
  deleteCustomCategory,
} from "../lib/questionBank";
import PackEditor from "./PackEditor";

// 自製題庫管理區（Setup 內的一個 Section）
// props:
//   onChanged: () => void   通知 App 重新讀題庫
export default function MyPacks({ onChanged }) {
  const [packs, setPacks] = useState(() => getCustomCategories());
  const [editing, setEditing] = useState(null); // { mode: "add"|"edit", pack }

  const refresh = () => {
    setPacks(getCustomCategories());
    onChanged?.();
  };

  const handleSave = (patch) => {
    if (editing.mode === "add") {
      addCustomCategory(patch);
    } else {
      updateCustomCategory(editing.pack.id, patch);
    }
    setEditing(null);
    refresh();
  };

  const handleDelete = () => {
    deleteCustomCategory(editing.pack.id);
    setEditing(null);
    refresh();
  };

  const startAdd = () => {
    setEditing({
      mode: "add",
      pack: { label: "", emoji: "📦", desc: "", items: [] },
    });
  };

  const startEdit = (pack) => {
    setEditing({ mode: "edit", pack });
  };

  return (
    <div>
      {packs.length === 0 ? (
        <p className="text-deep/60 text-sm mb-3">
          尚無自製題庫。點下方按鈕新增屬於你自己的題目（例如：同事暱稱、家裡物品、工作專案⋯⋯）
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
          {packs.map(p => (
            <PackRow key={p.id} pack={p} onEdit={() => startEdit(p)} />
          ))}
        </div>
      )}

      <button onClick={startAdd} className="btn-soft text-sm">
        ➕ 新增自製題庫
      </button>

      {editing && (
        <PackEditor
          pack={editing.pack}
          onSave={handleSave}
          onCancel={() => setEditing(null)}
          onDelete={editing.mode === "edit" ? handleDelete : null}
        />
      )}
    </div>
  );
}

function PackRow({ pack, onEdit }) {
  return (
    <button
      onClick={onEdit}
      className="text-left rounded-2xl p-3 border-2 border-deep/15 bg-white hover:border-deep/40 hover:scale-[1.01] transition shadow-[2px_2px_0_rgba(45,27,78,0.1)]"
    >
      <div className="font-black flex items-center gap-2">
        <span className="text-xl">{pack.emoji || "📦"}</span>
        <span className="truncate">{pack.label}</span>
        <span className="ml-auto text-xs font-mono text-deep/50">{pack.items.length} 題</span>
      </div>
      {pack.desc && <div className="text-xs text-deep/60 mt-1 truncate">{pack.desc}</div>}
      <div className="text-xs text-deep/40 mt-1">點擊編輯</div>
    </button>
  );
}
