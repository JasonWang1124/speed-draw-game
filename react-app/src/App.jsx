import { useState, useEffect } from "react";
import questionBank from "./questions.json";
import { initTTS } from "./lib/tts";
import { shuffle } from "./lib/util";
import Setup from "./components/Setup";
import QuestionPhase from "./components/QuestionPhase";
import AnswerPhase from "./components/AnswerPhase";
import Final from "./components/Final";

export default function App() {
  const [phase, setPhase] = useState("setup");
  const [config, setConfig] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answerOrder, setAnswerOrder] = useState([]);
  const [answerAssign, setAnswerAssign] = useState([]);
  const [finalScores, setFinalScores] = useState([]);

  const categories = questionBank.categories;

  useEffect(() => { initTTS(); }, []);

  const startGame = (cfg) => {
    setConfig(cfg);
    const pool = cfg.category === "mixed"
      ? categories.flatMap(c => c.items)
      : categories.find(c => c.id === cfg.category)?.items || [];
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
      {phase === "setup" && (
        <Setup categories={categories} onStart={startGame} />
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
