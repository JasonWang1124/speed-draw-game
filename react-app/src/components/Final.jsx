import { useEffect } from "react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { speak } from "../lib/tts";

const MEDALS = ["🥇", "🥈", "🥉"];

export default function Final({ playerNames, scores, useTTS, onRestart }) {
  const ranked = scores.map((pts, i) => ({ pts, i, name: playerNames[i] })).sort((a, b) => b.pts - a.pts);
  const winner = ranked[0];

  useEffect(() => {
    speak(`恭喜${winner.name}獲勝`, { disabled: !useTTS });
    // Massive confetti barrage
    const end = Date.now() + 2000;
    const frame = () => {
      confetti({ particleCount: 5, spread: 80, origin: { x: 0, y: 0.6 }, colors: ["#ff7a8a", "#ffd66e", "#b388ff", "#b6e2d3"] });
      confetti({ particleCount: 5, spread: 80, origin: { x: 1, y: 0.6 }, colors: ["#ff7a8a", "#ffd66e", "#b388ff", "#b6e2d3"] });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="min-h-screen flex flex-col items-center justify-center px-4 py-10"
    >
      <motion.div
        initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", duration: 1 }}
        className="text-9xl sm:text-[180px] mb-2"
      >
        🏆
      </motion.div>

      <p className="text-deep/60 font-bold tracking-widest mb-2">冠軍</p>
      <motion.h1
        initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, type: "spring" }}
        className="text-5xl sm:text-7xl font-black mb-1 text-center"
        style={{
          background: "linear-gradient(135deg, #ff7a8a, #ffd66e, #b388ff)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundSize: "200% 200%",
          animation: "wiggle 2s ease-in-out infinite",
        }}
      >
        {winner.name}
      </motion.h1>
      <div className="text-2xl font-black text-deep/70 mb-8">{winner.pts} 分</div>

      <div className="w-full max-w-md grid gap-3">
        {ranked.map((r, rank) => (
          <motion.div
            key={r.i}
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4 + rank * 0.1 }}
            className={`sticker p-4 flex items-center gap-3 ${rank === 0 ? "ring-4 ring-buttercup/60" : ""}`}
          >
            <div className="text-3xl sm:text-4xl">{MEDALS[rank] || `#${rank + 1}`}</div>
            <div className="flex-1">
              <div className="font-black text-lg sm:text-xl text-deep">{r.name}</div>
            </div>
            <div className="text-3xl sm:text-4xl font-black text-deep">{r.pts}</div>
          </motion.div>
        ))}
      </div>

      <motion.button
        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
        onClick={onRestart}
        className="btn-pop mt-10 text-xl"
      >
        🔄 再來一局
      </motion.button>
    </motion.div>
  );
}
