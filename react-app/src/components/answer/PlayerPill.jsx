import { motion } from "framer-motion";

// 上方主答題者標籤（浮世繪版）
// 使用紅色印章感的橫條
export default function PlayerPill({ stage, activeName, pickingSteal, roundKey }) {
  if (pickingSteal) {
    return (
      <motion.div
        key={roundKey}
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring" }}
        className="font-display text-base sm:text-lg tracking-[0.4em] text-[var(--color-vermillion-dark)] px-6 py-2 bg-[var(--color-washi-warm)] border-2 border-dashed border-[var(--color-vermillion)]"
      >
        ─ 換 人 作 答 ─
      </motion.div>
    );
  }

  const isSteal = stage === "steal";
  return (
    <motion.div
      key={roundKey}
      initial={{ scale: 0.85, y: -8, opacity: 0 }}
      animate={{ scale: 1, y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 200 }}
      className="relative inline-flex items-center gap-3 px-7 py-2.5"
      style={{
        background: isSteal ? "var(--color-indigo)" : "var(--color-vermillion)",
        color: "var(--color-washi-bright)",
        boxShadow: `inset 0 0 0 3px var(--color-washi-bright), inset 0 0 0 4px ${
          isSteal ? "var(--color-indigo-dark)" : "var(--color-vermillion-dark)"
        }, 3px 3px 0 var(--color-ink)`,
      }}
    >
      <span className="font-stamp text-xl leading-none">招</span>
      <span className="font-display text-lg sm:text-xl font-semibold tracking-[0.15em]">
        {activeName}
      </span>
    </motion.div>
  );
}
