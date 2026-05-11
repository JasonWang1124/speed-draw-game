import { motion } from "framer-motion";

// 揭曉答案卡片（浮世繪版）
export default function ResultCard({ resultKind, scoredPlayerName, answer, isLast, onNext }) {
  const correct = resultKind === "correct";
  return (
    <div className="text-center">
      {/* 大印章效果 */}
      <motion.div
        initial={{ scale: 0, rotate: 0, opacity: 0 }}
        animate={{ scale: 1, rotate: -6, opacity: 1 }}
        transition={{ type: "spring", stiffness: 180, damping: 12 }}
        className="inline-flex flex-col items-center mb-4"
      >
        <div
          className="font-stamp text-7xl sm:text-8xl px-8 py-2 leading-none"
          style={{
            color: "var(--color-washi-bright)",
            background: correct ? "var(--color-vermillion)" : "var(--color-ink)",
            boxShadow: `inset 0 0 0 3px var(--color-washi-bright), inset 0 0 0 4px ${
              correct ? "var(--color-vermillion-dark)" : "var(--color-ink-soft)"
            }`,
          }}
        >
          {correct ? "中" : "敗"}
        </div>
      </motion.div>

      <div className="font-display text-sm tracking-[0.3em] text-[var(--color-ink-soft)]/70 mb-2">
        {correct ? `${scoredPlayerName}　答　對　了` : "─　無　人　答　對　─"}
      </div>

      {/* 答案大字 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="font-stamp text-5xl sm:text-7xl text-[var(--color-ink)] tracking-[0.15em] my-6"
      >
        {answer.name}
      </motion.div>

      {/* 提示 */}
      {answer.hint && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="font-display text-sm sm:text-base text-[var(--color-ink-soft)]/75 tracking-wider px-4"
        >
          ─ {answer.hint} ─
        </motion.div>
      )}

      <motion.button
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        onClick={onNext}
        className="btn-seal mt-8 px-10"
      >
        {isLast ? "看 結 算" : "下 一 題"}
      </motion.button>
    </div>
  );
}
