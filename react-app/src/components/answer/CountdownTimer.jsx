import { motion } from "framer-motion";

// 答題倒數計時（浮世繪版）
export default function CountdownTimer({ timeLeft, total, resetKey }) {
  const isDanger = timeLeft <= 3;
  const isWarn = timeLeft <= 5 && timeLeft > 3;

  const color = isDanger
    ? "var(--color-vermillion)"
    : isWarn
      ? "var(--color-gold)"
      : "var(--color-ink)";

  return (
    <div className="mb-4">
      <div className="flex items-baseline justify-center gap-2 mb-2">
        <span
          className={`font-stamp text-5xl sm:text-6xl leading-none ${isDanger ? "animate-shake-ink" : ""}`}
          style={{ color }}
        >
          {timeLeft}
        </span>
        <span className="font-display text-sm tracking-widest text-[var(--color-ink-soft)]/70">秒</span>
      </div>
      {/* 進度條：墨色底 + 漸層條 */}
      <div className="relative h-1.5 bg-[var(--color-ink)]/15 overflow-hidden">
        <motion.div
          key={resetKey}
          className="absolute top-0 left-0 h-full w-full"
          style={{
            originX: 0,
            background: isDanger
              ? "linear-gradient(90deg, var(--color-vermillion), var(--color-vermillion-soft))"
              : "linear-gradient(90deg, var(--color-indigo), var(--color-vermillion))",
          }}
          initial={{ scaleX: 1 }}
          animate={{ scaleX: 0 }}
          transition={{ duration: total, ease: "linear" }}
        />
      </div>
    </div>
  );
}
