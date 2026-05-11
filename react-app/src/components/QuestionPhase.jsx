import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { speakNow, cancelAllSpeech } from "../lib/tts";
import { sleep } from "../lib/util";

export default function QuestionPhase({ questions, intervalMs, useTTS, onDone }) {
  const [idx, setIdx] = useState(-1); // -1 = countdown phase
  const [count, setCount] = useState(3);
  const stoppedRef = useRef(false);

  useEffect(() => {
    stoppedRef.current = false;
    (async () => {
      // 倒數：每秒一個數字 + GO!
      for (let n = 3; n >= 1; n--) {
        if (stoppedRef.current) return;
        setCount(n);
        await Promise.all([
          speakNow(String(n), { disabled: !useTTS }),
          sleep(700),
        ]);
      }
      if (stoppedRef.current) return;
      setCount(0);
      await Promise.all([
        speakNow("開始", { disabled: !useTTS }),
        sleep(500),
      ]);

      // 出題：每題保證至少念完才進下一題，避免 Chrome speech queue 累積導致跳字
      for (let i = 0; i < questions.length; i++) {
        if (stoppedRef.current) return;
        setIdx(i);
        await Promise.all([
          speakNow(questions[i].name, { disabled: !useTTS }),
          sleep(intervalMs),
        ]);
      }
      if (!stoppedRef.current) onDone();
    })();
    return () => {
      stoppedRef.current = true;
      cancelAllSpeech();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (idx === -1) {
    // countdown
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-deep/60 font-bold mb-4 tracking-widest">準備出題</p>
          <AnimatePresence mode="wait">
            <motion.div
              key={count}
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.4, opacity: 0 }}
              transition={{ duration: 0.4, type: "spring" }}
              className="text-[180px] sm:text-[240px] font-black leading-none"
              style={{
                background: "linear-gradient(135deg, #ff7a8a, #b388ff)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {count === 0 ? "GO!" : count}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      {/* Progress */}
      <div className="text-deep/60 font-bold mb-6 tracking-widest text-sm sm:text-base">
        第 {idx + 1} / {questions.length} 題
      </div>

      {/* Speaker pulse — 只播聲音不顯示文字 */}
      <motion.div
        key={idx}
        initial={{ scale: 0.6, opacity: 0, rotate: -10 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 200 }}
        className="text-center mb-10"
      >
        <div className="text-[140px] sm:text-[200px] leading-none animate-pulse-glow">
          🔊
        </div>
        <div className="mt-6 text-2xl sm:text-3xl font-black tracking-widest text-deep/70">
          仔細聽
        </div>
      </motion.div>

      {/* Countdown bar */}
      <div className="w-full max-w-md">
        <div className="h-3 rounded-full bg-deep/10 overflow-hidden border-2 border-deep/15">
          <motion.div
            key={idx}
            className="h-full bg-gradient-to-r from-coral to-grape"
            initial={{ scaleX: 1 }}
            animate={{ scaleX: 0 }}
            transition={{ duration: intervalMs / 1000, ease: "linear" }}
            style={{ originX: 0 }}
          />
        </div>
      </div>

      {/* Replay button — user gesture 觸發最穩，可重念當前題 */}
      {useTTS && (
        <button
          onClick={() => speakNow(questions[idx].name)}
          className="btn-soft text-sm mt-6"
          aria-label="重播語音"
        >
          🔁 重播語音
        </button>
      )}
    </div>
  );
}
