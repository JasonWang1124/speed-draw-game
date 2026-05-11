import { useEffect, useRef, useState } from "react";
import {
  getCustomCategories,
  addCustomCategory,
  updateCustomCategory,
  deleteCustomCategory,
  mergeImportCustom,
} from "../lib/questionBank";
import {
  exportJSON,
  exportCSV,
  parseJSON,
  parseCSV,
  readFileAsText,
  buildShareURL,
} from "../lib/packIO";
import PackEditor from "./PackEditor";

// 自製題庫管理區（Setup 內的一個 Section）
// props:
//   onChanged: () => void   通知 App 重新讀題庫
export default function MyPacks({ onChanged, externalVersion = 0 }) {
  const [packs, setPacks] = useState(() => getCustomCategories());
  const [editing, setEditing] = useState(null); // { mode: "add"|"edit", pack }
  const [message, setMessage] = useState(null);  // { type: "ok"|"err", text }
  const fileInputRef = useRef(null);
  const [pendingFile, setPendingFile] = useState(null); // { type: "json"|"csv", text }

  // 外部（App 層）改動 localStorage（如分享匯入）時，重新從 storage 讀取
  useEffect(() => {
    setPacks(getCustomCategories());
  }, [externalVersion]);

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

  const showMsg = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleExportAllJSON = () => {
    const all = getCustomCategories();
    if (all.length === 0) {
      showMsg("err", "尚無自製題庫可匯出");
      return;
    }
    exportJSON(all, `speed-draw-packs-${dateStr()}.json`);
    showMsg("ok", `已匯出 ${all.length} 個題庫`);
  };

  const handleExportPackCSV = (pack) => {
    exportCSV(pack, `${pack.label}.csv`);
    showMsg("ok", `已匯出「${pack.label}」為 CSV`);
  };

  const handleSharePack = async (pack) => {
    try {
      const url = await buildShareURL(pack);
      // 連結太長提醒
      if (url.length > 4000) {
        showMsg("err", `連結超過 ${url.length} 字元，建議改用 JSON 匯出`);
        return;
      }
      try {
        await navigator.clipboard.writeText(url);
        showMsg("ok", `已複製分享連結（${url.length} 字元）到剪貼簿`);
      } catch {
        // 剪貼簿失敗：用 prompt 顯示讓使用者手動複製
        window.prompt("複製此連結分享給朋友：", url);
      }
    } catch (err) {
      showMsg("err", err.message || "產生分享連結失敗");
    }
  };

  const handlePickFile = () => fileInputRef.current?.click();

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // 允許重複選同一個檔案
    if (!file) return;
    try {
      const text = await readFileAsText(file);
      const isCSV = file.name.toLowerCase().endsWith(".csv");
      if (isCSV) {
        // CSV 需要使用者輸入分類名稱
        setPendingFile({ type: "csv", text, suggestedLabel: file.name.replace(/\.csv$/i, "") });
      } else {
        // JSON：直接合併匯入
        const cats = parseJSON(text);
        const after = mergeImportCustom(cats);
        showMsg("ok", `已匯入，目前共 ${after.length} 個題庫`);
        refresh();
      }
    } catch (err) {
      showMsg("err", err.message || "匯入失敗");
    }
  };

  const confirmCSVImport = (label, emoji) => {
    try {
      const cat = parseCSV(pendingFile.text, { label, emoji });
      mergeImportCustom([cat]);
      setPendingFile(null);
      showMsg("ok", `已從 CSV 匯入「${label}」（${cat.items.length} 題）`);
      refresh();
    } catch (err) {
      showMsg("err", err.message || "CSV 匯入失敗");
    }
  };

  return (
    <div>
      {packs.length === 0 ? (
        <p className="text-[var(--color-ink-soft)]/70 text-sm leading-relaxed mb-4">
          尚無自製題庫。點下方按鈕新增屬於你自己的題目（例如：同事暱稱、家裡物品、工作專案⋯⋯）
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-4">
          {packs.map(p => (
            <PackRow
              key={p.id}
              pack={p}
              onEdit={() => startEdit(p)}
              onExportCSV={() => handleExportPackCSV(p)}
              onShare={() => handleSharePack(p)}
            />
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button onClick={startAdd} className="btn-paper-accent text-xs">
          ＋ 新 增 題 庫
        </button>
        <button onClick={handlePickFile} className="btn-paper text-xs">
          匯 入 JSON / CSV
        </button>
        <button onClick={handleExportAllJSON} className="btn-paper text-xs" disabled={packs.length === 0}>
          匯 出 全 部
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json,.csv,application/json,text/csv"
        className="hidden"
        onChange={handleFileChange}
      />

      {message && (
        <div
          className={`mt-3 px-3 py-2 text-sm font-display border-l-4 ${
            message.type === "ok"
              ? "bg-[var(--color-indigo)]/10 border-[var(--color-indigo)] text-[var(--color-indigo-dark)]"
              : "bg-[var(--color-vermillion)]/10 border-[var(--color-vermillion)] text-[var(--color-vermillion-dark)]"
          }`}
        >
          {message.type === "ok" ? "✓ " : "⚠ "}
          {message.text}
        </div>
      )}

      {editing && (
        <PackEditor
          pack={editing.pack}
          onSave={handleSave}
          onCancel={() => setEditing(null)}
          onDelete={editing.mode === "edit" ? handleDelete : null}
        />
      )}

      {pendingFile?.type === "csv" && (
        <CSVImportDialog
          suggestedLabel={pendingFile.suggestedLabel}
          onConfirm={confirmCSVImport}
          onCancel={() => setPendingFile(null)}
        />
      )}
    </div>
  );
}

function dateStr() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
}

function CSVImportDialog({ suggestedLabel, onConfirm, onCancel }) {
  const [label, setLabel] = useState(suggestedLabel || "");
  const [emoji, setEmoji] = useState("📦");
  return (
    <div className="fixed inset-0 z-50 bg-[var(--color-ink)]/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="washi-card w-full max-w-md p-6">
        <div className="flex items-baseline gap-2 mb-4">
          <span className="font-stamp text-2xl text-[var(--color-vermillion)]">印</span>
          <h3 className="font-display text-lg font-semibold tracking-widest">匯入 CSV</h3>
          <span className="text-xs tracking-widest text-[var(--color-ink-soft)]/60 ml-1">SET LABEL</span>
        </div>
        <div className="flex gap-2 mb-4">
          <input
            value={emoji}
            onChange={e => setEmoji(e.target.value)}
            maxLength={4}
            className="w-14 text-center text-2xl border-2 border-[var(--color-ink)]/30 bg-[var(--color-washi-bright)] p-2 focus:outline-none focus:border-[var(--color-vermillion)]"
          />
          <input
            value={label}
            onChange={e => setLabel(e.target.value)}
            placeholder="分類名稱"
            className="flex-1 border-2 border-[var(--color-ink)]/30 bg-[var(--color-washi-bright)] p-2 font-display font-semibold focus:outline-none focus:border-[var(--color-vermillion)]"
          />
        </div>
        <div className="flex gap-2 justify-end">
          <button onClick={onCancel} className="btn-paper text-xs">取 消</button>
          <button
            onClick={() => label.trim() && onConfirm(label.trim(), emoji.trim() || "📦")}
            disabled={!label.trim()}
            className="btn-seal text-xs px-6 py-2"
          >
            匯 入
          </button>
        </div>
      </div>
    </div>
  );
}

function PackRow({ pack, onEdit, onExportCSV, onShare }) {
  return (
    <div className="relative bg-[var(--color-washi-warm)] border-2 border-[var(--color-ink)]/40 p-3 pl-4 hover:shadow-[3px_3px_0_var(--color-vermillion)] hover:border-[var(--color-ink)] transition">
      <span className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--color-vermillion)]"></span>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xl">{pack.emoji || "📦"}</span>
        <span className="font-display font-semibold tracking-wider truncate text-[var(--color-ink)]">{pack.label}</span>
        <span className="ml-auto font-stamp text-xs tracking-widest text-[var(--color-vermillion)]">{pack.items.length} 題</span>
      </div>
      {pack.desc && (
        <div className="text-xs text-[var(--color-ink-soft)]/70 mb-2 truncate leading-relaxed">
          {pack.desc}
        </div>
      )}
      <div className="flex gap-1.5 mt-2">
        <button
          onClick={onEdit}
          className="flex-1 font-display text-xs tracking-widest px-2 py-1 border border-[var(--color-ink)]/30 hover:bg-[var(--color-ink)] hover:text-[var(--color-washi-bright)] transition"
        >
          編 輯
        </button>
        <button
          onClick={onExportCSV}
          className="font-display text-xs tracking-widest px-2 py-1 border border-[var(--color-ink)]/30 hover:bg-[var(--color-ink)] hover:text-[var(--color-washi-bright)] transition"
          title="匯出為 CSV"
        >
          CSV
        </button>
        <button
          onClick={onShare}
          className="font-display text-xs tracking-widest px-2 py-1 border border-[var(--color-ink)]/30 hover:bg-[var(--color-vermillion)] hover:border-[var(--color-vermillion)] hover:text-[var(--color-washi-bright)] transition"
          title="複製分享連結"
        >
          分 享
        </button>
      </div>
    </div>
  );
}
