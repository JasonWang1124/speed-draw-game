// 答對/沒人答對的揭曉卡
// props:
//   resultKind: "correct" | "gaveup"
//   scoredPlayerName?: string
//   answer: { name, hint }
//   isLast: boolean
//   onNext: () => void
export default function ResultCard({ resultKind, scoredPlayerName, answer, isLast, onNext }) {
  const correct = resultKind === "correct";
  return (
    <div className="text-center">
      <div className={`text-7xl sm:text-8xl mb-2 ${correct ? "text-mint" : "text-coral"}`}>
        {correct ? "✓" : "✗"}
      </div>
      <div className="text-deep/60 font-bold mb-2">
        {correct ? `${scoredPlayerName} 答對了！` : "沒人答對"}
      </div>
      <div
        className="text-5xl sm:text-7xl font-black my-4"
        style={{
          background: "linear-gradient(135deg, #ff7a8a, #b388ff)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        {answer.name}
      </div>
      {answer.hint && (
        <div className="text-deep/60 text-sm sm:text-base px-2">{answer.hint}</div>
      )}
      <button onClick={onNext} className="btn-pop mt-6">
        {isLast ? "🏆 看結算" : "下一題 →"}
      </button>
    </div>
  );
}
