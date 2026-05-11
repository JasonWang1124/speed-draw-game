import { motion } from "framer-motion";

// 計分板：和紙卡 + 紅章編號 + 分數大字
export default function PlayerScoreboard({ players, playerNames, scores, highlightIdx = null, pulseIdx = null }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-2.5">
      {Array.from({ length: players }).map((_, i) => {
        const isActive = i === highlightIdx;
        const isPulse = i === pulseIdx;
        return (
          <motion.div
            key={i}
            animate={isPulse ? { scale: [1, 1.08, 1] } : {}}
            className="relative bg-[var(--color-washi-warm)] border-2 p-2 sm:p-3"
            style={{
              borderColor: isActive ? "var(--color-vermillion)" : "rgba(10, 10, 10, 0.3)",
              boxShadow: isActive ? "3px 3px 0 var(--color-vermillion)" : "2px 2px 0 rgba(10, 10, 10, 0.15)",
            }}
          >
            {/* 編號 */}
            <span
              className="absolute -top-2 -left-2 stamp-round"
              style={{ width: 24, height: 24, fontSize: 11 }}
            >
              {i + 1}
            </span>

            <div className="font-display text-xs tracking-wider text-[var(--color-ink-soft)] truncate pl-3">
              {playerNames[i]}
            </div>
            <div
              className="font-stamp text-2xl sm:text-3xl text-[var(--color-ink)] text-right leading-none mt-1"
              style={isPulse ? { color: "var(--color-vermillion)" } : undefined}
            >
              {scores[i]}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
