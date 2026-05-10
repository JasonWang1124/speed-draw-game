import { motion } from "framer-motion";

// 顯示「有人分享一個題庫給你，要不要匯入？」的確認對話框
// props:
//   pack: { label, emoji, desc, items }
//   onAccept / onDecline
export default function ShareImportDialog({ pack, onAccept, onDecline }) {
  const previewItems = pack.items.slice(0, 6);
  const more = pack.items.length - previewItems.length;

  return (
    <div className="fixed inset-0 z-50 bg-deep/40 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-cream w-full max-w-md rounded-3xl shadow-[6px_6px_0_#2d1b4e] border-3 border-deep p-5 sm:p-6"
      >
        <div className="text-center mb-3">
          <div className="text-5xl mb-2">{pack.emoji || "📦"}</div>
          <h3 className="text-xl font-black">收到分享題庫</h3>
          <p className="text-deep/60 text-sm mt-1">
            有人透過連結分享一份自製題庫給你
          </p>
        </div>

        <div className="rounded-2xl border-2 border-deep/15 bg-white p-3 mb-4">
          <div className="font-black text-lg flex items-center gap-2">
            <span>{pack.emoji || "📦"}</span>
            <span className="truncate">{pack.label}</span>
            <span className="ml-auto text-xs font-mono text-deep/50">
              {pack.items.length} 題
            </span>
          </div>
          {pack.desc && <div className="text-xs text-deep/60 mt-1">{pack.desc}</div>}
          <div className="flex flex-wrap gap-1 mt-2">
            {previewItems.map((it, i) => (
              <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-deep/5 text-deep/80">
                {it.name}
              </span>
            ))}
            {more > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-deep/5 text-deep/50">
                ＋還有 {more} 題
              </span>
            )}
          </div>
        </div>

        <p className="text-xs text-deep/60 mb-3">
          匯入後會出現在「我的題庫」中，可以隨時刪除。同名題庫會自動合併新題目。
        </p>

        <div className="flex gap-2 justify-end">
          <button onClick={onDecline} className="btn-soft text-sm">取消</button>
          <button onClick={onAccept} className="btn-pop text-sm px-5">📥 匯入</button>
        </div>
      </motion.div>
    </div>
  );
}
