import { useEffect, useMemo, useState, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import confetti from "canvas-confetti";
import { speak, cancelAllSpeech } from "../lib/tts";
import { matchAnswer } from "../lib/util";
import CountdownTimer from "./answer/CountdownTimer";
import AnswerInput from "./answer/AnswerInput";
import StealPanel from "./answer/StealPanel";
import ResultCard from "./answer/ResultCard";
import PlayerScoreboard from "./answer/PlayerScoreboard";
import PlayerPill from "./answer/PlayerPill";

export default function AnswerPhase({ config, questions, answerOrder, answerAssign, onComplete }) {
  const { players, playerNames, answerSec, maxWrongs, useTTS, showAnswerText } = config;

  // ─── 狀態 ─────────────────────────────────
  // scores 改為從 scoreMatrix 衍生（useMemo），避免兩個 state 不同步且
  // 解決 React 18 strict mode 下 setState reducer 雙重執行造成的重複加分
  const [scoreMatrix, setScoreMatrix] = useState(() =>
    questions.map(() => Array(players).fill(null))
  );
  const scores = useMemo(() => {
    const totals = Array(players).fill(0);
    for (const row of scoreMatrix) {
      for (let p = 0; p < players; p++) {
        if (row[p] != null) totals[p] += row[p];
      }
    }
    return totals;
  }, [scoreMatrix, players]);
  const [stage, setStage] = useState("answering"); // answering | steal | result
  const [round, setRound] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [attempts, setAttempts] = useState([]);
  const [stealTried, setStealTried] = useState(new Set());
  const [stealActiveIdx, setStealActiveIdx] = useState(null);
  const [resultKind, setResultKind] = useState(null);
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

  // ─── 計時器 ───────────────────────────────
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
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  // ─── 進入新題：重置 + 念出 ────────────────
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
    return () => {
      stopTimer();
      cancelAllSpeech();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round]);

  // ─── 計分 ─────────────────────────────────
  // 只更新 scoreMatrix；scores 由 useMemo 衍生，無需手動同步
  function setScore(playerIdx, points) {
    setScoreMatrix(prev => {
      const copy = prev.map(row => [...row]);
      copy[qIdx][playerIdx] = points;
      return copy;
    });
  }

  function celebrate() {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#ff7a8a", "#ffd66e", "#b388ff", "#b6e2d3"],
    });
  }

  // ─── 主答題流程 ───────────────────────────
  function submitAnswer() {
    const val = inputRef.current?.value.trim() ?? "";
    if (!val) return;
    if (matchAnswer(val, q)) {
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
    if (inputRef.current) {
      inputRef.current.value = "";
      inputRef.current.focus();
    }
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

  // ─── 換人作答流程 ─────────────────────────
  function pickStealer(pIdx) {
    if (stealTried.has(pIdx)) return;
    setStealActiveIdx(pIdx);
    setTimeout(() => stealInputRef.current?.focus(), 100);
    speak(`請${playerNames[pIdx]}作答`, { disabled: !useTTS });
  }

  function submitSteal() {
    const val = stealInputRef.current?.value.trim() ?? "";
    if (!val || stealActiveIdx == null) return;
    if (matchAnswer(val, q)) {
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

  // ─── render ───────────────────────────────
  const activeName =
    stage === "steal" && stealActiveIdx != null
      ? playerNames[stealActiveIdx]
      : playerNames[mainPlayerIdx];
  const pickingSteal = stage === "steal" && stealActiveIdx == null;

  return (
    <div className="min-h-screen px-4 py-6 sm:py-8 flex flex-col">
      {/* 進度 */}
      <div className="text-center mb-4">
        <div className="text-deep/60 font-bold tracking-widest text-sm">
          第 <span className="text-deep">{round + 1}</span> / {answerOrder.length} 輪
        </div>
      </div>

      {/* 玩家標籤 */}
      <div className="flex justify-center mb-4">
        <PlayerPill
          stage={stage}
          activeName={activeName}
          pickingSteal={pickingSteal}
          roundKey={`${round}-${stealActiveIdx}`}
        />
      </div>

      {/* 主卡片 */}
      <div className="flex-1 max-w-2xl w-full mx-auto sticker p-4 sm:p-6">
        <AnimatePresence mode="wait">
          {stage === "answering" && (
            <motion.div key="ans" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="text-center text-deep/70 mb-2 font-bold">
                請回答第 {qIdx + 1} 題
              </div>
              {showAnswerText && (
                <div className="text-center my-2">
                  <div
                    className="inline-block px-4 py-2 rounded-2xl bg-deep/5 border-2 border-deep/15 text-2xl sm:text-3xl font-black tracking-wide"
                    style={{
                      background: "linear-gradient(135deg, #ff7a8a, #b388ff)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    {q.name}
                  </div>
                  <div className="text-xs text-deep/50 mt-1">👀 視覺輔助模式</div>
                </div>
              )}
              <CountdownTimer timeLeft={timeLeft} total={answerSec} resetKey={round} />
              <AnswerInput
                ref={inputRef}
                shakeKey={shake}
                wrongCount={wrongCount}
                maxWrongs={maxWrongs}
                attempts={attempts}
                onSubmit={submitAnswer}
                onSkip={giveUpToSteal}
              />
            </motion.div>
          )}

          {stage === "steal" && (
            <motion.div key="steal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <StealPanel
                ref={stealInputRef}
                players={players}
                playerNames={playerNames}
                mainPlayerIdx={mainPlayerIdx}
                stealTried={stealTried}
                stealActiveIdx={stealActiveIdx}
                onPick={pickStealer}
                onSubmit={submitSteal}
                onCancelPick={() => setStealActiveIdx(null)}
                onGiveUp={() => {
                  setResultKind("gaveup");
                  setStage("result");
                }}
              />
            </motion.div>
          )}

          {stage === "result" && (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring" }}
            >
              <ResultCard
                resultKind={resultKind}
                scoredPlayerName={scoredPlayer != null ? playerNames[scoredPlayer] : null}
                answer={q}
                isLast={round + 1 >= answerOrder.length}
                onNext={next}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 計分板 */}
      <div className="max-w-3xl w-full mx-auto mt-4">
        <PlayerScoreboard
          players={players}
          playerNames={playerNames}
          scores={scores}
          highlightIdx={stage === "answering" ? mainPlayerIdx : null}
          pulseIdx={stage === "result" ? scoredPlayer : null}
        />
      </div>
    </div>
  );
}
