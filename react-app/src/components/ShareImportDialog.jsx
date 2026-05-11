import { motion } from "framer-motion";

// 收到分享題庫的確認對話框（浮世繪版）
export default function ShareImportDialog({ pack, onAccept, onDecline }) {
  const previewItems = pack.items.slice(0, 6);
  const more = pack.items.length - previewItems.length;

  return (
    <div className="fixed inset-0 z-50 bg-[var(--color-ink)]/45 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="washi-card w-full max-w-md p-7"
      >
        <div className="text-center mb-5 pb-4 border-b border-[var(--color-ink)]/15">
          <div className="text-5xl mb-2">{pack.emoji || "📦"}</div>
          <div className="font-stamp text-xs tracking-[0.4em] text-[var(--color-vermillion)] mb-1">
            ─ 訪 客 來 信 ─
          </div>
          <h3 className="font-display text-xl font-semibold tracking-[0.15em]">收到分享題庫</h3>
          <p className="text-[var(--color-ink-soft)]/70 text-xs mt-2 tracking-wider">
            有人透過連結分享一份自製題庫給你
          </p>
        </div>

        <div className="bg-[var(--color-washi-warm)] border-2 border-[var(--color-ink)]/30 p-3 mb-4 relative">
          <span className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--color-vermillion)]"></span>
          <div className="font-display font-semibold flex items-center gap-2 tracking-wider pl-2">
            <span className="text-xl">{pack.emoji || "📦"}</span>
            <span className="truncate text-[var(--color-ink)]">{pack.label}</span>
            <span className="ml-auto font-stamp text-xs tracking-widest text-[var(--color-vermillion)]">
              {pack.items.length} 題
            </span>
          </div>
          {pack.desc && (
            <div className="text-xs text-[var(--color-ink-soft)]/70 mt-1 pl-2">{pack.desc}</div>
          )}
          <div className="flex flex-wrap gap-1 mt-3 pl-2">
            {previewItems.map((it, i) => (
              <span key={i} className="font-display text-xs px-2 py-0.5 bg-[var(--color-washi-bright)] border border-[var(--color-ink)]/20 tracking-wider">
                {it.name}
              </span>
            ))}
            {more > 0 && (
              <span className="font-display text-xs px-2 py-0.5 text-[var(--color-ink-soft)]/60 tracking-wider">
                ＋還有 {more} 題
              </span>
            )}
          </div>
        </div>

        <p className="text-xs text-[var(--color-ink-soft)]/70 mb-4 leading-relaxed">
          匯入後會出現在「我的題庫」中，可隨時刪除。同名題庫會自動合併新題目。
        </p>

        <div className="flex gap-2 justify-end">
          <button onClick={onDecline} className="btn-paper text-xs">取 消</button>
          <button onClick={onAccept} className="btn-seal text-xs px-8 py-2.5">匯 入</button>
        </div>
      </motion.div>
    </div>
  );
}
