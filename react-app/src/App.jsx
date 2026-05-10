import { useState, useEffect } from "react";
import { initTTS } from "./lib/tts";
import { shuffle } from "./lib/util";
import { getAllCategories, mergeImportCustom } from "./lib/questionBank";
import { readShareTokenFromHash, decodeShare, clearShareHash } from "./lib/packIO";
import Setup from "./components/Setup";
import QuestionPhase from "./components/QuestionPhase";
import AnswerPhase from "./components/AnswerPhase";
import Final from "./components/Final";
import ShareImportDialog from "./components/ShareImportDialog";

export default function App() {
  const [phase, setPhase] = useState("setup");
  const [config, setConfig] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answerOrder, setAnswerOrder] = useState([]);
  const [answerAssign, setAnswerAssign] = useState([]);
  const [finalScores, setFinalScores] = useState([]);
  // categoriesVersion：每次題庫變動就 +1，觸發 Setup 重新讀取
  const [categoriesVersion, setCategoriesVersion] = useState(0);
  // 分享連結匯入：null = 沒有；否則為 { label, emoji, desc, items }
  const [pendingShare, setPendingShare] = useState(null);

  const categories = getAllCategories();

  useEffect(() => { initTTS(); }, []);

  // 啟動時檢查 URL hash 是否有分享 token
  useEffect(() => {
    const token = readShareTokenFromHash();
    if (!token) return;
    decodeShare(token)
      .then(cat => setPendingShare(cat))
      .catch(err => {
        console.warn("[share] decode failed", err);
        clearShareHash();
      });
  }, []);

  const acceptShare = () => {
    mergeImportCustom([pendingShare]);
    setPendingShare(null);
    clearShareHash();
    setCategoriesVersion(v => v + 1);
  };

  const declineShare = () => {
    setPendingShare(null);
    clearShareHash();
  };
  // categoriesVersion 變動 → Setup 收到新 props → 重抓題庫
  // eslint-disable-next-line no-unused-expressions
  categoriesVersion;

  const startGame = (cfg) => {
    setConfig(cfg);
    // categoryIds 為陣列；空陣列或 "all" 表示全選
    const ids = cfg.categoryIds && cfg.categoryIds.length > 0
      ? cfg.categoryIds
      : categories.map(c => c.id);
    const pool = categories
      .filter(c => ids.includes(c.id))
      .flatMap(c => c.items);
    const qs = shuffle(pool).slice(0, cfg.questionCount);
    setQuestions(qs);
    const order = cfg.shuffleAnswer
      ? shuffle(qs.map((_, i) => i))
      : qs.map((_, i) => i);
    setAnswerOrder(order);
    const assign = qs.map((_, i) => i % cfg.players);
    setAnswerAssign(shuffle(assign));
    setPhase("question");
  };

  return (
    <div className="min-h-screen">
      {pendingShare && (
        <ShareImportDialog
          pack={pendingShare}
          onAccept={acceptShare}
          onDecline={declineShare}
        />
      )}
      {phase === "setup" && (
        <Setup
          categories={categories}
          categoriesVersion={categoriesVersion}
          onStart={startGame}
          onCategoriesChanged={() => setCategoriesVersion(v => v + 1)}
        />
      )}
      {phase === "question" && (
        <QuestionPhase
          questions={questions}
          intervalMs={config.intervalMs}
          useTTS={config.useTTS}
          onDone={() => setPhase("answer")}
        />
      )}
      {phase === "answer" && (
        <AnswerPhase
          config={config}
          questions={questions}
          answerOrder={answerOrder}
          answerAssign={answerAssign}
          onComplete={({ scores }) => {
            setFinalScores(scores);
            setPhase("final");
          }}
        />
      )}
      {phase === "final" && (
        <Final
          playerNames={config.playerNames}
          scores={finalScores}
          useTTS={config.useTTS}
          onRestart={() => setPhase("setup")}
        />
      )}
    </div>
  );
}
