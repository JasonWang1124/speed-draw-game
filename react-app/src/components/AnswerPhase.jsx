import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { speak, cancelAllSpeech } from "../lib/tts";
import { normalize } from "../lib/util";

const COLORS = ["#ffb4a2", "#ffd66e", "#b6e2d3", "#a8dadc", "#b388ff", "#ff7a8a", "#ffafcc", "#bde0fe", "#caffbf", "#ffd6a5"];

export default function AnswerPhase({ config, questions, answerOrder, answerAssign, onComplete }) {
  const { players, playerNames, answerSec, maxWrongs, useTTS } = config;
  const [scores, setScores] = useState(() => Array(players).fill(0));
  const [scoreMatrix, setScoreMatrix] = useState(() => questions.map(() => Array(players).fill(null)));
  const [stage, setStage] = useState("answering"); // answering | steal | result
  const [round, setRound] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [attempts, setAttempts] = useState([]);
  const [stealTried, setStealTried] = useState(new Set()); // playerIdx
  const [stealActiveIdx, setStealActiveIdx] = useState(null);
  const [resultKind, setResultKind] = useState(null); // "correct" | "gaveup"
  const [scoredPlayer, setScoredPlayer] = useState(null);
  const [shake, setShake] = useState(0);
  const [timeLeft, setTimeLeft] = useState(answerSec);
  const inputRef = useRef(null);
  const stealInputRef = useRef(null);
  const timerRef = useRef(null);
  const endAtRef = useRef(0);

  const qIdx = answerOrder[round];
  const q = questions[qIdx];
  const mainPlayerIdx = answerAssign[round];

  // 進入新題：重置一切並念出
  useEffect(() => {
    setStage("answering");
    setWrongCount(0);
    setAttempts([]);
    setStealTried(new Set());
    setStealActiveIdx(null);
    setResultKind(null);
    setScoredPlayer(null);
    cancelAllSpeech();
    speak(`請${playerNames[mainPlayerIdx]}回答第 ${qIdx + 1} 題`, { disabled: !useTTS });
    startTimer();
    setTimeout(() => inputRef.current?.focus(), 200);
    return () => { stopTimer(); cancelAllSpeech(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round]);

  function startTimer() {
    stopTimer();
    endAtRef.current = Date.now() + answerSec * 1000;
    setTimeLeft(answerSec);
    timerRef.current = setInterval(() => {
      const left = Math.max(0, Math.ceil((endAtRef.current - Date.now()) / 1000));
      setTimeLeft(left);
      if (left <= 0) {
        stopTimer();
        registerWrong("⌛時間到");
      }
    }, 100);
  }
  function stopTimer() {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }

  function setScore(playerIdx, points) {
    setScoreMatrix(prev => {
      const copy = prev.map(row => [...row]);
      const old = copy[qIdx][playerIdx];
      copy[qIdx][playerIdx] = points;
      setScores(s => {
        const ns = [...s];
        if (old != null) ns[playerIdx] -= old;
        ns[playerIdx] += points;
        return ns;
      });
      return copy;
    });
  }

  function celebrate() {
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 }, colors: ["#ff7a8a", "#ffd66e", "#b388ff", "#b6e2d3"] });
  }

  function submitAnswer() {
    const val = inputRef.current?.value.trim() ?? "";
    if (!val) return;
    if (normalize(val) === normalize(q.name)) {
      stopTimer();
      setScore(mainPlayerIdx, 2);
      setScoredPlayer(mainPlayerIdx);
      setResultKind("correct");
      setStage("result");
      celebrate();
      speak(`${playerNames[mainPlayerIdx]}答對了`, { disabled: !useTTS });
    } else {
      registerWrong(val);
    }
  }

  function registerWrong(label) {
    setAttempts(a => [...a, label]);
    setWrongCount(c => {
      const next = c + 1;
      if (next > maxWrongs) {
        // 超過容許錯誤次數
        stopTimer();
        setScore(mainPlayerIdx, 0);
        if (players <= 1) {
          setResultKind("gaveup");
          setStage("result");
        } else {
          setStage("steal");
          speak("換人作答", { disabled: !useTTS });
        }
      } else {
        speak("錯", { disabled: !useTTS });
      }
      return next;
    });
    setShake(s => s + 1);
    if (inputRef.current) { inputRef.current.value = ""; inputRef.current.focus(); }
  }

  function giveUpToSteal() {
    stopTimer();
    setScore(mainPlayerIdx, 0);
    if (players <= 1) {
      setResultKind("gaveup");
      setStage("result");
    } else {
      setStage("steal");
      speak("換人作答", { disabled: !useTTS });
    }
  }

  function pickStealer(pIdx) {
    if (stealTried.has(pIdx)) return;
    setStealActiveIdx(pIdx);
    setTimeout(() => stealInputRef.current?.focus(), 100);
    speak(`請${playerNames[pIdx]}作答`, { disabled: !useTTS });
  }

  function submitSteal() {
    const val = stealInputRef.current?.value.trim() ?? "";
    if (!val || stealActiveIdx == null) return;
    if (normalize(val) === normalize(q.name)) {
      setScore(stealActiveIdx, 1);
      setScoredPlayer(stealActiveIdx);
      setResultKind("correct");
      setStage("result");
      celebrate();
      speak(`${playerNames[stealActiveIdx]}答對了`, { disabled: !useTTS });
    } else {
      const tried = new Set(stealTried);
      tried.add(stealActiveIdx);
      setStealTried(tried);
      setStealActiveIdx(null);
      if (stealInputRef.current) stealInputRef.current.value = "";
      speak("錯", { disabled: !useTTS });
      // 全部都試過 → 揭曉
      if (tried.size >= players - 1) {
        setResultKind("gaveup");
        setStage("result");
      }
    }
  }

  function next() {
    if (round + 1 >= answerOrder.length) {
      onComplete({ scores, scoreMatrix });
    } else {
      setRound(r => r + 1);
    }
  }

  return (
    <div className="min-h-screen px-4 py-6 sm:py-8 flex flex-col">
      {/* Top: progress */}
      <div className="text-center mb-4">
        <div className="text-deep/60 font-bold tracking-widest text-sm">
          第 <span className="text-deep">{round + 1}</span> / {answerOrder.length} 輪
        </div>
      </div>

      {/* Player pill */}
      <div className="flex justify-center mb-4">
        <motion.div
          key={`${round}-${stealActiveIdx}`}
          initial={{ scale: 0.6, y: -10 }} animate={{ scale: 1, y: 0 }}
          transition={{ type: "spring" }}
          className="px-6 py-2 rounded-full font-black text-white text-lg sm:text-xl shadow-[3px_3px_0_#2d1b4e] border-3 border-deep"
          style={{
            background: stage === "steal" && stealActiveIdx != null
              ? "linear-gradient(135deg, #ffd66e, #ff7a8a)"
              : stage === "steal"
                ? "linear-gradient(135deg, #b388ff, #ffafcc)"
                : "linear-gradient(135deg, #ff7a8a, #b388ff)",
          }}
        >
          {stage === "steal" && stealActiveIdx == null
            ? "🎯 點選一位選手作答"
            : `🎤 ${playerNames[stealActiveIdx ?? mainPlayerIdx]}`}
        </motion.div>
      </div>

      {/* Card */}
      <div className="flex-1 max-w-2xl w-full mx-auto sticker p-4 sm:p-6">
        <AnimatePresence mode="wait">
          {stage === "answering" && (
            <motion.div key="ans" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="text-center text-deep/70 mb-2 font-bold">
                請回答第 {qIdx + 1} 題
              </div>
              {/* Timer */}
              <div className="mb-3">
                <div className={`text-center text-3xl sm:text-4xl font-black mb-1 ${
                  timeLeft <= 3 ? "text-coral animate-shake" : timeLeft <= 5 ? "text-buttercup" : "text-deep"
                }`}>
                  {timeLeft} 秒
                </div>
                <div className="h-3 rounded-full bg-deep/10 overflow-hidden border-2 border-deep/15">
                  <motion.div
                    key={round}
                    className="h-full"
                    style={{
                      originX: 0,
                      background: timeLeft <= 3
                        ? "linear-gradient(90deg, #ff7a8a, #ffafcc)"
                        : "linear-gradient(90deg, #b6e2d3, #ff7a8a)",
                    }}
                    initial={{ scaleX: 1 }}
                    animate={{ scaleX: 0 }}
                    transition={{ duration: answerSec, ease: "linear" }}
                  />
                </div>
              </div>

              {/* Wrong counter */}
              <div className={`text-center text-sm font-bold mb-2 ${wrongCount >= maxWrongs ? "text-coral" : "text-deep/60"}`}>
                錯誤 {wrongCount} / {maxWrongs}
              </div>

              {/* Input */}
              <motion.input
                ref={inputRef}
                key={shake}
                animate={shake > 0 ? { x: [-10, 10, -6, 6, 0] } : {}}
                transition={{ duration: 0.4 }}
                type="text"
                placeholder="輸入答案後按 Enter"
                autoComplete="off" autoCorrect="off" spellCheck="false"
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); submitAnswer(); }}}
                className="w-full text-center text-2xl sm:text-3xl font-black p-4 rounded-2xl border-3 border-deep bg-cream focus:bg-white focus:outline-none focus:ring-4 focus:ring-coral/40 placeholder:text-deep/30 placeholder:font-bold"
              />

              {/* Buttons */}
              <div className="flex gap-2 sm:gap-3 mt-3 justify-center">
                <button onClick={submitAnswer} className="btn-pop flex-1">送出答案</button>
                <button onClick={giveUpToSteal} className="btn-soft">換人作答</button>
              </div>

              {/* Wrong attempts */}
              {attempts.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3 justify-center">
                  {attempts.map((a, i) => (
                    <span key={i} className="px-3 py-1 rounded-full bg-coral/15 text-coral text-sm font-bold line-through border border-coral/30">
                      {a}
                    </span>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {stage === "steal" && (
            <motion.div key="steal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="text-center mb-3">
                <div className="text-2xl sm:text-3xl font-black bg-gradient-to-br from-buttercup to-coral bg-clip-text text-transparent">
                  🎯 換人作答
                </div>
                <div className="text-deep/60 text-sm mt-1">點選一位選手由他作答（答對 +1，答錯該選手不能再選）</div>
              </div>

              {/* Player chips */}
              <div className="flex flex-wrap gap-2 sm:gap-3 justify-center mb-4">
                {Array.from({ length: players }).map((_, i) => {
                  if (i === mainPlayerIdx) return null;
                  const tried = stealTried.has(i);
                  const active = stealActiveIdx === i;
                  return (
                    <motion.button
                      key={i}
                      whileHover={!tried ? { scale: 1.05 } : {}}
                      whileTap={!tried ? { scale: 0.92 } : {}}
                      onClick={() => pickStealer(i)}
                      disabled={tried}
                      className={`px-4 py-2 rounded-full font-black border-3 ${
                        active
                          ? "bg-gradient-to-br from-buttercup to-coral text-white border-deep shadow-[3px_3px_0_#2d1b4e]"
                          : tried
                            ? "bg-deep/10 text-deep/40 border-deep/20 line-through"
                            : "bg-white text-deep border-deep shadow-[3px_3px_0_#2d1b4e]"
                      }`}
                    >
                      {playerNames[i]}
                    </motion.button>
                  );
                })}
              </div>

              {stealActiveIdx != null && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <input
                    ref={stealInputRef}
                    type="text"
                    placeholder={`${playerNames[stealActiveIdx]} 的答案`}
                    autoComplete="off" autoCorrect="off" spellCheck="false"
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); submitSteal(); }}}
                    className="w-full text-center text-2xl font-black p-4 rounded-2xl border-3 border-buttercup bg-cream focus:outline-none focus:ring-4 focus:ring-buttercup/50 mt-2"
                  />
                  <div className="flex gap-2 mt-3 justify-center">
                    <button onClick={submitSteal} className="btn-pop">送出</button>
                    <button onClick={() => { setStealActiveIdx(null); }} className="btn-soft">取消</button>
                  </div>
                </motion.div>
              )}

              <div className="text-center mt-4">
                <button
                  onClick={() => { setResultKind("gaveup"); setStage("result"); }}
                  className="text-deep/60 text-sm underline"
                >
                  跳過 → 揭曉答案
                </button>
              </div>
            </motion.div>
          )}

          {stage === "result" && (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring" }}
              className="text-center"
            >
              <div className={`text-7xl sm:text-8xl mb-2 ${resultKind === "correct" ? "text-mint" : "text-coral"}`}>
                {resultKind === "correct" ? "✓" : "✗"}
              </div>
              <div className="text-deep/60 font-bold mb-2">
                {resultKind === "correct"
                  ? `${playerNames[scoredPlayer]} 答對了！`
                  : "沒人答對"}
              </div>
              <div className="text-5xl sm:text-7xl font-black my-4"
                style={{
                  background: "linear-gradient(135deg, #ff7a8a, #b388ff)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {q.name}
              </div>
              <div className="text-deep/60 text-sm sm:text-base px-2">{q.hint}</div>
              <button onClick={next} className="btn-pop mt-6">
                {round + 1 >= answerOrder.length ? "🏆 看結算" : "下一題 →"}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Scoreboard */}
      <div className="max-w-3xl w-full mx-auto mt-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
          {Array.from({ length: players }).map((_, i) => (
            <motion.div
              key={i}
              animate={i === scoredPlayer && stage === "result" ? { scale: [1, 1.1, 1] } : {}}
              className="rounded-2xl p-2 sm:p-3 border-2 text-center"
              style={{
                background: COLORS[i % COLORS.length],
                borderColor: i === mainPlayerIdx && stage === "answering" ? "#2d1b4e" : "rgba(45,27,78,0.15)",
                borderWidth: i === mainPlayerIdx && stage === "answering" ? "3px" : "2px",
              }}
            >
              <div className="text-xs font-bold text-deep/70 truncate">{playerNames[i]}</div>
              <div className="text-2xl sm:text-3xl font-black text-deep">{scores[i]}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
