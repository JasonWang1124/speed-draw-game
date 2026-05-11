import { forwardRef } from "react";
import { motion } from "framer-motion";

// 換人作答（浮世繪版）
const StealPanel = forwardRef(function StealPanel(
  { players, playerNames, mainPlayerIdx, stealTried, stealActiveIdx, onPick, onSubmit, onCancelPick, onGiveUp },
  ref
) {
  return (
    <>
      <div className="text-center mb-5">
        <div className="font-stamp text-3xl sm:text-4xl text-[var(--color-vermillion)] tracking-[0.2em] mb-1">
          換　人　作　答
        </div>
        <div className="font-display text-xs text-[var(--color-ink-soft)]/70 tracking-widest leading-relaxed">
          擇一選手作答（答對 +1，答錯該選手不能再選）
        </div>
      </div>

      {/* 選手選擇 */}
      <div className="flex flex-wrap gap-2 sm:gap-3 justify-center mb-5">
        {Array.from({ length: players }).map((_, i) => {
          if (i === mainPlayerIdx) return null;
          const tried = stealTried.has(i);
          const active = stealActiveIdx === i;
          return (
            <motion.button
              key={i}
              whileHover={!tried ? { y: -2 } : {}}
              whileTap={!tried ? { scale: 0.94 } : {}}
              onClick={() => onPick(i)}
              disabled={tried}
              className="relative px-5 py-2.5 font-display font-semibold text-base tracking-wider transition-all"
              style={{
                background: active
                  ? "var(--color-vermillion)"
                  : tried
                    ? "var(--color-washi-warm)"
                    : "var(--color-washi-bright)",
                color: active
                  ? "var(--color-washi-bright)"
                  : tried
                    ? "var(--color-ink-soft)/40"
                    : "var(--color-ink)",
                border: `2px solid ${tried ? "rgba(10,10,10,0.2)" : "var(--color-ink)"}`,
                boxShadow: active
                  ? "inset 0 0 0 3px var(--color-washi-bright), inset 0 0 0 4px var(--color-vermillion-dark), 3px 3px 0 var(--color-ink)"
                  : tried
                    ? "none"
                    : "2px 2px 0 var(--color-ink)",
                textDecoration: tried ? "line-through" : "none",
                opacity: tried ? 0.5 : 1,
              }}
            >
              {playerNames[i]}
            </motion.button>
          );
        })}
      </div>

      {/* 搶答者輸入 */}
      {stealActiveIdx != null && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <input
            ref={ref}
            type="text"
            placeholder={`${playerNames[stealActiveIdx]} 之答案`}
            autoComplete="off"
            autoCorrect="off"
            spellCheck="false"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onSubmit();
              }
            }}
            className="w-full text-center font-display text-xl sm:text-2xl font-semibold tracking-[0.15em] p-3.5 bg-[var(--color-washi-bright)] border-2 border-[var(--color-vermillion)] text-[var(--color-ink)] placeholder:text-[var(--color-ink-soft)]/30 focus:outline-none mt-2"
            style={{ boxShadow: "3px 3px 0 var(--color-vermillion)" }}
          />
          <div className="flex gap-2 mt-3 justify-center">
            <button onClick={onSubmit} className="btn-seal text-sm">送 出</button>
            <button onClick={onCancelPick} className="btn-paper text-sm">取 消</button>
          </div>
        </motion.div>
      )}

      <div className="text-center mt-5">
        <button
          onClick={onGiveUp}
          className="font-display text-xs tracking-[0.3em] text-[var(--color-ink-soft)]/60 hover:text-[var(--color-vermillion)] underline underline-offset-4 decoration-2 decoration-[var(--color-ink)]/20 hover:decoration-[var(--color-vermillion)] transition"
        >
          ─ 跳過 · 揭曉答案 ─
        </button>
      </div>
    </>
  );
});

export default StealPanel;
