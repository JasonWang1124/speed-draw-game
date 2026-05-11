import { useEffect } from "react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { speak } from "../lib/tts";
import heroVictory from "../assets/hero-victory.png";

const RANK_LABELS = ["金", "銀", "銅"];

export default function Final({ playerNames, scores, useTTS, onRestart }) {
  const ranked = scores
    .map((pts, i) => ({ pts, i, name: playerNames[i] }))
    .sort((a, b) => b.pts - a.pts);
  const winner = ranked[0];

  useEffect(() => {
    speak(`恭喜${winner.name}凱旋`, { disabled: !useTTS });
    // 朱紅金墨色彩屑（呼應浮世繪配色）
    const end = Date.now() + 2200;
    const frame = () => {
      confetti({
        particleCount: 4,
        spread: 70,
        origin: { x: 0, y: 0.55 },
        colors: ["#d4391c", "#1a3a5c", "#c8a04a", "#0a0a0a"],
      });
      confetti({
        particleCount: 4,
        spread: 70,
        origin: { x: 1, y: 0.55 },
        colors: ["#d4391c", "#1a3a5c", "#c8a04a", "#0a0a0a"],
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
    >
      {/* Hero: 旭日雙鶴 */}
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        className="relative mb-4"
      >
        <img
          src={heroVictory}
          alt="凱旋"
          className="w-64 sm:w-80 animate-hero-float"
          style={{ filter: "drop-shadow(0 16px 32px rgba(212, 57, 28, 0.25))" }}
        />
      </motion.div>

      {/* 凱旋標題 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-center mb-2"
      >
        <div className="font-stamp text-xs tracking-[0.5em] text-[var(--color-vermillion)] mb-1">
          ─　凱　旋　─
        </div>
        <h1 className="font-stamp text-5xl sm:text-7xl tracking-[0.15em] text-[var(--color-ink)]">
          {winner.name}
        </h1>
      </motion.div>

      {/* 分數 */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="flex items-baseline gap-2 mb-10"
      >
        <span className="font-stamp text-5xl sm:text-6xl text-[var(--color-vermillion)] leading-none">
          {winner.pts}
        </span>
        <span className="font-display text-base tracking-widest text-[var(--color-ink-soft)]/70">分</span>
      </motion.div>

      {/* 名次榜 */}
      <div className="w-full max-w-md space-y-2.5">
        {ranked.map((r, rank) => (
          <motion.div
            key={r.i}
            initial={{ x: -30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.55 + rank * 0.08 }}
            className="relative bg-[var(--color-washi-warm)] border-2 p-4 flex items-center gap-4"
            style={{
              borderColor: rank === 0 ? "var(--color-vermillion)" : "rgba(10, 10, 10, 0.3)",
              boxShadow:
                rank === 0
                  ? "4px 4px 0 var(--color-vermillion)"
                  : "2px 2px 0 rgba(10, 10, 10, 0.2)",
            }}
          >
            {/* 名次印章 */}
            <div
              className="font-stamp text-2xl leading-none flex items-center justify-center w-12 h-12"
              style={{
                color: "var(--color-washi-bright)",
                background:
                  rank === 0
                    ? "var(--color-vermillion)"
                    : rank === 1
                      ? "var(--color-gold)"
                      : rank === 2
                        ? "var(--color-indigo)"
                        : "var(--color-ink)",
                boxShadow:
                  "inset 0 0 0 2px var(--color-washi-bright), inset 0 0 0 3px rgba(0,0,0,0.4)",
              }}
            >
              {RANK_LABELS[rank] || rank + 1}
            </div>

            {/* 名字 */}
            <div className="flex-1">
              <div className="font-display font-semibold text-lg sm:text-xl tracking-[0.1em] text-[var(--color-ink)]">
                {r.name}
              </div>
              <div className="font-display text-xs tracking-[0.3em] text-[var(--color-ink-soft)]/50">
                第 {rank + 1} 位
              </div>
            </div>

            {/* 分數 */}
            <div className="text-right">
              <div className="font-stamp text-3xl leading-none text-[var(--color-ink)]">{r.pts}</div>
              <div className="font-display text-xs tracking-widest text-[var(--color-ink-soft)]/50">分</div>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55 + ranked.length * 0.08 + 0.2 }}
        onClick={onRestart}
        className="btn-seal mt-10 px-12 py-4"
      >
        再 開 一 局
      </motion.button>

      <div className="mt-6 font-display text-xs tracking-[0.5em] text-[var(--color-ink-soft)]/40">
        ／　謝　幕　／
      </div>
    </motion.div>
  );
}
