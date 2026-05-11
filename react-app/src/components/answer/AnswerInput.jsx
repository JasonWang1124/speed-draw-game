import { forwardRef } from "react";
import { motion } from "framer-motion";

// 答題輸入（浮世繪版）
const AnswerInput = forwardRef(function AnswerInput(
  { shakeKey, wrongCount, maxWrongs, attempts, onSubmit, onSkip },
  ref
) {
  const danger = wrongCount >= maxWrongs;
  return (
    <>
      {/* 錯誤次數 */}
      <div
        className={`text-center font-display text-xs tracking-[0.3em] mb-3 ${
          danger ? "text-[var(--color-vermillion)]" : "text-[var(--color-ink-soft)]/60"
        }`}
      >
        錯 誤 {wrongCount} / {maxWrongs}
      </div>

      <motion.input
        ref={ref}
        key={shakeKey}
        animate={shakeKey > 0 ? { x: [-10, 10, -6, 6, 0] } : {}}
        transition={{ duration: 0.4 }}
        type="text"
        placeholder="揮 毫 作 答　·　按 ENTER"
        autoComplete="off"
        autoCorrect="off"
        spellCheck="false"
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onSubmit();
          }
        }}
        className="w-full text-center font-display text-2xl sm:text-3xl font-semibold tracking-[0.15em] p-4 bg-[var(--color-washi-bright)] border-2 border-[var(--color-ink)] text-[var(--color-ink)] placeholder:text-[var(--color-ink-soft)]/30 placeholder:tracking-[0.2em] placeholder:font-display placeholder:text-base focus:bg-white focus:outline-none focus:border-[var(--color-vermillion)]"
        style={{ boxShadow: "3px 3px 0 var(--color-ink)" }}
      />

      <div className="flex gap-2 mt-4 justify-center">
        <button onClick={onSubmit} className="btn-seal flex-1 max-w-xs">送 出</button>
        <button onClick={onSkip} className="btn-paper">換 人</button>
      </div>

      {/* 已試過的錯答 */}
      {attempts.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-4 justify-center">
          {attempts.map((a, i) => (
            <span
              key={i}
              className="font-display text-xs tracking-wider px-3 py-1 bg-[var(--color-vermillion)]/10 text-[var(--color-vermillion)] border border-[var(--color-vermillion)]/30 line-through"
            >
              {a}
            </span>
          ))}
        </div>
      )}
    </>
  );
});

export default AnswerInput;
