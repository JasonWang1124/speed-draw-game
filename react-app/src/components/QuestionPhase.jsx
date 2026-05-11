import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { speakNow, cancelAllSpeech } from "../lib/tts";
import { sleep } from "../lib/util";
import heroBell from "../assets/hero-bell.png";

// 阿拉伯數字 → 漢字數字（題數顯示用）
function chineseNum(n) {
  const digits = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九"];
  if (n < 10) return digits[n];
  if (n < 20) return n === 10 ? "十" : "十" + digits[n - 10];
  const tens = Math.floor(n / 10);
  const ones = n % 10;
  return digits[tens] + "十" + (ones ? digits[ones] : "");
}

const QUESTION_TTS_RATE = 1.35;

function estimateQuestionDuration(text, baseMs, useTTS) {
  if (!useTTS || !text) return baseMs;
  const charCount = Array.from(text).filter(ch => ch.trim()).length;
  const estimatedMs = 500 + charCount * 260;
  return Math.max(baseMs, Math.min(5200, estimatedMs));
}

export default function QuestionPhase({ questions, intervalMs, useTTS, onDone }) {
  const [idx, setIdx] = useState(-1); // -1 = countdown phase
  const [count, setCount] = useState(3);
  const [questionDurationMs, setQuestionDurationMs] = useState(intervalMs);
  const runIdRef = useRef(0);

  useEffect(() => {
    const runId = runIdRef.current + 1;
    runIdRef.current = runId;
    const isStale = () => runIdRef.current !== runId;

    (async () => {
      // 倒數：每秒一個數字 + GO!
      for (let n = 3; n >= 1; n--) {
        if (isStale()) return;
        setCount(n);
        speakNow(String(n), { disabled: !useTTS, rate: QUESTION_TTS_RATE });
        await sleep(700);
      }
      if (isStale()) return;
      setCount(0);
      speakNow("開始", { disabled: !useTTS, rate: QUESTION_TTS_RATE });
      await sleep(500);

      // 出題節奏以設定秒數為底線，TTS 開啟時長題會自動加一點時間避免被下一題切斷。
      for (let i = 0; i < questions.length; i++) {
        if (isStale()) return;
        const questionText = questions[i]?.name?.trim();
        const durationMs = estimateQuestionDuration(questionText, intervalMs, useTTS);
        setQuestionDurationMs(durationMs);
        setIdx(i);
        speakNow(questionText, { disabled: !useTTS, rate: QUESTION_TTS_RATE });
        await sleep(durationMs);
      }
      if (!isStale()) onDone();
    })();
    return () => {
      if (runIdRef.current === runId) runIdRef.current += 1;
      cancelAllSpeech();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (idx === -1) {
    const numerals = ["零", "壹", "貳", "參"];
    const displayChar = count === 0 ? "始" : numerals[count];
    const isStart = count === 0;
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center">
          <p className="font-display text-xs sm:text-sm tracking-[0.6em] text-[var(--color-ink-soft)]/70 mb-10">
            ─　準　備　出　題　─
          </p>
          <AnimatePresence mode="wait">
            <motion.div
              key={count}
              initial={{ scale: 0.3, opacity: 0, rotate: -8 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 1.6, opacity: 0, rotate: 6 }}
              transition={{ duration: 0.5, type: "spring", stiffness: 180 }}
              className="relative inline-block"
            >
              <span
                className="font-stamp text-[220px] sm:text-[320px] leading-none block"
                style={{
                  color: isStart ? "var(--color-vermillion)" : "var(--color-ink)",
                  textShadow: isStart
                    ? "6px 6px 0 var(--color-ink)"
                    : "5px 5px 0 rgba(212, 57, 28, 0.4)",
                }}
              >
                {displayChar}
              </span>
              {isStart && (
                <motion.div
                  initial={{ scale: 0, rotate: 0 }}
                  animate={{ scale: 1, rotate: -8 }}
                  transition={{ delay: 0.25, type: "spring" }}
                  className="absolute -top-4 -right-2 sm:-right-8 stamp-round"
                  style={{ width: 72, height: 72, fontSize: 28 }}
                >
                  始
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 relative">
      {/* 題數標記 */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-10 left-1/2 -translate-x-1/2 flex items-center gap-2"
      >
        <span className="font-stamp text-xl text-[var(--color-vermillion)] leading-none">第</span>
        <span className="font-stamp text-2xl text-[var(--color-ink)] leading-none">
          {chineseNum(idx + 1)}
        </span>
        <span className="font-stamp text-xl text-[var(--color-vermillion)] leading-none">題</span>
        <span className="font-display text-xs tracking-[0.3em] text-[var(--color-ink-soft)]/50 ml-3">
          / {questions.length}
        </span>
      </motion.div>

      {/* Hero: 鈴鐺 + 聲波同心圓 */}
      <motion.div
        key={idx}
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative mb-10"
      >
        {/* 聲波同心圓（背景動畫） */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none -z-10">
          <SoundRipples />
        </div>

        {/* 鈴鐺插畫 */}
        <div className="relative animate-hero-float">
          <img
            src={heroBell}
            alt="聽聲"
            className="w-64 sm:w-80 relative z-10"
            style={{ filter: "drop-shadow(0 12px 24px rgba(26, 58, 92, 0.3))" }}
          />
        </div>
      </motion.div>

      {/* 「仔細聆聽」標語 */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="font-stamp text-3xl sm:text-4xl text-[var(--color-ink)] tracking-[0.4em] mb-2"
      >
        仔　細　聆　聽
      </motion.div>
      <div className="font-display text-xs tracking-[0.5em] text-[var(--color-ink-soft)]/60 mb-10">
        LISTEN CAREFULLY
      </div>

      {/* Countdown bar */}
      <div className="w-full max-w-md">
        <div className="relative h-2 bg-[var(--color-ink)]/15 overflow-hidden">
          <motion.div
            key={idx}
            className="absolute top-0 left-0 h-full w-full"
            style={{
              background: "linear-gradient(to right, var(--color-vermillion), var(--color-indigo))",
              originX: 0,
            }}
            initial={{ scaleX: 1 }}
            animate={{ scaleX: 0 }}
            transition={{ duration: questionDurationMs / 1000, ease: "linear" }}
          />
        </div>
      </div>

      {/* Replay button */}
      {useTTS && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          onClick={() => speakNow(questions[idx].name, { rate: QUESTION_TTS_RATE })}
          className="btn-paper text-xs mt-8"
          aria-label="重播語音"
        >
          ⟲ 重 播 語 音
        </motion.button>
      )}
    </div>
  );
}

// 同心圓聲波（純 CSS 動畫，跟著題目換而 ripple 重來）
function SoundRipples() {
  const sizes = [380, 380, 380];
  return (
    <>
      {sizes.map((s, i) => (
        <div
          key={i}
          className="absolute rounded-full border-2"
          style={{
            width: s,
            height: s,
            borderColor: i % 2 === 0 ? "rgba(212, 57, 28, 0.5)" : "rgba(26, 58, 92, 0.4)",
            animation: "ripple-out 2.4s cubic-bezier(0.22, 1, 0.36, 1) infinite",
            animationDelay: `${i * 0.8}s`,
          }}
        />
      ))}
    </>
  );
}
